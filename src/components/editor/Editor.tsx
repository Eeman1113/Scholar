import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import TurndownService from 'turndown'

// Extensions
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Mathematics from '@tiptap/extension-mathematics'

// Custom components
import SlashCommands from './SlashCommands'
import { BubbleToolbar } from './BubbleToolbar'
import { GhostText } from './GhostText'
import HarperExtension from './extensions/HarperExtension'
import HarperSuggestions from './HarperSuggestions'
import HarperStatus from './HarperStatus'

// Hooks and stores
import { useDocumentStore } from '@/store/documentStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useStreamingChat, createAIPrompts } from '@/hooks/useStreamingChat'
import { useDocumentReadingLevel } from '@/hooks/useDocumentReadingLevel'
import { type HarperLint } from '@/lib/harper/service'

// UI components
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { PenTool, Save, Clock, Sparkles, FileText, EyeOff, Download, Upload } from 'lucide-react'

export interface EditorProps {
  className?: string
}


export function Editor({ className = '' }: EditorProps) {
  const {
    content,
    setContent,
    updateWordCount,
    updateCharacterCount,
    updateReadingLevel,
    title,
    documentType,
    academicLevel
  } = useDocumentStore()

  const { sendMessage } = useStreamingChat()
  const { saveNow, hasUnsavedChanges } = useAutoSave({
    onSave: () => console.log('Auto-saved!')
  })
  useDocumentReadingLevel() // This updates the document store automatically

  // Editor state
  const [isReady, setIsReady] = useState(false)
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const [slashCommandQuery, setSlashCommandQuery] = useState('')
  const [slashCommandRange, setSlashCommandRange] = useState<{ from: number; to: number } | null>(null)
  const [slashCommandPosition, setSlashCommandPosition] = useState<{ top: number; left: number } | null>(null)
  const [showBubbleToolbar, setShowBubbleToolbar] = useState(false)
  const [aiContributionVisible, setAiContributionVisible] = useState(false)
  const [markdownView, setMarkdownView] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  
  // Harper grammar checking state
  const [harperLints, setHarperLints] = useState<HarperLint[]>([])
  const [harperIsLinting, setHarperIsLinting] = useState(false)
  const [harperEnabled, setHarperEnabled] = useState(true)
  const [selectedHarperLint, setSelectedHarperLint] = useState<HarperLint | null>(null)
  const [harperSuggestionsPosition, setHarperSuggestionsPosition] = useState<{ x: number; y: number } | null>(null)

  // Refs
  const slashCommandsRef = useRef<{ onKeyDown: (event: KeyboardEvent) => boolean }>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Markdown converter
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  })

  // Ghost text generator function
  const generateGhostText = async (context: string, position: number): Promise<string> => {
    try {
      const prompt = createAIPrompts.ghostText(context, position)
      const documentContext = {
        fullText: content,
        cursorPosition: position,
        wordCount: editor?.storage.characterCount?.words() || 0,
        documentTitle: title,
        documentType,
        academicLevel
      }

      const response = await sendMessage(prompt, documentContext)
      
      // Return only the first sentence or clause as a suggestion
      const sentences = response.split(/[.!?]+/)
      return sentences[0]?.trim() + (sentences[0]?.trim() ? '...' : '')
    } catch (error) {
      console.error('Failed to generate ghost text:', error)
      return ''
    }
  }

  // Calculate reading level
  const calculateFleschKincaid = (text: string): string => {
    if (!text || text.length < 100) return 'N/A'

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.trim().length > 0)
    const syllables = words.reduce((count, word) => {
      return count + countSyllables(word)
    }, 0)

    if (sentences.length === 0 || words.length === 0) return 'N/A'

    const avgSentenceLength = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length
    
    const grade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59
    
    if (grade < 6) return 'Elementary'
    if (grade < 9) return 'Middle School'
    if (grade < 13) return 'High School'
    if (grade < 16) return 'College'
    return 'Graduate'
  }

  const countSyllables = (word: string): number => {
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g)
    return vowelGroups ? vowelGroups.length : 1
  }

  // Harper event handlers
  const handleHarperLintUpdate = (lints: HarperLint[]) => {
    setHarperLints(lints)
  }

  const handleHarperLintClick = (event: CustomEvent) => {
    const { lint, event: clickEvent } = event.detail
    const rect = (clickEvent.target as HTMLElement).getBoundingClientRect()
    setSelectedHarperLint(lint)
    setHarperSuggestionsPosition({
      x: rect.left,
      y: rect.bottom + window.scrollY + 8
    })
  }

  const closeHarperSuggestions = () => {
    setSelectedHarperLint(null)
    setHarperSuggestionsPosition(null)
  }

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude Link from StarterKit to avoid duplicate
        link: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Enter a heading...'
          }
          return 'Start writing your document... Press "/" for commands'
        },
      }),
      CharacterCount.configure({
        limit: 10000, // Optional limit
      }),
      Highlight.configure({
        multicolor: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Mathematics.configure({
        katexOptions: {},
      }),
      GhostText.configure({
        delay: 2000,
        enabled: true,
        onGhostTextRequest: generateGhostText,
      }),
      HarperExtension.configure({
        enabled: harperEnabled,
        debounceMs: 1500,
        onLintUpdate: handleHarperLintUpdate,
      }),
    ],
    content,
      editorProps: {
        attributes: {
          class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-full',
          spellcheck: 'true',
          contenteditable: 'true',
          tabindex: '0',
        },
        handleKeyDown: (view, event) => {
          // Handle slash commands
          if (showSlashCommands && slashCommandsRef.current) {
            return slashCommandsRef.current.onKeyDown(event)
          }

          // Ensure paste functionality works (Ctrl+V / Cmd+V)
          if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            // Let the default paste behavior handle this
            return false
          }

          // Show slash commands on "/"
          if (event.key === '/' && view.state.selection.empty) {
            event.preventDefault()
            const { from } = view.state.selection
            
            // Insert the "/" character first, then calculate position
            view.dispatch(view.state.tr.insertText('/', from))
            
            // Set up slash command state
            const newRange = { from, to: from + 1 }
            const position = calculateSlashCommandPosition(editor, newRange)
            
            setSlashCommandRange(newRange)
            setSlashCommandPosition(position)
            setSlashCommandQuery('')
            setShowSlashCommands(true)
            return true
          }

          return false
        },
        handlePaste: (_view, _event, _slice) => {
          // Allow default paste behavior
          return false
        },
        handleClick: () => {
          // Close slash commands on click
          if (showSlashCommands) {
            setShowSlashCommands(false)
            setSlashCommandRange(null)
            setSlashCommandPosition(null)
          }
        },
      },
    onCreate: () => {
      setIsReady(true)
    },
    onUpdate: ({ editor: editorInstance }) => {
      const newContent = editorInstance.getHTML()
      const wordCount = editorInstance.storage.characterCount?.words() || 0
      const characterCount = editorInstance.storage.characterCount?.characters() || 0
      const plainText = editorInstance.getText()

      // Update store
      setContent(newContent)
      updateWordCount(wordCount)
      updateCharacterCount(characterCount)
      updateReadingLevel(calculateFleschKincaid(plainText))

      // Handle slash command input
      if (showSlashCommands && slashCommandRange) {
        const { from } = slashCommandRange
        const currentCursor = editorInstance.state.selection.from
        const currentText = editorInstance.state.doc.textBetween(from, currentCursor, ' ')
        
        if (currentText.startsWith('/') && currentCursor >= from) {
          // Update query, removing the leading "/"
          setSlashCommandQuery(currentText.slice(1))
          
          // Update position based on current cursor position
          const newRange = { from, to: currentCursor }
          const position = calculateSlashCommandPosition(editor, newRange)
          setSlashCommandPosition(position)
        } else {
          // Hide slash commands if the text no longer starts with "/"
          setShowSlashCommands(false)
          setSlashCommandRange(null)
          setSlashCommandPosition(null)
        }
      }
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      const { empty, from, to } = editorInstance.state.selection
      
      // Show/hide bubble toolbar based on selection
      if (!empty && to - from > 0) {
        setShowBubbleToolbar(true)
      } else {
        setShowBubbleToolbar(false)
      }

      // Hide slash commands if selection moved away from command
      if (showSlashCommands && slashCommandRange) {
        const { from: rangeFrom } = slashCommandRange
        // Allow movement within the slash command text
        const maxPosition = rangeFrom + slashCommandQuery.length + 1
        if (from < rangeFrom || from > maxPosition) {
          setShowSlashCommands(false)
          setSlashCommandRange(null)
          setSlashCommandPosition(null)
        }
      }
    },
  })

  // Sync content with store on mount
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor]) // Only run when editor is ready

  // Ensure editor can handle paste operations
  useEffect(() => {
    if (editor) {
      // Add paste event listener to ensure it's working
      const handlePasteEvent = (e: ClipboardEvent) => {
        if (!editor.isFocused) return
        
        // Let TipTap handle the paste
        e.stopPropagation()
      }
      
      const editorElement = editor.view.dom
      editorElement.addEventListener('paste', handlePasteEvent)
      
      return () => {
        editorElement.removeEventListener('paste', handlePasteEvent)
      }
    }
  }, [editor])

  // Sync markdown content when editor content changes (but not in markdown view)
  useEffect(() => {
    if (editor && !markdownView) {
      const html = editor.getHTML()
      const markdown = convertToMarkdown(html)
      if (markdown !== markdownContent) {
        setMarkdownContent(markdown)
      }
    }
  }, [content, markdownView]) // Update when content changes but not when in markdown view

  // Set up Harper DOM event listener
  useEffect(() => {
    const handleEvent = (event: Event) => {
      handleHarperLintClick(event as CustomEvent)
    }
    
    document.addEventListener('harperLintClick', handleEvent)
    
    return () => {
      document.removeEventListener('harperLintClick', handleEvent)
    }
  }, [])

  // Sync Harper state with extension storage
  useEffect(() => {
    if (editor) {
      const harperExtension = editor.extensionManager.extensions.find(ext => ext.name === 'harper')
      if (harperExtension) {
        setHarperEnabled(harperExtension.options.enabled)
        setHarperIsLinting(harperExtension.storage.isLinting)
      }
    }
  }, [editor, editor?.state.doc])

  const handleManualSave = () => {
    saveNow()
  }

  const toggleAiContributions = () => {
    setAiContributionVisible(!aiContributionVisible)
  }

  // Markdown functions
  const convertToMarkdown = (html: string): string => {
    return turndownService.turndown(html)
  }

  const toggleMarkdownView = () => {
    if (!markdownView) {
      // Switching to markdown view
      const html = editor?.getHTML() || ''
      const markdown = convertToMarkdown(html)
      setMarkdownContent(markdown)
    } else {
      // Switching back to rich text view
      if (editor && markdownContent !== convertToMarkdown(editor.getHTML())) {
        // Content has changed, update the editor
        editor.commands.setContent(markdownContent)
      }
    }
    setMarkdownView(!markdownView)
  }

  const handleMarkdownContentChange = (value: string) => {
    setMarkdownContent(value)
  }

  const handleMarkdownKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const textarea = e.target as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = markdownContent.substring(start, end)
      
      let newText = markdownContent
      let newCursorPos = start

      switch (e.key) {
        case 'b': // Bold
          e.preventDefault()
          if (selectedText) {
            newText = markdownContent.substring(0, start) + `**${selectedText}**` + markdownContent.substring(end)
            newCursorPos = end + 4
          } else {
            newText = markdownContent.substring(0, start) + '****' + markdownContent.substring(end)
            newCursorPos = start + 2
          }
          break
          
        case 'i': // Italic
          e.preventDefault()
          if (selectedText) {
            newText = markdownContent.substring(0, start) + `*${selectedText}*` + markdownContent.substring(end)
            newCursorPos = end + 2
          } else {
            newText = markdownContent.substring(0, start) + '**' + markdownContent.substring(end)
            newCursorPos = start + 1
          }
          break
          
        case 'k': // Link
          e.preventDefault()
          if (selectedText) {
            newText = markdownContent.substring(0, start) + `[${selectedText}](url)` + markdownContent.substring(end)
            newCursorPos = end + selectedText.length + 3
          } else {
            newText = markdownContent.substring(0, start) + '[text](url)' + markdownContent.substring(end)
            newCursorPos = start + 1
          }
          break
          
        default:
          return
      }
      
      setMarkdownContent(newText)
      
      // Set cursor position after state update
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  const exportAsMarkdown = () => {
    const html = editor?.getHTML() || ''
    const markdown = convertToMarkdown(html)
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importMarkdown = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === 'text/markdown' || file.name.endsWith('.md'))) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const markdown = e.target?.result as string
        if (editor) {
          editor.commands.setContent(markdown)
          setContent(editor.getHTML())
        }
      }
      reader.readAsText(file)
    }
    // Reset the input
    event.target.value = ''
  }

  // Calculate position for slash commands popup
  const calculateSlashCommandPosition = (editor: any, range: { from: number; to: number }) => {
    try {
      const { view } = editor
      const { from } = range
      
      // Get the DOM coordinates of the cursor position
      const coords = view.coordsAtPos(from)
      const editorRect = view.dom.getBoundingClientRect()
      
      // Calculate position relative to editor
      const top = coords.top - editorRect.top + 25 // Add some offset below the cursor
      const left = coords.left - editorRect.left
      
      return { top, left }
    } catch (error) {
      console.warn('Failed to calculate slash command position:', error)
      return { top: 0, left: 0 }
    }
  }

  if (!editor || !isReady) {
    return (
      <div className={`h-full flex items-center justify-center bg-background ${className}`}>
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center space-x-2">
          <PenTool className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {markdownView ? 'Markdown View' : 'Rich Text Editor'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Markdown Toggle */}
          <Button
            variant={markdownView ? "default" : "ghost"}
            size="sm"
            onClick={toggleMarkdownView}
            className="text-xs"
          >
            {markdownView ? (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Rich Text
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 mr-1" />
                Markdown
              </>
            )}
          </Button>

          {/* Markdown Import/Export */}
          {markdownView && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={importMarkdown}
                className="text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                Import
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportAsMarkdown}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </>
          )}

          {/* Harper Grammar Check Toggle */}
          {!markdownView && (
            <HarperStatus
              editor={editor}
              lints={harperLints}
              isLinting={harperIsLinting}
              isEnabled={harperEnabled}
            />
          )}

          {/* AI Contribution Toggle */}
          {!markdownView && (
            <Button
              variant={aiContributionVisible ? "default" : "ghost"}
              size="sm"
              onClick={toggleAiContributions}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI Tracking
            </Button>
          )}

          {/* Save Status */}
          {hasUnsavedChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSave}
              className="text-xs text-orange-600 hover:text-orange-700"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          )}

          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Auto-save
          </div>
        </div>
      </div>

      {/* Hidden file input for markdown import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Editor Container */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-y-auto">
          {markdownView ? (
            /* Markdown Editor View */
            <div className="h-full flex">
              {/* Markdown Input */}
              <div className="w-1/2 h-full border-r border-border">
                <div className="h-full p-4 overflow-y-auto">
                  <textarea
                    value={markdownContent}
                    onChange={(e) => handleMarkdownContentChange(e.target.value)}
                    onKeyDown={handleMarkdownKeyDown}
                    placeholder="Enter your markdown content here..."
                    className="w-full h-full resize-none bg-transparent border-none outline-none font-mono text-sm leading-relaxed"
                    spellCheck={true}
                  />
                </div>
              </div>
              
              {/* Markdown Preview */}
              <div className="w-1/2 h-full overflow-y-auto">
                <div className="p-4">
                  <MarkdownRenderer content={markdownContent} />
                </div>
              </div>
            </div>
          ) : (
            /* Rich Text Editor View */
            <div className="h-full overflow-y-auto">
              <EditorContent
                editor={editor}
                className={`min-h-full w-full p-4 focus-within:outline-none ${
                  aiContributionVisible ? 'ai-contribution-overlay' : ''
                }`}
                style={{ userSelect: 'text' }}
              />
            </div>
          )}

          {/* Rich Text Editor Overlays */}
          {!markdownView && (
            <>
              {/* Slash Commands Overlay */}
              {showSlashCommands && slashCommandRange && slashCommandPosition && (
                <div className="absolute z-50" style={{ 
                  top: `${slashCommandPosition.top}px`, 
                  left: `${slashCommandPosition.left}px` 
                }}>
                  <SlashCommands
                    ref={slashCommandsRef}
                    editor={editor}
                    query={slashCommandQuery}
                    range={slashCommandRange}
                    onClose={() => {
                      setShowSlashCommands(false)
                      setSlashCommandRange(null)
                      setSlashCommandPosition(null)
                      editor.commands.focus()
                    }}
                  />
                </div>
              )}

              {/* Bubble Toolbar */}
              <BubbleToolbar
                editor={editor}
                visible={showBubbleToolbar}
              />

              {/* Harper Grammar Suggestions */}
              <HarperSuggestions
                editor={editor}
                lint={selectedHarperLint}
                position={harperSuggestionsPosition}
                onClose={closeHarperSuggestions}
              />
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            {markdownView ? (
              <>
                <span>{markdownContent.split(/\s+/).filter(w => w.length > 0).length} words</span>
                <span>{markdownContent.length} characters</span>
                <span>Format: Markdown</span>
              </>
            ) : (
              <>
                <span>{editor.storage.characterCount?.words() || 0} words</span>
                <span>{editor.storage.characterCount?.characters() || 0} characters</span>
                <span>Reading: {calculateFleschKincaid(editor.getText())}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {markdownView ? (
              <>
                <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">
                  Ctrl+B
                </kbd>
                <span>**bold**</span>
                
                <span className="text-border">•</span>
                
                <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">
                  Ctrl+I
                </kbd>
                <span>*italic*</span>
              </>
            ) : (
              <>
                <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">
                  /
                </kbd>
                <span>for commands</span>
                
                <span className="text-border">•</span>
                
                <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">
                  Tab
                </kbd>
                <span>accept AI suggestion</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}