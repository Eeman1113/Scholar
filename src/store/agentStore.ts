import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StreamingMessage } from '@/hooks/useStreamingChat'
import { AGENT_CONFIGS } from '@/agents/config'

export interface AgentState {
  id: string
  isActive: boolean
  conversations: StreamingMessage[]
  lastActivity: number
  isThinking: boolean
  customPrompt?: string
}

export interface CustomAgent {
  id: string
  name: string
  description: string
  systemPrompt: string
  color: string
  createdAt: number
}

export interface AgentStoreState {
  // Active agents and their state
  agents: Record<string, AgentState>
  activeAgentId: string
  
  // Custom agents created by users
  customAgents: Record<string, CustomAgent>
  
  // Global agent settings
  multiAgentMode: boolean
  autoSwitchAgents: boolean
  agentOrchestration: boolean
  
  // API settings
  hasValidApiKey: boolean
}

export interface AgentStoreActions {
  // Agent management
  setActiveAgent: (agentId: string) => void
  activateAgent: (agentId: string) => void
  deactivateAgent: (agentId: string) => void
  setAgentThinking: (agentId: string, isThinking: boolean) => void
  
  // Conversations
  addMessage: (agentId: string, message: StreamingMessage) => void
  clearConversation: (agentId: string) => void
  clearAllConversations: () => void
  
  // Custom agents
  createCustomAgent: (agent: Omit<CustomAgent, 'id' | 'createdAt'>) => string
  updateCustomAgent: (id: string, updates: Partial<CustomAgent>) => void
  deleteCustomAgent: (id: string) => void
  
  // Settings
  setMultiAgentMode: (enabled: boolean) => void
  setAutoSwitchAgents: (enabled: boolean) => void
  setAgentOrchestration: (enabled: boolean) => void
  setHasValidApiKey: (hasKey: boolean) => void
  
  // Utilities
  getActiveAgents: () => string[]
  getAgentConversation: (agentId: string) => StreamingMessage[]
  getLastAgentActivity: (agentId: string) => number
}

// Initialize default agent states
const initializeAgentStates = (): Record<string, AgentState> => {
  const states: Record<string, AgentState> = {}
  
  Object.keys(AGENT_CONFIGS).forEach(agentId => {
    states[agentId] = {
      id: agentId,
      isActive: agentId === 'sage', // Only Sage is active by default
      conversations: [],
      lastActivity: Date.now(),
      isThinking: false
    }
  })
  
  return states
}

export const useAgentStore = create<AgentStoreState & AgentStoreActions>()(
  persist(
    (set, get) => ({
      // Initial state
      agents: initializeAgentStates(),
      activeAgentId: 'sage',
      customAgents: {},
      multiAgentMode: false,
      autoSwitchAgents: true,
      agentOrchestration: true,
      hasValidApiKey: false,
      
      // Agent management
      setActiveAgent: (agentId: string) => {
        const state = get()
        if (AGENT_CONFIGS[agentId] || state.customAgents[agentId]) {
          set({ activeAgentId: agentId })
          
          // Activate the agent if not already active
          if (!state.agents[agentId]?.isActive) {
            get().activateAgent(agentId)
          }
        }
      },
      
      activateAgent: (agentId: string) => {
        set(state => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...state.agents[agentId],
              isActive: true,
              lastActivity: Date.now()
            }
          }
        }))
      },
      
      deactivateAgent: (agentId: string) => {
        set(state => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...state.agents[agentId],
              isActive: false
            }
          }
        }))
      },
      
      setAgentThinking: (agentId: string, isThinking: boolean) => {
        set(state => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...state.agents[agentId],
              isThinking,
              lastActivity: Date.now()
            }
          }
        }))
      },
      
      // Conversations
      addMessage: (agentId: string, message: StreamingMessage) => {
        set(state => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...state.agents[agentId],
              conversations: [...(state.agents[agentId]?.conversations || []), message],
              lastActivity: Date.now()
            }
          }
        }))
      },
      
      clearConversation: (agentId: string) => {
        set(state => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...state.agents[agentId],
              conversations: []
            }
          }
        }))
      },
      
      clearAllConversations: () => {
        set(state => {
          const newAgents = { ...state.agents }
          Object.keys(newAgents).forEach(agentId => {
            newAgents[agentId] = {
              ...newAgents[agentId],
              conversations: []
            }
          })
          return { agents: newAgents }
        })
      },
      
      // Custom agents
      createCustomAgent: (agent) => {
        const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newAgent: CustomAgent = {
          ...agent,
          id,
          createdAt: Date.now()
        }
        
        set(state => ({
          customAgents: {
            ...state.customAgents,
            [id]: newAgent
          },
          agents: {
            ...state.agents,
            [id]: {
              id,
              isActive: false,
              conversations: [],
              lastActivity: Date.now(),
              isThinking: false
            }
          }
        }))
        
        return id
      },
      
      updateCustomAgent: (id: string, updates) => {
        set(state => ({
          customAgents: {
            ...state.customAgents,
            [id]: {
              ...state.customAgents[id],
              ...updates
            }
          }
        }))
      },
      
      deleteCustomAgent: (id: string) => {
        set(state => {
          const { [id]: deletedAgent, ...remainingCustomAgents } = state.customAgents
          const { [id]: deletedAgentState, ...remainingAgents } = state.agents
          
          return {
            customAgents: remainingCustomAgents,
            agents: remainingAgents,
            activeAgentId: state.activeAgentId === id ? 'sage' : state.activeAgentId
          }
        })
      },
      
      // Settings
      setMultiAgentMode: (enabled: boolean) => set({ multiAgentMode: enabled }),
      setAutoSwitchAgents: (enabled: boolean) => set({ autoSwitchAgents: enabled }),
      setAgentOrchestration: (enabled: boolean) => set({ agentOrchestration: enabled }),
      setHasValidApiKey: (hasKey: boolean) => set({ hasValidApiKey: hasKey }),
      
      // Utilities
      getActiveAgents: () => {
        const state = get()
        return Object.values(state.agents)
          .filter(agent => agent.isActive)
          .map(agent => agent.id)
      },
      
      getAgentConversation: (agentId: string) => {
        const state = get()
        return state.agents[agentId]?.conversations || []
      },
      
      getLastAgentActivity: (agentId: string) => {
        const state = get()
        return state.agents[agentId]?.lastActivity || 0
      }
    }),
    {
      name: 'scholar-agent-storage',
      partialize: (state) => ({
        agents: Object.fromEntries(
          Object.entries(state.agents).map(([id, agent]) => [
            id,
            {
              ...agent,
              conversations: agent.conversations.slice(-50) // Keep only last 50 messages per agent
            }
          ])
        ),
        activeAgentId: state.activeAgentId,
        customAgents: state.customAgents,
        multiAgentMode: state.multiAgentMode,
        autoSwitchAgents: state.autoSwitchAgents,
        agentOrchestration: state.agentOrchestration
      })
    }
  )
)