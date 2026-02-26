import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckIcon, XIcon, PlusIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react'
import { type Editor } from '@tiptap/react'
import { type HarperLint } from '@/lib/harper/service'

interface HarperSuggestionsProps {
  editor: Editor | null
  lint: HarperLint | null
  position: { x: number; y: number } | null
  onClose: () => void
}

export const HarperSuggestions: React.FC<HarperSuggestionsProps> = ({
  editor,
  lint,
  position,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(lint !== null && position !== null)
  }, [lint, position])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  const applySuggestion = (suggestionIndex: number) => {
    if (!editor || !lint) return

    editor.commands.applyHarperSuggestion(lint, suggestionIndex)
    onClose()
  }

  const ignoreLint = () => {
    if (!editor || !lint) return

    editor.commands.ignoreHarperLint(lint)
    onClose()
  }

  const addToDictionary = () => {
    if (!editor || !lint) return

    const lintedText = editor.state.doc.textBetween(lint.range.from, lint.range.to)
    editor.commands.addWordToHarperDictionary(lintedText)
    onClose()
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircleIcon className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangleIcon className="w-4 h-4 text-yellow-500" />
      default:
        return <InfoIcon className="w-4 h-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (!isVisible || !lint || !position) {
    return null
  }

  const cardStyle = {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 1000,
    maxWidth: '320px',
    minWidth: '280px'
  }

  const lintedText = editor?.state.doc.textBetween(lint.range.from, lint.range.to) || ''
  const isSpellingError = lint.message.toLowerCase().includes('spelling') || 
                         lint.message.toLowerCase().includes('misspelled')

  return (
    <Card ref={cardRef} style={cardStyle} className="shadow-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {getSeverityIcon(lint.severity)}
              Grammar Check
              <Badge variant={getSeverityColor(lint.severity) as any} className="text-xs">
                {lint.severity}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {lint.message}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 shrink-0 ml-2"
          >
            <XIcon className="w-3 h-3" />
          </Button>
        </div>
        
        {lintedText && (
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono border">
            "<span className="text-red-600 font-semibold">{lintedText}</span>"
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Suggestions */}
        {lint.suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Suggestions:
            </div>
            <div className="space-y-1">
              {lint.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 text-left text-xs font-mono hover:bg-green-50 hover:text-green-800 border border-transparent hover:border-green-200"
                  onClick={() => applySuggestion(index)}
                >
                  <CheckIcon className="w-3 h-3 mr-2 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      "{suggestion.text}"
                    </div>
                    {suggestion.description && (
                      <div className="text-muted-foreground text-xs mt-1">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <Separator className="my-3" />
        
        <div className="flex flex-col gap-2">
          {isSpellingError && lintedText && (
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-2 text-xs hover:bg-blue-50 hover:text-blue-800 border border-transparent hover:border-blue-200"
              onClick={addToDictionary}
            >
              <PlusIcon className="w-3 h-3 mr-2 text-blue-600 shrink-0" />
              Add "{lintedText}" to dictionary
            </Button>
          )}
          
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-2 text-xs hover:bg-gray-50 hover:text-gray-800 border border-transparent hover:border-gray-200"
            onClick={ignoreLint}
          >
            <XIcon className="w-3 h-3 mr-2 text-gray-600 shrink-0" />
            Ignore this suggestion
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
          Click a suggestion to apply it, or press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to close.
        </div>
      </CardContent>
    </Card>
  )
}

export default HarperSuggestions