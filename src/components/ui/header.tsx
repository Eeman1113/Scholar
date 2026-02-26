import { useState } from 'react'
import { FileText, Download, Settings, Menu, BookOpen, Brain, History, ClipboardList, Focus } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { ExportDialog } from './export-dialog'
import { useUiStore } from '@/store/uiStore'
import { config } from '@/lib/config'
import { motion, AnimatePresence } from '@/components/ui/animated-components'
import { AnimatedButton } from '@/components/ui/animated-components'

interface HeaderProps {
  documentTitle?: string
  onDocumentTitleChange?: (title: string) => void
  onSettings?: () => void
  onOpenRubricMode?: () => void
  className?: string
}

export function Header({ 
  documentTitle = 'Untitled Document', 
  onDocumentTitleChange,
  onSettings,
  onOpenRubricMode,
  className = ''
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(documentTitle)
  const [showExportDialog, setShowExportDialog] = useState(false)
  
  const { 
    toggleCitationManager,
    toggleStudyPack,
    toggleVersionHistory,
    toggleFocusMode,
    panels,
    focusMode
  } = useUiStore()

  const handleTitleSubmit = () => {
    onDocumentTitleChange?.(tempTitle)
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setTempTitle(documentTitle)
      setIsEditingTitle(false)
    }
  }

  return (
    <motion.header 
      className={`glass-card border-b bg-background/80 backdrop-blur-md ${className}`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left section - Logo and Document Title */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2 flex-shrink-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <motion.div 
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center"
              whileHover={{ 
                scale: 1.1,
                rotate: 5,
                boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-4 h-4 text-white" />
            </motion.div>
            <motion.h1 
              className="text-lg font-serif font-semibold text-foreground hidden sm:block"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {config.app.name}
            </motion.h1>
          </motion.div>

          {/* Document Title */}
          <motion.div 
            className="min-w-0 flex-1 max-w-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <AnimatePresence mode="wait">
              {isEditingTitle ? (
                <motion.input
                  key="editing"
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full px-3 py-1 text-sm font-medium bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                />
              ) : (
                <motion.button
                  key="display"
                  onClick={() => setIsEditingTitle(true)}
                  className="w-full text-left px-3 py-1 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors truncate"
                  title={documentTitle}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {documentTitle}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Feature Module Buttons */}
        <motion.div 
          className="hidden lg:flex items-center space-x-1 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2, staggerChildren: 0.05 }}
        >
          {[
            {
              icon: BookOpen,
              isActive: panels.isCitationManagerOpen,
              onClick: toggleCitationManager,
              title: "Citation Manager (Ctrl+Shift+C)"
            },
            {
              icon: Brain,
              isActive: panels.isStudyPackOpen,
              onClick: toggleStudyPack,
              title: "Study Pack (Ctrl+Shift+S)"
            },
            {
              icon: History,
              isActive: panels.isVersionHistoryOpen,
              onClick: toggleVersionHistory,
              title: "Version History (Ctrl+Shift+H)"
            },
            {
              icon: ClipboardList,
              isActive: false,
              onClick: onOpenRubricMode,
              title: "Rubric Mode"
            },
            {
              icon: Focus,
              isActive: focusMode.isActive,
              onClick: toggleFocusMode,
              title: "Focus Mode (Ctrl+Shift+F)"
            }
          ].map((button, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <AnimatedButton
                variant={button.isActive ? "primary" : "ghost"}
                onClick={button.onClick}
                title={button.title}
                className="w-8 h-8 p-0"
              >
                <button.icon className="h-4 w-4" />
              </AnimatedButton>
            </motion.div>
          ))}
        </motion.div>

        {/* Right section - Actions */}
        <motion.div 
          className="flex items-center space-x-2 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {/* Export Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatedButton
              variant="ghost"
              onClick={() => setShowExportDialog(true)}
              className="hidden sm:flex w-8 h-8 p-0"
              title="Export document"
            >
              <Download className="h-4 w-4" />
            </AnimatedButton>
          </motion.div>

          {/* Settings Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
          >
            <AnimatedButton
              variant="ghost"
              onClick={onSettings}
              className="hidden sm:flex w-8 h-8 p-0"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </AnimatedButton>
          </motion.div>

          {/* Theme Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ThemeToggle />
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }}
          >
            <AnimatedButton
              variant="ghost"
              className="sm:hidden w-8 h-8 p-0"
              title="Menu"
            >
              <Menu className="h-4 w-4" />
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </motion.header>
  )
}