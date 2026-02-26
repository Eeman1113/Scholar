/**
 * Tool Call Handler for OpenRouter API
 * 
 * Manages tool registration, execution, and OpenRouter's tool calling format.
 * Supports both synchronous and asynchronous tool functions.
 */

import type { ToolCall, Tool } from './client'

export type ToolFunction = (parameters: any) => Promise<string> | string

export interface ToolExecutionResult {
  success: boolean
  result?: string
  error?: string
  executionTime?: number
}

export interface RegisteredTool {
  name: string
  description: string
  parameters: any
  handler: ToolFunction
  metadata?: Record<string, any>
}

/**
 * Tool Call Handler class
 */
export class ToolCallHandler {
  private tools: Map<string, RegisteredTool> = new Map()
  private executionHistory: Array<{
    toolName: string
    parameters: any
    result: ToolExecutionResult
    timestamp: number
  }> = []

  /**
   * Register a tool for execution
   */
  registerTool(
    name: string, 
    handler: ToolFunction,
    definition?: Omit<RegisteredTool, 'name' | 'handler'>
  ): void {
    const tool: RegisteredTool = {
      name,
      handler,
      description: definition?.description || `Execute ${name} tool`,
      parameters: definition?.parameters || {
        type: 'object',
        properties: {},
        required: []
      },
      metadata: definition?.metadata
    }

    this.tools.set(name, tool)
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): boolean {
    return this.tools.delete(name)
  }

  /**
   * Get registered tool
   */
  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name)
  }

  /**
   * Get all registered tools as OpenRouter Tool format
   */
  getToolDefinitions(): Tool[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }))
  }

  /**
   * Execute a tool call
   */
  async executeToolCall(toolCall: ToolCall): Promise<string> {
    const startTime = Date.now()
    const tool = this.tools.get(toolCall.function.name)

    if (!tool) {
      const error = `Tool "${toolCall.function.name}" not found`
      this.recordExecution(toolCall.function.name, {}, {
        success: false,
        error,
        executionTime: Date.now() - startTime
      })
      return JSON.stringify({ error })
    }

    try {
      // Parse parameters
      let parameters: any = {}
      if (toolCall.function.arguments) {
        try {
          parameters = JSON.parse(toolCall.function.arguments)
        } catch (parseError) {
          const error = `Invalid tool parameters: ${parseError}`
          this.recordExecution(toolCall.function.name, toolCall.function.arguments, {
            success: false,
            error,
            executionTime: Date.now() - startTime
          })
          return JSON.stringify({ error })
        }
      }

      // Validate parameters against schema
      const validationError = this.validateParameters(parameters, tool.parameters)
      if (validationError) {
        this.recordExecution(toolCall.function.name, parameters, {
          success: false,
          error: validationError,
          executionTime: Date.now() - startTime
        })
        return JSON.stringify({ error: validationError })
      }

      // Execute the tool
      const result = await Promise.resolve(tool.handler(parameters))
      const executionTime = Date.now() - startTime

      this.recordExecution(toolCall.function.name, parameters, {
        success: true,
        result,
        executionTime
      })

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const executionTime = Date.now() - startTime

      this.recordExecution(toolCall.function.name, {}, {
        success: false,
        error: errorMessage,
        executionTime
      })

      return JSON.stringify({ error: errorMessage })
    }
  }

  /**
   * Execute multiple tool calls in parallel
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<string[]> {
    const promises = toolCalls.map(toolCall => this.executeToolCall(toolCall))
    return Promise.all(promises)
  }

  /**
   * Validate parameters against tool schema
   */
  private validateParameters(parameters: any, schema: any): string | null {
    if (!schema || schema.type !== 'object') {
      return null // Skip validation if schema is not properly defined
    }

    const { properties = {}, required = [] } = schema

    // Check required parameters
    for (const requiredParam of required) {
      if (!(requiredParam in parameters)) {
        return `Missing required parameter: ${requiredParam}`
      }
    }

    // Basic type checking for properties
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const paramSchema = properties[paramName]
      if (!paramSchema) continue

      const error = this.validateParameterType(paramName, paramValue, paramSchema)
      if (error) return error
    }

    return null
  }

  /**
   * Validate individual parameter type
   */
  private validateParameterType(name: string, value: any, schema: any): string | null {
    const { type, enum: enumValues } = schema

    if (enumValues && !enumValues.includes(value)) {
      return `Parameter ${name} must be one of: ${enumValues.join(', ')}`
    }

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `Parameter ${name} must be a string`
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `Parameter ${name} must be a number`
        }
        break
      case 'integer':
        if (!Number.isInteger(value)) {
          return `Parameter ${name} must be an integer`
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Parameter ${name} must be a boolean`
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          return `Parameter ${name} must be an array`
        }
        break
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `Parameter ${name} must be an object`
        }
        break
    }

    return null
  }

  /**
   * Record tool execution for history/debugging
   */
  private recordExecution(
    toolName: string,
    parameters: any,
    result: ToolExecutionResult
  ): void {
    this.executionHistory.push({
      toolName,
      parameters,
      result,
      timestamp: Date.now()
    })

    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory.shift()
    }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(toolName?: string): typeof this.executionHistory {
    if (toolName) {
      return this.executionHistory.filter(entry => entry.toolName === toolName)
    }
    return [...this.executionHistory]
  }

  /**
   * Clear execution history
   */
  clearExecutionHistory(): void {
    this.executionHistory = []
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    totalExecutions: number
    successRate: number
    averageExecutionTime: number
    toolUsage: Record<string, number>
  } {
    const total = this.executionHistory.length
    if (total === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        toolUsage: {}
      }
    }

    const successful = this.executionHistory.filter(entry => entry.result.success).length
    const totalTime = this.executionHistory.reduce(
      (sum, entry) => sum + (entry.result.executionTime || 0), 
      0
    )
    
    const toolUsage: Record<string, number> = {}
    this.executionHistory.forEach(entry => {
      toolUsage[entry.toolName] = (toolUsage[entry.toolName] || 0) + 1
    })

    return {
      totalExecutions: total,
      successRate: successful / total,
      averageExecutionTime: totalTime / total,
      toolUsage
    }
  }
}

/**
 * Built-in tools for common functionality
 */
export class BuiltInTools {
  /**
   * Create a web search tool
   */
  static createWebSearchTool(): { name: string; handler: ToolFunction; definition: any } {
    return {
      name: 'web_search',
      handler: async (params: { query: string; num_results?: number }) => {
        // This would integrate with a real search API
        return `Search results for "${params.query}" (${params.num_results || 5} results)`
      },
      definition: {
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            },
            num_results: {
              type: 'integer',
              description: 'Number of results to return',
              default: 5
            }
          },
          required: ['query']
        }
      }
    }
  }

  /**
   * Create a calculator tool
   */
  static createCalculatorTool(): { name: string; handler: ToolFunction; definition: any } {
    return {
      name: 'calculator',
      handler: async (params: { expression: string }) => {
        try {
          // Simple math evaluation (in production, use a safe math parser)
          const result = Function(`"use strict"; return (${params.expression})`)()
          return `The result is: ${result}`
        } catch (error) {
          return `Error evaluating expression: ${error}`
        }
      },
      definition: {
        description: 'Evaluate mathematical expressions',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")'
            }
          },
          required: ['expression']
        }
      }
    }
  }

  /**
   * Create a text analysis tool
   */
  static createTextAnalysisTool(): { name: string; handler: ToolFunction; definition: any } {
    return {
      name: 'analyze_text',
      handler: async (params: { text: string; analysis_type: string }) => {
        const text = params.text
        const type = params.analysis_type

        switch (type) {
          case 'word_count':
            const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
            return `Word count: ${wordCount}`

          case 'readability':
            const sentences = text.split(/[.!?]+/).length - 1
            const words = text.split(/\s+/).length
            const avgWordsPerSentence = words / sentences
            return `Average words per sentence: ${avgWordsPerSentence.toFixed(1)}`

          case 'sentiment':
            // Simple sentiment analysis
            const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful']
            const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor']
            
            const lowerText = text.toLowerCase()
            const positive = positiveWords.filter(word => lowerText.includes(word)).length
            const negative = negativeWords.filter(word => lowerText.includes(word)).length
            
            let sentiment = 'neutral'
            if (positive > negative) sentiment = 'positive'
            else if (negative > positive) sentiment = 'negative'
            
            return `Sentiment: ${sentiment} (positive: ${positive}, negative: ${negative})`

          default:
            return `Analysis type "${type}" not supported`
        }
      },
      definition: {
        description: 'Analyze text for various metrics',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to analyze'
            },
            analysis_type: {
              type: 'string',
              enum: ['word_count', 'readability', 'sentiment'],
              description: 'Type of analysis to perform'
            }
          },
          required: ['text', 'analysis_type']
        }
      }
    }
  }
}