/**
 * Animation utility hooks for Scholar AI
 * Manages animation states and provides animation utilities
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'

// Hook for managing staggered animations
export function useStaggeredAnimation(itemCount: number, delay: number = 0.1) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev < itemCount - 1) {
          return prev + 1
        }
        clearInterval(timer)
        return prev
      })
    }, delay * 1000)
    
    return () => clearInterval(timer)
  }, [itemCount, delay])
  
  return useCallback((index: number) => index <= currentIndex, [currentIndex])
}

// Hook for text insertion animation
export function useTextInsertion() {
  const [insertions, setInsertions] = useState<Array<{
    id: string
    text: string
    startPos: { x: number; y: number }
    targetPos: { x: number; y: number }
  }>>([])
  
  const createInsertion = useCallback((
    text: string,
    startElement?: HTMLElement,
    targetElement?: HTMLElement
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    
    // Get positions from elements or use defaults
    const startRect = startElement?.getBoundingClientRect()
    const targetRect = targetElement?.getBoundingClientRect()
    
    const startPos = startRect ? {
      x: startRect.left + startRect.width / 2,
      y: startRect.top + startRect.height / 2
    } : { x: window.innerWidth - 200, y: 200 }
    
    const targetPos = targetRect ? {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2
    } : { x: 200, y: 300 }
    
    setInsertions(prev => [...prev, {
      id,
      text,
      startPos,
      targetPos: {
        x: targetPos.x - startPos.x,
        y: targetPos.y - startPos.y
      }
    }])
    
    // Remove after animation completes
    setTimeout(() => {
      setInsertions(prev => prev.filter(item => item.id !== id))
    }, 1000)
    
    return id
  }, [])
  
  return { insertions, createInsertion }
}

// Hook for managing agent thinking states
export function useAgentThinking() {
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set())
  
  const setAgentThinking = useCallback((agentId: string, isThinking: boolean) => {
    setThinkingAgents(prev => {
      const next = new Set(prev)
      if (isThinking) {
        next.add(agentId)
      } else {
        next.delete(agentId)
      }
      return next
    })
  }, [])
  
  const isAgentThinking = useCallback((agentId: string) => {
    return thinkingAgents.has(agentId)
  }, [thinkingAgents])
  
  return { setAgentThinking, isAgentThinking, thinkingAgents }
}

// Hook for smooth scrolling animations
export function useSmoothScroll() {
  const scrollToElement = useCallback((
    element: HTMLElement | string,
    options?: ScrollIntoViewOptions
  ) => {
    const target = typeof element === 'string' 
      ? document.querySelector(element) 
      : element
    
    if (!target) return
    
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
      ...options
    })
  }, [])
  
  const scrollToTop = useCallback((container?: HTMLElement) => {
    const target = container || window
    target.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])
  
  const scrollToBottom = useCallback((container?: HTMLElement) => {
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])
  
  return { scrollToElement, scrollToTop, scrollToBottom }
}

// Hook for mouse-following animations
export function useMouseFollower(enabled: boolean = false) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)
  
  useEffect(() => {
    if (!enabled) return
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [enabled, mouseX, mouseY])
  
  return { x, y }
}

// Hook for intersection-based animations
export function useInViewAnimation(threshold: number = 0.1) {
  const [isInView, setIsInView] = useState(false)
  const [hasBeenInView, setHasBeenInView] = useState(false)
  const ref = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
        if (entry.isIntersecting) {
          setHasBeenInView(true)
        }
      },
      { threshold }
    )
    
    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])
  
  return { ref, isInView, hasBeenInView }
}

// Hook for managing focus mode animations
export function useFocusMode() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const enterFocusMode = useCallback((elementId: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setFocusedElement(elementId)
      setIsTransitioning(false)
    }, 150) // Half of transition duration
  }, [])
  
  const exitFocusMode = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setFocusedElement(null)
      setIsTransitioning(false)
    }, 150)
  }, [])
  
  const isFocused = useCallback((elementId: string) => {
    return focusedElement === elementId
  }, [focusedElement])
  
  const isDimmed = useCallback((elementId: string) => {
    return focusedElement !== null && focusedElement !== elementId
  }, [focusedElement])
  
  return {
    focusedElement,
    isTransitioning,
    enterFocusMode,
    exitFocusMode,
    isFocused,
    isDimmed
  }
}

// Hook for managing loading states with animations
export function useLoadingAnimation(duration: number = 2000) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<number | undefined>(undefined)
  
  const startLoading = useCallback(() => {
    setIsLoading(true)
    setProgress(0)
    
    const increment = 100 / (duration / 50) // Update every 50ms
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          setIsLoading(false)
          return 100
        }
        return prev + increment
      })
    }, 50) as unknown as number
  }, [duration])
  
  const stopLoading = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 200)
  }, [])
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
  
  return { isLoading, progress, startLoading, stopLoading }
}

// Hook for typewriter effect
export function useTypewriter(
  text: string,
  speed: number = 50,
  delay: number = 0
) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    if (!text) return
    
    setDisplayText('')
    setIsComplete(false)
    
    const startTimer = setTimeout(() => {
      setIsTyping(true)
      let index = 0
      
      const typeTimer = setInterval(() => {
        setDisplayText(text.slice(0, index + 1))
        index++
        
        if (index >= text.length) {
          clearInterval(typeTimer)
          setIsTyping(false)
          setIsComplete(true)
        }
      }, speed)
      
      return () => clearInterval(typeTimer)
    }, delay)
    
    return () => clearTimeout(startTimer)
  }, [text, speed, delay])
  
  return { displayText, isTyping, isComplete }
}

// Hook for managing animation queues
export function useAnimationQueue() {
  const [queue, setQueue] = useState<Array<() => Promise<void>>>([])
  const [isRunning, setIsRunning] = useState(false)
  
  const addToQueue = useCallback((animation: () => Promise<void>) => {
    setQueue(prev => [...prev, animation])
  }, [])
  
  const runQueue = useCallback(async () => {
    if (isRunning || queue.length === 0) return
    
    setIsRunning(true)
    
    for (const animation of queue) {
      await animation()
    }
    
    setQueue([])
    setIsRunning(false)
  }, [queue, isRunning])
  
  const clearQueue = useCallback(() => {
    setQueue([])
    setIsRunning(false)
  }, [])
  
  // Auto-run queue when new animations are added
  useEffect(() => {
    if (queue.length > 0 && !isRunning) {
      runQueue()
    }
  }, [queue, isRunning, runQueue])
  
  return { addToQueue, clearQueue, isRunning, queueLength: queue.length }
}

// Hook for parallax scrolling effects
export function useParallax(speed: number = 0.5) {
  const [offsetY, setOffsetY] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.pageYOffset * speed)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])
  
  return offsetY
}

// Hook for managing reduced motion preferences
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReducedMotion
}