import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DocumentVersion {
  id: string
  content: string
  timestamp: number
  wordCount: number
  summary?: string
  aiContributions?: Array<{
    startPos: number
    endPos: number
    type: 'suggestion' | 'insertion' | 'replacement'
    content: string
    timestamp: number
  }>
}

export interface DocumentState {
  // Current document
  content: string
  title: string
  documentType: 'essay' | 'research' | 'creative' | 'technical' | 'other'
  academicLevel: 'high-school' | 'undergraduate' | 'graduate' | 'phd' | 'professional'
  
  // Metadata
  wordCount: number
  characterCount: number
  readingLevel: string
  aiContribution: number
  
  // Version history
  versions: DocumentVersion[]
  currentVersionId: string
  
  // AI contributions tracking
  aiContributions: Array<{
    id: string
    startPos: number
    endPos: number
    type: 'suggestion' | 'insertion' | 'replacement'
    content: string
    timestamp: number
    accepted: boolean
  }>
  
  // Settings
  autoSave: boolean
  lastSaved: number
}

export interface DocumentActions {
  // Content management
  setContent: (content: string) => void
  setTitle: (title: string) => void
  setDocumentType: (type: DocumentState['documentType']) => void
  setAcademicLevel: (level: DocumentState['academicLevel']) => void
  
  // Metadata
  updateWordCount: (count: number) => void
  updateCharacterCount: (count: number) => void
  updateReadingLevel: (level: string) => void
  updateAiContribution: (percentage: number) => void
  
  // Version management
  createVersion: (summary?: string) => void
  restoreVersion: (versionId: string) => void
  deleteVersion: (versionId: string) => void
  
  // AI contributions
  addAiContribution: (contribution: Omit<DocumentState['aiContributions'][0], 'id' | 'timestamp'>) => void
  acceptAiContribution: (id: string) => void
  rejectAiContribution: (id: string) => void
  clearAiContributions: () => void
  
  // Autosave
  triggerAutoSave: () => void
  setAutoSave: (enabled: boolean) => void
  
  // Reset
  resetDocument: () => void
}

const initialState: DocumentState = {
  content: '',
  title: 'Untitled Document',
  documentType: 'essay',
  academicLevel: 'undergraduate',
  wordCount: 0,
  characterCount: 0,
  readingLevel: 'Grade 12',
  aiContribution: 0,
  versions: [],
  currentVersionId: '',
  aiContributions: [],
  autoSave: true,
  lastSaved: Date.now(),
}

export const useDocumentStore = create<DocumentState & DocumentActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setContent: (content: string) => {
        set({ content, lastSaved: Date.now() })
        // Auto-create version if significant change
        const currentState = get()
        if (currentState.content.length > 0 && 
            Math.abs(content.length - currentState.content.length) > 100) {
          get().createVersion('Auto-save checkpoint')
        }
      },
      
      setTitle: (title: string) => set({ title }),
      setDocumentType: (documentType) => set({ documentType }),
      setAcademicLevel: (academicLevel) => set({ academicLevel }),
      
      updateWordCount: (wordCount: number) => set({ wordCount }),
      updateCharacterCount: (characterCount: number) => set({ characterCount }),
      updateReadingLevel: (readingLevel: string) => set({ readingLevel }),
      updateAiContribution: (aiContribution: number) => set({ aiContribution }),
      
      createVersion: (summary?: string) => {
        const state = get()
        const newVersion: DocumentVersion = {
          id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: state.content,
          timestamp: Date.now(),
          wordCount: state.wordCount,
          summary: summary || `Version from ${new Date().toLocaleString()}`,
          aiContributions: state.aiContributions.map(contrib => ({
            startPos: contrib.startPos,
            endPos: contrib.endPos,
            type: contrib.type,
            content: contrib.content,
            timestamp: contrib.timestamp
          }))
        }
        
        set({
          versions: [...state.versions, newVersion],
          currentVersionId: newVersion.id
        })
      },
      
      restoreVersion: (versionId: string) => {
        const state = get()
        const version = state.versions.find(v => v.id === versionId)
        if (version) {
          set({
            content: version.content,
            wordCount: version.wordCount,
            currentVersionId: versionId,
            aiContributions: version.aiContributions?.map(contrib => ({
              id: `restored_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...contrib,
              accepted: true
            })) || []
          })
        }
      },
      
      deleteVersion: (versionId: string) => {
        const state = get()
        set({
          versions: state.versions.filter(v => v.id !== versionId),
          currentVersionId: state.currentVersionId === versionId ? '' : state.currentVersionId
        })
      },
      
      addAiContribution: (contribution) => {
        const state = get()
        const newContribution = {
          ...contribution,
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }
        
        set({
          aiContributions: [...state.aiContributions, newContribution]
        })
        
        // Update AI contribution percentage
        const totalChars = state.content.length
        const aiChars = state.aiContributions.reduce((acc, contrib) => 
          acc + (contrib.endPos - contrib.startPos), 0
        )
        get().updateAiContribution(totalChars > 0 ? Math.round((aiChars / totalChars) * 100) : 0)
      },
      
      acceptAiContribution: (id: string) => {
        const state = get()
        set({
          aiContributions: state.aiContributions.map(contrib =>
            contrib.id === id ? { ...contrib, accepted: true } : contrib
          )
        })
      },
      
      rejectAiContribution: (id: string) => {
        const state = get()
        set({
          aiContributions: state.aiContributions.filter(contrib => contrib.id !== id)
        })
        
        // Recalculate AI contribution percentage
        const totalChars = state.content.length
        const aiChars = state.aiContributions
          .filter(contrib => contrib.id !== id)
          .reduce((acc, contrib) => acc + (contrib.endPos - contrib.startPos), 0)
        get().updateAiContribution(totalChars > 0 ? Math.round((aiChars / totalChars) * 100) : 0)
      },
      
      clearAiContributions: () => {
        set({ aiContributions: [] })
        get().updateAiContribution(0)
      },
      
      triggerAutoSave: () => {
        set({ lastSaved: Date.now() })
      },
      
      setAutoSave: (autoSave: boolean) => set({ autoSave }),
      
      resetDocument: () => set({
        ...initialState,
        versions: [],
        aiContributions: [],
        lastSaved: Date.now()
      })
    }),
    {
      name: 'scholar-document-storage',
      partialize: (state) => ({
        content: state.content,
        title: state.title,
        documentType: state.documentType,
        academicLevel: state.academicLevel,
        versions: state.versions.slice(-10), // Keep only last 10 versions
        autoSave: state.autoSave,
      })
    }
  )
)