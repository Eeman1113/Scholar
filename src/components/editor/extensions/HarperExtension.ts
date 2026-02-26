import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { harperService, type HarperLint } from '@/lib/harper/service'

export interface HarperExtensionOptions {
  enabled: boolean
  debounceMs: number
  onLintUpdate?: (lints: HarperLint[]) => void
}

export interface HarperExtensionStorage {
  lints: HarperLint[]
  isLinting: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    harper: {
      /**
       * Toggle Harper grammar checking
       */
      toggleHarper: () => ReturnType
      /**
       * Apply a Harper suggestion
       */
      applyHarperSuggestion: (lint: HarperLint, suggestionIndex: number) => ReturnType
      /**
       * Ignore a Harper lint
       */
      ignoreHarperLint: (lint: HarperLint) => ReturnType
      /**
       * Add word to dictionary
       */
      addWordToHarperDictionary: (word: string) => ReturnType
    }
  }
}

export const HarperExtensionKey = new PluginKey('harper')

export const HarperExtension = Extension.create<HarperExtensionOptions, HarperExtensionStorage>({
  name: 'harper',

  addOptions() {
    return {
      enabled: true,
      debounceMs: 1000,
      onLintUpdate: undefined,
    }
  },

  addStorage() {
    return {
      lints: [],
      isLinting: false,
    }
  },

  addCommands() {
    return {
      toggleHarper:
        () =>
        ({ commands }) => {
          const enabled = !this.options.enabled
          this.options.enabled = enabled
          harperService.setEnabled(enabled)
          
          // Clear decorations if disabled
          if (!enabled) {
            this.storage.lints = []
            this.options.onLintUpdate?.(this.storage.lints)
          }
          
          return commands.focus()
        },
      
      applyHarperSuggestion:
        (lint: HarperLint, suggestionIndex: number) =>
        ({ editor, tr }) => {
          const suggestion = lint.suggestions[suggestionIndex]
          if (!suggestion) return false

          const { from, to } = lint.range
          
          // Apply the suggestion
          tr.replaceWith(from, to, editor.schema.text(suggestion.text))
          
          // Remove this lint from storage
          this.storage.lints = this.storage.lints.filter(l => l.id !== lint.id)
          this.options.onLintUpdate?.(this.storage.lints)
          
          return true
        },
      
      ignoreHarperLint:
        (lint: HarperLint) =>
        ({ editor }) => {
          const text = editor.getText()
          harperService.ignoreLint(text, lint)
          
          // Remove this lint from storage
          this.storage.lints = this.storage.lints.filter(l => l.id !== lint.id)
          this.options.onLintUpdate?.(this.storage.lints)
          
          return true
        },
      
      addWordToHarperDictionary:
        (word: string) =>
        () => {
          harperService.addWordToDictionary(word)
          
          // Remove lints for this word
          this.storage.lints = this.storage.lints.filter(lint => {
            const lintedText = lint.range.from !== undefined && lint.range.to !== undefined
              ? this.editor.state.doc.textBetween(lint.range.from, lint.range.to)
              : ''
            return lintedText.toLowerCase() !== word.toLowerCase()
          })
          
          this.options.onLintUpdate?.(this.storage.lints)
          
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    return [
      new Plugin({
        key: HarperExtensionKey,
        
        state: {
          init: () => DecorationSet.empty,
          
          apply: (tr, decorationSet, _oldState, newState) => {
            // Clear debounce timer on transaction
            if (debounceTimer) {
              clearTimeout(debounceTimer)
              debounceTimer = null
            }

            // If content changed, schedule new linting
            if (tr.docChanged && this.options.enabled) {
              this.storage.isLinting = true
              
              debounceTimer = setTimeout(async () => {
                try {
                  const text = newState.doc.textContent
                  const lints = await harperService.lintText(text)
                  
                  // Update storage
                  this.storage.lints = lints
                  this.storage.isLinting = false
                  this.options.onLintUpdate?.(lints)
                  
                  // Trigger view update to show new decorations
                  const view = this.editor?.view
                  if (view) {
                    view.dispatch(view.state.tr)
                  }
                } catch (error) {
                  console.warn('Harper linting error:', error)
                  this.storage.isLinting = false
                }
              }, this.options.debounceMs)
            }

            // Map existing decorations through the transaction
            if (tr.docChanged) {
              decorationSet = decorationSet.map(tr.mapping, tr.doc)
            }

            // Create new decorations based on current lints
            const decorations: Decoration[] = []
            
            for (const lint of this.storage.lints) {
              const { from, to } = lint.range
              
              // Ensure the range is valid for the current document
              if (from >= 0 && to <= newState.doc.content.size && from < to) {
                const decoration = Decoration.inline(from, to, {
                  class: `harper-lint harper-lint--${lint.severity}`,
                  'data-harper-lint-id': lint.id,
                  'data-harper-message': lint.message,
                  title: lint.message,
                }, {
                  inclusiveStart: false,
                  inclusiveEnd: false,
                })
                
                decorations.push(decoration)
              }
            }

            return DecorationSet.create(newState.doc, decorations)
          },
        },

        props: {
          decorations: (state) => {
            return HarperExtensionKey.getState(state)
          },
          
          handleClick: (_view, _pos, event) => {
            // Handle clicks on Harper decorations
            const target = event.target as HTMLElement
            
            if (target && target.classList.contains('harper-lint')) {
              const lintId = target.getAttribute('data-harper-lint-id')
              const lint = this.storage.lints.find(l => l.id === lintId)
              
              if (lint) {
                // Emit custom event for lint click using DOM event
                const customEvent = new CustomEvent('harperLintClick', {
                  detail: { lint, pos: _pos, event }
                })
                document.dispatchEvent(customEvent)
                return true
              }
            }
            
            return false
          },
        },
      }),
    ]
  },
})

export default HarperExtension