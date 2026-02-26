import { useMemo, useState, useEffect } from 'react'

export interface ReadingLevelStats {
  fleschKincaidGrade: number
  fleschReadingEase: number
  gradeLevel: string
  readabilityLevel: string
  syllableCount: number
  sentenceCount: number
  wordCount: number
}

export function useReadingLevel(text: string): ReadingLevelStats {
  return useMemo(() => {
    if (!text || text.trim().length < 50) {
      return {
        fleschKincaidGrade: 0,
        fleschReadingEase: 0,
        gradeLevel: 'N/A',
        readabilityLevel: 'Insufficient text',
        syllableCount: 0,
        sentenceCount: 0,
        wordCount: 0
      }
    }

    // Clean text for analysis
    const cleanText = text.replace(/[^\w\s.!?;:]/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Count sentences
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const sentenceCount = sentences.length
    
    // Count words
    const words = cleanText.split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    
    // Count syllables
    const syllableCount = words.reduce((count, word) => count + countSyllables(word), 0)
    
    if (sentenceCount === 0 || wordCount === 0 || syllableCount === 0) {
      return {
        fleschKincaidGrade: 0,
        fleschReadingEase: 0,
        gradeLevel: 'N/A',
        readabilityLevel: 'Unable to calculate',
        syllableCount: 0,
        sentenceCount: 0,
        wordCount: 0
      }
    }
    
    // Calculate averages
    const avgSentenceLength = wordCount / sentenceCount
    const avgSyllablesPerWord = syllableCount / wordCount
    
    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59
    
    // Flesch Reading Ease
    const fleschReadingEase = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    
    // Convert to grade level and readability descriptions
    const gradeLevel = getGradeLevel(fleschKincaidGrade)
    const readabilityLevel = getReadabilityLevel(fleschReadingEase)
    
    return {
      fleschKincaidGrade: Math.max(0, Math.round(fleschKincaidGrade * 10) / 10),
      fleschReadingEase: Math.max(0, Math.min(100, Math.round(fleschReadingEase * 10) / 10)),
      gradeLevel,
      readabilityLevel,
      syllableCount,
      sentenceCount,
      wordCount
    }
  }, [text])
}

function countSyllables(word: string): number {
  if (word.length <= 3) return 1
  
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length === 0) return 0
  
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g) || []
  let syllables = vowelGroups.length
  
  // Adjust for silent 'e' at the end
  if (word.endsWith('e') && syllables > 1) {
    syllables--
  }
  
  // Adjust for 'le' at the end (like "table", "simple")
  if (word.match(/[^aeiou]le$/)) {
    syllables++
  }
  
  // Minimum of 1 syllable per word
  return Math.max(1, syllables)
}

function getGradeLevel(grade: number): string {
  if (grade < 1) return 'Pre-K'
  if (grade < 2) return 'Grade 1'
  if (grade < 3) return 'Grade 2'
  if (grade < 4) return 'Grade 3'
  if (grade < 5) return 'Grade 4'
  if (grade < 6) return 'Grade 5'
  if (grade < 7) return 'Grade 6'
  if (grade < 8) return 'Grade 7'
  if (grade < 9) return 'Grade 8'
  if (grade < 10) return 'Grade 9'
  if (grade < 11) return 'Grade 10'
  if (grade < 12) return 'Grade 11'
  if (grade < 13) return 'Grade 12'
  if (grade < 16) return 'College Level'
  return 'Graduate Level'
}

function getReadabilityLevel(score: number): string {
  if (score >= 90) return 'Very Easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly Easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly Difficult'
  if (score >= 30) return 'Difficult'
  return 'Very Difficult'
}

// Hook for real-time reading level updates with debouncing
export function useDebouncedReadingLevel(text: string, delay: number = 1000): ReadingLevelStats {
  const [debouncedText, setDebouncedText] = useState(text)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(text)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [text, delay])

  return useReadingLevel(debouncedText)
}

// Additional utility functions
export function getReadingTimeEstimate(wordCount: number, wpm: number = 200): { minutes: number; seconds: number } {
  const totalMinutes = wordCount / wpm
  const minutes = Math.floor(totalMinutes)
  const seconds = Math.round((totalMinutes - minutes) * 60)
  
  return { minutes, seconds }
}

export function getTextComplexityMetrics(text: string) {
  const stats = useReadingLevel(text)
  
  return {
    ...stats,
    complexity: stats.fleschKincaidGrade > 12 ? 'High' : 
                stats.fleschKincaidGrade > 8 ? 'Medium' : 'Low',
    recommendation: getRecommendation(stats)
  }
}

function getRecommendation(stats: ReadingLevelStats): string {
  if (stats.fleschKincaidGrade > 16) {
    return 'Consider simplifying sentence structure and using shorter words'
  }
  if (stats.fleschKincaidGrade < 6) {
    return 'Text may be too simple for advanced readers'
  }
  if (stats.fleschReadingEase < 30) {
    return 'Text is very difficult - consider breaking up long sentences'
  }
  if (stats.fleschReadingEase > 90) {
    return 'Text is very easy to read'
  }
  return 'Reading level is appropriate'
}