# OpenRouter Integration Guide

This guide shows how to integrate the new OpenRouter API client with your existing Scholar AI codebase.

## 🔧 Integration Steps

### 1. Update API Key Management

First, ensure your OpenRouter API key is properly configured:

```typescript
// In your settings or configuration
localStorage.setItem('openrouter_api_key', 'sk-or-your-api-key-here')

// Or use environment variables
process.env.OPENROUTER_API_KEY = 'your-api-key'
```

### 2. Replace Existing Streaming Hook

You can now use the enhanced `useOpenRouterChat` hook instead of the basic `useStreamingChat`:

```typescript
// Before
import { useStreamingChat } from '@/hooks/useStreamingChat'

// After
import { useOpenRouterChat } from '@/hooks/useOpenRouterChat'

// Usage
const {
  messages,
  isStreaming,
  error,
  sendMessage,
  sendMessageWithTools,
  clearMessages,
  abortStream,
  client
} = useOpenRouterChat({
  apiKey: 'your-api-key', // or omit to use localStorage
  agentId: 'sage', // Use your existing agent system
  model: 'anthropic/claude-3.5-sonnet'
})
```

### 3. Enhanced Agent Panel Integration

Update your agent panel component to use the new capabilities:

```typescript
// src/components/agents/enhanced-agent-panel.tsx
import { useOpenRouterChat, createTool } from '@/hooks/useOpenRouterChat'
import { AGENT_CONFIGS } from '@/agents/config'

export function EnhancedAgentPanel({ agentId, documentContext }: {
  agentId: string
  documentContext: DocumentContext
}) {
  const agentConfig = AGENT_CONFIGS[agentId]
  
  // Create tools from agent configuration
  const tools = agentConfig?.tools?.map(toolConfig => 
    createTool(
      toolConfig.name,
      toolConfig.description,
      toolConfig.parameters,
      async (params) => {
        // Execute your existing tool logic here
        return `Tool ${toolConfig.name} executed with params: ${JSON.stringify(params)}`
      }
    )
  ) || []

  const {
    messages,
    isStreaming,
    sendMessageWithTools,
    error
  } = useOpenRouterChat({
    agentId,
    tools: tools.map(t => t.tool),
    onToolCall: (toolName, parameters, result) => {
      console.log(`Agent ${agentId} used tool ${toolName}:`, { parameters, result })
    }
  })

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessageWithTools(content, tools.map(t => t.tool), documentContext)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="agent-panel">
      <div className="agent-header">
        <h3>{agentConfig.name}</h3>
        <span className={agentConfig.color}>{agentConfig.role}</span>
      </div>
      
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="content">{message.content}</div>
            {message.toolCalls && (
              <div className="tool-calls">
                {message.toolCalls.map(tc => (
                  <div key={tc.name} className="tool-call">
                    🔧 {tc.name}: {JSON.stringify(tc.parameters)}
                  </div>
                ))}
              </div>
            )}
            {message.error && (
              <div className="error">❌ {message.error}</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          placeholder={`Ask ${agentConfig.name}...`}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage(e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
          disabled={isStreaming}
        />
        {isStreaming && <div className="loading">...</div>}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  )
}
```

### 4. Update Editor Integration

Enhance your editor component to use the new streaming capabilities:

```typescript
// src/components/editor/enhanced-editor.tsx
import { useOpenRouterChat } from '@/hooks/useOpenRouterChat'
import { Editor } from '@tiptap/react'

export function EnhancedEditor({ editor }: { editor: Editor }) {
  const { sendMessage, isStreaming } = useOpenRouterChat({
    agentId: 'prose', // Writing assistant agent
    onStreamComplete: (response) => {
      // Insert AI response at cursor position
      editor.chain().focus().insertContent(response).run()
    }
  })

  const handleAIAssist = async (prompt: string) => {
    const context = {
      fullText: editor.getText(),
      selectedText: editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      ),
      cursorPosition: editor.state.selection.from,
      wordCount: editor.storage.characterCount.words(),
      documentTitle: 'Current Document',
      documentType: 'academic',
      academicLevel: 'undergraduate'
    }

    try {
      await sendMessage(prompt, context)
    } catch (error) {
      console.error('AI assist failed:', error)
    }
  }

  return (
    <div className="enhanced-editor">
      <div className="ai-toolbar">
        <button 
          onClick={() => handleAIAssist("Improve the clarity of this text")}
          disabled={isStreaming}
        >
          ✨ Improve Clarity
        </button>
        <button 
          onClick={() => handleAIAssist("Check grammar and style")}
          disabled={isStreaming}
        >
          📝 Check Grammar
        </button>
        <button 
          onClick={() => handleAIAssist("Expand on this topic")}
          disabled={isStreaming}
        >
          🔍 Expand
        </button>
      </div>
      
      {/* Your existing editor JSX */}
    </div>
  )
}
```

### 5. Add Tool Registration for Existing Agents

Create tool handlers for your existing agent tools:

```typescript
// src/lib/openrouter/agent-tools.ts
import { BuiltInTools } from '@/lib/openrouter'
import { TOOL_REGISTRY } from '@/agents/tools'

export function registerAgentTools(client: OpenRouterClient, agentId: string) {
  const agentConfig = AGENT_CONFIGS[agentId]
  
  if (!agentConfig?.tools) return

  agentConfig.tools.forEach(toolConfig => {
    client.registerTool(
      toolConfig.name,
      async (parameters) => {
        // Execute using existing tool registry
        const toolFunction = TOOL_REGISTRY[toolConfig.name]
        if (!toolFunction) {
          throw new Error(`Tool ${toolConfig.name} not found in registry`)
        }
        
        const result = await toolFunction(parameters)
        return result.success 
          ? result.message || JSON.stringify(result.data)
          : `Error: ${result.error}`
      },
      {
        description: toolConfig.description,
        parameters: toolConfig.parameters
      }
    )
  })

  // Add built-in tools
  const builtInTools = [
    BuiltInTools.createCalculatorTool(),
    BuiltInTools.createTextAnalysisTool(),
    BuiltInTools.createWebSearchTool()
  ]

  builtInTools.forEach(tool => {
    client.registerTool(tool.name, tool.handler, tool.definition)
  })
}
```

### 6. Global OpenRouter Provider

Create a global provider for OpenRouter access across your app:

```typescript
// src/contexts/openrouter-context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { OpenRouterClient, createOpenRouterClient } from '@/lib/openrouter'

interface OpenRouterContextType {
  client: OpenRouterClient | null
  isReady: boolean
  error: string | null
  updateApiKey: (apiKey: string) => void
}

const OpenRouterContext = createContext<OpenRouterContextType>({
  client: null,
  isReady: false,
  error: null,
  updateApiKey: () => {}
})

export function OpenRouterProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<OpenRouterClient | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeClient = (apiKey: string) => {
    try {
      const newClient = createOpenRouterClient({ apiKey })
      setClient(newClient)
      setError(null)
      setIsReady(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize client')
      setIsReady(false)
    }
  }

  useEffect(() => {
    const apiKey = localStorage.getItem('openrouter_api_key')
    if (apiKey) {
      initializeClient(apiKey)
    } else {
      setIsReady(true) // Ready but no client
    }
  }, [])

  const updateApiKey = (apiKey: string) => {
    localStorage.setItem('openrouter_api_key', apiKey)
    initializeClient(apiKey)
  }

  return (
    <OpenRouterContext.Provider value={{ client, isReady, error, updateApiKey }}>
      {children}
    </OpenRouterContext.Provider>
  )
}

export const useOpenRouter = () => useContext(OpenRouterContext)
```

### 7. Settings Integration

Update your settings component to include OpenRouter configuration:

```typescript
// Add to your settings component
export function OpenRouterSettings() {
  const { client, updateApiKey, error } = useOpenRouter()
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('openrouter_api_key') || ''
  )
  const [models, setModels] = useState<any[]>([])

  const handleSaveApiKey = () => {
    updateApiKey(apiKey)
  }

  const loadModels = async () => {
    if (client) {
      try {
        const availableModels = await client.getModels()
        setModels(availableModels)
      } catch (err) {
        console.error('Failed to load models:', err)
      }
    }
  }

  return (
    <div className="openrouter-settings">
      <h3>OpenRouter Configuration</h3>
      
      <div className="api-key-section">
        <label>API Key:</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-..."
        />
        <button onClick={handleSaveApiKey}>Save</button>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="model-selection">
        <label>Available Models:</label>
        <button onClick={loadModels} disabled={!client}>
          Load Models
        </button>
        <select>
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.pricing?.prompt}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

## 🚀 Migration Checklist

- [ ] Install OpenRouter API key in settings/localStorage
- [ ] Replace `useStreamingChat` with `useOpenRouterChat`
- [ ] Update agent panels to use new tool calling
- [ ] Add OpenRouter context provider to your app root
- [ ] Register existing agent tools with new client
- [ ] Update editor integration for enhanced AI assistance
- [ ] Test streaming, tool calling, and context management
- [ ] Verify error handling and retry mechanisms
- [ ] Update documentation for your team

## 🎯 Benefits After Integration

1. **Better Error Handling**: Automatic retries and user-friendly error messages
2. **Tool Integration**: Seamless tool calling with your existing agent system
3. **Context Management**: Intelligent conversation history with automatic truncation
4. **Streaming Improvements**: Proper SSE parsing with mid-stream error recovery
5. **Analytics**: Built-in usage tracking and performance monitoring
6. **Type Safety**: Full TypeScript support with comprehensive types

## 🔍 Testing the Integration

Create a simple test to verify everything works:

```typescript
// test-integration.ts
import { useOpenRouterChat } from '@/hooks/useOpenRouterChat'

export function TestOpenRouterIntegration() {
  const { sendMessage, messages, error } = useOpenRouterChat({
    agentId: 'sage'
  })

  const runTest = async () => {
    try {
      await sendMessage("Hello! Can you help me test the OpenRouter integration?")
      console.log("✅ Integration test successful!")
    } catch (err) {
      console.error("❌ Integration test failed:", err)
    }
  }

  return (
    <div>
      <button onClick={runTest}>Test Integration</button>
      {error && <div>Error: {error}</div>}
      <div>Messages: {messages.length}</div>
    </div>
  )
}
```

The integration is now complete! Your Scholar AI workspace now has full OpenRouter capabilities with streaming, tool calling, and context management.