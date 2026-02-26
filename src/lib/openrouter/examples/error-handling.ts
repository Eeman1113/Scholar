/**
 * Error Handling Example
 * 
 * Demonstrates comprehensive error handling and retry strategies
 */

import { 
  createOpenRouterClient, 
  OpenRouterError, 
  ErrorHandler,
  OpenRouterErrorCode 
} from '../index'

export async function errorHandlingExample() {
  console.log('🚨 Starting error handling example...\n')

  // Test with invalid API key
  console.log('1️⃣ Testing invalid API key...')
  try {
    const invalidClient = createOpenRouterClient({
      apiKey: 'invalid-key'
    })

    await invalidClient.createChatCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: 'Hello' }]
    })
  } catch (error) {
    if (error instanceof OpenRouterError) {
      console.log(`   ❌ Caught OpenRouterError: ${error.code}`)
      console.log(`   📝 User message: ${ErrorHandler.formatErrorForUser(error)}`)
      console.log(`   🔄 Retryable: ${error.retryable}`)
    } else {
      console.log('   ❌ Unexpected error:', error)
    }
  }

  // Test retry mechanism
  console.log('\n2️⃣ Testing retry mechanism...')
  let attemptCount = 0
  
  try {
    await ErrorHandler.withRetry(async () => {
      attemptCount++
      console.log(`   🔄 Attempt ${attemptCount}`)
      
      if (attemptCount < 3) {
        // Simulate temporary failure
        throw new OpenRouterError(
          'Temporary server error',
          OpenRouterErrorCode.SERVER_ERROR,
          500
        )
      }
      
      return 'Success!'
    }, 3)
    
    console.log('   ✅ Success after retries!')
  } catch (error) {
    console.log('   ❌ Failed after all retries')
  }

  // Test with valid client but simulate network issues
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('\n3️⃣ Testing graceful streaming error handling...')
  try {
    const controller = new AbortController()
    
    // Start a stream and abort it quickly
    setTimeout(() => {
      console.log('   ⏹️ Aborting stream...')
      controller.abort()
    }, 100)

    await client.streamChat([
      { role: 'user', content: 'Tell me a long story about space exploration' }
    ], {
      signal: controller.signal,
      onError: (error) => {
        console.log('   📢 Stream error callback:', error.message)
      }
    })

  } catch (error) {
    if (error instanceof OpenRouterError) {
      console.log(`   ✅ Properly caught stream abortion: ${error.code}`)
    }
  }

  console.log('\n4️⃣ Testing configuration validation...')
  try {
    ErrorHandler.validateConfig({
      apiKey: '',
      timeout: -1
    })
  } catch (error) {
    if (error instanceof OpenRouterError) {
      console.log(`   ✅ Configuration validation caught: ${error.message}`)
    }
  }
}

export async function robustStreamingExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('\n🛡️ Robust streaming with error recovery...\n')

  let retryCount = 0
  const maxRetries = 2

  const attemptStream = async (): Promise<string> => {
    try {
      console.log(`📡 Stream attempt ${retryCount + 1}/${maxRetries + 1}`)
      
      return await client.streamChat([
        { 
          role: 'user', 
          content: 'Write a detailed explanation of how neural networks work' 
        }
      ], {
        model: 'anthropic/claude-3.5-sonnet',
        onContent: (content) => {
          process.stdout.write(content)
        },
        onComplete: (fullResponse) => {
          console.log('\n✅ Stream completed successfully!')
          return fullResponse
        },
        onError: (error) => {
          console.log('\n❌ Stream error:', error.message)
          throw error
        }
      })

    } catch (error) {
      retryCount++
      
      if (error instanceof OpenRouterError && error.retryable && retryCount <= maxRetries) {
        console.log(`\n🔄 Retrying stream in 2 seconds... (attempt ${retryCount})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return attemptStream()
      } else {
        console.log('\n💀 Stream failed permanently:', ErrorHandler.formatErrorForUser(error as Error))
        throw error
      }
    }
  }

  try {
    await attemptStream()
  } catch (finalError) {
    console.log('\n⚰️ All retry attempts exhausted')
  }
}

export async function toolErrorHandlingExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('\n🔧 Tool error handling example...\n')

  // Register a tool that might fail
  client.registerTool('unreliable_api', async (params: { query: string }) => {
    // Simulate random failures
    if (Math.random() < 0.5) {
      throw new Error('API temporarily unavailable')
    }
    
    return `Query "${params.query}" processed successfully`
  }, {
    description: 'An unreliable API tool that sometimes fails',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Query to process'
        }
      },
      required: ['query']
    }
  })

  try {
    console.log('📤 Asking assistant to use unreliable tool...')

    // Use agentic loop with error handling
    const agenticLoop = client.agenticChat([
      {
        role: 'system',
        content: 'You are an assistant that uses tools. If a tool fails, acknowledge the error and suggest alternatives.'
      },
      {
        role: 'user',
        content: 'Please use the unreliable_api tool to process the query "test data"'
      }
    ], client.toolHandler.getToolDefinitions(), {
      maxIterations: 3,
      toolExecutor: async (toolCall) => {
        try {
          return await client.toolHandler.executeToolCall(toolCall)
        } catch (error) {
          console.log(`   ⚠️ Tool ${toolCall.function.name} failed:`, error.message)
          return `Tool execution failed: ${error.message}. Please try an alternative approach.`
        }
      }
    })

    for await (const { messages, iteration, done } of agenticLoop) {
      const lastMessage = messages[messages.length - 1]
      
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        console.log(`\n🤖 Response (iteration ${iteration}):`, lastMessage.content)
      }

      if (done) break
    }

    // Show tool execution statistics
    const stats = client.toolHandler.getExecutionStats()
    console.log('\n📊 Tool execution stats:', stats)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run examples if called directly
if (import.meta.url === new URL(import.meta.resolve('./error-handling.ts')).href) {
  (async () => {
    await errorHandlingExample()
    await robustStreamingExample()
    await toolErrorHandlingExample()
  })()
}