import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface GhostTextOptions {
  delay: number
  onGhostTextRequest: (context: string, position: number) => Promise<string>
  enabled: boolean
}

export interface GhostTextState {
  decorations: DecorationSet
  isGenerating: boolean
  ghostText: string
  position: number
}

const GhostTextPluginKey = new PluginKey<GhostTextState>('ghostText')

export const GhostText = Extension.create<GhostTextOptions>({
  name: 'ghostText',

  addOptions() {
    return {
      delay: 2000, // 2 seconds
      onGhostTextRequest: async () => '',
      enabled: true,
    }
  },

  addProseMirrorPlugins() {
    const extension = this
    let timeout: number | null = null
    let abortController: AbortController | null = null

    return [
      new Plugin<GhostTextState>({
        key: GhostTextPluginKey,
        
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              isGenerating: false,
              ghostText: '',
              position: 0,
            }
          },

          apply(tr, prevState) {
            let { decorations, isGenerating, ghostText, position } = prevState

            // Map decorations through transaction
            decorations = decorations.map(tr.mapping, tr.doc)

            // Clear ghost text if document changed (user is typing)
            if (tr.docChanged) {
              decorations = DecorationSet.empty
              ghostText = ''
              isGenerating = false

              // Clear existing timeout
              if (timeout) {
                window.clearTimeout(timeout)
                timeout = null
              }

              // Abort ongoing generation
              if (abortController) {
                abortController.abort()
                abortController = null
              }

              // Only start new timeout if enabled and not in the middle of generation
              if (extension.options.enabled && !isGenerating) {
                const currentPos = tr.selection.from
                
                timeout = window.setTimeout(async () => {
                  if (!extension.options.enabled) return

                  try {
                    // Set generating state
                    isGenerating = true
                    abortController = new AbortController()

                    // Get context around cursor
                    const doc = tr.doc
                    const contextStart = Math.max(0, currentPos - 500)
                    const contextEnd = Math.min(doc.content.size, currentPos + 100)
                    const context = doc.textBetween(contextStart, contextEnd, ' ')

                    // Generate ghost text
                    const suggestion = await extension.options.onGhostTextRequest(context, currentPos)
                    
                    if (suggestion && suggestion.trim() && !abortController?.signal.aborted) {
                      // Create decoration for ghost text
                      const ghostDecoration = Decoration.widget(
                        currentPos,
                        () => {
                          const span = document.createElement('span')
                          span.className = 'ghost-text'
                          span.style.cssText = `
                            color: hsl(var(--muted-foreground));
                            opacity: 0.6;
                            font-style: italic;
                            pointer-events: none;
                            user-select: none;
                          `
                          span.textContent = suggestion
                          return span
                        },
                        {
                          side: 1,
                          key: 'ghost-text-widget'
                        }
                      )

                      decorations = DecorationSet.create(doc, [ghostDecoration])
                      ghostText = suggestion
                      position = currentPos
                    }
                  } catch (error) {
                    if (!abortController?.signal.aborted) {
                      console.error('Failed to generate ghost text:', error)
                    }
                  } finally {
                    isGenerating = false
                    abortController = null
                  }

                  // Trigger view update
                  if (extension.editor?.view) {
                    extension.editor.view.dispatch(
                      extension.editor.view.state.tr.setMeta(GhostTextPluginKey, {
                        decorations,
                        isGenerating: false,
                        ghostText,
                        position
                      })
                    )
                  }
                }, extension.options.delay)
              }
            }

            // Handle meta transactions (for updating decorations from async operations)
            const meta = tr.getMeta(GhostTextPluginKey)
            if (meta) {
              return {
                decorations: meta.decorations || decorations,
                isGenerating: meta.isGenerating ?? isGenerating,
                ghostText: meta.ghostText ?? ghostText,
                position: meta.position ?? position,
              }
            }

            return {
              decorations,
              isGenerating,
              ghostText,
              position,
            }
          }
        },

        props: {
          decorations(state) {
            const pluginState = this.getState(state)
            return pluginState ? pluginState.decorations : DecorationSet.empty
          },

          handleKeyDown(view, event) {
            const state = this.getState(view.state)
            
            // Accept ghost text with Tab
            if (event.key === 'Tab' && state?.ghostText && state.decorations.find().length > 0) {
              event.preventDefault()
              
              // Insert the ghost text
              const tr = view.state.tr.insertText(state.ghostText, state.position)
              view.dispatch(tr)
              
              return true
            }

            // Clear ghost text on Escape or other navigation keys
            if (['Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
              const currentState = this.getState(view.state)
              if (currentState && currentState.decorations.find().length > 0) {
                view.dispatch(
                  view.state.tr.setMeta(GhostTextPluginKey, {
                    decorations: DecorationSet.empty,
                    isGenerating: false,
                    ghostText: '',
                    position: 0,
                  })
                )
              }
            }

            return false
          },
        },

        view() {
          return {
            destroy() {
              // Cleanup
              if (timeout) {
                window.clearTimeout(timeout)
              }
              if (abortController) {
                abortController.abort()
              }
            }
          }
        }
      })
    ]
  },

})