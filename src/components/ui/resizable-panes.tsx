import { useState, useRef, useCallback, useEffect } from 'react'
import { GripVertical } from 'lucide-react'

interface ResizablePanesProps {
  leftPane: React.ReactNode
  rightPane: React.ReactNode
  defaultSplit?: number // percentage for left pane (0-100)
  minLeftWidth?: number // minimum percentage for left pane
  minRightWidth?: number // minimum percentage for right pane
  className?: string
  onSplitChange?: (splitPercentage: number) => void
}

export function ResizablePanes({
  leftPane,
  rightPane,
  defaultSplit = 60,
  minLeftWidth = 30,
  minRightWidth = 30,
  className = '',
  onSplitChange
}: ResizablePanesProps) {
  const [splitPercentage, setSplitPercentage] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [showRightPane, setShowRightPane] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1200)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return
    setIsDragging(true)
    e.preventDefault()
  }, [isMobile])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newSplitPercentage = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Apply constraints
      const constrainedSplit = Math.max(
        minLeftWidth,
        Math.min(100 - minRightWidth, newSplitPercentage)
      )

      setSplitPercentage(constrainedSplit)
      onSplitChange?.(constrainedSplit)
    },
    [isDragging, minLeftWidth, minRightWidth, onSplitChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Mobile view - tab switcher
  if (isMobile) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        {/* Tab Switcher */}
        <div className="flex bg-muted/50 border-b border-border">
          <button
            onClick={() => setShowRightPane(false)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              !showRightPane
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setShowRightPane(true)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              showRightPane
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            AI Agents
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              showRightPane ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            {leftPane}
          </div>
          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              showRightPane ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {rightPane}
          </div>
        </div>
      </div>
    )
  }

  // Tablet view - collapsible right pane
  if (isTablet) {
    return (
      <div className={`h-full flex ${className}`} ref={containerRef}>
        {/* Left pane - always visible */}
        <div className="flex-1 min-w-0 border-r border-border">
          {leftPane}
        </div>

        {/* Toggle button for right pane */}
        <button
          onClick={() => setShowRightPane(!showRightPane)}
          className={`w-8 border-r border-border bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center ${
            showRightPane ? '' : 'border-l'
          }`}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Right pane - collapsible */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            showRightPane ? 'w-80' : 'w-0'
          }`}
        >
          <div className="w-80 h-full">
            {rightPane}
          </div>
        </div>
      </div>
    )
  }

  // Desktop view - resizable split panes
  return (
    <div className={`h-full flex ${className}`} ref={containerRef}>
      {/* Left pane */}
      <div
        className="min-w-0 border-r border-border transition-all duration-100"
        style={{ width: `${splitPercentage}%` }}
      >
        {leftPane}
      </div>

      {/* Resize handle */}
      <div
        className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors relative group focus:outline-none focus:bg-primary/50 ${
          isDragging ? 'bg-primary' : ''
        }`}
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' && splitPercentage > minLeftWidth) {
            const newSplit = Math.max(minLeftWidth, splitPercentage - 5)
            setSplitPercentage(newSplit)
            onSplitChange?.(newSplit)
            e.preventDefault()
          } else if (e.key === 'ArrowRight' && splitPercentage < 100 - minRightWidth) {
            const newSplit = Math.min(100 - minRightWidth, splitPercentage + 5)
            setSplitPercentage(newSplit)
            onSplitChange?.(newSplit)
            e.preventDefault()
          }
        }}
        tabIndex={0}
        role="separator"
        aria-label="Resize panels"
        aria-valuemin={minLeftWidth}
        aria-valuemax={100 - minRightWidth}
        aria-valuenow={splitPercentage}
      >
        <div className="absolute inset-y-0 -inset-x-2 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
          <div className="w-4 h-8 bg-background border border-border rounded-sm shadow-sm flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Right pane */}
      <div
        className="min-w-0 transition-all duration-100"
        style={{ width: `${100 - splitPercentage}%` }}
      >
        {rightPane}
      </div>
    </div>
  )
}