import { useState, useEffect, useRef } from 'react'
import { Editor } from '@tiptap/react'
import { 
  Bold, 
  Italic, 
  Highlighter, 
  MessageSquare, 
  Zap, 
  ArrowRight,
  Sparkles,
  Copy,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStreamingChat, createAIPrompts } from '@/hooks/useStreamingChat'
import { useDocumentStore } from '@/store/documentStore'

export interface BubbleToolbarProps {
  editor: Editor
  visible: boolean
}

export function BubbleToolbar({ editor, visible }: BubbleToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const { sendMessage } = useStreamingChat()
  const { addAiContribution, documentType, academicLevel } = useDocumentStore()

  const getSelectedText = () => {
    if (editor.state.selection.empty) return ''
    return editor.state.doc.textBetween(
      editor.state.selection.from, 
      editor.state.selection.to
    )
  }

  const replaceSelectedText = async (newText: string) => {
    const { from, to } = editor.state.selection
    
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, newText)
      .setTextSelection({ from, to: from + newText.length })
      .run()
    
    // Track as AI contribution
    addAiContribution({
      startPos: from,
      endPos: from + newText.length,
      type: 'replacement',
      content: newText,
      accepted: true
    })
  }

  const insertAfterSelection = async (newText: string) => {
    const { to } = editor.state.selection
    
    editor.chain()
      .focus()
      .insertContentAt(to + 1, '\n\n' + newText)
      .run()
    
    // Track as AI contribution
    addAiContribution({
      startPos: to + 1,
      endPos: to + 1 + newText.length + 2,
      type: 'insertion',
      content: newText,
      accepted: true
    })
  }

  // Update position when selection changes
  useEffect(() => {
    if (!visible || !editor) {
      setPosition(null)
      setShowAIMenu(false)
      return
    }

    const updatePosition = () => {
      const { ranges } = editor.state.selection
      const from = Math.min(...ranges.map(range => range.$from.pos))
      const to = Math.max(...ranges.map(range => range.$to.pos))

      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)

      const editorRect = editor.view.dom.getBoundingClientRect()
      
      setPosition({
        top: start.top - editorRect.top - 60, // Position above selection
        left: (start.left + end.left) / 2 - editorRect.left - 150 // Center horizontally
      })
    }

    // Small delay to ensure selection is stable
    const timer = setTimeout(updatePosition, 50)
    return () => clearTimeout(timer)
  }, [visible, editor, editor.state.selection])

  const handleAIAction = async (action: 'simplify' | 'expand' | 'explain' | 'ask') => {
    const selectedText = getSelectedText()
    if (!selectedText) return

    setIsProcessing(true)
    setShowAIMenu(false)

    try {
      let prompt: string
      let shouldReplace = false

      switch (action) {
        case 'simplify':
          prompt = createAIPrompts.simplify(selectedText)
          shouldReplace = true
          break
        case 'expand':
          prompt = createAIPrompts.expand(selectedText)
          shouldReplace = false // Insert after
          break
        case 'explain':
          prompt = createAIPrompts.explain(selectedText)
          shouldReplace = false // Insert after
          break
        case 'ask':
          const question = window.prompt('What would you like to know about the selected text?')
          if (!question) return
          prompt = createAIPrompts.askAI(selectedText, question)
          shouldReplace = false // Insert after
          break
        default:
          return
      }

      const context = {
        fullText: editor.getText(),
        selectedText,
        wordCount: editor.storage.characterCount?.words() || 0,
        documentTitle: useDocumentStore.getState().title,
        documentType,
        academicLevel,
        cursorPosition: editor.state.selection.from
      }

      const response = await sendMessage(prompt, context)

      if (shouldReplace) {
        await replaceSelectedText(response)
      } else {
        await insertAfterSelection(response)
      }

    } catch (error) {
      console.error('AI action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
    const selectedText = getSelectedText()
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
    }
  }

  if (!visible || !position) return null

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 transition-all duration-200 ease-out"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg p-1">
        <div className="flex items-center space-x-1">
          {/* Basic formatting */}
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('highlight') ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* AI Actions */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-primary hover:bg-primary/10"
            onClick={() => handleAIAction('ask')}
            disabled={isProcessing}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Ask AI
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleAIAction('simplify')}
            disabled={isProcessing}
          >
            <Zap className="w-4 h-4 mr-1" />
            Simplify
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleAIAction('expand')}
            disabled={isProcessing}
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Expand
          </Button>

          {/* More options dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowAIMenu(!showAIMenu)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {showAIMenu && (
              <Card className="absolute top-10 right-0 p-2 bg-card/95 backdrop-blur-sm border-0 shadow-lg min-w-40 z-60">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2"
                    onClick={() => handleAIAction('explain')}
                    disabled={isProcessing}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Explain
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2"
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Card>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <Card className="bg-primary/10 border-primary/20 p-2">
            <div className="flex items-center space-x-2 text-sm text-primary">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
              <span>AI is thinking...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}