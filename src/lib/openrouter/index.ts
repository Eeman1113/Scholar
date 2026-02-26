/**
 * OpenRouter API Integration
 * 
 * A comprehensive TypeScript client for OpenRouter API with streaming, 
 * tool calling, and context management capabilities.
 * 
 * Features:
 * - ✅ Streaming responses with proper SSE parsing
 * - ✅ Tool calling with OpenRouter's function format
 * - ✅ Conversation context management
 * - ✅ Comprehensive error handling
 * - ✅ Agentic loops for multi-turn conversations
 * - ✅ Built-in retry logic and error recovery
 * - ✅ TypeScript support with full type definitions
 * 
 * @example
 * ```typescript
 * import { OpenRouterClient } from './lib/openrouter'
 * 
 * const client = new OpenRouterClient({
 *   apiKey: 'your-api-key'
 * })
 * 
 * // Simple streaming chat
 * const response = await client.streamChat([
 *   { role: 'user', content: 'Hello!' }
 * ])
 * ```
 */

// Main exports  
import { OpenRouterClient } from './client'
export { OpenRouterClient }
export { ContextManager } from './context-manager'
export { ToolCallHandler, BuiltInTools } from './tool-handler'
export { SSEParser } from './utils/sse-parser'
export { EventEmitter } from './utils/event-emitter'

// Error types
export {
  OpenRouterError,
  OpenRouterStreamError,
  OpenRouterToolError,
  OpenRouterConfigError,
  OpenRouterErrorCode,
  ErrorHandler
} from './errors'

// Type definitions
export type {
  OpenRouterMessage,
  ToolCall,
  Tool,
  ChatCompletionRequest,
  ChatCompletionResponse,
  OpenRouterConfig,
  StreamingOptions
} from './client'

export type {
  ContextOptions,
  ConversationContext
} from './context-manager'

export type {
  ToolFunction,
  ToolExecutionResult,
  RegisteredTool
} from './tool-handler'

/**
 * Create a preconfigured OpenRouter client instance
 */
export function createOpenRouterClient(config: {
  apiKey: string
  model?: string
  baseUrl?: string
  timeout?: number
}): OpenRouterClient {
  return new OpenRouterClient({
    apiKey: config.apiKey,
    defaultModel: config.model || 'anthropic/claude-3.5-sonnet',
    baseUrl: config.baseUrl,
    timeout: config.timeout
  })
}

/**
 * Utility function to validate OpenRouter API key format
 */
export function isValidApiKey(apiKey: string): boolean {
  // OpenRouter API keys typically start with "sk-or-"
  return typeof apiKey === 'string' && 
         apiKey.length > 10 && 
         (apiKey.startsWith('sk-or-') || apiKey.startsWith('sk-'))
}

/**
 * Quick setup function for common use cases
 */
export async function quickSetup(apiKey: string, options: {
  enableBuiltInTools?: boolean
  model?: string
} = {}) {
  const client = createOpenRouterClient({
    apiKey,
    model: options.model
  })

  // Register built-in tools if requested
  // TODO: Fix BuiltInTools reference
  // if (options.enableBuiltInTools) {
  //   const webSearch = BuiltInTools.createWebSearchTool()
  //   const calculator = BuiltInTools.createCalculatorTool()
  //   const textAnalysis = BuiltInTools.createTextAnalysisTool()

  //   client.registerTool(webSearch.name, webSearch.handler, webSearch.definition)
  //   client.registerTool(calculator.name, calculator.handler, calculator.definition)
  //   client.registerTool(textAnalysis.name, textAnalysis.handler, textAnalysis.definition)
  // }

  return client
}

// Version info
export const VERSION = '1.0.0'
export const SUPPORTED_OPENROUTER_VERSION = 'v1'