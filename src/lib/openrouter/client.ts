/**
 * OpenRouter API Client
 * 
 * Comprehensive client for OpenRouter API with streaming, tool calling, and context management
 * Based on OpenRouter documentation: https://openrouter.ai/docs
 */

import { EventEmitter } from './utils/event-emitter'
import { SSEParser } from './utils/sse-parser'
import { ContextManager } from './context-manager'
import { ToolCallHandler } from './tool-handler'

// Types based on OpenRouter API specification
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
    }
  }
}

export interface ChatCompletionRequest {
  model: string
  messages: OpenRouterMessage[]
  tools?: Tool[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  parallel_tool_calls?: boolean
  max_tokens?: number
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  stream?: boolean
  user?: string
}

export interface ChatCompletionResponse {
  id: string
  object: 'chat.completion' | 'chat.completion.chunk'
  created: number
  model: string
  provider?: string
  choices: {
    index: number
    message?: OpenRouterMessage
    delta?: Partial<OpenRouterMessage>
    finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error' | null
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: {
    code: string | number
    message: string
  }
}

export interface OpenRouterConfig {
  apiKey: string
  baseUrl?: string
  defaultModel?: string
  timeout?: number
  maxRetries?: number
  httpReferer?: string
  appName?: string
}

export interface StreamingOptions {
  onChunk?: (chunk: ChatCompletionResponse) => void
  onContent?: (content: string) => void
  onToolCall?: (toolCall: ToolCall) => void
  onComplete?: (response: string, usage?: any) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

/**
 * Main OpenRouter API Client
 */
export class OpenRouterClient extends EventEmitter {
  private config: Required<OpenRouterConfig>
  private contextManager: ContextManager
  private toolHandler: ToolCallHandler

  constructor(config: OpenRouterConfig) {
    super()
    
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      defaultModel: config.defaultModel || 'anthropic/claude-3.5-sonnet',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      httpReferer: config.httpReferer || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'),
      appName: config.appName || 'OpenRouter Integration'
    }

    this.contextManager = new ContextManager()
    this.toolHandler = new ToolCallHandler()
  }

  /**
   * Create a non-streaming chat completion
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await this.makeRequest({
      ...request,
      stream: false
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    // Check for error in response
    if (data.error) {
      throw new Error(`OpenRouter Error: ${data.error.message}`)
    }

    this.emit('completion', data)
    return data
  }

  /**
   * Create a streaming chat completion
   */
  async *createStreamingChatCompletion(
    request: ChatCompletionRequest,
    options: StreamingOptions = {}
  ): AsyncGenerator<ChatCompletionResponse, void, unknown> {
    const response = await this.makeRequest({
      ...request,
      stream: true
    }, options.signal)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    if (!response.body) {
      throw new Error('Response body is not available for streaming')
    }

    const parser = new SSEParser(response.body)
    let fullContent = ''
    let currentToolCalls: ToolCall[] = []

    try {
      for await (const event of parser) {
        if (event.data === '[DONE]') {
          break
        }

        let chunk: ChatCompletionResponse
        try {
          chunk = JSON.parse(event.data)
        } catch (parseError) {
          console.warn('Failed to parse SSE chunk:', event.data)
          continue
        }

        // Handle mid-stream errors
        if (chunk.error) {
          const error = new Error(`Stream Error: ${chunk.error.message}`)
          options.onError?.(error)
          this.emit('error', error)
          throw error
        }

        // Process the chunk
        this.emit('chunk', chunk)
        options.onChunk?.(chunk)

        const delta = chunk.choices?.[0]?.delta
        if (delta?.content) {
          fullContent += delta.content
          options.onContent?.(delta.content)
          this.emit('content', delta.content)
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          // Merge tool calls (OpenRouter may send them in chunks)
          for (const toolCall of delta.tool_calls) {
            const existingCall = currentToolCalls.find(tc => tc.id === toolCall.id)
            if (existingCall) {
              // Merge arguments if they're being streamed
              if (toolCall.function?.arguments) {
                existingCall.function.arguments += toolCall.function.arguments
              }
            } else {
              currentToolCalls.push(toolCall as ToolCall)
            }
          }
        }

        // Check for completion
        const finishReason = chunk.choices?.[0]?.finish_reason
        if (finishReason) {
          if (finishReason === 'tool_calls' && currentToolCalls.length > 0) {
            // Emit tool calls for processing
            for (const toolCall of currentToolCalls) {
              options.onToolCall?.(toolCall)
              this.emit('toolCall', toolCall)
            }
          }
          
          options.onComplete?.(fullContent, chunk.usage)
          this.emit('complete', { content: fullContent, usage: chunk.usage, toolCalls: currentToolCalls })
          break
        }

        yield chunk
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Streaming error')
      options.onError?.(err)
      this.emit('error', err)
      throw err
    }
  }

  /**
   * Convenient method for simple streaming chat
   */
  async streamChat(
    messages: OpenRouterMessage[],
    options: StreamingOptions & {
      model?: string
      tools?: Tool[]
      maxTokens?: number
      temperature?: number
    } = {}
  ): Promise<string> {
    const { model, tools, maxTokens, temperature, ...streamOptions } = options
    
    let fullResponse = ''
    
    const stream = this.createStreamingChatCompletion({
      model: model || this.config.defaultModel,
      messages,
      tools,
      max_tokens: maxTokens,
      temperature,
      stream: true
    }, streamOptions)

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content
      if (content) {
        fullResponse += content
      }
    }

    return fullResponse
  }

  /**
   * Agentic loop for multi-turn tool conversations
   */
  async *agenticChat(
    messages: OpenRouterMessage[],
    tools: Tool[],
    options: {
      model?: string
      maxIterations?: number
      onIteration?: (iteration: number, messages: OpenRouterMessage[]) => void
      toolExecutor?: (toolCall: ToolCall) => Promise<string>
    } = {}
  ): AsyncGenerator<{ messages: OpenRouterMessage[]; iteration: number; done: boolean }, void, unknown> {
    const {
      model = this.config.defaultModel,
      maxIterations = 10,
      toolExecutor,
      onIteration
    } = options

    let currentMessages = [...messages]
    let iteration = 0

    while (iteration < maxIterations) {
      iteration++
      onIteration?.(iteration, currentMessages)

      // Make the API call
      const response = await this.createChatCompletion({
        model,
        messages: currentMessages,
        tools,
        tool_choice: 'auto'
      })

      const assistantMessage = response.choices[0]?.message
      if (!assistantMessage) {
        throw new Error('No assistant message in response')
      }

      // Add assistant message to conversation
      currentMessages.push(assistantMessage)

      // Check if we need to execute tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Execute tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          let result: string
          
          if (toolExecutor) {
            result = await toolExecutor(toolCall)
          } else {
            // Default tool execution (you might want to customize this)
            result = await this.toolHandler.executeToolCall(toolCall)
          }

          // Add tool result message
          currentMessages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id
          })
        }

        yield { messages: currentMessages, iteration, done: false }
      } else {
        // No more tool calls, we're done
        yield { messages: currentMessages, iteration, done: true }
        break
      }
    }

    if (iteration >= maxIterations) {
      throw new Error(`Maximum iterations (${maxIterations}) reached`)
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    const response = await fetch(`${this.config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': this.config.httpReferer,
        'X-Title': this.config.appName
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * Context management methods
   */
  getContext(conversationId?: string): OpenRouterMessage[] {
    return this.contextManager.getMessages(conversationId)
  }

  addToContext(messages: OpenRouterMessage | OpenRouterMessage[], conversationId?: string): void {
    this.contextManager.addMessages(Array.isArray(messages) ? messages : [messages], conversationId)
  }

  clearContext(conversationId?: string): void {
    this.contextManager.clear(conversationId)
  }

  /**
   * Tool management methods
   */
  registerTool(name: string, handler: (parameters: any) => Promise<string> | string): void {
    this.toolHandler.registerTool(name, handler)
  }

  unregisterTool(name: string): void {
    this.toolHandler.unregisterTool(name)
  }

  /**
   * Private method to make HTTP requests
   */
  private async makeRequest(request: ChatCompletionRequest, signal?: AbortSignal): Promise<Response> {
    const url = `${this.config.baseUrl}/chat/completions`
    
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': this.config.httpReferer,
        'X-Title': this.config.appName
      },
      body: JSON.stringify(request),
      signal
    })
  }
}