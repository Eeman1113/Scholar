import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Editor } from '@tiptap/react'
import { 
  FileText, 
  Quote, 
  Table, 
  Hash, 
  Image, 
  Lightbulb,
  ArrowRight,
  ArrowDown,
  Zap,
  MessageSquare,
  BookOpen,
  Target,
  GraduationCap
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useStreamingChat, createAIPrompts } from '@/hooks/useStreamingChat'
import { useDocumentStore } from '@/store/documentStore'

export interface SlashCommand {
  id: string
  label: string
  description: string
  icon: React.ElementType
  group: 'formatting' | 'ai' | 'content'
  action: (editor: Editor, params?: any) => void
  requiresAI?: boolean
}

export interface SlashCommandsProps {
  editor: Editor
  query: string
  range: { from: number; to: number }
  onClose: () => void
}

export interface SlashCommandsRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

const SlashCommandsComponent = forwardRef<SlashCommandsRef, SlashCommandsProps>(
  ({ editor, query, range, onClose }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const { sendMessage } = useStreamingChat()
    const { content, title, documentType, academicLevel, wordCount, addAiContribution } = useDocumentStore()

    const createDocumentContext = () => ({
      fullText: content,
      selectedText: editor.state.selection.empty 
        ? undefined 
        : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to),
      cursorPosition: editor.state.selection.from,
      wordCount,
      documentTitle: title,
      documentType,
      academicLevel,
      cursorParagraph: getCurrentParagraph()
    })

    const getCurrentParagraph = () => {
      const { from } = editor.state.selection
      const doc = editor.state.doc
      const $pos = doc.resolve(from)
      const paragraph = $pos.parent
      return paragraph.textContent
    }

    const insertAIContent = async (prompt: string, insertPosition?: number) => {
      try {
        const context = createDocumentContext()
        const response = await sendMessage(prompt, context)
        
        const pos = insertPosition || range.from
        const endPos = pos + response.length
        
        // Insert the content
        editor.chain()
          .focus()
          .deleteRange(range)
          .insertContentAt(pos, response)
          .run()
        
        // Track as AI contribution
        addAiContribution({
          startPos: pos,
          endPos: endPos,
          type: 'insertion',
          content: response,
          accepted: true
        })
        
        onClose()
      } catch (error) {
        console.error('Failed to generate AI content:', error)
        onClose()
      }
    }

    const commands: SlashCommand[] = [
      // Formatting commands
      {
        id: 'h1',
        label: '/h1',
        description: 'Large heading',
        icon: FileText,
        group: 'formatting',
        action: (editor) => {
          editor.chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 1 })
            .run()
          onClose()
        }
      },
      {
        id: 'h2',
        label: '/h2',
        description: 'Medium heading',
        icon: FileText,
        group: 'formatting',
        action: (editor) => {
          editor.chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 2 })
            .run()
          onClose()
        }
      },
      {
        id: 'h3',
        label: '/h3',
        description: 'Small heading',
        icon: FileText,
        group: 'formatting',
        action: (editor) => {
          editor.chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 3 })
            .run()
          onClose()
        }
      },
      {
        id: 'quote',
        label: '/quote',
        description: 'Quote block',
        icon: Quote,
        group: 'formatting',
        action: (editor) => {
          editor.chain()
            .focus()
            .deleteRange(range)
            .setBlockquote()
            .run()
          onClose()
        }
      },
      {
        id: 'table',
        label: '/table',
        description: 'Insert table',
        icon: Table,
        group: 'content',
        action: (editor) => {
          editor.chain()
            .focus()
            .deleteRange(range)
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
          onClose()
        }
      },
      {
        id: 'math',
        label: '/math',
        description: 'Math equation',
        icon: Hash,
        group: 'content',
        action: (editor) => {
          const mathExpression = window.prompt('Enter math expression (LaTeX):')
          if (mathExpression) {
            editor.chain()
              .focus()
              .deleteRange(range)
              .insertContent(`$${mathExpression}$`)
              .run()
          }
          onClose()
        }
      },
      {
        id: 'image',
        label: '/image',
        description: 'Insert image',
        icon: Image,
        group: 'content',
        action: (editor) => {
          const url = window.prompt('Enter image URL:')
          if (url) {
            editor.chain()
              .focus()
              .deleteRange(range)
              .setImage({ src: url })
              .run()
          }
          onClose()
        }
      },
      // AI commands
      {
        id: 'summarize',
        label: '/summarize',
        description: 'Summarize selected text or document',
        icon: ArrowDown,
        group: 'ai',
        requiresAI: true,
        action: (editor) => {
          const selectedText = editor.state.selection.empty 
            ? content 
            : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
          
          if (!selectedText) {
            onClose()
            return
          }
          
          insertAIContent(createAIPrompts.summarize(selectedText))
        }
      },
      {
        id: 'explain',
        label: '/explain',
        description: 'Explain concept in simpler terms',
        icon: Lightbulb,
        group: 'ai',
        requiresAI: true,
        action: (editor) => {
          const selectedText = editor.state.selection.empty 
            ? getCurrentParagraph()
            : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
          
          if (!selectedText) {
            onClose()
            return
          }
          
          insertAIContent(createAIPrompts.explain(selectedText))
        }
      },
      {
        id: 'expand',
        label: '/expand',
        description: 'Expand with more detail',
        icon: ArrowRight,
        group: 'ai',
        requiresAI: true,
        action: (editor) => {
          const selectedText = editor.state.selection.empty 
            ? getCurrentParagraph()
            : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
          
          if (!selectedText) {
            onClose()
            return
          }
          
          insertAIContent(createAIPrompts.expand(selectedText))
        }
      },
      {
        id: 'simplify',
        label: '/simplify',
        description: 'Make text clearer and more concise',
        icon: Zap,
        group: 'ai',
        requiresAI: true,
        action: (editor) => {
          const selectedText = editor.state.selection.empty 
            ? getCurrentParagraph()
            : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
          
          if (!selectedText) {
            onClose()
            return
          }
          
          insertAIContent(createAIPrompts.simplify(selectedText))
        }
      },
      {
        id: 'counterargument',
        label: '/counterargument',
        description: 'Generate counterargument',
        icon: MessageSquare,
        group: 'ai',
        requiresAI: true,
        action: (editor) => {
          const selectedText = editor.state.selection.empty 
            ? getCurrentParagraph()
            : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
          
          if (!selectedText) {
            onClose()
            return
          }
          
          insertAIContent(createAIPrompts.counterargument(selectedText))
        }
      },
      {
        id: 'studycard',
        label: '/studycard',
        description: 'Create study flashcard',
        icon: BookOpen,
        group: 'ai',
        requiresAI: true,
        action: (editor) => {
          const selectedText = editor.state.selection.empty 
            ? getCurrentParagraph()
            : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
          
          if (!selectedText) {
            onClose()
            return
          }
          
          const prompt = `Create a study flashcard (question and answer format) based on this content:\n\n${selectedText}`
          insertAIContent(prompt)
        }
      },
      {
        id: 'rubric',
        label: '/rubric',
        description: 'Analyze against rubric criteria',
        icon: Target,
        group: 'ai',
        requiresAI: true,
        action: () => {
          const rubricCriteria = window.prompt('Enter rubric criteria or leave empty for general academic assessment:')
          const analysisText = content || getCurrentParagraph()
          
          if (!analysisText) {
            onClose()
            return
          }
          
          const aiPrompt = rubricCriteria 
            ? `Analyze the following text against these rubric criteria: "${rubricCriteria}"\n\nText to analyze:\n${analysisText}`
            : `Provide a general academic assessment of the following text, including strengths and areas for improvement:\n\n${analysisText}`
          
          insertAIContent(aiPrompt)
        }
      }
    ]

    // Filter commands based on query
    const filteredCommands = commands.filter(command =>
      command.label.toLowerCase().includes(query.toLowerCase()) ||
      command.description.toLowerCase().includes(query.toLowerCase())
    )

    const groupedCommands = {
      formatting: filteredCommands.filter(cmd => cmd.group === 'formatting'),
      content: filteredCommands.filter(cmd => cmd.group === 'content'),
      ai: filteredCommands.filter(cmd => cmd.group === 'ai')
    }

    // Flatten for keyboard navigation
    const allFilteredCommands = filteredCommands

    const onKeyDown = useCallback((event: KeyboardEvent): boolean => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((prev) => 
          prev <= 0 ? allFilteredCommands.length - 1 : prev - 1
        )
        return true
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((prev) => 
          prev >= allFilteredCommands.length - 1 ? 0 : prev + 1
        )
        return true
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const selectedCommand = allFilteredCommands[selectedIndex]
        if (selectedCommand) {
          selectedCommand.action(editor)
        }
        return true
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return true
      }

      return false
    }, [selectedIndex, allFilteredCommands, editor, onClose])

    useImperativeHandle(ref, () => ({
      onKeyDown
    }), [onKeyDown])

    // Reset selection when filtered commands change
    useEffect(() => {
      setSelectedIndex(0)
    }, [query])

    if (allFilteredCommands.length === 0) {
      return (
        <Card className="p-3 shadow-lg border-0 bg-card/95 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground">
            No commands found for "{query}"
          </div>
        </Card>
      )
    }

    const renderCommandGroup = (groupName: string, commands: SlashCommand[]) => {
      if (commands.length === 0) return null

      return (
        <div key={groupName} className="mb-2 last:mb-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1 mb-1">
            {groupName}
          </div>
          {commands.map((command) => {
            const globalIndex = allFilteredCommands.indexOf(command)
            return (
              <button
                key={command.id}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-left text-sm rounded-md transition-colors
                  ${globalIndex === selectedIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-foreground'
                  }
                `}
                onClick={() => command.action(editor)}
              >
                <command.icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {command.label}
                    {command.requiresAI && (
                      <GraduationCap className="w-3 h-3 inline-block ml-1 opacity-70" />
                    )}
                  </div>
                  <div className="text-xs opacity-70 truncate">
                    {command.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <Card className="p-2 shadow-lg border-0 bg-card/95 backdrop-blur-sm max-w-sm">
        <div className="max-h-80 overflow-y-auto">
          {renderCommandGroup('Formatting', groupedCommands.formatting)}
          {renderCommandGroup('Content', groupedCommands.content)}
          {renderCommandGroup('AI Assistant', groupedCommands.ai)}
        </div>
        
        {/* Footer hint */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>↑↓ Navigate • ⏎ Select • ⎋ Close</span>
            {allFilteredCommands.some(cmd => cmd.requiresAI) && (
              <span className="flex items-center space-x-1">
                <GraduationCap className="w-3 h-3" />
                <span>AI</span>
              </span>
            )}
          </div>
        </div>
      </Card>
    )
  }
)

SlashCommandsComponent.displayName = 'SlashCommands'

export default SlashCommandsComponent