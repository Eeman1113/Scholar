import { useEffect, useRef, useCallback } from 'react'
import { useDocumentStore } from '@/store/documentStore'

export interface UseAutoSaveOptions {
  interval?: number // milliseconds, default 30 seconds
  enabled?: boolean
  onSave?: () => void
  onError?: (error: Error) => void
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    interval = 30000, // 30 seconds
    enabled = true,
    onSave,
    onError
  } = options

  const content = useDocumentStore(state => state.content)
  const autoSave = useDocumentStore(state => state.autoSave)
  const triggerAutoSave = useDocumentStore(state => state.triggerAutoSave)
  const lastSavedContentRef = useRef<string>('')
  const timeoutRef = useRef<number | undefined>(undefined)

  const performSave = useCallback(async () => {
    try {
      if (!autoSave || !enabled) return

      // Only save if content has actually changed
      if (content === lastSavedContentRef.current) return
      
      // Update last saved content
      lastSavedContentRef.current = content
      
      // Trigger the store's auto-save
      triggerAutoSave()
      
      // Call the optional onSave callback
      onSave?.()
      
      console.log('Auto-saved document at', new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Auto-save failed:', error)
      onError?.(error instanceof Error ? error : new Error('Auto-save failed'))
    }
  }, [content, autoSave, enabled, triggerAutoSave, onSave, onError])

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !autoSave) return

    // Clear existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = window.setTimeout(performSave, interval)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [content, interval, enabled, autoSave, performSave])

  // Manual save function
  const saveNow = useCallback(() => {
    performSave()
  }, [performSave])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (content !== lastSavedContentRef.current) {
        performSave()
        // Show confirmation if there are unsaved changes
        e.preventDefault()
        return e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [content, performSave])

  return {
    saveNow,
    isAutoSaveEnabled: autoSave && enabled,
    hasUnsavedChanges: content !== lastSavedContentRef.current
  }
}

// Hook for debounced saves (useful for rapid typing)
export function useDebouncedAutoSave(options: UseAutoSaveOptions & { debounceMs?: number } = {}) {
  const { debounceMs = 2000, ...autoSaveOptions } = options
  const content = useDocumentStore(state => state.content)
  const debounceTimeoutRef = useRef<number | undefined>(undefined)
  
  const { saveNow, isAutoSaveEnabled, hasUnsavedChanges } = useAutoSave({
    ...autoSaveOptions,
    enabled: false // We'll handle the timing ourselves
  })

  // Debounced save effect
  useEffect(() => {
    if (!isAutoSaveEnabled) return

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current)
    }

    // Set new debounced timeout
    debounceTimeoutRef.current = window.setTimeout(() => {
      if (hasUnsavedChanges) {
        saveNow()
      }
    }, debounceMs)

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [content, debounceMs, isAutoSaveEnabled, hasUnsavedChanges, saveNow])

  return {
    saveNow,
    isAutoSaveEnabled,
    hasUnsavedChanges
  }
}