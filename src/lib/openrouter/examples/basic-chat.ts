/**
 * Basic Chat Example
 * 
 * Demonstrates simple streaming chat functionality with OpenRouter
 */

import { createOpenRouterClient } from '../index'

export async function basicChatExample() {
  // Create client
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('🚀 Starting basic chat example...\n')

  try {
    // Simple non-streaming request
    console.log('📤 Sending message: "What is the capital of France?"')
    
    const response = await client.createChatCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'user', content: 'What is the capital of France?' }
      ]
    })

    console.log('📥 Response:', response.choices[0].message?.content)
    console.log('💰 Usage:', response.usage)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

export async function streamingChatExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('\n🌊 Starting streaming chat example...\n')

  try {
    console.log('📤 Streaming message: "Tell me a short story about a robot"')
    process.stdout.write('📥 Response: ')

    // Streaming with callbacks
    await client.streamChat([
      { role: 'user', content: 'Tell me a short story about a robot' }
    ], {
      onContent: (content) => {
        process.stdout.write(content)
      },
      onComplete: (fullResponse, usage) => {
        console.log('\n\n✅ Stream completed!')
        console.log('💰 Usage:', usage)
        console.log('📏 Total length:', fullResponse.length, 'characters')
      },
      onError: (error) => {
        console.error('\n❌ Stream error:', error.message)
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run examples if called directly
if (import.meta.url === new URL(import.meta.resolve('./basic-chat.ts')).href) {
  (async () => {
    await basicChatExample()
    await streamingChatExample()
  })()
}