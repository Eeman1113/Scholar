/**
 * Context Management Example
 * 
 * Demonstrates conversation context management and multi-turn conversations
 */

import { createOpenRouterClient } from '../index'

export async function contextManagementExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('💭 Starting context management example...\n')

  const conversationId = 'example-conversation'

  try {
    // Start a conversation
    console.log('👤 User: "Hi, I\'m planning a trip to Japan. What should I know?"')
    
    let messages = client.getContext(conversationId)
    messages = client.contextManager.createPrompt(
      "Hi, I'm planning a trip to Japan. What should I know?",
      "You are a helpful travel assistant. Provide detailed and practical travel advice.",
      conversationId
    )

    const response1 = await client.createChatCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages
    })

    const assistantResponse1 = response1.choices[0].message?.content || ''
    console.log('🤖 Assistant:', assistantResponse1.substring(0, 200) + '...')

    // Add response to context
    client.addToContext([
      { role: 'user', content: "Hi, I'm planning a trip to Japan. What should I know?" },
      { role: 'assistant', content: assistantResponse1 }
    ], conversationId)

    // Continue the conversation
    console.log('\n👤 User: "What about the best time to visit for cherry blossoms?"')
    
    const messages2 = client.contextManager.createPrompt(
      "What about the best time to visit for cherry blossoms?",
      undefined,
      conversationId
    )

    const response2 = await client.createChatCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: messages2
    })

    const assistantResponse2 = response2.choices[0].message?.content || ''
    console.log('🤖 Assistant:', assistantResponse2.substring(0, 200) + '...')

    // Add to context
    client.addToContext([
      { role: 'user', content: "What about the best time to visit for cherry blossoms?" },
      { role: 'assistant', content: assistantResponse2 }
    ], conversationId)

    // Check context stats
    const stats = client.contextManager.getStats(conversationId)
    console.log('\n📊 Context Stats:', stats)

    // Show full conversation
    const fullContext = client.getContext(conversationId)
    console.log('\n📝 Full conversation history:')
    fullContext.forEach((msg, i) => {
      const preview = msg.content?.substring(0, 100) || ''
      console.log(`  ${i + 1}. ${msg.role}: ${preview}${preview.length >= 100 ? '...' : ''}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

export async function contextTruncationExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('\n✂️ Starting context truncation example...\n')

  const conversationId = 'truncation-test'

  try {
    // Simulate a long conversation
    console.log('📝 Simulating long conversation with automatic truncation...')

    // Add many messages to trigger truncation
    for (let i = 1; i <= 15; i++) {
      client.addToContext([
        { role: 'user', content: `This is user message number ${i}. Let me tell you about my day and all the interesting things that happened. It was quite eventful with many details to share.` },
        { role: 'assistant', content: `Thank you for sharing message ${i}! I understand you had an eventful day. Let me respond with some thoughtful insights and questions about what you've told me.` }
      ], conversationId, {
        maxMessages: 10, // Trigger truncation
        preserveSystemMessages: true
      })
    }

    const stats = client.contextManager.getStats(conversationId)
    console.log('📊 Final stats after truncation:', stats)

    const context = client.getContext(conversationId)
    console.log('📝 Messages after truncation:')
    context.forEach((msg, i) => {
      const preview = msg.content?.substring(0, 50) || ''
      console.log(`  ${i + 1}. ${msg.role}: ${preview}...`)
    })

    // Test conversation export/import
    console.log('\n💾 Testing export/import...')
    const exported = client.contextManager.exportConversation(conversationId)
    console.log('Exported conversation:', {
      id: exported?.id,
      messageCount: exported?.messages.length,
      created: new Date(exported?.created || 0).toISOString()
    })

    // Clear and import
    client.clearContext(conversationId)
    if (exported) {
      client.contextManager.importConversation(exported)
      console.log('✅ Successfully imported conversation back')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

export async function multiConversationExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('\n👥 Starting multi-conversation example...\n')

  try {
    // Start multiple conversations
    const conversations = ['travel', 'cooking', 'technology']
    
    for (const topic of conversations) {
      console.log(`🆔 Starting conversation: ${topic}`)
      
      const prompt = {
        travel: "I want to plan a vacation. Where should I go?",
        cooking: "I want to learn how to cook Italian food. Any tips?",
        technology: "What are the latest trends in AI and machine learning?"
      }[topic] || 'Hello'

      client.addToContext([
        { role: 'system', content: `You are an expert in ${topic}. Provide helpful advice.` },
        { role: 'user', content: prompt }
      ], topic)

      // Get a quick response
      const messages = client.getContext(topic)
      const response = await client.createChatCompletion({
        model: 'anthropic/claude-3.5-sonnet',
        messages
      })

      const assistantResponse = response.choices[0].message?.content || ''
      client.addToContext([
        { role: 'assistant', content: assistantResponse }
      ], topic)

      console.log(`  📋 ${topic}: ${assistantResponse.substring(0, 100)}...`)
    }

    // Show all conversations
    console.log('\n📊 All conversation stats:')
    const allConversations = client.contextManager.getConversationIds()
    
    for (const convId of allConversations) {
      const stats = client.contextManager.getStats(convId)
      console.log(`  ${convId}: ${stats?.messageCount} messages, ~${stats?.estimatedTokens} tokens`)
    }

    // Demonstrate conversation switching
    console.log('\n🔄 Continuing the travel conversation...')
    const travelMessages = client.contextManager.createPrompt(
      "Actually, I prefer mountains over beaches. Any mountain destinations?",
      undefined,
      'travel'
    )

    const response = await client.createChatCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: travelMessages
    })

    console.log('🤖 Travel assistant:', response.choices[0].message?.content?.substring(0, 200) + '...')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run examples if called directly
if (import.meta.url === new URL(import.meta.resolve('./context-management.ts')).href) {
  (async () => {
    await contextManagementExample()
    await contextTruncationExample()
    await multiConversationExample()
  })()
}