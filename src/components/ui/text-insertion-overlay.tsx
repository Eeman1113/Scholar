/**
 * Text Insertion Animation Overlay
 * Creates flying text animations from agent responses to editor
 */

import { AnimatePresence } from 'framer-motion'
import { AnimatedTextInsertion } from './animated-components'
import { useTextInsertion } from '@/hooks/useAnimations'

export function TextInsertionOverlay() {
  const { insertions } = useTextInsertion()

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {insertions.map((insertion) => (
          <AnimatedTextInsertion
            key={insertion.id}
            text={insertion.text}
            startPosition={insertion.startPos}
            targetPosition={insertion.targetPos}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}