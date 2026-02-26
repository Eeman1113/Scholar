/**
 * Animated component wrappers using Framer Motion
 * Pre-configured components with polished micro-animations
 */

import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HTMLMotionProps, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  buttonVariants, 
  primaryButtonVariants, 
  agentAvatarVariants,
  messageVariants,
  modalVariants,
  quickActionItemVariants,
  TIMING,
  EASING
} from '@/lib/animations'

// Animated Button with micro-interactions
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
  children: React.ReactNode
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, variant = 'secondary', isLoading = false, ...props }, ref) => {
    const variants = variant === 'primary' ? primaryButtonVariants : buttonVariants
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variant === 'primary' && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          variant === 'secondary' && "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
          variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
          "px-4 py-2",
          className
        )}
        variants={variants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        disabled={isLoading}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <motion.div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Loading...</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    )
  }
)
AnimatedButton.displayName = "AnimatedButton"

// Animated Agent Avatar with thinking states
interface AnimatedAgentAvatarProps {
  isSelected?: boolean
  isThinking?: boolean
  isActive?: boolean
  color: string
  icon: React.ComponentType<{ className?: string }>
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

export function AnimatedAgentAvatar({
  isSelected = false,
  isThinking = false,
  isActive = false,
  color,
  icon: Icon,
  size = 'md',
  onClick,
  className
}: AnimatedAgentAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  return (
    <motion.div
      className={cn("relative cursor-pointer", className)}
      variants={agentAvatarVariants}
      initial="initial"
      animate={isThinking ? "thinking" : isSelected ? "selected" : "animate"}
      whileHover="hover"
      onClick={onClick}
      layout
    >
      <div className={cn(
        sizeClasses[size],
        color,
        "rounded-full flex items-center justify-center relative overflow-hidden"
      )}>
        <Icon className={cn(iconSizes[size], "text-white relative z-10")} />
        
        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            />
          )}
        </AnimatePresence>
        
        {/* Thinking pulse rings */}
        <AnimatePresence>
          {isThinking && (
            <>
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0 border-2 border-blue-400 rounded-full"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.6, 0.3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.4,
                    ease: EASING.gentle
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Animated Message Bubble
interface AnimatedMessageProps {
  children: React.ReactNode
  role: 'user' | 'assistant'
  isStreaming?: boolean
  className?: string
}

export function AnimatedMessage({ 
  children, 
  role, 
  isStreaming = false, 
  className 
}: AnimatedMessageProps) {
  return (
    <motion.div
      className={cn(
        "relative",
        role === 'user' ? 'ml-8' : 'mr-8',
        className
      )}
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      <div className={cn(
        "rounded-lg p-4 relative overflow-hidden",
        role === 'user' 
          ? 'bg-primary/10 border border-primary/20' 
          : 'bg-muted/50 border border-border'
      )}>
        {/* Streaming shimmer effect */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          )}
        </AnimatePresence>
        
        {children}
        
        {/* Streaming cursor */}
        {isStreaming && (
          <motion.span
            className="inline-block w-2 h-4 bg-primary ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: EASING.gentle
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

// Animated Modal/Dialog
interface AnimatedModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  className
}: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Content */}
          <motion.div
            className={cn("relative z-10 bg-background border border-border rounded-lg shadow-lg", className)}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Animated Slide-in Panel
interface AnimatedSlidePanelProps {
  isOpen: boolean
  children: React.ReactNode
  side?: 'left' | 'right'
  className?: string
}

export function AnimatedSlidePanel({
  isOpen,
  children,
  side = 'right',
  className
}: AnimatedSlidePanelProps) {
  const variants: Variants = {
    initial: {
      x: side === 'right' ? '100%' : '-100%',
      opacity: 0
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: TIMING.normal,
        ease: EASING.ease
      }
    },
    exit: {
      x: side === 'right' ? '100%' : '-100%',
      opacity: 0,
      transition: {
        duration: TIMING.fast,
        ease: EASING.sharp
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed inset-y-0 z-40 bg-background border-l border-border shadow-xl",
            side === 'right' ? 'right-0' : 'left-0',
            className
          )}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Animated Quick Action Item
interface AnimatedQuickActionProps extends HTMLMotionProps<"button"> {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
  iconColor?: string
}

export const AnimatedQuickAction = forwardRef<HTMLButtonElement, AnimatedQuickActionProps>(
  ({ icon: Icon, label, description, iconColor = "text-primary", className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "flex items-start space-x-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 text-left w-full transition-colors",
          className
        )}
        variants={quickActionItemVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        <motion.div
          className="flex-shrink-0"
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ duration: TIMING.fast, ease: EASING.ease }}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </motion.div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{label}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </motion.button>
    )
  }
)
AnimatedQuickAction.displayName = "AnimatedQuickAction"

// Animated Text Insertion Effect
interface AnimatedTextInsertionProps {
  text: string
  onComplete?: () => void
  startPosition?: { x: number; y: number }
  targetPosition?: { x: number; y: number }
}

export function AnimatedTextInsertion({
  text,
  onComplete,
  startPosition = { x: 0, y: 0 },
  targetPosition = { x: -200, y: -100 }
}: AnimatedTextInsertionProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50 pointer-events-none bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium shadow-lg"
        style={{
          left: startPosition.x,
          top: startPosition.y
        }}
        initial={{ 
          scale: 1, 
          opacity: 1,
          x: 0,
          y: 0 
        }}
        animate={{
          scale: 0.8,
          opacity: 0.7,
          x: targetPosition.x,
          y: targetPosition.y
        }}
        exit={{
          scale: 0,
          opacity: 0
        }}
        transition={{
          duration: TIMING.slow,
          ease: EASING.ease
        }}
        onAnimationComplete={() => {
          onComplete?.()
        }}
      >
        {text.slice(0, 50)}...
      </motion.div>
    </AnimatePresence>
  )
}

// Animated Number Counter
interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ 
  value, 
  duration = TIMING.gentle, 
  className 
}: AnimatedCounterProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration }}
      key={value}
    >
      <motion.span
        initial={{ scale: 1.2, color: "#3b82f6" }}
        animate={{ scale: 1, color: "inherit" }}
        transition={{ duration: TIMING.fast }}
      >
        {value}
      </motion.span>
    </motion.span>
  )
}

// Animated Progress Bar
interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  showLabel = false
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className={cn("relative", className)}>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: TIMING.gentle,
            ease: EASING.ease
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </div>
      {showLabel && (
        <motion.div
          className="text-xs text-muted-foreground mt-1 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  )
}

// Export motion for direct use
export { motion, AnimatePresence, type Variants } from 'framer-motion'