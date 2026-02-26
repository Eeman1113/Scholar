/**
 * Context Manager for OpenRouter conversations
 * 
 * Manages conversation history, context windows, and message persistence
 * across multiple turns with intelligent truncation and summarization.
 */

import type { OpenRouterMessage } from './client'

export interface ContextOptions {
  maxMessages?: number
  maxTokens?: number
  enableSummarization?: boolean
  preserveSystemMessages?: boolean
  preserveToolCalls?: boolean
}

export interface ConversationContext {
  id: string
  messages: OpenRouterMessage[]
  created: number
  updated: number
  metadata?: Record<string, any>
}

export class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map()
  private defaultOptions: Required<ContextOptions>

  constructor(options: ContextOptions = {}) {
    this.defaultOptions = {
      maxMessages: 50,
      maxTokens: 4000,
      enableSummarization: false,
      preserveSystemMessages: true,
      preserveToolCalls: true,
      ...options
    }
  }

  /**
   * Get messages for a conversation
   */
  getMessages(conversationId: string = 'default'): OpenRouterMessage[] {
    const context = this.contexts.get(conversationId)
    return context ? [...context.messages] : []
  }

  /**
   * Add messages to a conversation
   */
  addMessages(
    messages: OpenRouterMessage[],
    conversationId: string = 'default',
    options?: Partial<ContextOptions>
  ): void {
    const opts = { ...this.defaultOptions, ...options }
    let context = this.contexts.get(conversationId)

    if (!context) {
      context = {
        id: conversationId,
        messages: [],
        created: Date.now(),
        updated: Date.now()
      }
      this.contexts.set(conversationId, context)
    }

    // Add new messages
    context.messages.push(...messages)
    context.updated = Date.now()

    // Apply context management rules
    this.manageContext(context, opts)
  }

  /**
   * Update the last message in a conversation
   */
  updateLastMessage(
    updates: Partial<OpenRouterMessage>,
    conversationId: string = 'default'
  ): void {
    const context = this.contexts.get(conversationId)
    if (context && context.messages.length > 0) {
      const lastMessage = context.messages[context.messages.length - 1]
      Object.assign(lastMessage, updates)
      context.updated = Date.now()
    }
  }

  /**
   * Insert a message at a specific position
   */
  insertMessage(
    message: OpenRouterMessage,
    index: number,
    conversationId: string = 'default'
  ): void {
    const context = this.contexts.get(conversationId)
    if (context) {
      context.messages.splice(index, 0, message)
      context.updated = Date.now()
    }
  }

  /**
   * Remove messages from a conversation
   */
  removeMessages(
    indices: number[],
    conversationId: string = 'default'
  ): void {
    const context = this.contexts.get(conversationId)
    if (context) {
      // Sort indices in descending order to remove from end to start
      const sortedIndices = indices.sort((a, b) => b - a)
      for (const index of sortedIndices) {
        if (index >= 0 && index < context.messages.length) {
          context.messages.splice(index, 1)
        }
      }
      context.updated = Date.now()
    }
  }

  /**
   * Clear a conversation or all conversations
   */
  clear(conversationId?: string): void {
    if (conversationId) {
      this.contexts.delete(conversationId)
    } else {
      this.contexts.clear()
    }
  }

  /**
   * Get conversation metadata
   */
  getMetadata(conversationId: string = 'default'): Record<string, any> | undefined {
    const context = this.contexts.get(conversationId)
    return context?.metadata
  }

  /**
   * Set conversation metadata
   */
  setMetadata(
    metadata: Record<string, any>,
    conversationId: string = 'default'
  ): void {
    let context = this.contexts.get(conversationId)
    if (!context) {
      context = {
        id: conversationId,
        messages: [],
        created: Date.now(),
        updated: Date.now(),
        metadata
      }
      this.contexts.set(conversationId, context)
    } else {
      context.metadata = { ...context.metadata, ...metadata }
      context.updated = Date.now()
    }
  }

  /**
   * Get all conversation IDs
   */
  getConversationIds(): string[] {
    return Array.from(this.contexts.keys())
  }

  /**
   * Get conversation statistics
   */
  getStats(conversationId: string = 'default'): {
    messageCount: number
    estimatedTokens: number
    created: number
    updated: number
  } | null {
    const context = this.contexts.get(conversationId)
    if (!context) return null

    return {
      messageCount: context.messages.length,
      estimatedTokens: this.estimateTokens(context.messages),
      created: context.created,
      updated: context.updated
    }
  }

  /**
   * Create a context-aware prompt with system instructions
   */
  createPrompt(
    userMessage: string,
    systemPrompt?: string,
    conversationId: string = 'default'
  ): OpenRouterMessage[] {
    const messages = this.getMessages(conversationId)
    const prompt: OpenRouterMessage[] = []

    // Add system message if provided and not already present
    if (systemPrompt) {
      const hasSystemMessage = messages.some(m => m.role === 'system')
      if (!hasSystemMessage) {
        prompt.push({ role: 'system', content: systemPrompt })
      }
    }

    // Add conversation history
    prompt.push(...messages)

    // Add new user message
    prompt.push({ role: 'user', content: userMessage })

    return prompt
  }

  /**
   * Manage context size and apply truncation rules
   */
  private manageContext(
    context: ConversationContext,
    options: Required<ContextOptions>
  ): void {
    let { messages } = context
    
    // Check if we need to truncate
    const messageCount = messages.length
    const estimatedTokens = this.estimateTokens(messages)

    if (messageCount <= options.maxMessages && estimatedTokens <= options.maxTokens) {
      return // No truncation needed
    }

    // Separate system messages, tool calls, and regular messages
    const systemMessages = options.preserveSystemMessages 
      ? messages.filter(m => m.role === 'system')
      : []
    
    const toolMessages = options.preserveToolCalls
      ? messages.filter(m => m.role === 'tool' || m.tool_calls)
      : []

    const regularMessages = messages.filter(m => 
      m.role !== 'system' && 
      (!options.preserveToolCalls || (m.role !== 'tool' && !m.tool_calls))
    )

    // Apply truncation strategy
    let truncatedMessages: OpenRouterMessage[] = []

    if (options.enableSummarization && regularMessages.length > 10) {
      // Summarization strategy: keep first few, summarize middle, keep last few
      const keepFirst = 2
      const keepLast = Math.min(6, Math.floor(options.maxMessages / 2))
      
      const firstMessages = regularMessages.slice(0, keepFirst)
      const lastMessages = regularMessages.slice(-keepLast)
      
      // Create summary message
      const summaryMessage: OpenRouterMessage = {
        role: 'system',
        content: '[Previous conversation summarized for context management]'
      }

      truncatedMessages = [...firstMessages, summaryMessage, ...lastMessages]
    } else {
      // Simple truncation: keep the most recent messages
      const maxRegularMessages = options.maxMessages - systemMessages.length - toolMessages.length
      truncatedMessages = regularMessages.slice(-maxRegularMessages)
    }

    // Reconstruct the message list
    context.messages = [
      ...systemMessages,
      ...truncatedMessages,
      ...toolMessages
    ]
  }

  /**
   * Estimate token count for messages (rough approximation)
   */
  private estimateTokens(messages: OpenRouterMessage[]): number {
    return messages.reduce((total, message) => {
      const content = message.content || ''
      const toolCalls = message.tool_calls ? JSON.stringify(message.tool_calls) : ''
      
      // Rough estimate: ~4 characters per token
      return total + Math.ceil((content.length + toolCalls.length) / 4)
    }, 0)
  }

  /**
   * Export conversation for backup/analysis
   */
  exportConversation(conversationId: string = 'default'): ConversationContext | null {
    const context = this.contexts.get(conversationId)
    return context ? JSON.parse(JSON.stringify(context)) : null
  }

  /**
   * Import conversation from backup
   */
  importConversation(context: ConversationContext): void {
    this.contexts.set(context.id, context)
  }
}