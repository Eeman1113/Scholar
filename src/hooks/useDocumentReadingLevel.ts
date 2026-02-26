import { useEffect } from 'react'
import { useReadingLevel, type ReadingLevelStats } from './useReadingLevel'
import { useDocumentStore } from '@/store/documentStore'
import { config } from '@/lib/config'

/**
 * Hook that automatically calculates and updates reading level for the current document
 */
export function useDocumentReadingLevel(): ReadingLevelStats & {
  updateReadingLevel: () => void
} {
  const { content, updateReadingLevel: updateStoreReadingLevel } = useDocumentStore()
  const readingLevelStats = useReadingLevel(content)

  // Update the document store whenever reading level changes
  useEffect(() => {
    if (content.length >= config.editor.readingLevel.minTextLength) {
      updateStoreReadingLevel(readingLevelStats.gradeLevel)
    }
  }, [
    readingLevelStats.gradeLevel, 
    content.length, 
    updateStoreReadingLevel
  ])

  const updateReadingLevel = () => {
    if (content.length >= config.editor.readingLevel.minTextLength) {
      updateStoreReadingLevel(readingLevelStats.gradeLevel)
    }
  }

  return {
    ...readingLevelStats,
    updateReadingLevel
  }
}