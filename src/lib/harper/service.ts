import { WorkerLinter, LocalLinter, type Linter, type Lint, type Suggestion, binary } from 'harper.js'

// Define Dialect enum since it may not be exported correctly
export const Dialect = {
  AmericanEnglish: 'american-english' as const,
  BritishEnglish: 'british-english' as const
} as const

export type DialectType = typeof Dialect[keyof typeof Dialect]

export interface HarperLint {
  id: string
  message: string
  range: { from: number; to: number }
  severity: 'error' | 'warning' | 'info'
  suggestions: HarperSuggestion[]
  originalLint: Lint
}

export interface HarperSuggestion {
  text: string
  description?: string
  originalSuggestion: Suggestion
}

export interface HarperConfig {
  enabled: boolean
  dialect: DialectType
  useWorker: boolean
}

export class HarperService {
  private linter: Linter | null = null
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null
  private config: HarperConfig = {
    enabled: true,
    dialect: Dialect.AmericanEnglish,
    useWorker: typeof Worker !== 'undefined' // Use worker in browser, local in Node.js
  }

  constructor(config?: Partial<HarperConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this.doInitialize()
    await this.initializationPromise
    this.isInitialized = true
  }

  private async doInitialize(): Promise<void> {
    try {
      if (this.config.useWorker && typeof Worker !== 'undefined') {
        this.linter = new WorkerLinter({ binary, dialect: this.config.dialect as any })
      } else {
        this.linter = new LocalLinter({ binary, dialect: this.config.dialect as any })
      }
      
      await this.linter.setup()
    } catch (error) {
      console.warn('Failed to initialize Harper.js linter:', error)
      throw error
    }
  }

  async lintText(text: string): Promise<HarperLint[]> {
    if (!this.config.enabled || !text.trim()) return []
    
    try {
      await this.initialize()
      if (!this.linter) return []

      const lints = await this.linter.lint(text)
      
      return lints.map((lint: any, index: number) => {
        const span = typeof lint.span === 'function' ? lint.span() : lint.span
        const message = typeof lint.message === 'function' ? lint.message() : lint.message
        const suggestions = typeof lint.suggestions === 'function' ? lint.suggestions() : lint.suggestions
        
        return {
          id: `harper-${index}-${span?.start || 0}-${span?.end || 0}`,
          message: String(message),
          range: { from: span?.start || 0, to: span?.end || 0 },
          severity: this.determineSeverity(lint),
          suggestions: (Array.isArray(suggestions) ? suggestions : []).map((suggestion: any) => ({
            text: String(suggestion?.text || ''),
            description: String(suggestion?.kind || ''),
            originalSuggestion: suggestion
          })),
          originalLint: lint
        }
      })
    } catch (error) {
      console.warn('Harper linting failed:', error)
      return []
    }
  }

  async applySuggestion(text: string, lint: HarperLint, suggestion: HarperSuggestion): Promise<string> {
    try {
      await this.initialize()
      if (!this.linter) return text

      return await this.linter.applySuggestion(text, lint.originalLint, suggestion.originalSuggestion)
    } catch (error) {
      console.warn('Failed to apply Harper suggestion:', error)
      return text
    }
  }

  async ignoreLint(text: string, lint: HarperLint): Promise<void> {
    try {
      await this.initialize()
      if (!this.linter) return

      await this.linter.ignoreLint(text, lint.originalLint)
    } catch (error) {
      console.warn('Failed to ignore Harper lint:', error)
    }
  }

  async addWordToDictionary(word: string): Promise<void> {
    try {
      await this.initialize()
      if (!this.linter) return

      await this.linter.importWords([word])
    } catch (error) {
      console.warn('Failed to add word to Harper dictionary:', error)
    }
  }

  private determineSeverity(lint: any): 'error' | 'warning' | 'info' {
    // Convert Harper's lint messages to severity levels
    const messageText = typeof lint.message === 'function' ? lint.message() : lint.message
    const message = String(messageText || '').toLowerCase()
    
    if (message.includes('spelling') || message.includes('misspelled')) {
      return 'error'
    }
    
    if (message.includes('grammar') || message.includes('should be')) {
      return 'warning'
    }
    
    return 'info'
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  setDialect(dialect: DialectType): void {
    this.config.dialect = dialect
    // Re-initialize with new dialect
    this.isInitialized = false
    this.initializationPromise = null
    this.linter = null
  }

  async dispose(): Promise<void> {
    if (this.linter) {
      await this.linter.dispose()
      this.linter = null
    }
    this.isInitialized = false
    this.initializationPromise = null
  }
}

// Global instance
export const harperService = new HarperService()