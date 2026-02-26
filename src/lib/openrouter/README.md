# OpenRouter API Integration

A comprehensive TypeScript client for the OpenRouter API with streaming, tool calling, and context management capabilities.

## ✨ Features

- **🌊 Streaming Support**: Full Server-Sent Events (SSE) implementation with proper error handling
- **🔧 Tool Calling**: Complete OpenRouter function calling with parameter validation
- **💭 Context Management**: Intelligent conversation history management with automatic truncation
- **🚨 Error Handling**: Comprehensive error types and retry strategies
- **🔄 Agentic Loops**: Multi-turn conversations with tool execution
- **📊 Analytics**: Built-in usage tracking and performance monitoring
- **🎯 TypeScript**: Full type safety with extensive type definitions

## 🚀 Quick Start

### Installation

```bash
# The integration is built into your project
# No additional installation required
```

### Basic Usage

```typescript
import { createOpenRouterClient } from '@/lib/openrouter'

// Create client
const client = createOpenRouterClient({
  apiKey: 'your-openrouter-api-key'
})

// Simple chat
const response = await client.createChatCompletion({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [
    { role: 'user', content: 'Hello, world!' }
  ]
})

console.log(response.choices[0].message?.content)
```

### Streaming Chat

```typescript
// Stream a conversation
const fullResponse = await client.streamChat([
  { role: 'user', content: 'Tell me about quantum computing' }
], {
  onContent: (chunk) => console.log(chunk),
  onComplete: (full, usage) => console.log('Done!', usage)
})
```

## 🔧 Tool Calling

### Register Custom Tools

```typescript
// Register a custom tool
client.registerTool('get_weather', async (params: { location: string }) => {
  const weather = await fetchWeatherAPI(params.location)
  return `Weather in ${params.location}: ${weather.temperature}°C`
}, {
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or location'
      }
    },
    required: ['location']
  }
})

// Use tools in conversation
const response = await client.createChatCompletion({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [{ role: 'user', content: 'What\'s the weather in Tokyo?' }],
  tools: client.toolHandler.getToolDefinitions(),
  tool_choice: 'auto'
})
```

### Built-in Tools

```typescript
import { BuiltInTools } from '@/lib/openrouter'

// Add calculator tool
const calc = BuiltInTools.createCalculatorTool()
client.registerTool(calc.name, calc.handler, calc.definition)

// Add text analysis tool
const textAnalysis = BuiltInTools.createTextAnalysisTool()
client.registerTool(textAnalysis.name, textAnalysis.handler, textAnalysis.definition)
```

## 💭 Context Management

### Multi-turn Conversations

```typescript
// Start a conversation
const conversationId = 'user-123-session'

client.addToContext([
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Hello!' }
], conversationId)

// Continue the conversation
const messages = client.contextManager.createPrompt(
  'Tell me about AI',
  undefined,
  conversationId
)

const response = await client.createChatCompletion({
  model: 'anthropic/claude-3.5-sonnet',
  messages
})

// Add response to context
client.addToContext([
  { role: 'assistant', content: response.choices[0].message?.content || '' }
], conversationId)
```

### Context Configuration

```typescript
// Configure context limits
client.addToContext(messages, conversationId, {
  maxMessages: 20,
  maxTokens: 4000,
  enableSummarization: true,
  preserveSystemMessages: true
})

// Get conversation stats
const stats = client.contextManager.getStats(conversationId)
console.log(`Messages: ${stats?.messageCount}, Tokens: ~${stats?.estimatedTokens}`)
```

## 🔄 Agentic Loops

```typescript
// Multi-turn conversation with tools
const agenticChat = client.agenticChat([
  { role: 'user', content: 'Research renewable energy and create a summary' }
], tools, {
  maxIterations: 5,
  onIteration: (iter, msgs) => console.log(`Iteration ${iter}`),
  toolExecutor: async (toolCall) => {
    return await client.toolHandler.executeToolCall(toolCall)
  }
})

for await (const { messages, iteration, done } of agenticChat) {
  const lastMessage = messages[messages.length - 1]
  console.log(`Turn ${iteration}:`, lastMessage.content)
  
  if (done) break
}
```

## 🚨 Error Handling

### Comprehensive Error Types

```typescript
import { OpenRouterError, ErrorHandler, OpenRouterErrorCode } from '@/lib/openrouter'

try {
  await client.createChatCompletion({...})
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.log('Error code:', error.code)
    console.log('Retryable:', error.retryable)
    console.log('User message:', ErrorHandler.formatErrorForUser(error))
    
    if (error.code === OpenRouterErrorCode.RATE_LIMITED) {
      // Handle rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}
```

### Retry Strategies

```typescript
// Automatic retry with exponential backoff
const result = await ErrorHandler.withRetry(async () => {
  return await client.createChatCompletion({...})
}, 3) // max 3 retries
```

### Streaming Error Recovery

```typescript
await client.streamChat(messages, {
  onError: (error) => {
    console.log('Stream error:', error.message)
    // Implement recovery logic
  },
  signal: abortController.signal // For cancellation
})
```

## 📊 Analytics and Monitoring

### Tool Execution Stats

```typescript
const stats = client.toolHandler.getExecutionStats()
console.log({
  totalExecutions: stats.totalExecutions,
  successRate: stats.successRate,
  averageTime: stats.averageExecutionTime,
  toolUsage: stats.toolUsage
})
```

### Conversation Export/Import

```typescript
// Export conversation
const exported = client.contextManager.exportConversation(conversationId)

// Import to another client or session
client.contextManager.importConversation(exported)
```

## 🎛️ Advanced Configuration

### Client Configuration

```typescript
const client = new OpenRouterClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://openrouter.ai/api/v1', // Custom endpoint
  defaultModel: 'anthropic/claude-3.5-sonnet',
  timeout: 30000,
  maxRetries: 3,
  httpReferer: 'https://yourapp.com',
  appName: 'Your App Name'
})
```

### Event Handling

```typescript
// Listen to client events
client.on('completion', (response) => {
  console.log('Completion received:', response.usage)
})

client.on('toolCall', (toolCall) => {
  console.log('Tool called:', toolCall.function.name)
})

client.on('error', (error) => {
  console.log('Client error:', error.message)
})
```

## 📚 Examples

Check out the `examples/` directory for complete working examples:

- **[Basic Chat](./examples/basic-chat.ts)**: Simple and streaming chat examples
- **[Tool Calling](./examples/tool-calling.ts)**: Custom tools and agentic loops
- **[Context Management](./examples/context-management.ts)**: Multi-turn conversations
- **[Error Handling](./examples/error-handling.ts)**: Robust error handling patterns

## 🛠️ Integration with Existing Code

### Updating the Current Streaming Hook

The integration includes an updated version of your existing `useStreamingChat` hook that leverages the new OpenRouter client:

```typescript
// The hook now uses the OpenRouter client internally
const { messages, isStreaming, sendMessage } = useOpenRouterChat({
  apiKey: 'your-api-key',
  agentId: 'sage',
  tools: customTools
})
```

## 🔧 Development

### Running Examples

```bash
# Set your API key
export OPENROUTER_API_KEY=your_api_key_here

# Run examples (if set up as modules)
npm run example:basic-chat
npm run example:tool-calling
npm run example:context-management
npm run example:error-handling
```

## 📝 API Reference

### OpenRouterClient

The main client class with methods for chat completions, streaming, and tool management.

### ContextManager

Manages conversation history with intelligent truncation and persistence.

### ToolCallHandler

Handles tool registration, validation, and execution with comprehensive error handling.

### Error Types

- `OpenRouterError`: Base error class with specific error codes
- `OpenRouterStreamError`: Streaming-specific errors
- `OpenRouterToolError`: Tool execution errors
- `OpenRouterConfigError`: Configuration validation errors

## 🤝 Contributing

This integration is designed to be extensible. You can:

1. Add new built-in tools in `tool-handler.ts`
2. Extend error handling in `errors.ts`
3. Improve context management strategies in `context-manager.ts`
4. Add new streaming features in `client.ts`

## 📄 License

This integration is part of your project and follows your project's licensing terms.