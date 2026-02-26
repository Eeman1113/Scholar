import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircleIcon, 
  AlertCircleIcon, 
  AlertTriangleIcon, 
  LoaderIcon,
  BookOpenIcon
} from 'lucide-react'
import { type Editor } from '@tiptap/react'
import { type HarperLint } from '@/lib/harper/service'

interface HarperStatusProps {
  editor: Editor | null
  lints: HarperLint[]
  isLinting: boolean
  isEnabled: boolean
}

export const HarperStatus: React.FC<HarperStatusProps> = ({
  editor,
  lints,
  isLinting,
  isEnabled
}) => {
  const toggleHarper = () => {
    if (!editor) return
    editor.commands.toggleHarper()
  }

  const errorCount = lints.filter(lint => lint.severity === 'error').length
  const warningCount = lints.filter(lint => lint.severity === 'warning').length
  const infoCount = lints.filter(lint => lint.severity === 'info').length

  const totalIssues = errorCount + warningCount + infoCount

  const getStatusIcon = () => {
    if (isLinting) {
      return <LoaderIcon className="w-3 h-3 animate-spin" />
    }
    
    if (!isEnabled) {
      return <BookOpenIcon className="w-3 h-3 text-muted-foreground" />
    }
    
    if (errorCount > 0) {
      return <AlertCircleIcon className="w-3 h-3 text-red-500" />
    }
    
    if (warningCount > 0) {
      return <AlertTriangleIcon className="w-3 h-3 text-yellow-500" />
    }
    
    return <CheckCircleIcon className="w-3 h-3 text-green-500" />
  }

  const getStatusText = () => {
    if (isLinting) return 'Checking...'
    if (!isEnabled) return 'Grammar: Off'
    if (totalIssues === 0) return 'Grammar: Good'
    return `Grammar: ${totalIssues} issue${totalIssues === 1 ? '' : 's'}`
  }


  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={isEnabled ? "default" : "ghost"}
        size="sm"
        onClick={toggleHarper}
        className="text-xs h-7 px-2"
      >
        {getStatusIcon()}
        <span className="ml-1">
          {getStatusText()}
        </span>
      </Button>
      
      {isEnabled && totalIssues > 0 && (
        <div className="flex items-center space-x-1">
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs h-5 px-1.5">
              {errorCount}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {warningCount}
            </Badge>
          )}
          {infoCount > 0 && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {infoCount}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default HarperStatus