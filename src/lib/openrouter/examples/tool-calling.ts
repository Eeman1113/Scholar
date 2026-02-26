/**
 * Tool Calling Example
 * 
 * Demonstrates OpenRouter tool calling with custom and built-in tools
 */

import { createOpenRouterClient, BuiltInTools } from '../index'
import type { Tool } from '../client'

export async function toolCallingExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('🔧 Starting tool calling example...\n')

  // Register a custom weather tool
  client.registerTool('get_weather', async (params: { location: string }) => {
    // Simulate weather API call
    const weather = {
      location: params.location,
      temperature: Math.round(Math.random() * 30) + 10,
      condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
      humidity: Math.round(Math.random() * 100)
    }
    
    return `Current weather in ${weather.location}: ${weather.temperature}°C, ${weather.condition}, ${weather.humidity}% humidity`
  }, {
    description: 'Get current weather information for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city or location to get weather for'
        }
      },
      required: ['location']
    }
  })

  // Register built-in calculator tool
  const calculator = BuiltInTools.createCalculatorTool()
  client.registerTool(calculator.name, calculator.handler, calculator.definition)

  // Define tools for the request
  const tools: Tool[] = [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather information for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city or location to get weather for'
            }
          },
          required: ['location']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'calculator',
        description: 'Evaluate mathematical expressions',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Mathematical expression to evaluate'
            }
          },
          required: ['expression']
        }
      }
    }
  ]

  try {
    console.log('📤 Asking: "What\'s the weather in London and what\'s 15 * 23?"')

    const response = await client.createChatCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: "What's the weather in London and what's 15 * 23?"
        }
      ],
      tools,
      tool_choice: 'auto'
    })

    const message = response.choices[0].message
    console.log('🤖 Assistant:', message?.content)

    // Check for tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
      console.log('\n🔧 Tool calls detected:', message.tool_calls.length)
      
      // Execute tools and continue conversation
      const toolResults: any[] = []
      
      for (const toolCall of message.tool_calls) {
        console.log(`\n⚡ Executing: ${toolCall.function.name}`)
        console.log(`   Parameters:`, JSON.parse(toolCall.function.arguments))
        
        const result = await client.toolHandler.executeToolCall(toolCall)
        console.log(`   Result: ${result}`)
        
        toolResults.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id
        })
      }

      // Continue conversation with tool results
      const followUpResponse = await client.createChatCompletion({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: "What's the weather in London and what's 15 * 23?"
          },
          message,
          ...toolResults
        ],
        tools
      })

      console.log('\n🤖 Final response:', followUpResponse.choices[0].message?.content)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

export async function agenticLoopExample() {
  const client = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here'
  })

  console.log('\n🔄 Starting agentic loop example...\n')

  // Register research tool
  client.registerTool('research_topic', async (params: { topic: string; depth: string }) => {
    // Simulate research
    const findings = [
      `Key finding about ${params.topic}: Recent developments show significant progress`,
      `Statistical data: 73% improvement in ${params.topic} over the last year`,
      `Expert opinion: ${params.topic} is expected to grow by 25% next year`
    ]
    
    return `Research findings for ${params.topic} (${params.depth} analysis):\n${findings.join('\n')}`
  }, {
    description: 'Research a topic and provide detailed findings',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to research'
        },
        depth: {
          type: 'string',
          enum: ['basic', 'detailed', 'comprehensive'],
          description: 'Depth of research required'
        }
      },
      required: ['topic', 'depth']
    }
  })

  const tools = client.toolHandler.getToolDefinitions()

  try {
    console.log('📤 Starting research task: "Research renewable energy and provide insights"')

    const agenticLoop = client.agenticChat([
      {
        role: 'system',
        content: 'You are a research assistant. Use the research_topic tool to gather information, then provide a comprehensive analysis.'
      },
      {
        role: 'user',
        content: 'Research renewable energy trends and provide insights for a business presentation'
      }
    ], tools, {
      maxIterations: 5,
      onIteration: (iteration, messages) => {
        console.log(`\n🔄 Iteration ${iteration} (${messages.length} messages in context)`)
      }
    })

    for await (const { messages, iteration, done } of agenticLoop) {
      const lastMessage = messages[messages.length - 1]
      
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        console.log(`\n🤖 Assistant (iteration ${iteration}):`, lastMessage.content)
      }
      
      if (lastMessage.role === 'tool') {
        console.log(`\n🔧 Tool result:`, lastMessage.content?.substring(0, 200) + '...')
      }

      if (done) {
        console.log('\n✅ Agentic conversation completed!')
        break
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run examples if called directly
if (import.meta.url === new URL(import.meta.resolve('./tool-calling.ts')).href) {
  (async () => {
    await toolCallingExample()
    await agenticLoopExample()
  })()
}