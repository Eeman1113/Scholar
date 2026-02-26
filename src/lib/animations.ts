/**
 * Animation utilities and configuration for Scholar AI
 * Comprehensive micro-animations with Framer Motion
 */

import type { Variants } from 'framer-motion'

// Core animation timing
export const TIMING = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  gentle: 0.4
} as const

// Easing curves
export const EASING = {
  ease: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  gentle: [0.25, 0.1, 0.25, 1],
  sharp: [0.4, 0, 0.6, 1]
} as const

// Page Load Animations
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.gentle,
      ease: EASING.ease,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: TIMING.fast,
      ease: EASING.sharp
    }
  }
}

// Staggered page components (editor → agents)
export const editorVariants: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: TIMING.gentle,
      ease: EASING.ease
    }
  }
}

export const agentPanelVariants: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: TIMING.gentle,
      ease: EASING.ease,
      delay: 0.1
    }
  }
}

// Agent Avatar Animations
export const agentAvatarVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: TIMING.normal,
      ease: EASING.bounce
    }
  },
  thinking: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0px rgba(59, 130, 246, 0)",
      "0 0 0 8px rgba(59, 130, 246, 0.2)",
      "0 0 0 0px rgba(59, 130, 246, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: EASING.gentle
    }
  },
  selected: {
    scale: 1.1,
    boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
    transition: {
      duration: TIMING.normal,
      ease: EASING.ease
    }
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
    transition: {
      duration: TIMING.fast,
      ease: EASING.ease
    }
  }
}

// Message Animations
export const messageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: TIMING.normal,
      ease: EASING.ease
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: TIMING.fast,
      ease: EASING.sharp
    }
  }
}

// Text Streaming Animation
export const streamingTextVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: EASING.gentle
    }
  }
}

// Button and Interactive Element Animations
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: TIMING.fast,
      ease: EASING.ease
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: EASING.sharp
    }
  }
}

// Special effect for primary actions
export const primaryButtonVariants: Variants = {
  ...buttonVariants,
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
    transition: {
      duration: TIMING.fast,
      ease: EASING.ease
    }
  }
}

// Modal and Panel Animations
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: TIMING.normal,
      ease: EASING.ease
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: TIMING.fast,
      ease: EASING.sharp
    }
  }
}

// Slide-in panels (Citation Manager, Study Pack, etc.)
export const slideInVariants: Variants = {
  initial: {
    x: "100%",
    opacity: 0
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: TIMING.normal,
      ease: EASING.ease,
      staggerChildren: 0.05
    }
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: TIMING.fast,
      ease: EASING.sharp
    }
  }
}

// Text insertion flying animation
export const textInsertVariants: Variants = {
  initial: {
    scale: 1,
    x: 0,
    y: 0,
    opacity: 1
  },
  flying: {
    scale: 0.8,
    x: -200, // Approximate distance to editor
    y: -100,
    opacity: 0.7,
    transition: {
      duration: TIMING.slow,
      ease: EASING.ease
    }
  },
  inserted: {
    scale: 1.1,
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      duration: TIMING.fast,
      ease: EASING.bounce
    }
  }
}

// Focus Mode Animations
export const focusModeVariants: Variants = {
  initial: { opacity: 1 },
  focused: {
    opacity: 0.3,
    filter: "blur(2px)",
    transition: {
      duration: TIMING.slow,
      ease: EASING.gentle
    }
  },
  spotlight: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: TIMING.slow,
      ease: EASING.gentle
    }
  }
}

// Status Bar Animations
export const statusBarVariants: Variants = {
  initial: { y: 50, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: TIMING.gentle,
      ease: EASING.ease,
      delay: 0.2
    }
  }
}

// AI Contribution Glow Animation
export const aiGlowVariants: Variants = {
  animate: {
    boxShadow: [
      "2px 0 0 0 rgba(59, 130, 246, 0.3)",
      "2px 0 0 0 rgba(59, 130, 246, 0.7)",
      "2px 0 0 0 rgba(59, 130, 246, 0.3)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: EASING.gentle
    }
  }
}

// Tool Call Display Animation
export const toolCallVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0
  },
  animate: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: TIMING.normal,
      ease: EASING.ease
    }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      duration: TIMING.fast,
      ease: EASING.sharp
    }
  }
}

// Loading Spinner Variants
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

// Quick Actions Grid Animation
export const quickActionsVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const quickActionItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: TIMING.normal,
      ease: EASING.ease
    }
  },
  hover: {
    scale: 1.02,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    transition: {
      duration: TIMING.fast,
      ease: EASING.ease
    }
  }
}

// Header Animation
export const headerVariants: Variants = {
  initial: { y: -50, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: TIMING.gentle,
      ease: EASING.ease,
      staggerChildren: 0.05
    }
  }
}

// Utility animations for common interactions
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.normal,
      ease: EASING.ease
    }
  }
}

export const scaleIn: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: TIMING.normal,
      ease: EASING.bounce
    }
  }
}

// Mode switch crossfade
export const crossfadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: TIMING.fast,
      ease: EASING.ease
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: TIMING.fast,
      ease: EASING.ease
    }
  }
}

// Gesture-based animations for mobile
export const swipeVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}

// Animation presets for different component types
export const animationPresets = {
  // For buttons and clickable elements
  clickable: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: TIMING.fast, ease: EASING.ease }
  },
  
  // For agent avatars
  agentAvatar: {
    variants: agentAvatarVariants,
    initial: "initial",
    animate: "animate",
    whileHover: "hover"
  },
  
  // For modal dialogs
  modal: {
    variants: modalVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit"
  },
  
  // For page transitions
  page: {
    variants: pageVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit"
  }
} as const