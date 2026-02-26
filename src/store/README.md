# Scholar AI - State Management Architecture

This directory contains all Zustand stores for the Scholar AI application, implementing a robust, persistent state management system.

## Store Overview

### 📄 DocumentStore (`documentStore.ts`)
Manages document content, version history, and AI contributions.

**Key Features:**
- Document content and metadata (title, type, academic level)
- Version control with auto-checkpoints
- AI contribution tracking with visual indicators
- Auto-save functionality
- Reading level and word count tracking

**Usage:**
```typescript
import { useDocumentStore } from '@/store'

const { content, setContent, createVersion, aiContributions } = useDocumentStore()
```

### 🤖 AgentStore (`agentStore.ts`)
Handles multi-agent system state and conversations.

**Key Features:**
- 7 specialized AI agents with individual states
- Custom agent creation and management
- Conversation history per agent
- Agent orchestration settings
- API key validation

**Usage:**
```typescript
import { useAgentStore } from '@/store'

const { agents, activeAgentId, setActiveAgent, addMessage } = useAgentStore()
```

### 🎨 UiStore (`uiStore.ts`)
Controls all UI state, theming, and user preferences.

**Key Features:**
- **Panel Management**: Split-pane layout, responsive behavior
- **Focus Mode**: Distraction-free writing with Pomodoro timer
- **Theme System**: Light/dark mode, custom colors, typography
- **Editor Settings**: Auto-save, spell check, AI features
- **Notifications**: Toast system for user feedback

**Usage:**
```typescript
import { useUiStore } from '@/store'

const { theme, toggleFocusMode, setTheme, notifications } = useUiStore()
```

## Persistence Strategy

All stores use Zustand's `persist` middleware for localStorage persistence:

- **Document Store**: Saves content, versions (last 10), and settings
- **Agent Store**: Saves conversations (last 50 messages per agent), custom agents
- **UI Store**: Saves theme, editor settings, panel preferences

## Store Integration Patterns

### 1. Cross-Store Communication
```typescript
// Example: Update document metadata when agent adds content
const { addAiContribution } = useDocumentStore()
const { addMessage } = useAgentStore()

// In agent message handler
const handleAgentMessage = (message, insertPosition) => {
  addMessage(agentId, message)
  if (message.toolCalls?.includes('insert_text')) {
    addAiContribution({
      startPos: insertPosition,
      endPos: insertPosition + message.content.length,
      type: 'insertion',
      content: message.content,
      accepted: false
    })
  }
}
```

### 2. Responsive State Management
```typescript
// Example: Auto-collapse panels on mobile
const { setResponsiveMode, collapseAgentPanel } = useUiStore()

useEffect(() => {
  const handleResize = () => {
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200
    
    setResponsiveMode(isMobile, isTablet)
  }
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

### 3. Settings Export/Import
```typescript
// Export all user settings
const { exportSettings } = useUiStore()
const settings = exportSettings()
localStorage.setItem('scholar-backup', settings)

// Import settings
const { importSettings } = useUiStore()
const success = importSettings(backupSettings)
```

## Best Practices

1. **Immutable Updates**: All state updates use immutable patterns
2. **Type Safety**: Full TypeScript support with exported types
3. **Performance**: Selective subscriptions with Zustand selectors
4. **Persistence**: Only essential data is persisted to avoid localStorage bloat
5. **Error Handling**: Graceful fallbacks for corrupted storage data

## Development Guidelines

- Use selectors to prevent unnecessary re-renders
- Keep store actions pure and predictable
- Add loading states for async operations
- Include proper error boundaries for store failures
- Test store persistence across browser sessions

## File Structure
```
src/store/
├── index.ts          # Main exports and types
├── documentStore.ts  # Document and content management
├── agentStore.ts     # AI agents and conversations  
├── uiStore.ts        # UI state and preferences
└── README.md         # This documentation
```