import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PanelState {
  // Split pane layout
  editorWidth: number
  agentPanelWidth: number
  isAgentPanelCollapsed: boolean
  
  // Responsive behavior
  isMobile: boolean
  isTablet: boolean
  activeTab: 'editor' | 'agents' // For mobile/tablet tab switcher
  
  // Feature panels
  isCitationManagerOpen: boolean
  isStudyPackOpen: boolean
  isVersionHistoryOpen: boolean
  isSettingsOpen: boolean
  
  // Panel positioning
  citationManagerPosition: 'left' | 'right' | 'bottom'
  studyPackPosition: 'left' | 'right' | 'bottom'
}

export interface FocusMode {
  isActive: boolean
  type: 'paragraph' | 'sentence' | 'typewriter'
  
  // Pomodoro timer
  pomodoroEnabled: boolean
  workDuration: number // minutes
  breakDuration: number // minutes
  currentSession: 'work' | 'break' | 'inactive'
  sessionStartTime: number
  totalSessions: number
  
  // Ambient sound
  ambientSound: 'none' | 'lofi' | 'rain' | 'whitenoise' | 'nature'
  soundVolume: number
  
  // UI adjustments in focus mode
  hideStatusBar: boolean
  hideToolbar: boolean
  dimOpacity: number
}

export interface ThemeState {
  mode: 'light' | 'dark' | 'system'
  
  // Custom theme properties
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  fontFamily: 'geist' | 'dmsans' | 'inter' | 'system'
  
  // Visual effects
  enableAnimations: boolean
  enableGrainTexture: boolean
  enableGlassEffects: boolean
  
  // Accessibility
  highContrast: boolean
  reducedMotion: boolean
}

export interface EditorSettings {
  // Writing preferences
  spellCheck: boolean
  grammarCheck: boolean
  autoSave: boolean
  autoSaveInterval: number // seconds
  
  // AI features
  ghostTextEnabled: boolean
  ghostTextDelay: number // milliseconds
  aiContributionTracking: boolean
  
  // Reading level display
  showReadingLevel: boolean
  readingLevelTarget: string
  
  // Export preferences
  defaultExportFormat: 'markdown' | 'docx' | 'pdf' | 'html'
  includeCitations: boolean
  includeAiReport: boolean
}

export interface UiState {
  panels: PanelState
  focusMode: FocusMode
  theme: ThemeState
  editorSettings: EditorSettings
  
  // Global UI state
  isLoading: boolean
  lastError: string | null
  
  // Onboarding
  hasCompletedOnboarding: boolean
  showWelcomeModal: boolean
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: number
    dismissible: boolean
  }>
}

export interface UiActions {
  // Panel management
  setPanelWidth: (panel: 'editor' | 'agents', width: number) => void
  toggleAgentPanel: () => void
  collapseAgentPanel: (collapsed: boolean) => void
  setActiveTab: (tab: 'editor' | 'agents') => void
  setResponsiveMode: (mobile: boolean, tablet: boolean) => void
  
  // Feature panels
  toggleCitationManager: () => void
  toggleStudyPack: () => void
  toggleVersionHistory: () => void
  toggleSettings: () => void
  setCitationManagerPosition: (position: PanelState['citationManagerPosition']) => void
  setStudyPackPosition: (position: PanelState['studyPackPosition']) => void
  
  // Focus mode
  toggleFocusMode: () => void
  setFocusType: (type: FocusMode['type']) => void
  startPomodoroSession: () => void
  pausePomodoroSession: () => void
  resetPomodoroSession: () => void
  setPomodoroSettings: (work: number, breakTime: number) => void
  setAmbientSound: (sound: FocusMode['ambientSound']) => void
  setSoundVolume: (volume: number) => void
  setFocusUiSettings: (settings: Partial<Pick<FocusMode, 'hideStatusBar' | 'hideToolbar' | 'dimOpacity'>>) => void
  
  // Theme management
  setTheme: (mode: ThemeState['mode']) => void
  setAccentColor: (color: string) => void
  setFontSize: (size: ThemeState['fontSize']) => void
  setFontFamily: (family: ThemeState['fontFamily']) => void
  toggleAnimations: () => void
  toggleGrainTexture: () => void
  toggleGlassEffects: () => void
  setAccessibility: (settings: Partial<Pick<ThemeState, 'highContrast' | 'reducedMotion'>>) => void
  
  // Editor settings
  setSpellCheck: (enabled: boolean) => void
  setGrammarCheck: (enabled: boolean) => void
  setAutoSave: (enabled: boolean, interval?: number) => void
  setGhostText: (enabled: boolean, delay?: number) => void
  setAiContributionTracking: (enabled: boolean) => void
  setReadingLevelSettings: (show: boolean, target?: string) => void
  setExportSettings: (settings: Partial<Pick<EditorSettings, 'defaultExportFormat' | 'includeCitations' | 'includeAiReport'>>) => void
  
  // Global UI state
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Onboarding
  completeOnboarding: () => void
  showWelcome: () => void
  hideWelcome: () => void
  
  // Notifications
  addNotification: (notification: Omit<UiState['notifications'][0], 'id' | 'timestamp'>) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
  
  // Utilities
  resetUi: () => void
  exportSettings: () => string
  importSettings: (settings: string) => boolean
}

const initialState: UiState = {
  panels: {
    editorWidth: 60,
    agentPanelWidth: 40,
    isAgentPanelCollapsed: false,
    isMobile: false,
    isTablet: false,
    activeTab: 'editor',
    isCitationManagerOpen: false,
    isStudyPackOpen: false,
    isVersionHistoryOpen: false,
    isSettingsOpen: false,
    citationManagerPosition: 'right',
    studyPackPosition: 'right'
  },
  focusMode: {
    isActive: false,
    type: 'paragraph',
    pomodoroEnabled: false,
    workDuration: 25,
    breakDuration: 5,
    currentSession: 'inactive',
    sessionStartTime: 0,
    totalSessions: 0,
    ambientSound: 'none',
    soundVolume: 50,
    hideStatusBar: false,
    hideToolbar: false,
    dimOpacity: 0.3
  },
  theme: {
    mode: 'system',
    accentColor: '#3b82f6',
    fontSize: 'medium',
    fontFamily: 'geist',
    enableAnimations: true,
    enableGrainTexture: true,
    enableGlassEffects: true,
    highContrast: false,
    reducedMotion: false
  },
  editorSettings: {
    spellCheck: true,
    grammarCheck: true,
    autoSave: true,
    autoSaveInterval: 30,
    ghostTextEnabled: true,
    ghostTextDelay: 2000,
    aiContributionTracking: true,
    showReadingLevel: true,
    readingLevelTarget: 'Grade 12',
    defaultExportFormat: 'markdown',
    includeCitations: true,
    includeAiReport: false
  },
  isLoading: false,
  lastError: null,
  hasCompletedOnboarding: false,
  showWelcomeModal: true,
  notifications: []
}

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Panel management
      setPanelWidth: (panel, width) => {
        const otherWidth = 100 - width
        set(state => ({
          panels: {
            ...state.panels,
            [panel === 'editor' ? 'editorWidth' : 'agentPanelWidth']: width,
            [panel === 'editor' ? 'agentPanelWidth' : 'editorWidth']: otherWidth
          }
        }))
      },
      
      toggleAgentPanel: () => {
        set(state => ({
          panels: {
            ...state.panels,
            isAgentPanelCollapsed: !state.panels.isAgentPanelCollapsed
          }
        }))
      },
      
      collapseAgentPanel: (collapsed) => {
        set(state => ({
          panels: {
            ...state.panels,
            isAgentPanelCollapsed: collapsed
          }
        }))
      },
      
      setActiveTab: (activeTab) => {
        set(state => ({
          panels: {
            ...state.panels,
            activeTab
          }
        }))
      },
      
      setResponsiveMode: (isMobile, isTablet) => {
        set(state => ({
          panels: {
            ...state.panels,
            isMobile,
            isTablet,
            // Auto-collapse agent panel on mobile
            isAgentPanelCollapsed: isMobile ? true : state.panels.isAgentPanelCollapsed
          }
        }))
      },
      
      // Feature panels
      toggleCitationManager: () => {
        set(state => ({
          panels: {
            ...state.panels,
            isCitationManagerOpen: !state.panels.isCitationManagerOpen
          }
        }))
      },
      
      toggleStudyPack: () => {
        set(state => ({
          panels: {
            ...state.panels,
            isStudyPackOpen: !state.panels.isStudyPackOpen
          }
        }))
      },
      
      toggleVersionHistory: () => {
        set(state => ({
          panels: {
            ...state.panels,
            isVersionHistoryOpen: !state.panels.isVersionHistoryOpen
          }
        }))
      },
      
      toggleSettings: () => {
        set(state => ({
          panels: {
            ...state.panels,
            isSettingsOpen: !state.panels.isSettingsOpen
          }
        }))
      },
      
      setCitationManagerPosition: (position) => {
        set(state => ({
          panels: {
            ...state.panels,
            citationManagerPosition: position
          }
        }))
      },
      
      setStudyPackPosition: (position) => {
        set(state => ({
          panels: {
            ...state.panels,
            studyPackPosition: position
          }
        }))
      },
      
      // Focus mode
      toggleFocusMode: () => {
        const state = get()
        const wasActive = state.focusMode.isActive
        
        set(currentState => ({
          focusMode: {
            ...currentState.focusMode,
            isActive: !wasActive,
            // Reset pomodoro session when exiting focus mode
            currentSession: !wasActive ? currentState.focusMode.currentSession : 'inactive',
            sessionStartTime: !wasActive ? currentState.focusMode.sessionStartTime : 0
          }
        }))
      },
      
      setFocusType: (type) => {
        set(state => ({
          focusMode: {
            ...state.focusMode,
            type
          }
        }))
      },
      
      startPomodoroSession: () => {
        const state = get()
        const sessionType = state.focusMode.currentSession === 'work' ? 'break' : 'work'
        
        set(currentState => ({
          focusMode: {
            ...currentState.focusMode,
            pomodoroEnabled: true,
            currentSession: sessionType,
            sessionStartTime: Date.now(),
            totalSessions: sessionType === 'work' ? currentState.focusMode.totalSessions + 1 : currentState.focusMode.totalSessions
          }
        }))
      },
      
      pausePomodoroSession: () => {
        set(state => ({
          focusMode: {
            ...state.focusMode,
            currentSession: 'inactive',
            sessionStartTime: 0
          }
        }))
      },
      
      resetPomodoroSession: () => {
        set(state => ({
          focusMode: {
            ...state.focusMode,
            currentSession: 'inactive',
            sessionStartTime: 0,
            totalSessions: 0
          }
        }))
      },
      
      setPomodoroSettings: (workDuration, breakDuration) => {
        set(state => ({
          focusMode: {
            ...state.focusMode,
            workDuration,
            breakDuration
          }
        }))
      },
      
      setAmbientSound: (ambientSound) => {
        set(state => ({
          focusMode: {
            ...state.focusMode,
            ambientSound
          }
        }))
      },
      
      setSoundVolume: (soundVolume) => {
        set(state => ({
          focusMode: {
            ...state.focusMode,
            soundVolume
          }
        }))
      },
      
      setFocusUiSettings: (settings) => {
        set(state => ({
          focusMode: {
            ...state.focusMode,
            ...settings
          }
        }))
      },
      
      // Theme management
      setTheme: (mode) => {
        set(state => ({
          theme: {
            ...state.theme,
            mode
          }
        }))
      },
      
      setAccentColor: (accentColor) => {
        set(state => ({
          theme: {
            ...state.theme,
            accentColor
          }
        }))
      },
      
      setFontSize: (fontSize) => {
        set(state => ({
          theme: {
            ...state.theme,
            fontSize
          }
        }))
      },
      
      setFontFamily: (fontFamily) => {
        set(state => ({
          theme: {
            ...state.theme,
            fontFamily
          }
        }))
      },
      
      toggleAnimations: () => {
        set(state => ({
          theme: {
            ...state.theme,
            enableAnimations: !state.theme.enableAnimations
          }
        }))
      },
      
      toggleGrainTexture: () => {
        set(state => ({
          theme: {
            ...state.theme,
            enableGrainTexture: !state.theme.enableGrainTexture
          }
        }))
      },
      
      toggleGlassEffects: () => {
        set(state => ({
          theme: {
            ...state.theme,
            enableGlassEffects: !state.theme.enableGlassEffects
          }
        }))
      },
      
      setAccessibility: (settings) => {
        set(state => ({
          theme: {
            ...state.theme,
            ...settings
          }
        }))
      },
      
      // Editor settings
      setSpellCheck: (spellCheck) => {
        set(state => ({
          editorSettings: {
            ...state.editorSettings,
            spellCheck
          }
        }))
      },
      
      setGrammarCheck: (grammarCheck) => {
        set(state => ({
          editorSettings: {
            ...state.editorSettings,
            grammarCheck
          }
        }))
      },
      
      setAutoSave: (autoSave, autoSaveInterval) => {
        set(state => ({
          editorSettings: {
            ...state.editorSettings,
            autoSave,
            ...(autoSaveInterval && { autoSaveInterval })
          }
        }))
      },
      
      setGhostText: (ghostTextEnabled, ghostTextDelay) => {
        set(state => ({
          editorSettings: {
            ...state.editorSettings,
            ghostTextEnabled,
            ...(ghostTextDelay && { ghostTextDelay })
          }
        }))
      },
      
      setAiContributionTracking: (aiContributionTracking) => {
        set(state => ({
          editorSettings: {
            ...state.editorSettings,
            aiContributionTracking
          }
        }))
      },
      
      setReadingLevelSettings: (showReadingLevel, readingLevelTarget) => {
        set(state => ({
          editorSettings: {
            ...state.editorSettings,
            showReadingLevel,
            ...(readingLevelTarget && { readingLevelTarget })
          }
        }))
      },
      
      setExportSettings: (settings) => {
        set(state => ({
          editorSettings: {
            ...state.editorSettings,
            ...settings
          }
        }))
      },
      
      // Global UI state
      setLoading: (isLoading) => set({ isLoading }),
      setError: (lastError) => set({ lastError }),
      
      // Onboarding
      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true, showWelcomeModal: false })
      },
      
      showWelcome: () => set({ showWelcomeModal: true }),
      hideWelcome: () => set({ showWelcomeModal: false }),
      
      // Notifications
      addNotification: (notification) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now()
        }
        
        set(state => ({
          notifications: [...state.notifications, newNotification]
        }))
        
        // Auto-dismiss after 5 seconds if dismissible
        if (notification.dismissible) {
          setTimeout(() => {
            get().dismissNotification(id)
          }, 5000)
        }
      },
      
      dismissNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Utilities
      resetUi: () => {
        set({
          ...initialState,
          hasCompletedOnboarding: get().hasCompletedOnboarding // Preserve onboarding state
        })
      },
      
      exportSettings: () => {
        const state = get()
        const settings = {
          theme: state.theme,
          editorSettings: state.editorSettings,
          focusMode: {
            type: state.focusMode.type,
            workDuration: state.focusMode.workDuration,
            breakDuration: state.focusMode.breakDuration,
            ambientSound: state.focusMode.ambientSound,
            soundVolume: state.focusMode.soundVolume,
            hideStatusBar: state.focusMode.hideStatusBar,
            hideToolbar: state.focusMode.hideToolbar,
            dimOpacity: state.focusMode.dimOpacity
          },
          panels: {
            citationManagerPosition: state.panels.citationManagerPosition,
            studyPackPosition: state.panels.studyPackPosition
          }
        }
        return JSON.stringify(settings, null, 2)
      },
      
      importSettings: (settingsJson) => {
        try {
          const settings = JSON.parse(settingsJson)
          
          set(state => ({
            theme: { ...state.theme, ...settings.theme },
            editorSettings: { ...state.editorSettings, ...settings.editorSettings },
            focusMode: { ...state.focusMode, ...settings.focusMode },
            panels: { ...state.panels, ...settings.panels }
          }))
          
          return true
        } catch (error) {
          console.error('Failed to import settings:', error)
          return false
        }
      }
    }),
    {
      name: 'scholar-ui-storage',
      partialize: (state) => ({
        panels: {
          editorWidth: state.panels.editorWidth,
          agentPanelWidth: state.panels.agentPanelWidth,
          citationManagerPosition: state.panels.citationManagerPosition,
          studyPackPosition: state.panels.studyPackPosition
        },
        theme: state.theme,
        editorSettings: state.editorSettings,
        focusMode: {
          type: state.focusMode.type,
          workDuration: state.focusMode.workDuration,
          breakDuration: state.focusMode.breakDuration,
          ambientSound: state.focusMode.ambientSound,
          soundVolume: state.focusMode.soundVolume,
          hideStatusBar: state.focusMode.hideStatusBar,
          hideToolbar: state.focusMode.hideToolbar,
          dimOpacity: state.focusMode.dimOpacity
        },
        hasCompletedOnboarding: state.hasCompletedOnboarding
      })
    }
  )
)