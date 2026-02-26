/**
 * Enhanced OpenRouter Chat Hook
 * 
 * Updated version of useStreamingChat that leverages the new OpenRouter client
 * with full streaming, tool calling, and context management capabilities.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  createOpenRouterClient, 
  OpenRouterClient, 
  OpenRouterError,
  ErrorHandler
} from '@/lib/openrouter'
import type { 
  OpenRouterMessage, 
  Tool
} from '@/lib/openrouter'
import { AGENT_CONFIGS } from '@/agents/config'

export interface ToolCall {
  name: string
  parameters: any
  result?: any
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  streaming?: boolean
  error?: string
  toolCalls?: ToolCall[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
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

export interface OpenRouterChatOptions {
  apiKey?: string
  agentId?: string
  model?: string
  tools?: Tool[]
  conversationId?: string
  maxRetries?: number
  timeout?: number
  onMessage?: (message: ChatMessage) => void
  onError?: (error: Error) => void
  onStreamComplete?: (fullMessage: string, usage?: any) => void
  onToolCall?: (toolName: string, parameters: any, result?: any) => void
}

export interface OpenRouterChatHook {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  client: OpenRouterClient | null
  sendMessage: (content: string, context?: DocumentContext) => Promise<string>
  sendMessageWithTools: (content: string, tools?: Tool[], context?: DocumentContext) => Promise<string>
  clearMessages: () => void
  abortStream: () => void
  getContext: () => OpenRouterMessage[]
  setSystemPrompt: (prompt: string) => void
  retryLastMessage: () => Promise<string | null>
}

export function useOpenRouterChat(options: OpenRouterChatOptions = {}): OpenRouterChatHook {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<OpenRouterClient | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const conversationId = options.conversationId || 'default'

  // Initialize client
  useEffect(() => {
    const apiKey = options.apiKey || localStorage.getItem('openrouter_api_key')
    
    if (apiKey) {
      try {
        const openRouterClient = createOpenRouterClient({
          apiKey,
          model: options.model || 'anthropic/claude-3.5-sonnet',
          timeout: options.timeout
        })

        // Register custom tools if provided
        if (options.tools) {
          options.tools.forEach(tool => {
            // Tool registration would need a handler function
            // This is a placeholder - you'd need to implement actual tool handlers
            console.log('Tool available:', tool.function.name)
          })
        }

        setClient(openRouterClient)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize OpenRouter client'
        setError(errorMessage)
        options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      }
    } else {
      setError('OpenRouter API key not found. Please add it in Settings.')
    }
  }, [options.apiKey, options.model, options.timeout])

  // Set system prompt if agent is specified
  useEffect(() => {
    if (client && options.agentId) {
      const agentConfig = AGENT_CONFIGS[options.agentId]
      if (agentConfig?.systemPrompt) {
        client.addToContext([
          { role: 'system', content: agentConfig.systemPrompt }
        ], conversationId)
      }
    }
  }, [client, options.agentId, conversationId])

  const setSystemPrompt = useCallback((prompt: string) => {
    if (client) {
      // Remove existing system messages and add new one
      const context = client.getContext(conversationId)
      const nonSystemMessages = context.filter(msg => msg.role !== 'system')
      
      client.clearContext(conversationId)
      client.addToContext([
        { role: 'system', content: prompt },
        ...nonSystemMessages
      ], conversationId)
    }
  }, [client, conversationId])

  const sendMessage = useCallback(async (
    content: string,
    context?: DocumentContext
  ): Promise<string> => {
    return sendMessageWithTools(content, undefined, context)
  }, [])

  const sendMessageWithTools = useCallback(async (
    content: string,
    tools?: Tool[],
    context?: DocumentContext
  ): Promise<string> => {
    if (!client) {
      const error = new Error('OpenRouter client not initialized')
      setError(error.message)
      options.onError?.(error)
      throw error
    }

    try {
      setError(null)
      setIsStreaming(true)

      // Create user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, userMessage])
      options.onMessage?.(userMessage)

      // Add to context
      client.addToContext([{ role: 'user', content }], conversationId)

      // Create assistant message placeholder
      const assistantMessageId = `assistant_${Date.now()}`
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        streaming: true
      }

      setMessages(prev => [...prev, assistantMessage])

      // Set up abort controller
      abortControllerRef.current = new AbortController()

      // Build context with document info if provided
      const currentContext = client.getContext(conversationId)
      let contextualPrompt = currentContext

      if (context) {
        const contextInfo = `
## Current Document Context:
- **Title**: ${context.documentTitle}
- **Type**: ${context.documentType}
- **Academic Level**: ${context.academicLevel}
- **Word Count**: ${context.wordCount}
${context.selectedText ? `- **Selected Text**: "${context.selectedText}"` : ''}
${context.cursorParagraph ? `- **Current Paragraph**: "${context.cursorParagraph}"` : ''}

Current document content (first 1000 chars):
${context.fullText.slice(0, 1000)}${context.fullText.length > 1000 ? '...' : ''}

Please provide assistance relevant to this context.`

        // Add context as a system message for this request
        contextualPrompt = [
          ...currentContext.filter(m => m.role === 'system'),
          { role: 'system', content: contextInfo },
          ...currentContext.filter(m => m.role !== 'system')
        ]
      }

      let fullResponse = ''
      const toolCalls: ToolCall[] = []

      // Stream the response
      const stream = client.createStreamingChatCompletion({
        model: options.model || 'anthropic/claude-3.5-sonnet',
        messages: contextualPrompt,
        tools: tools, // TODO: Fix toolHandler access - it's private
        tool_choice: tools || options.tools ? 'auto' : undefined,
        stream: true
      }, {
        onContent: (content) => {
          fullResponse += content
          
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullResponse }
              : msg
          ))
        },
        onToolCall: (toolCall) => {
          console.log('Tool call received:', toolCall.function.name)
          toolCalls.push({
            name: toolCall.function.name,
            parameters: JSON.parse(toolCall.function.arguments || '{}')
          })
          
          options.onToolCall?.(toolCall.function.name, JSON.parse(toolCall.function.arguments || '{}'))
        },
        onComplete: (response, usage) => {
          // Mark streaming as complete
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  streaming: false, 
                  toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                  usage 
                }
              : msg
          ))

          // Add to context
          client.addToContext([{ 
            role: 'assistant', 
            content: response,
            tool_calls: toolCalls.length > 0 ? toolCalls.map(tc => ({
              id: `tool_${Date.now()}_${Math.random()}`,
              type: 'function' as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.parameters)
              }
            })) : undefined
          }], conversationId)

          options.onStreamComplete?.(response, usage)
        },
        onError: (streamError) => {
          const errorMessage = ErrorHandler.formatErrorForUser(streamError)
          setError(errorMessage)
          
          setMessages(prev => prev.map(msg =>
            msg.streaming
              ? { ...msg, streaming: false, error: errorMessage }
              : msg
          ))
          
          options.onError?.(streamError)
        },
        signal: abortControllerRef.current.signal
      })

      // Consume the stream
      for await (const _ of stream) {
        // Stream processing is handled by callbacks
      }

      return fullResponse

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      const formattedError = err instanceof OpenRouterError 
        ? ErrorHandler.formatErrorForUser(err)
        : errorMessage

      setError(formattedError)
      setMessages(prev => prev.map(msg =>
        msg.streaming
          ? { ...msg, streaming: false, error: formattedError }
          : msg
      ))

      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [client, conversationId, options])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    if (client) {
      client.clearContext(conversationId)
    }
  }, [client, conversationId])

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setError('Stream aborted by user')
    }
  }, [])

  const getContext = useCallback(() => {
    return client ? client.getContext(conversationId) : []
  }, [client, conversationId])

  const retryLastMessage = useCallback(async (): Promise<string | null> => {
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'user')

    if (lastUserMessage && client) {
      try {
        // Remove the last assistant message if it exists
        const lastAssistantIndex = messages.length - 1
        if (messages[lastAssistantIndex]?.role === 'assistant') {
          setMessages(prev => prev.slice(0, -1))
        }

        return await sendMessage(lastUserMessage.content)
      } catch (error) {
        console.error('Retry failed:', error)
        return null
      }
    }
    
    return null
  }, [messages, client, sendMessage])

  return {
    messages,
    isStreaming,
    error,
    client,
    sendMessage,
    sendMessageWithTools,
    clearMessages,
    abortStream,
    getContext,
    setSystemPrompt,
    retryLastMessage
  }
}

// Utility functions for creating tools compatible with the system
export const createTool = (
  name: string,
  description: string,
  parameters: any,
  handler: (params: any) => Promise<string> | string
): { tool: Tool; handler: typeof handler } => {
  return {
    tool: {
      type: 'function',
      function: {
        name,
        description,
        parameters
      }
    },
    handler
  }
}

// Common AI prompts adapted for OpenRouter
export const openRouterPrompts = {
  summarize: (text: string) => 
    `Please provide a concise summary of the following text:\n\n${text}`,
  
  explain: (text: string) => 
    `Please explain the following text in simpler terms:\n\n${text}`,
  
  expand: (text: string) => 
    `Please expand on the following text with more detail and examples:\n\n${text}`,
  
  improve: (text: string, style?: string) => 
    `Please improve the following text${style ? ` for ${style} style` : ''}:\n\n${text}`,
  
  translate: (text: string, targetLanguage: string) =>
    `Please translate the following text to ${targetLanguage}:\n\n${text}`,
  
  analyze: (text: string, analysisType?: string) =>
    `Please analyze the following text${analysisType ? ` for ${analysisType}` : ''}:\n\n${text}`
}