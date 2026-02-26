// Export all Zustand stores for the Scholar AI application
export { useDocumentStore } from './documentStore'
export { useAgentStore } from './agentStore'
export { useUiStore } from './uiStore'

// Export types for external use
export type {
  DocumentState,
  DocumentActions,
  DocumentVersion
} from './documentStore'

export type {
  AgentStoreState,
  AgentStoreActions,
  AgentState,
  CustomAgent
} from './agentStore'

export type {
  UiState,
  UiActions,
  PanelState,
  FocusMode,
  ThemeState,
  EditorSettings
} from './uiStore'