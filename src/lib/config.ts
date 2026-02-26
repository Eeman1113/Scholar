export const config = {
  app: {
    name: 'Scholar',
    version: '1.0.0',
    description: 'AI-Powered Writing & Research Workspace',
    author: 'Scholar AI Team',
    url: 'https://scholar-ai.app',
  },
  
  api: {
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-3.5-sonnet',
      timeout: 30000, // 30 seconds
    },
    
    // Harper Grammar Service
    harper: {
      enabled: true,
      apiUrl: 'https://api.languagetool.org/v2',
      timeout: 10000, // 10 seconds
    },
  },
  
  editor: {
    // Auto-save settings
    autoSave: {
      enabled: true,
      interval: 30000, // 30 seconds
      debounceDelay: 2000, // 2 seconds
    },
    
    // Ghost text settings
    ghostText: {
      enabled: true,
      delay: 2000, // 2 seconds
      maxLength: 100,
    },
    
    // Reading level calculation
    readingLevel: {
      enabled: true,
      updateDelay: 1000, // 1 second
      minTextLength: 50,
    },
    
    // AI contribution tracking
    aiTracking: {
      enabled: true,
      trackByCharacter: true,
      showIndicators: true,
    },
  },
  
  agents: {
    // Default agent settings
    defaultAgent: 'sage',
    
    // Agent behavior settings
    multiAgent: {
      enabled: false,
      autoSwitch: true,
      orchestration: true,
    },
    
    // Tool execution settings
    tools: {
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
    },
  },
  
  features: {
    // Citation manager
    citations: {
      enabled: true,
      defaultStyle: 'APA' as const,
      supportedStyles: ['APA', 'MLA', 'Chicago', 'Harvard'] as const,
    },
    
    // Study pack generator
    studyPack: {
      enabled: true,
      maxFlashcards: 50,
      maxQuizQuestions: 20,
    },
    
    // Focus mode
    focusMode: {
      enabled: true,
      pomodoro: {
        workDuration: 25, // minutes
        breakDuration: 5, // minutes
      },
      ambientSounds: ['none', 'lofi', 'rain', 'whitenoise', 'nature'] as const,
    },
    
    // Version history
    versionHistory: {
      enabled: true,
      maxVersions: 50,
      autoSaveVersions: true,
      compressionEnabled: true,
    },
    
    // Export functionality
    export: {
      enabled: true,
      supportedFormats: ['markdown', 'html', 'txt', 'docx', 'pdf'] as const,
      defaultFormat: 'markdown' as const,
      includeMetadata: true,
    },
  },
  
  ui: {
    // Theme settings
    theme: {
      default: 'system' as const,
      supportedThemes: ['light', 'dark', 'system'] as const,
    },
    
    // Animation settings
    animations: {
      enabled: true,
      duration: 200, // milliseconds
      easing: 'ease-out',
    },
    
    // Layout settings
    layout: {
      defaultSplit: 60, // percentage for editor pane
      minPaneWidth: 30, // percentage
      mobileBreakpoint: 768, // pixels
      tabletBreakpoint: 1200, // pixels
    },
    
    // Notification settings
    notifications: {
      enabled: true,
      duration: 5000, // 5 seconds
      position: 'top-right' as const,
    },
  },
  
  storage: {
    // LocalStorage keys
    keys: {
      apiKey: 'openrouter_api_key',
      theme: 'scholar-theme',
      document: 'scholar-document-storage',
      ui: 'scholar-ui-storage',
      agents: 'scholar-agent-storage',
    },
    
    // Storage limits
    limits: {
      documentSize: 5 * 1024 * 1024, // 5MB
      versionHistory: 10 * 1024 * 1024, // 10MB
      totalStorage: 50 * 1024 * 1024, // 50MB
    },
  },
  
  accessibility: {
    // Screen reader support
    screenReader: {
      enabled: true,
      announceChanges: true,
    },
    
    // Keyboard navigation
    keyboard: {
      shortcuts: true,
      tabNavigation: true,
    },
    
    // High contrast mode
    highContrast: {
      enabled: false,
      autoDetect: true,
    },
    
    // Reduced motion
    reducedMotion: {
      enabled: false,
      autoDetect: true,
    },
  },
  
  development: {
    // Debug settings (only in development)
    debug: import.meta.env?.DEV || false,
    logging: {
      level: 'info' as const,
      enableApiLogs: false,
      enableStateLogs: false,
    },
    
    // Mock data
    mocks: {
      enabled: false,
      mockApiCalls: false,
      mockDelay: 1000, // milliseconds
    },
  },
  
  // Feature flags for gradual rollout
  featureFlags: {
    // New features that can be toggled
    experimentalFeatures: false,
    betaAgent: false,
    advancedExport: true,
    collaborativeEditing: false,
    cloudSync: false,
    voiceInput: false,
    realTimeCollaboration: false,
  },
} as const

// Type definitions for configuration
export type Config = typeof config
export type FeatureFlag = keyof typeof config.featureFlags
export type CitationStyle = typeof config.features.citations.supportedStyles[number]
export type ExportFormat = typeof config.features.export.supportedFormats[number]
export type Theme = typeof config.ui.theme.supportedThemes[number]
export type AmbientSound = typeof config.features.focusMode.ambientSounds[number]

// Helper functions
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return config.featureFlags[feature]
}

export function getStorageKey(key: keyof typeof config.storage.keys): string {
  return config.storage.keys[key]
}

export function isDevelopment(): boolean {
  return config.development.debug
}

export function getApiConfig() {
  return config.api
}

export function getEditorConfig() {
  return config.editor
}

export function getUiConfig() {
  return config.ui
}