import { useState } from 'react'
import { Bot, Sparkles, Search, PenTool, Calculator, Brain, BookOpen, Plus, Send, Loader2, Square, Settings, Wrench, CheckCircle, AlertCircle, Eye, EyeOff, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { SettingsModal } from '@/components/ui/settings-modal'
import { MarkdownRenderer, MarkdownPreview, useMarkdownCopy, hasMarkdownSyntax } from '@/components/ui/markdown-renderer'
import { useStreamingChat, type DocumentContext } from '@/hooks/useStreamingChat'
import { useDocumentStore } from '@/store/documentStore'
import { AGENT_CONFIGS } from '@/agents/config'
import { 
  AnimatedButton, 
  AnimatedAgentAvatar, 
  AnimatedMessage, 
  AnimatedModal,
  AnimatedQuickAction,
  motion, 
  AnimatePresence 
} from '@/components/ui/animated-components'
import { 
  quickActionsVariants, 
  quickActionItemVariants,
  fadeInUp
} from '@/lib/animations'
import { useAgentThinking, useTextInsertion } from '@/hooks/useAnimations'

interface Agent {
  id: string
  name: string
  icon: any
  color: string
  description: string
  isActive: boolean
}

interface AgentPanelProps {
  className?: string
}

export function AgentPanel({ className = '' }: AgentPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('sage')
  const [message, setMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [markdownPreviews, setMarkdownPreviews] = useState<Record<string, boolean>>({})
  const [showInputPreview, setShowInputPreview] = useState(false)
  const { copied, copyMarkdown } = useMarkdownCopy()
  
  // Animation hooks
  const { setAgentThinking, isAgentThinking } = useAgentThinking()
  useTextInsertion() // For text insertion animations
  
  // Document store
  const { content, title, documentType, academicLevel, wordCount } = useDocumentStore()
  
  // Streaming chat hook
  const { 
    messages, 
    isStreaming, 
    error, 
    sendMessage, 
    abortStream 
  } = useStreamingChat({
    agentId: selectedAgent,
    onMessage: (msg) => {
      console.log('New message:', msg)
      // Stop thinking animation when message is complete
      if (!msg.streaming) {
        setAgentThinking(selectedAgent, false)
      }
    },
    onError: (err) => {
      console.error('Chat error:', err)
      setAgentThinking(selectedAgent, false)
    }
  })

  // Agent configurations with icons
  const agentIcons: Record<string, any> = {
    sage: Bot,
    atlas: Search,
    prose: PenTool,
    cite: BookOpen,
    euler: Calculator,
    socrates: Brain,
    mnemo: Sparkles
  }

  const agents: Agent[] = Object.values(AGENT_CONFIGS).map(config => ({
    id: config.id,
    name: config.name,
    icon: agentIcons[config.id] || Bot,
    color: config.color,
    description: config.description,
    isActive: config.id === 'sage' // Only Sage is active by default
  }))

  const activeAgent = agents.find(agent => agent.id === selectedAgent)

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return
    
    const userMessage = message
    setMessage('')
    
    // Start thinking animation
    setAgentThinking(selectedAgent, true)
    
    try {
      // Build document context
      const documentContext: DocumentContext = {
        fullText: content,
        selectedText: window.getSelection()?.toString() || undefined,
        wordCount,
        documentTitle: title,
        documentType,
        academicLevel
      }
      
      await sendMessage(userMessage, documentContext)
    } catch (error) {
      console.error('Failed to send message:', error)
      setAgentThinking(selectedAgent, false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleMarkdownPreview = (messageId: string) => {
    setMarkdownPreviews(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  const handleCopyMessage = async (content: string) => {
    await copyMarkdown(content)
  }

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Agent Selection Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <motion.div 
          className="flex items-center justify-between mb-4"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <motion.h2 
            className="text-lg font-semibold text-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            AI Agents
          </motion.h2>
          <div className="flex space-x-1">
            <AnimatedButton
              variant="ghost"
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </AnimatedButton>
            <AnimatedButton
              variant="ghost"
              className="w-8 h-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </AnimatedButton>
          </div>
        </motion.div>

        {/* Agent Grid */}
        <motion.div 
          className="grid grid-cols-3 gap-3"
          variants={quickActionsVariants}
          initial="initial"
          animate="animate"
        >
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              variants={quickActionItemVariants}
              custom={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.button
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full p-3 rounded-lg border transition-all ${
                  selectedAgent === agent.id
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
                whileHover={{
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <AnimatedAgentAvatar
                    isSelected={selectedAgent === agent.id}
                    isThinking={isAgentThinking(agent.id)}
                    isActive={agent.isActive}
                    color={agent.color}
                    icon={agent.icon}
                    size="md"
                  />
                  <motion.span 
                    className="text-xs font-medium text-foreground"
                    animate={selectedAgent === agent.id ? { 
                      color: "hsl(var(--primary))",
                      fontWeight: 600 
                    } : {}}
                  >
                    {agent.name}
                  </motion.span>
                  <AnimatePresence>
                    {agent.isActive && (
                      <motion.div
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1, 
                          opacity: 1,
                          boxShadow: [
                            "0 0 0 0px rgba(34, 197, 94, 0.4)",
                            "0 0 0 4px rgba(34, 197, 94, 0.1)",
                            "0 0 0 0px rgba(34, 197, 94, 0.4)"
                          ]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Active Agent Info */}
      <AnimatePresence mode="wait">
        {activeAgent && (
          <motion.div
            key={activeAgent.id}
            className="p-4 bg-muted/30 border-b border-border flex-shrink-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <AnimatedAgentAvatar
                isSelected={true}
                isThinking={isAgentThinking(activeAgent.id)}
                isActive={activeAgent.isActive}
                color={activeAgent.color}
                icon={activeAgent.icon}
                size="lg"
              />
              <motion.div 
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.h3 
                  className="font-semibold text-foreground"
                  layoutId={`agent-name-${activeAgent.id}`}
                >
                  {activeAgent.name}
                </motion.h3>
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {activeAgent.description}
                </motion.p>
              </motion.div>
              <AnimatePresence>
                {activeAgent.isActive && (
                  <motion.div
                    className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-emerald-500 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <span>Active</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-background">
          <div className="space-y-4">
            {messages.length === 0 && (
              /* Welcome Message */
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <div className={`w-full h-full ${activeAgent?.color || 'bg-indigo-500'} flex items-center justify-center`}>
                        {activeAgent?.icon && <activeAgent.icon className="w-4 h-4 text-white" />}
                      </div>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        Hello! I'm <strong>{activeAgent?.name || 'Sage'}</strong>. {AGENT_CONFIGS[selectedAgent]?.description || 'I\'m here to help with your writing.'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedAgent === 'sage' 
                          ? 'Ask me anything about your document, request research, or get writing suggestions. What would you like to work on?'
                          : `I specialize in ${AGENT_CONFIGS[selectedAgent]?.capabilities?.join(', ').toLowerCase() || 'helping you'}. How can I assist you today?`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Chat Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <AnimatedMessage 
                  key={msg.id} 
                  role={msg.role}
                  isStreaming={msg.streaming}
                >
                  <div className="flex items-start space-x-3">
                    {msg.role === 'assistant' && (
                      <AnimatedAgentAvatar
                        isSelected={false}
                        isThinking={msg.streaming}
                        isActive={activeAgent?.isActive}
                        color={activeAgent?.color || 'bg-indigo-500'}
                        icon={activeAgent?.icon || Bot}
                        size="sm"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {msg.role === 'user' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">You</span>
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-foreground">
                        {msg.role === 'assistant' && hasMarkdownSyntax(msg.content) ? (
                          <MarkdownPreview
                            content={msg.content}
                            isPreview={markdownPreviews[msg.id] !== false} // Default to preview for assistant messages
                            onTogglePreview={() => toggleMarkdownPreview(msg.id)}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        )}
                        {msg.streaming && <span className="animate-pulse ml-1">▋</span>}
                      </div>
                      
                      {/* Tool Calls Display */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.toolCalls.map((toolCall, index) => (
                            <div key={index} className="border border-border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center space-x-2 mb-2">
                                <Wrench className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium text-primary">Used Tool: {toolCall.name}</span>
                                {toolCall.result && (
                                  toolCall.result.success ? 
                                    <CheckCircle className="w-4 h-4 text-green-500" /> :
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              
                              {/* Tool Parameters */}
                              <div className="text-xs text-muted-foreground mb-2">
                                <strong>Parameters:</strong> {JSON.stringify(toolCall.parameters, null, 2)}
                              </div>
                              
                              {/* Tool Result */}
                              {toolCall.result && (
                                <div className={`text-xs p-2 rounded ${
                                  toolCall.result.success 
                                    ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                                    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                                }`}>
                                  <strong>Result:</strong> {toolCall.result.message || toolCall.result.error}
                                  {toolCall.result.data && (
                                    <details className="mt-1">
                                      <summary className="cursor-pointer">View Details</summary>
                                      <pre className="mt-1 text-xs overflow-x-auto">
                                        {JSON.stringify(toolCall.result.data, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {msg.error && (
                        <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          Error: {msg.error}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        {msg.role === 'assistant' && !msg.streaming && !msg.error && (
                          <motion.div 
                            className="flex space-x-1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <AnimatedButton 
                              variant="ghost" 
                              className="h-6 px-2 text-xs"
                            >
                              Insert
                            </AnimatedButton>
                            <AnimatedButton 
                              variant="ghost" 
                              className="h-6 px-2 text-xs"
                              onClick={() => handleCopyMessage(msg.content)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              {copied ? 'Copied!' : 'Copy'}
                            </AnimatedButton>
                            {hasMarkdownSyntax(msg.content) && (
                              <AnimatedButton
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => toggleMarkdownPreview(msg.id)}
                              >
                                {markdownPreviews[msg.id] !== false ? (
                                  <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Raw
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Preview
                                  </>
                                )}
                              </AnimatedButton>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedMessage>
              ))}
            </AnimatePresence>
            
            {/* Error Display */}
            {error && (
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {error}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div 
                  className="space-y-3"
                  variants={quickActionsVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <motion.p 
                    className="text-xs text-muted-foreground font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Quick Actions:
                  </motion.p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { 
                        icon: Search, 
                        label: 'Research this topic', 
                        description: 'Find credible sources and background information',
                        color: 'text-emerald-600',
                        action: () => {
                          setSelectedAgent('atlas')
                          setMessage('Help me research the main topic of my document and find credible sources.')
                        }
                      },
                      { 
                        icon: PenTool, 
                        label: 'Improve my writing', 
                        description: 'Get suggestions for clarity, style, and grammar',
                        color: 'text-purple-600',
                        action: () => {
                          setSelectedAgent('prose')
                          setMessage('Please review my writing and suggest improvements for clarity, style, and grammar.')
                        }
                      },
                      { 
                        icon: BookOpen, 
                        label: 'Create study materials', 
                        description: 'Generate flashcards and summaries',
                        color: 'text-pink-600',
                        action: () => {
                          setSelectedAgent('mnemo')
                          setMessage('Create study materials from my document including flashcards and a summary.')
                        }
                      },
                      { 
                        icon: Sparkles, 
                        label: 'Generate ideas', 
                        description: 'Brainstorm and analyze concepts',
                        color: 'text-amber-600',
                        action: () => {
                          setSelectedAgent('socrates')
                          setMessage('Help me brainstorm and critically analyze ideas related to my document topic.')
                        }
                      }
                    ].map((action, index) => (
                      <AnimatedQuickAction
                        key={index}
                        icon={action.icon}
                        label={action.label}
                        description={action.description}
                        iconColor={action.color}
                        onClick={action.action}
                        disabled={isStreaming}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-muted/30 flex-shrink-0">
          {/* Input Preview Toggle */}
          {hasMarkdownSyntax(message) && (
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {showInputPreview ? 'Markdown Preview' : 'Raw Input'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInputPreview(!showInputPreview)}
                className="h-6 text-xs"
              >
                {showInputPreview ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Raw
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          )}
          
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              {showInputPreview && hasMarkdownSyntax(message) ? (
                <div className="w-full min-h-[3rem] p-3 text-sm bg-background border border-border rounded-lg">
                  <MarkdownRenderer content={message} className="prose-xs" />
                </div>
              ) : (
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask ${activeAgent?.name} anything... (Markdown supported)`}
                  disabled={isStreaming}
                  className="w-full p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  rows={message.split('\n').length || 1}
                />
              )}
            </div>
            <AnimatePresence mode="wait">
              {isStreaming ? (
                <motion.div
                  key="stop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <AnimatedButton 
                    onClick={abortStream}
                    variant="secondary"
                    className="px-4 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Square className="w-4 h-4" />
                  </AnimatedButton>
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <AnimatedButton 
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isStreaming}
                    variant="primary"
                    className="px-4"
                  >
                    <Send className="w-4 h-4" />
                  </AnimatedButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line • Markdown supported
            </p>
            <AnimatePresence>
              {isStreaming && (
                <motion.div 
                  className="flex items-center space-x-1 text-xs text-primary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-3 h-3" />
                  </motion.div>
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Thinking...
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <AnimatedModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        className="w-full max-w-2xl max-h-[80vh] overflow-auto"
      >
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      </AnimatedModal>
    </div>
  )
}