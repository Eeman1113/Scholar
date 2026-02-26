import { useState, useEffect } from 'react'
import { Header, ResizablePanes, StatusBar } from '@/components/ui'
import { WelcomeModal } from '@/components/ui/welcome-modal'
import { SettingsModal } from '@/components/ui/settings-modal'
import { EditorPanel } from '@/components/editor/editor-panel'
import { AgentPanel } from '@/components/agents/agent-panel'
import { CitationManager, StudyPack, FocusMode, VersionHistory, RubricMode } from '@/components/features'
import { TextInsertionOverlay } from '@/components/ui/text-insertion-overlay'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/store/uiStore'
import { useDocumentStore } from '@/store/documentStore'
import { motion, AnimatePresence } from '@/components/ui/animated-components'
import { pageVariants, editorVariants, agentPanelVariants, headerVariants, statusBarVariants } from '@/lib/animations'

function App() {
  // Initialize theme
  useTheme()
  const [documentTitle, setDocumentTitle] = useState('Untitled Document')
  const [splitPercentage, setSplitPercentage] = useState(60)
  const [showRubricMode, setShowRubricMode] = useState(false)
  
  const { 
    focusMode,
    hasCompletedOnboarding,
    showWelcomeModal,
    panels,
    hideWelcome,
    toggleFocusMode,
    toggleCitationManager,
    toggleStudyPack,
    toggleVersionHistory,
    toggleSettings
  } = useUiStore()

  const documentStore = useDocumentStore()
  const { content: documentContent, wordCount, setContent, readingLevel, aiContribution } = documentStore

  // Export functionality is now handled by the ExportDialog in Header

  const handleSettings = () => {
    toggleSettings()
  }

  const handleSplitChange = (percentage: number) => {
    setSplitPercentage(percentage)
    // TODO: Save to localStorage
  }


  const handleInsertContent = (content: string) => {
    setContent(documentContent + content)
  }

  const handleOpenRubricMode = () => {
    setShowRubricMode(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Focus Mode: Cmd/Ctrl + Shift + F
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        toggleFocusMode()
      }
      
      // Citation Manager: Cmd/Ctrl + Shift + C
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        toggleCitationManager()
      }
      
      // Study Pack: Cmd/Ctrl + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        toggleStudyPack()
      }
      
      // Version History: Cmd/Ctrl + Shift + H
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        toggleVersionHistory()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [toggleFocusMode, toggleCitationManager, toggleStudyPack, toggleVersionHistory])

  return (
    <FocusMode>
      <motion.div 
        className="h-screen bg-background text-foreground flex flex-col relative overflow-hidden"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Subtle background texture */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-indigo-500/2 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        
        {/* Header */}
        <AnimatePresence>
          {!(focusMode.isActive && focusMode.hideToolbar) && (
            <motion.div
              key="header"
              variants={headerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 flex-shrink-0"
            >
              <Header
                documentTitle={documentTitle}
                onDocumentTitleChange={setDocumentTitle}
                onSettings={handleSettings}
                onOpenRubricMode={handleOpenRubricMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <motion.div 
          className="flex-1 relative z-10 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ResizablePanes
            leftPane={
              <motion.div
                variants={editorVariants}
                initial="initial"
                animate="animate"
                className="h-full"
              >
                <ErrorBoundary>
                  <EditorPanel />
                </ErrorBoundary>
              </motion.div>
            }
            rightPane={
              <motion.div
                variants={agentPanelVariants}
                initial="initial"
                animate="animate"
                className="h-full"
              >
                <AgentPanel />
              </motion.div>
            }
            defaultSplit={splitPercentage}
            onSplitChange={handleSplitChange}
            className="h-full"
          />
        </motion.div>

        {/* Status Bar */}
        <AnimatePresence>
          {!(focusMode.isActive && focusMode.hideStatusBar) && (
            <motion.div
              key="statusbar"
              variants={statusBarVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 flex-shrink-0"
            >
              <StatusBar
                wordCount={wordCount}
                readingLevel={readingLevel}
                aiContribution={aiContribution}
                targetWords={500}
                focusMode={focusMode.isActive}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Modules */}
        <CitationManager 
          onInsertCitation={(citation) => {
            // TODO: Format citation properly
            handleInsertContent(`\n[Citation: ${citation.title}]\n`)
          }}
        />
        
        <StudyPack 
          documentContent={documentContent}
          onInsertContent={handleInsertContent}
        />
        
        <VersionHistory
          documentContent={documentContent}
          onRestoreVersion={setContent}
          onPreviewVersion={(content) => {
            // TODO: Implement preview mode
            console.log('Previewing version:', content.slice(0, 100))
          }}
        />
        
        {/* Rubric Mode - Full Screen Modal */}
        {showRubricMode && (
          <div className="fixed inset-0 z-[100] bg-background">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex justify-end">
                <button 
                  onClick={() => setShowRubricMode(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <RubricMode
                  documentContent={documentContent}
                  onInsertContent={handleInsertContent}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Text Insertion Animation Overlay */}
        <TextInsertionOverlay />
        
        {/* Welcome Modal */}
        <WelcomeModal 
          isOpen={!hasCompletedOnboarding && showWelcomeModal}
          onClose={hideWelcome}
        />
        
        {/* Settings Modal */}
        <SettingsModal 
          isOpen={panels.isSettingsOpen}
          onClose={() => toggleSettings()}
        />
      </motion.div>
    </FocusMode>
  )
}

export default App
