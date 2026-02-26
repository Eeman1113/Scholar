/**
 * Error handling for OpenRouter API integration
 * 
 * Comprehensive error types and handling for various OpenRouter API scenarios
 */

export const OpenRouterErrorCode = {
  // Authentication errors
  INVALID_API_KEY: 'invalid_api_key',
  UNAUTHORIZED: 'unauthorized',
  
  // Rate limiting
  RATE_LIMITED: 'rate_limited',
  QUOTA_EXCEEDED: 'quota_exceeded',
  
  // Request errors
  INVALID_REQUEST: 'invalid_request',
  INVALID_MODEL: 'invalid_model',
  INVALID_PARAMETERS: 'invalid_parameters',
  CONTEXT_LENGTH_EXCEEDED: 'context_length_exceeded',
  
  // Server errors
  SERVER_ERROR: 'server_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  TIMEOUT: 'timeout',
  
  // Streaming errors
  STREAM_ERROR: 'stream_error',
  STREAM_INTERRUPTED: 'stream_interrupted',
  SSE_PARSE_ERROR: 'sse_parse_error',
  
  // Tool errors
  TOOL_NOT_FOUND: 'tool_not_found',
  TOOL_EXECUTION_ERROR: 'tool_execution_error',
  INVALID_TOOL_PARAMETERS: 'invalid_tool_parameters',
  
  // Network errors
  NETWORK_ERROR: 'network_error',
  CONNECTION_ERROR: 'connection_error',
  
  // Client errors
  INVALID_CONFIGURATION: 'invalid_configuration',
  CONTEXT_MANAGER_ERROR: 'context_manager_error',
  
  // Unknown
  UNKNOWN_ERROR: 'unknown_error'
} as const

export type OpenRouterErrorCodeType = typeof OpenRouterErrorCode[keyof typeof OpenRouterErrorCode]

export class OpenRouterError extends Error {
  public readonly code: OpenRouterErrorCodeType
  public readonly statusCode?: number
  public readonly details?: any
  public readonly retryable: boolean

  constructor(
    message: string,
    code: OpenRouterErrorCodeType = OpenRouterErrorCode.UNKNOWN_ERROR,
    statusCode?: number,
    details?: any
  ) {
    super(message)
    this.name = 'OpenRouterError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.retryable = this.isRetryable(code, statusCode)
    
    // Maintain proper stack trace
    if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, OpenRouterError)
    }
  }

  private isRetryable(code: OpenRouterErrorCodeType, statusCode?: number): boolean {
    // Determine if the error is retryable
    const retryableCodes: OpenRouterErrorCodeType[] = [
      OpenRouterErrorCode.SERVER_ERROR,
      OpenRouterErrorCode.SERVICE_UNAVAILABLE,
      OpenRouterErrorCode.TIMEOUT,
      OpenRouterErrorCode.NETWORK_ERROR,
      OpenRouterErrorCode.CONNECTION_ERROR
    ]

    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
    
    return retryableCodes.includes(code) || 
           (statusCode !== undefined && retryableStatusCodes.includes(statusCode))
  }

  static fromResponse(response: Response, responseBody?: any): OpenRouterError {
    const status = response.status
    let code: OpenRouterErrorCodeType = OpenRouterErrorCode.UNKNOWN_ERROR
    let message = `HTTP ${status}: ${response.statusText}`
    
    // Map HTTP status codes to error codes
    switch (status) {
      case 400:
        code = OpenRouterErrorCode.INVALID_REQUEST
        break
      case 401:
        code = OpenRouterErrorCode.UNAUTHORIZED
        break
      case 402:
        code = OpenRouterErrorCode.QUOTA_EXCEEDED
        break
      case 403:
        code = OpenRouterErrorCode.INVALID_API_KEY
        break
      case 408:
        code = OpenRouterErrorCode.TIMEOUT
        break
      case 429:
        code = OpenRouterErrorCode.RATE_LIMITED
        break
      case 500:
        code = OpenRouterErrorCode.SERVER_ERROR
        break
      case 502:
        code = OpenRouterErrorCode.SERVICE_UNAVAILABLE
        break
      case 503:
        code = OpenRouterErrorCode.SERVICE_UNAVAILABLE
        break
      case 504:
        code = OpenRouterErrorCode.TIMEOUT
        break
    }

    // Use error message from response body if available
    if (responseBody?.error?.message) {
      message = responseBody.error.message
    }

    return new OpenRouterError(message, code, status, responseBody)
  }

  static fromFetchError(error: Error): OpenRouterError {
    if (error.name === 'AbortError') {
      return new OpenRouterError('Request aborted', OpenRouterErrorCode.STREAM_INTERRUPTED)
    }
    
    if (error.message.includes('fetch')) {
      return new OpenRouterError(
        `Network error: ${error.message}`,
        OpenRouterErrorCode.NETWORK_ERROR
      )
    }

    return new OpenRouterError(
      error.message,
      OpenRouterErrorCode.CONNECTION_ERROR,
      undefined,
      { originalError: error }
    )
  }
}

export class OpenRouterStreamError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, OpenRouterErrorCode.STREAM_ERROR, undefined, details)
    this.name = 'OpenRouterStreamError'
  }
}

export class OpenRouterToolError extends OpenRouterError {
  public readonly toolName?: string

  constructor(message: string, toolName?: string, details?: any) {
    super(
      message, 
      OpenRouterErrorCode.TOOL_EXECUTION_ERROR, 
      undefined, 
      details
    )
    this.name = 'OpenRouterToolError'
    this.toolName = toolName
  }
}

export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, OpenRouterErrorCode.INVALID_CONFIGURATION, undefined, details)
    this.name = 'OpenRouterConfigError'
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  private static retryDelays = [1000, 2000, 4000, 8000] // Exponential backoff

  /**
   * Retry a function with exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    customDelays?: number[]
  ): Promise<T> {
    const delays = customDelays || this.retryDelays.slice(0, maxRetries)
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry if it's not a retryable error
        if (error instanceof OpenRouterError && !error.retryable) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break
        }

        // Wait before retrying
        const delay = delays[attempt] || delays[delays.length - 1]
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  /**
   * Handle streaming errors with recovery strategies
   */
  static async handleStreamingError(
    error: Error,
    onRecovery?: () => Promise<void>
  ): Promise<void> {
    if (error instanceof OpenRouterStreamError) {
      // Stream-specific recovery
      if (error.code === OpenRouterErrorCode.STREAM_INTERRUPTED && onRecovery) {
        await onRecovery()
        return
      }
    }

    // Re-throw non-recoverable errors
    throw error
  }

  /**
   * Validate OpenRouter configuration
   */
  static validateConfig(config: any): void {
    if (!config.apiKey) {
      throw new OpenRouterConfigError('API key is required')
    }

    if (typeof config.apiKey !== 'string' || config.apiKey.trim().length === 0) {
      throw new OpenRouterConfigError('API key must be a non-empty string')
    }

    if (config.baseUrl && typeof config.baseUrl !== 'string') {
      throw new OpenRouterConfigError('Base URL must be a string')
    }

    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
      throw new OpenRouterConfigError('Timeout must be a positive number')
    }

    if (config.maxRetries && (typeof config.maxRetries !== 'number' || config.maxRetries < 0)) {
      throw new OpenRouterConfigError('Max retries must be a non-negative number')
    }
  }

  /**
   * Create user-friendly error messages
   */
  static formatErrorForUser(error: Error): string {
    if (!(error instanceof OpenRouterError)) {
      return 'An unexpected error occurred. Please try again.'
    }

    switch (error.code) {
      case OpenRouterErrorCode.INVALID_API_KEY:
        return 'Invalid API key. Please check your OpenRouter API key in settings.'
      
      case OpenRouterErrorCode.UNAUTHORIZED:
        return 'Unauthorized access. Please verify your API key has the correct permissions.'
      
      case OpenRouterErrorCode.RATE_LIMITED:
        return 'Rate limit exceeded. Please wait a moment and try again.'
      
      case OpenRouterErrorCode.QUOTA_EXCEEDED:
        return 'API quota exceeded. Please check your OpenRouter account billing.'
      
      case OpenRouterErrorCode.CONTEXT_LENGTH_EXCEEDED:
        return 'Message too long. Please reduce the length of your message or conversation history.'
      
      case OpenRouterErrorCode.INVALID_MODEL:
        return 'The selected model is not available. Please try a different model.'
      
      case OpenRouterErrorCode.SERVICE_UNAVAILABLE:
        return 'OpenRouter service is temporarily unavailable. Please try again later.'
      
      case OpenRouterErrorCode.NETWORK_ERROR:
      case OpenRouterErrorCode.CONNECTION_ERROR:
        return 'Network connection error. Please check your internet connection and try again.'
      
      case OpenRouterErrorCode.TOOL_EXECUTION_ERROR:
        return `Tool execution failed${error instanceof OpenRouterToolError && error.toolName ? ` for ${error.toolName}` : ''}. Please try again.`
      
      default:
        return error.message || 'An error occurred while processing your request.'
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}