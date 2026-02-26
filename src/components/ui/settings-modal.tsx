import { useState, useEffect } from 'react'
import { Settings, Key, X, Save, Eye, EyeOff, Palette, Monitor, Moon, Sun, Download, Upload, RotateCcw, BookOpen, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUiStore } from '@/store/uiStore'
import { useAgentStore } from '@/store/agentStore'
import { motion, AnimatePresence } from '@/components/ui/animated-components'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'api' | 'theme' | 'editor' | 'agents' | 'export'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidKey, setIsValidKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { 
    theme, 
    editorSettings,
    setTheme,
    setFontSize,
    setFontFamily,
    toggleAnimations,
    toggleGrainTexture,
    toggleGlassEffects,
    setAccessibility,
    setSpellCheck,
    setGrammarCheck,
    setAutoSave,
    setGhostText,
    setAiContributionTracking,
    setReadingLevelSettings,
    setExportSettings,
    exportSettings,
    importSettings,
    resetUi
  } = useUiStore()

  const { 
    setHasValidApiKey,
    multiAgentMode,
    setMultiAgentMode,
    autoSwitchAgents,
    setAutoSwitchAgents,
    agentOrchestration,
    setAgentOrchestration
  } = useAgentStore()

  useEffect(() => {
    if (isOpen) {
      // Load existing API key from localStorage
      const existingKey = localStorage.getItem('anthropic_api_key')
      if (existingKey) {
        setApiKey(existingKey)
        setIsValidKey(true)
      }
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key')
      return
    }

    setIsSaving(true)
    try {
      // Simple validation - check if key starts with expected format for Anthropic
      if (apiKey.startsWith('sk-ant-') || apiKey.length > 20) {
        localStorage.setItem('anthropic_api_key', apiKey)
        setIsValidKey(true)
        setHasValidApiKey(true)
        setTimeout(() => {
          if (activeTab === 'api') {
            onClose()
          }
        }, 500)
      } else {
        alert('Invalid API key format. Please check your Anthropic Claude API key.')
      }
    } catch (error) {
      console.error('Failed to save API key:', error)
      alert('Failed to save API key. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveKey = () => {
    if (confirm('Are you sure you want to remove the API key? You won\'t be able to use AI agents until you add a new one.')) {
      localStorage.removeItem('anthropic_api_key')
      setApiKey('')
      setIsValidKey(false)
      setHasValidApiKey(false)
    }
  }

  const handleExportSettings = () => {
    const settingsJson = exportSettings()
    const blob = new Blob([settingsJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scholar-settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settingsJson = e.target?.result as string
        if (importSettings(settingsJson)) {
          alert('Settings imported successfully!')
        } else {
          alert('Failed to import settings. Please check the file format.')
        }
      } catch (error) {
        alert('Failed to import settings. Please check the file format.')
      }
    }
    reader.readAsText(file)
    // Reset the input
    event.target.value = ''
  }

  const tabs = [
    { id: 'api' as SettingsTab, label: 'API Keys', icon: Key },
    { id: 'theme' as SettingsTab, label: 'Appearance', icon: Palette },
    { id: 'editor' as SettingsTab, label: 'Editor', icon: BookOpen },
    { id: 'agents' as SettingsTab, label: 'Agents', icon: Users },
    { id: 'export' as SettingsTab, label: 'Data', icon: Download }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-background/95 backdrop-blur border-border/50 shadow-2xl">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg mt-4">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </CardHeader>
          
          <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* API Keys Tab */}
              {activeTab === 'api' && (
                <motion.div
                  key="api"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium">Anthropic Claude API Key</h3>
                      {isValidKey && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Enter your Anthropic Claude API key to enable AI agents. You can get one from{' '}
                      <a 
                        href="https://console.anthropic.com/keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        console.anthropic.com
                      </a>
                    </p>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-ant-..."
                          className="w-full p-3 pr-10 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleSave}
                          disabled={!apiKey.trim() || isSaving}
                          className="flex-1"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save Key'}
                        </Button>
                        
                        {isValidKey && (
                          <Button 
                            variant="destructive"
                            onClick={handleRemoveKey}
                            className="px-3"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Status */}
                    {isValidKey && (
                      <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>API key configured</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium mb-2">About Anthropic Claude</h3>
                    <p className="text-sm text-muted-foreground">
                      Claude is Anthropic's AI assistant that powers Scholar's specialized writing agents. 
                      Your API key is stored locally and only used to communicate with Anthropic's servers.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Theme Tab */}
              {activeTab === 'theme' && (
                <motion.div
                  key="theme"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center space-x-2">
                      <Palette className="w-4 h-4" />
                      <span>Appearance</span>
                    </h3>
                    
                    {/* Theme Mode */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Theme Mode</label>
                      <div className="flex space-x-2">
                        {[
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'dark', label: 'Dark', icon: Moon },
                          { id: 'system', label: 'System', icon: Monitor }
                        ].map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            onClick={() => setTheme(id as any)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                              theme.mode === id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Font Size</label>
                      <div className="flex space-x-2">
                        {[
                          { id: 'small', label: 'Small' },
                          { id: 'medium', label: 'Medium' },
                          { id: 'large', label: 'Large' }
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={() => setFontSize(id as any)}
                            className={`px-3 py-2 rounded-lg border transition-colors ${
                              theme.fontSize === id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Font Family</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'geist', label: 'Geist Sans' },
                          { id: 'dmsans', label: 'DM Sans' },
                          { id: 'inter', label: 'Inter' },
                          { id: 'system', label: 'System' }
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={() => setFontFamily(id as any)}
                            className={`px-3 py-2 rounded-lg border transition-colors text-left ${
                              theme.fontFamily === id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Effects */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Visual Effects</label>
                      
                      <div className="space-y-3">
                        {[
                          { 
                            key: 'enableAnimations', 
                            label: 'Enable Animations', 
                            description: 'Smooth transitions and micro-interactions',
                            checked: theme.enableAnimations,
                            onChange: toggleAnimations
                          },
                          { 
                            key: 'enableGrainTexture', 
                            label: 'Grain Texture', 
                            description: 'Subtle texture overlay for visual depth',
                            checked: theme.enableGrainTexture,
                            onChange: toggleGrainTexture
                          },
                          { 
                            key: 'enableGlassEffects', 
                            label: 'Glass Effects', 
                            description: 'Frosted glass backdrop blur effects',
                            checked: theme.enableGlassEffects,
                            onChange: toggleGlassEffects
                          }
                        ].map(setting => (
                          <div key={setting.key} className="flex items-start space-x-3">
                            <button
                              onClick={setting.onChange}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                setting.checked
                                  ? 'bg-primary border-primary'
                                  : 'border-border'
                              }`}
                            >
                              {setting.checked && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </button>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{setting.label}</div>
                              <div className="text-xs text-muted-foreground">{setting.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Accessibility */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Accessibility</label>
                      
                      <div className="space-y-3">
                        {[
                          { 
                            key: 'highContrast', 
                            label: 'High Contrast', 
                            description: 'Increase contrast for better visibility',
                            checked: theme.highContrast
                          },
                          { 
                            key: 'reducedMotion', 
                            label: 'Reduce Motion', 
                            description: 'Minimize animations and effects',
                            checked: theme.reducedMotion
                          }
                        ].map(setting => (
                          <div key={setting.key} className="flex items-start space-x-3">
                            <button
                              onClick={() => setAccessibility({ [setting.key]: !setting.checked })}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                setting.checked
                                  ? 'bg-primary border-primary'
                                  : 'border-border'
                              }`}
                            >
                              {setting.checked && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </button>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{setting.label}</div>
                              <div className="text-xs text-muted-foreground">{setting.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Editor Tab */}
              {activeTab === 'editor' && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Editor Preferences</span>
                    </h3>
                    
                    {/* Writing Features */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Writing Features</label>
                      
                      <div className="space-y-3">
                        {[
                          { 
                            key: 'spellCheck', 
                            label: 'Spell Check', 
                            description: 'Check spelling as you type',
                            checked: editorSettings.spellCheck,
                            onChange: () => setSpellCheck(!editorSettings.spellCheck)
                          },
                          { 
                            key: 'grammarCheck', 
                            label: 'Grammar Check', 
                            description: 'Advanced grammar and style suggestions',
                            checked: editorSettings.grammarCheck,
                            onChange: () => setGrammarCheck(!editorSettings.grammarCheck)
                          },
                          { 
                            key: 'autoSave', 
                            label: 'Auto Save', 
                            description: `Save automatically every ${editorSettings.autoSaveInterval} seconds`,
                            checked: editorSettings.autoSave,
                            onChange: () => setAutoSave(!editorSettings.autoSave)
                          }
                        ].map(setting => (
                          <div key={setting.key} className="flex items-start space-x-3">
                            <button
                              onClick={setting.onChange}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                setting.checked
                                  ? 'bg-primary border-primary'
                                  : 'border-border'
                              }`}
                            >
                              {setting.checked && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </button>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{setting.label}</div>
                              <div className="text-xs text-muted-foreground">{setting.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Features */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">AI Features</label>
                      
                      <div className="space-y-3">
                        {[
                          { 
                            key: 'ghostTextEnabled', 
                            label: 'Ghost Text Suggestions', 
                            description: `Show AI suggestions after ${editorSettings.ghostTextDelay/1000}s pause`,
                            checked: editorSettings.ghostTextEnabled,
                            onChange: () => setGhostText(!editorSettings.ghostTextEnabled)
                          },
                          { 
                            key: 'aiContributionTracking', 
                            label: 'AI Contribution Tracking', 
                            description: 'Track and visualize AI-assisted content',
                            checked: editorSettings.aiContributionTracking,
                            onChange: () => setAiContributionTracking(!editorSettings.aiContributionTracking)
                          },
                          { 
                            key: 'showReadingLevel', 
                            label: 'Reading Level Display', 
                            description: `Show reading level (target: ${editorSettings.readingLevelTarget})`,
                            checked: editorSettings.showReadingLevel,
                            onChange: () => setReadingLevelSettings(!editorSettings.showReadingLevel)
                          }
                        ].map(setting => (
                          <div key={setting.key} className="flex items-start space-x-3">
                            <button
                              onClick={setting.onChange}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                setting.checked
                                  ? 'bg-primary border-primary'
                                  : 'border-border'
                              }`}
                            >
                              {setting.checked && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </button>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{setting.label}</div>
                              <div className="text-xs text-muted-foreground">{setting.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export Settings */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Export Format</label>
                      <div className="flex space-x-2">
                        {[
                          { id: 'markdown', label: 'Markdown' },
                          { id: 'docx', label: 'Word' },
                          { id: 'pdf', label: 'PDF' },
                          { id: 'html', label: 'HTML' }
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={() => setExportSettings({ defaultExportFormat: id as any })}
                            className={`px-3 py-2 rounded-lg border transition-colors ${
                              editorSettings.defaultExportFormat === id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Agents Tab */}
              {activeTab === 'agents' && (
                <motion.div
                  key="agents"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Agent Behavior</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {[
                        { 
                          key: 'multiAgentMode', 
                          label: 'Multi-Agent Mode', 
                          description: 'Allow multiple agents to be active simultaneously',
                          checked: multiAgentMode,
                          onChange: () => setMultiAgentMode(!multiAgentMode)
                        },
                        { 
                          key: 'autoSwitchAgents', 
                          label: 'Auto Switch Agents', 
                          description: 'Automatically suggest the best agent for each task',
                          checked: autoSwitchAgents,
                          onChange: () => setAutoSwitchAgents(!autoSwitchAgents)
                        },
                        { 
                          key: 'agentOrchestration', 
                          label: 'Agent Orchestration', 
                          description: 'Let Sage coordinate complex tasks between agents',
                          checked: agentOrchestration,
                          onChange: () => setAgentOrchestration(!agentOrchestration)
                        }
                      ].map(setting => (
                        <div key={setting.key} className="flex items-start space-x-3">
                          <button
                            onClick={setting.onChange}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                              setting.checked
                                ? 'bg-primary border-primary'
                                : 'border-border'
                            }`}
                          >
                            {setting.checked && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </button>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{setting.label}</div>
                            <div className="text-xs text-muted-foreground">{setting.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data Tab */}
              {activeTab === 'export' && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Data Management</span>
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 border border-border rounded-lg space-y-3">
                        <h4 className="font-medium">Export Settings</h4>
                        <p className="text-sm text-muted-foreground">
                          Save your preferences, theme, and agent settings to a file.
                        </p>
                        <Button
                          onClick={handleExportSettings}
                          className="flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export Settings</span>
                        </Button>
                      </div>
                      
                      <div className="p-4 border border-border rounded-lg space-y-3">
                        <h4 className="font-medium">Import Settings</h4>
                        <p className="text-sm text-muted-foreground">
                          Restore your preferences from a previously exported settings file.
                        </p>
                        <div>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportSettings}
                            className="hidden"
                            id="import-settings"
                          />
                          <Button
                            onClick={() => document.getElementById('import-settings')?.click()}
                            variant="outline"
                            className="flex items-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Import Settings</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-destructive/20 rounded-lg space-y-3">
                        <h4 className="font-medium text-destructive">Reset All Settings</h4>
                        <p className="text-sm text-muted-foreground">
                          Reset all settings to their default values. This cannot be undone.
                        </p>
                        <Button
                          onClick={() => {
                            if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
                              resetUi()
                            }
                          }}
                          variant="destructive"
                          className="flex items-center space-x-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset Settings</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}