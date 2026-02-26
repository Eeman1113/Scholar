import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, Users, BookOpen, GraduationCap, Briefcase, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUiStore } from '@/store/uiStore'
import { useAgentStore } from '@/store/agentStore'
import { AGENT_CONFIGS } from '@/agents/config'
import { motion, AnimatePresence } from '@/components/ui/animated-components'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

type DocumentType = 'essay' | 'research' | 'creative' | 'technical' | 'other'
type AcademicLevel = 'highschool' | 'undergraduate' | 'graduate' | 'professional'

const DOCUMENT_TYPES = [
  {
    id: 'essay' as DocumentType,
    title: 'Essay & Papers',
    description: 'Academic essays, analytical papers, and arguments',
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-600 border-blue-200'
  },
  {
    id: 'research' as DocumentType,
    title: 'Research Papers',
    description: 'Research papers, literature reviews, and theses',
    icon: FlaskConical,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
  },
  {
    id: 'creative' as DocumentType,
    title: 'Creative Writing',
    description: 'Stories, poems, scripts, and creative works',
    icon: Sparkles,
    color: 'bg-purple-500/10 text-purple-600 border-purple-200'
  },
  {
    id: 'technical' as DocumentType,
    title: 'Technical Writing',
    description: 'Documentation, reports, and technical guides',
    icon: Briefcase,
    color: 'bg-amber-500/10 text-amber-600 border-amber-200'
  },
  {
    id: 'other' as DocumentType,
    title: 'Other',
    description: 'General writing and other document types',
    icon: BookOpen,
    color: 'bg-gray-500/10 text-gray-600 border-gray-200'
  }
]

const ACADEMIC_LEVELS = [
  {
    id: 'highschool' as AcademicLevel,
    title: 'High School',
    description: 'Grades 9-12, basic academic writing',
    icon: GraduationCap,
    color: 'bg-green-500/10 text-green-600 border-green-200'
  },
  {
    id: 'undergraduate' as AcademicLevel,
    title: 'Undergraduate',
    description: 'Bachelor\'s degree coursework and assignments',
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-600 border-blue-200'
  },
  {
    id: 'graduate' as AcademicLevel,
    title: 'Graduate',
    description: 'Master\'s and PhD level research and writing',
    icon: FlaskConical,
    color: 'bg-purple-500/10 text-purple-600 border-purple-200'
  },
  {
    id: 'professional' as AcademicLevel,
    title: 'Professional',
    description: 'Business writing and professional documents',
    icon: Briefcase,
    color: 'bg-amber-500/10 text-amber-600 border-amber-200'
  }
]

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [step, setStep] = useState(1)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('essay')
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel>('undergraduate')
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['sage', 'prose', 'atlas'])

  const { completeOnboarding } = useUiStore()
  const { setActiveAgent, activateAgent } = useAgentStore()

  const handleDocTypeSelect = (type: DocumentType) => {
    setSelectedDocType(type)
    // Smart defaults based on document type
    switch (type) {
      case 'research':
        setSelectedAgents(['sage', 'atlas', 'cite', 'prose'])
        break
      case 'creative':
        setSelectedAgents(['sage', 'prose', 'socrates'])
        break
      case 'technical':
        setSelectedAgents(['sage', 'prose', 'euler'])
        break
      default:
        setSelectedAgents(['sage', 'prose', 'atlas'])
    }
  }

  const handleLevelSelect = (level: AcademicLevel) => {
    setSelectedLevel(level)
  }

  const toggleAgent = (agentId: string) => {
    if (agentId === 'sage') return // Sage is always included
    
    setSelectedAgents(prev => 
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const handleComplete = () => {
    // Activate selected agents
    selectedAgents.forEach(agentId => {
      activateAgent(agentId)
    })
    setActiveAgent('sage')
    
    // Complete onboarding
    completeOnboarding()
    onClose()
  }

  const handleSkip = () => {
    completeOnboarding()
    onClose()
  }

  if (!isOpen) return null

  const stepVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <Card className="relative bg-background/95 backdrop-blur border-border/50 shadow-2xl">
          {/* Header */}
          <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to Scholar
                </h1>
                <p className="text-sm text-muted-foreground">
                  Let's personalize your AI writing workspace
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === step ? 'bg-indigo-500' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSkip}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">What are you writing?</h2>
                    <p className="text-muted-foreground">
                      Choose the type of document you're working on to get the best AI assistance
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DOCUMENT_TYPES.map(type => {
                      const Icon = type.icon
                      return (
                        <motion.div
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            onClick={() => handleDocTypeSelect(type.id)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              selectedDocType === type.id
                                ? 'border-indigo-500 bg-indigo-50/50 shadow-md dark:bg-indigo-950/30'
                                : 'border-border hover:border-indigo-300 hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mb-3`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold mb-1">{type.title}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">What's your academic level?</h2>
                    <p className="text-muted-foreground">
                      This helps us adjust the AI assistance to match your writing requirements
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ACADEMIC_LEVELS.map(level => {
                      const Icon = level.icon
                      return (
                        <motion.div
                          key={level.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            onClick={() => handleLevelSelect(level.id)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              selectedLevel === level.id
                                ? 'border-indigo-500 bg-indigo-50/50 shadow-md dark:bg-indigo-950/30'
                                : 'border-border hover:border-indigo-300 hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg ${level.color} flex items-center justify-center mb-3`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold mb-1">{level.title}</h3>
                            <p className="text-sm text-muted-foreground">{level.description}</p>
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Meet your AI writing team</h2>
                    <p className="text-muted-foreground">
                      Choose which specialized agents you'd like to activate. You can always change this later.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(AGENT_CONFIGS).map(agent => (
                      <motion.div
                        key={agent.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => toggleAgent(agent.id)}
                          disabled={agent.id === 'sage'}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            selectedAgents.includes(agent.id)
                              ? 'border-indigo-500 bg-indigo-50/50 shadow-md dark:bg-indigo-950/30'
                              : 'border-border hover:border-indigo-300 hover:bg-muted/50'
                          } ${agent.id === 'sage' ? 'opacity-90 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 ${agent.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold">{agent.name}</h3>
                                {agent.id === 'sage' && (
                                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium">
                                    Required
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{agent.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {agent.capabilities.slice(0, 2).map(cap => (
                                  <span
                                    key={cap}
                                    className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                                  >
                                    {cap}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-border/50">
              <div className="flex items-center space-x-2">
                {step > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip setup
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <span>Get Started</span>
                    <Sparkles className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}