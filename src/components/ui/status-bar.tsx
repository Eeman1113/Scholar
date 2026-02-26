import { Bot, Clock, Target, Zap } from 'lucide-react'
import { Badge } from './badge'

interface StatusBarProps {
  wordCount?: number
  readingLevel?: string | number
  aiContribution?: number
  targetWords?: number
  focusMode?: boolean
  className?: string
}

export function StatusBar({ 
  wordCount = 0,
  readingLevel = 'Grade 12',
  aiContribution = 0,
  targetWords,
  focusMode = false,
  className = ''
}: StatusBarProps) {
  const formatReadingLevel = (level: string | number) => {
    if (typeof level === 'number') {
      return `Grade ${Math.round(level)}`
    }
    return level
  }

  const getAiContributionColor = (percentage: number) => {
    if (percentage === 0) return 'text-muted-foreground'
    if (percentage <= 25) return 'text-emerald-600 dark:text-emerald-400'
    if (percentage <= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const getWordCountColor = () => {
    if (!targetWords) return 'text-foreground'
    const percentage = (wordCount / targetWords) * 100
    if (percentage >= 100) return 'text-emerald-600 dark:text-emerald-400'
    if (percentage >= 75) return 'text-amber-600 dark:text-amber-400'
    return 'text-muted-foreground'
  }

  return (
    <div className={`glass-card border-t bg-background/80 backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 sm:px-6">
        {/* Left section - Word count and reading level */}
        <div className="flex items-center space-x-4 text-sm">
          {/* Word Count */}
          <div className="flex items-center space-x-1">
            <span className={`font-medium ${getWordCountColor()}`}>
              {wordCount.toLocaleString()} words
            </span>
            {targetWords && (
              <span className="text-muted-foreground">
                / {targetWords.toLocaleString()}
              </span>
            )}
          </div>

          {/* Reading Level */}
          <div className="hidden sm:flex items-center space-x-1 text-muted-foreground">
            <Target className="w-3 h-3" />
            <span>{formatReadingLevel(readingLevel)}</span>
          </div>
        </div>

        {/* Right section - AI contribution and modes */}
        <div className="flex items-center space-x-4">
          {/* Focus Mode Badge */}
          {focusMode && (
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Focus Mode
            </Badge>
          )}

          {/* AI Contribution */}
          <div className="flex items-center space-x-1 text-sm">
            <Bot className="w-3 h-3 text-muted-foreground" />
            <span className={getAiContributionColor(aiContribution)}>
              {aiContribution}% AI
            </span>
          </div>

          {/* Last Saved Indicator */}
          <div className="hidden sm:flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Auto-saved</span>
          </div>
        </div>
      </div>
    </div>
  )
}