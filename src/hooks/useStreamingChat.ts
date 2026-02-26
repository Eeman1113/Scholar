import { useState, useCallback, useRef } from 'react'
import { AGENT_CONFIGS } from '@/agents/config'
import { executeTool } from '@/agents/tools'

export interface ToolCall {
  name: string
  parameters: any
  result?: any
}

export interface StreamingMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  streaming?: boolean
  error?: string
  toolCalls?: ToolCall[]
}

export interface DocumentContext {
  fullText: string
  selectedText?: string
  cursorPosition?: number
  wordCount: number
  cursorParagraph?: string
  documentTitle: string
  documentType: string
  academicLevel: string
}

export interface StreamingChatOptions {
  apiKey?: string
  agentId?: string
  onMessage?: (message: StreamingMessage) => void
  onError?: (error: Error) => void
  onStreamComplete?: (fullMessage: string) => void
  onToolCall?: (toolName: string, parameters: any) => Promise<any>
}

export interface StreamingChatHook {
  messages: StreamingMessage[]
  isStreaming: boolean
  error: string | null
  sendMessage: (content: string, context?: DocumentContext) => Promise<string>
  clearMessages: () => void
  abortStream: () => void
}

export function useStreamingChat(options: StreamingChatOptions = {}): StreamingChatHook {
  const [messages, setMessages] = useState<StreamingMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (
    content: string, 
    context?: DocumentContext
  ): Promise<string> => {
    try {
      setError(null)
      setIsStreaming(true)

      // Add user message
      const userMessage: StreamingMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now()
      }
      
      setMessages(prev => [...prev, userMessage])
      options.onMessage?.(userMessage)

      // Create assistant message placeholder
      const assistantMessageId = `assistant_${Date.now()}`
      const assistantMessage: StreamingMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        streaming: true
      }
      
      setMessages(prev => [...prev, assistantMessage])

      // Set up abort controller
      abortControllerRef.current = new AbortController()

      // Get API key from localStorage or options
      const apiKey = options.apiKey || localStorage.getItem('openrouter_api_key')
      
      if (!apiKey) {
        throw new Error('OpenRouter API key not found. Please add it in Settings.')
      }

      // Get agent configuration
      const agentId = options.agentId || 'sage'
      const agentConfig = AGENT_CONFIGS[agentId]
      
      // Build the prompt with agent-specific context and tool instructions
      let systemPrompt = agentConfig?.systemPrompt || 'You are a helpful AI writing assistant. Provide clear, concise, and relevant responses.'
      
      // Add tool usage instructions if agent has tools
      if (agentConfig?.tools && agentConfig.tools.length > 0) {
        systemPrompt += `

## Available Tools:
You have access to the following tools to help complete tasks:

${agentConfig.tools.map(tool => 
  `**${tool.name}**: ${tool.description}\nParameters: ${JSON.stringify(tool.parameters, null, 2)}`
).join('\n\n')}

## Tool Usage Format:
To use a tool, include the following in your response:
[TOOL_CALL:tool_name({"parameter": "value", "another": "value"})]

The tool will be executed and results will be displayed to the user. Always explain what you're doing before using a tool.`
      }
      
      if (context) {
        systemPrompt += `

## Current Document Context:
- **Title**: ${context.documentTitle}
- **Type**: ${context.documentType} 
- **Academic Level**: ${context.academicLevel}
- **Word Count**: ${context.wordCount}
- **Current Content**: ${context.fullText.slice(0, 2000)}${context.fullText.length > 2000 ? '...' : ''}
${context.selectedText ? `- **Selected Text**: "${context.selectedText}"` : ''}
${context.cursorParagraph ? `- **Current Paragraph**: "${context.cursorParagraph}"` : ''}

Please provide assistance that's relevant to this context and aligns with your role as ${agentConfig?.name || 'an AI assistant'}.`
      }

      // Make API request to OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Scholar AI Workspace',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user', 
              content: content
            }
          ],
          max_tokens: 2048,
          stream: true,
          temperature: 0.7
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  
                  // OpenRouter format: choices[0].delta.content
                  if (parsed.choices?.[0]?.delta?.content) {
                    fullResponse += parsed.choices[0].delta.content
                    
                    // Update the streaming message
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: fullResponse }
                        : msg
                    ))
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', data)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, streaming: false }
          : msg
      ))
      
      // Check for and execute any tool calls in the response
      setTimeout(() => {
        detectAndExecuteToolCalls(fullResponse, assistantMessageId)
      }, 100)
      
      options.onStreamComplete?.(fullResponse)
      return fullResponse

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      
      setError(errorMessage)
      setMessages(prev => prev.map(msg => 
        msg.streaming 
          ? { ...msg, streaming: false, error: errorMessage }
          : msg
      ))
      
      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [options])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setError('Stream aborted by user')
    }
  }, [])

  // Helper function to detect and execute tool calls
  const detectAndExecuteToolCalls = useCallback(async (messageContent: string, messageId: string) => {
    try {
      // Look for tool call patterns in the message content
      const toolCallPattern = /\[TOOL_CALL:(\w+)\((.*?)\)\]/g
      let match
      const toolCalls: ToolCall[] = []
      
      while ((match = toolCallPattern.exec(messageContent)) !== null) {
        const [fullMatch, toolName, paramsString] = match
        
        try {
          // Parse parameters (expecting JSON format)
          const parameters = paramsString ? JSON.parse(paramsString) : {}
          
          // Execute the tool
          const result = await executeTool({ name: toolName, parameters })
          
          toolCalls.push({
            name: toolName,
            parameters,
            result
          })
          
          // Update message with tool call result
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { 
                  ...msg, 
                  content: msg.content.replace(fullMatch, `\n\n**Tool Used: ${toolName}**\n${result.success ? result.message : `Error: ${result.error}`}\n`),
                  toolCalls: [...(msg.toolCalls || []), { name: toolName, parameters, result }]
                }
              : msg
          ))
          
        } catch (parseError) {
          console.warn('Failed to parse tool call:', parseError)
        }
      }
      
      return toolCalls
    } catch (error) {
      console.error('Tool execution failed:', error)
      return []
    }
  }, [])

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    abortStream
  }
}

// Utility functions for common AI tasks
export const createAIPrompts = {
  // Slash commands
  summarize: (text: string) => `Please provide a concise summary of the following text:\n\n${text}`,
  explain: (text: string) => `Please explain the following text in simpler terms:\n\n${text}`,
  expand: (text: string) => `Please expand on the following text with more detail and examples:\n\n${text}`,
  simplify: (text: string) => `Please rewrite the following text to be clearer and more concise:\n\n${text}`,
  counterargument: (text: string) => `Please provide a thoughtful counterargument to the following position:\n\n${text}`,
  
  // Bubble toolbar actions
  askAI: (selectedText: string, question?: string) => 
    question 
      ? `Regarding this text: "${selectedText}"\n\nQuestion: ${question}`
      : `Please analyze or provide insights about this text: "${selectedText}"`,
  
  // Ghost text suggestions
  ghostText: (context: string, cursorPosition: number) => 
    `Based on the following context, suggest a natural continuation for the text. Provide only the suggested text, no explanations:\n\nContext: ${context.slice(0, cursorPosition)}[CURSOR]${context.slice(cursorPosition)}`,
  
  // Reading level calculation
  calculateReadingLevel: (text: string) => 
    `Please calculate the reading level of the following text using the Flesch-Kincaid Grade Level formula and return only the grade level (e.g., "Grade 8", "Grade 12", "College"):\n\n${text}`,
}