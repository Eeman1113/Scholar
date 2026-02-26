/**
 * Animation Showcase Component
 * Demonstrates all the micro-animations and UX enhancements
 */

import { useState } from 'react'
import { Bot, Sparkles, Search, PenTool, Calculator, Brain, BookOpen, Send, Settings, Download } from 'lucide-react'
import {
  AnimatedButton,
  AnimatedAgentAvatar,
  AnimatedMessage,
  AnimatedModal,
  AnimatedQuickAction,
  AnimatedCounter,
  AnimatedProgress,
  motion,
  AnimatePresence
} from '@/components/ui/animated-components'
import {
  pageVariants,
  quickActionsVariants,
  fadeInUp,
  crossfadeVariants
} from '@/lib/animations'
import { useAgentThinking, useStaggeredAnimation } from '@/hooks/useAnimations'

export function AnimationShowcase() {
  const [showModal, setShowModal] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string>('avatars')
  const [progress, setProgress] = useState(45)
  const [counter, setCounter] = useState(128)
  const { setAgentThinking, isAgentThinking } = useAgentThinking()
  const isVisible = useStaggeredAnimation(6, 0.15)

  const agents = [
    { id: 'sage', name: 'Sage', icon: Bot, color: 'bg-indigo-500' },
    { id: 'atlas', name: 'Atlas', icon: Search, color: 'bg-emerald-500' },
    { id: 'prose', name: 'Prose', icon: PenTool, color: 'bg-purple-500' },
    { id: 'cite', name: 'Cite', icon: BookOpen, color: 'bg-pink-500' },
    { id: 'euler', name: 'Euler', icon: Calculator, color: 'bg-orange-500' },
    { id: 'socrates', name: 'Socrates', icon: Brain, color: 'bg-amber-500' },
    { id: 'mnemo', name: 'Mnemo', icon: Sparkles, color: 'bg-blue-500' }
  ]

  const toggleThinking = (agentId: string) => {
    setAgentThinking(agentId, !isAgentThinking(agentId))
  }

  return (
    <motion.div
      className="p-8 max-w-6xl mx-auto space-y-12"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="text-center">
        <motion.h1
          className="text-4xl font-serif font-bold text-foreground mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Scholar AI Animation System
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Comprehensive micro-interactions and polished UX animations
        </motion.p>
      </div>

      {/* Demo Navigation */}
      <motion.div
        className="flex flex-wrap gap-2 justify-center"
        variants={quickActionsVariants}
        initial="initial"
        animate="animate"
      >
        {['avatars', 'buttons', 'messages', 'progress', 'modal'].map((demo) => (
          <AnimatedButton
            key={demo}
            variant={selectedDemo === demo ? 'primary' : 'secondary'}
            onClick={() => setSelectedDemo(demo)}
            className="capitalize"
          >
            {demo} Demo
          </AnimatedButton>
        ))}
      </motion.div>

      {/* Demo Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDemo}
          variants={crossfadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-[400px]"
        >
          {selectedDemo === 'avatars' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-serif font-semibold text-center">Agent Avatar Animations</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
                {agents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    className="flex flex-col items-center space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible(index) ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AnimatedAgentAvatar
                      isSelected={index === 0}
                      isThinking={isAgentThinking(agent.id)}
                      isActive={index < 2}
                      color={agent.color}
                      icon={agent.icon}
                      size="lg"
                      onClick={() => toggleThinking(agent.id)}
                    />
                    <span className="text-sm font-medium">{agent.name}</span>
                    <AnimatedButton
                      variant="ghost"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => toggleThinking(agent.id)}
                    >
                      Toggle Thinking
                    </AnimatedButton>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {selectedDemo === 'buttons' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-serif font-semibold text-center">Interactive Button Animations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Primary Buttons</h3>
                  <div className="space-y-2">
                    <AnimatedButton variant="primary" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </AnimatedButton>
                    <AnimatedButton variant="primary" isLoading className="w-full">
                      Processing
                    </AnimatedButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Secondary Buttons</h3>
                  <div className="space-y-2">
                    <AnimatedButton variant="secondary" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </AnimatedButton>
                    <AnimatedButton variant="ghost" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </AnimatedButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      { icon: Search, label: 'Research', color: 'text-emerald-600' },
                      { icon: PenTool, label: 'Write', color: 'text-purple-600' }
                    ].map((action, index) => (
                      <AnimatedQuickAction
                        key={index}
                        icon={action.icon}
                        label={action.label}
                        description={`${action.label} with enhanced animations`}
                        iconColor={action.color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDemo === 'messages' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-serif font-semibold text-center">Message Animations</h2>
              
              <div className="space-y-4 max-w-2xl mx-auto">
                <AnimatedMessage role="user">
                  <div className="text-sm">
                    This is a user message with smooth fade-in animation and hover effects.
                  </div>
                </AnimatedMessage>

                <AnimatedMessage role="assistant">
                  <div className="flex items-start space-x-3">
                    <AnimatedAgentAvatar
                      isSelected={false}
                      isThinking={false}
                      isActive={true}
                      color="bg-indigo-500"
                      icon={Bot}
                      size="sm"
                    />
                    <div className="flex-1 text-sm">
                      This is an assistant message with enhanced animations, including avatar thinking states and smooth transitions.
                    </div>
                  </div>
                </AnimatedMessage>

                <AnimatedMessage role="assistant" isStreaming>
                  <div className="flex items-start space-x-3">
                    <AnimatedAgentAvatar
                      isSelected={false}
                      isThinking={true}
                      isActive={true}
                      color="bg-purple-500"
                      icon={Sparkles}
                      size="sm"
                    />
                    <div className="flex-1 text-sm">
                      This is a streaming message with shimmer effects and typing cursor animation
                    </div>
                  </div>
                </AnimatedMessage>
              </div>
            </div>
          )}

          {selectedDemo === 'progress' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-serif font-semibold text-center">Progress & Counter Animations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Animated Progress Bar</h3>
                    <AnimatedProgress value={progress} showLabel className="mb-4" />
                    <div className="flex gap-2">
                      <AnimatedButton
                        variant="ghost"
                        onClick={() => setProgress(Math.max(0, progress - 10))}
                      >
                        -10
                      </AnimatedButton>
                      <AnimatedButton
                        variant="ghost"
                        onClick={() => setProgress(Math.min(100, progress + 10))}
                      >
                        +10
                      </AnimatedButton>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Animated Counter</h3>
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold">
                        <AnimatedCounter value={counter} className="text-primary" />
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">Word Count</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <AnimatedButton
                        variant="ghost"
                        onClick={() => setCounter(counter - 25)}
                      >
                        -25
                      </AnimatedButton>
                      <AnimatedButton
                        variant="ghost"
                        onClick={() => setCounter(counter + 25)}
                      >
                        +25
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDemo === 'modal' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-serif font-semibold text-center">Modal Animations</h2>
              
              <div className="text-center">
                <AnimatedButton
                  variant="primary"
                  onClick={() => setShowModal(true)}
                >
                  Open Animated Modal
                </AnimatedButton>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feature Overview */}
      <motion.div
        className="bg-muted/30 rounded-lg p-6"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <h3 className="text-xl font-semibold mb-4">Animation Features Implemented</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'Page Load Staggered Animations',
            'Agent Avatar Thinking States',
            'Micro-interaction Hover Effects',
            'Message Streaming Animations',
            'Button Loading States',
            'Modal Slide-in Effects',
            'Progress Bar Animations',
            'Text Insertion Flying Effects',
            'Focus Mode Transitions',
            'Tool Call Displays',
            'Quick Action Grids',
            'Cross-fade Mode Switches'
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center space-x-2 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Modal Demo */}
      <AnimatedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="w-full max-w-md p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Animated Modal Demo</h3>
          <p className="text-sm text-muted-foreground">
            This modal demonstrates smooth scale and fade animations with backdrop blur effects.
          </p>
          <div className="flex justify-end space-x-2">
            <AnimatedButton
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              onClick={() => setShowModal(false)}
            >
              Confirm
            </AnimatedButton>
          </div>
        </div>
      </AnimatedModal>
    </motion.div>
  )
}