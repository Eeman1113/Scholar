import { useState, useCallback } from 'react'
import { Brain, X, Settings, Download, Share2, RotateCcw, CheckCircle, 
         Lightbulb, BookMarked, MapPin, FileText, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'

interface StudyPackProps {
  documentContent?: string
  onInsertContent?: (content: string) => void
  className?: string
}

interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  mastered: boolean
  attempts: number
  lastReviewed?: Date
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  category: string
}

interface StudyNote {
  id: string
  title: string
  content: string
  category: string
  importance: 'high' | 'medium' | 'low'
}

type StudyPackTab = 'flashcards' | 'quiz' | 'mindmap' | 'notes' | 'summary'

// Mock study data
const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    front: 'What is machine learning?',
    back: 'A subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.',
    difficulty: 'medium',
    mastered: false,
    attempts: 0
  },
  {
    id: '2',
    front: 'Define neural networks',
    back: 'Computing systems inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information.',
    difficulty: 'hard',
    mastered: false,
    attempts: 0
  },
  {
    id: '3',
    front: 'What is supervised learning?',
    back: 'A type of machine learning where the algorithm learns from labeled training data to make predictions on new, unseen data.',
    difficulty: 'easy',
    mastered: true,
    attempts: 3
  }
]

const mockQuizQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'Which of the following is NOT a type of machine learning?',
    options: [
      'Supervised Learning',
      'Unsupervised Learning',
      'Reinforcement Learning',
      'Deterministic Learning'
    ],
    correctAnswer: 3,
    explanation: 'Deterministic Learning is not a recognized type of machine learning. The three main types are supervised, unsupervised, and reinforcement learning.',
    category: 'Fundamentals'
  },
  {
    id: '2',
    question: 'What is the primary goal of unsupervised learning?',
    options: [
      'To predict future outcomes',
      'To find hidden patterns in data',
      'To classify labeled data',
      'To optimize reward functions'
    ],
    correctAnswer: 1,
    explanation: 'Unsupervised learning aims to discover hidden patterns, structures, or relationships in data without labeled examples.',
    category: 'Learning Types'
  }
]

const mockNotes: StudyNote[] = [
  {
    id: '1',
    title: 'Key ML Algorithms',
    content: 'Linear Regression, Decision Trees, Random Forest, SVM, K-Means, Neural Networks',
    category: 'Algorithms',
    importance: 'high'
  },
  {
    id: '2',
    title: 'Data Preprocessing Steps',
    content: 'Data cleaning, normalization, feature selection, handling missing values, encoding categorical variables',
    category: 'Data Science',
    importance: 'medium'
  }
]

export function StudyPack({ documentContent, className = '' }: StudyPackProps) {
  const { 
    panels,
    toggleStudyPack,
    setStudyPackPosition 
  } = useUiStore()

  const [activeTab, setActiveTab] = useState<StudyPackTab>('flashcards')
  const [flashcards, setFlashcards] = useState<Flashcard[]>(mockFlashcards)
  const [quizQuestions] = useState<QuizQuestion[]>(mockQuizQuestions)
  const [notes] = useState<StudyNote[]>(mockNotes)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Flashcard state
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 })
  const [quizCompleted, setQuizCompleted] = useState(false)

  const currentFlashcard = flashcards[currentFlashcardIndex]
  const currentQuestion = quizQuestions[currentQuestionIndex]

  // Generate study materials from document
  const generateStudyPack = useCallback(async () => {
    if (!documentContent) return
    
    setIsGenerating(true)
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // TODO: Integrate with Mnemo agent to generate actual study materials
    // For now, we'll use the mock data
    
    setIsGenerating(false)
  }, [documentContent])

  const handleFlashcardAnswer = (correct: boolean) => {
    if (!currentFlashcard) return
    
    setFlashcards(prev => prev.map(card => 
      card.id === currentFlashcard.id
        ? {
            ...card,
            attempts: card.attempts + 1,
            mastered: correct && card.attempts >= 2,
            lastReviewed: new Date()
          }
        : card
    ))
    
    // Move to next card
    setTimeout(() => {
      setIsFlipped(false)
      if (currentFlashcardIndex < flashcards.length - 1) {
        setCurrentFlashcardIndex(prev => prev + 1)
      } else {
        setCurrentFlashcardIndex(0) // Loop back to start
      }
    }, 500)
  }

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setShowExplanation(true)
    
    if (answerIndex === currentQuestion.correctAnswer) {
      setQuizScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }))
    } else {
      setQuizScore(prev => ({ ...prev, total: prev.total + 1 }))
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setQuizScore({ correct: 0, total: 0 })
    setQuizCompleted(false)
  }

  const exportStudyPack = () => {
    // TODO: Implement PDF export functionality
    console.log('Exporting study pack to PDF...')
  }

  const shareStudyPack = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing study pack...')
  }

  if (!panels.isStudyPackOpen) return null

  const tabs: { id: StudyPackTab; label: string; icon: React.ReactNode }[] = [
    { id: 'flashcards', label: 'Flashcards', icon: <Brain className="w-4 h-4" /> },
    { id: 'quiz', label: 'Quiz', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'mindmap', label: 'Mind Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'notes', label: 'Key Terms', icon: <BookMarked className="w-4 h-4" /> },
    { id: 'summary', label: 'TL;DR', icon: <FileText className="w-4 h-4" /> }
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: panels.studyPackPosition === 'right' ? 400 : -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: panels.studyPackPosition === 'right' ? 400 : -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`
          fixed top-16 ${panels.studyPackPosition === 'right' ? 'right-4' : 'left-4'} 
          w-96 max-h-[calc(100vh-6rem)] z-50 
          ${className}
        `}
      >
        <Card className="h-full flex flex-col glass-card shadow-2xl border bg-background/95 backdrop-blur-xl">
          {/* Header */}
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>Study Pack</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={shareStudyPack}
                  className="w-8 h-8"
                  title="Share study pack"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exportStudyPack}
                  className="w-8 h-8"
                  title="Export to PDF"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStudyPackPosition(
                    panels.studyPackPosition === 'right' ? 'left' : 'right'
                  )}
                  className="w-8 h-8"
                  title="Move panel"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleStudyPack}
                  className="w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-muted rounded-lg p-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 text-xs h-8"
                >
                  {tab.icon}
                  <span className="ml-1 hidden sm:inline">{tab.label}</span>
                </Button>
              ))}
            </div>

            {/* Generate Button */}
            {!isGenerating && (
              <Button
                onClick={generateStudyPack}
                disabled={!documentContent}
                className="w-full text-sm"
                variant="outline"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Generate from Document
              </Button>
            )}
          </CardHeader>

          <Separator />

          {/* Content */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full"
                >
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Generating study materials...</p>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Flashcards Tab */}
                  {activeTab === 'flashcards' && (
                    <motion.div
                      key="flashcards"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full p-4 flex flex-col"
                    >
                      <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">
                          Card {currentFlashcardIndex + 1} of {flashcards.length}
                        </p>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          <div className="flex space-x-1">
                            {flashcards.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                  index === currentFlashcardIndex 
                                    ? 'bg-primary' 
                                    : index < currentFlashcardIndex 
                                      ? 'bg-green-500' 
                                      : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {currentFlashcard && (
                        <div className="flex-1 flex flex-col">
                          <div 
                            className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 cursor-pointer group hover:shadow-lg transition-all duration-300 min-h-[200px] flex items-center justify-center"
                            onClick={() => setIsFlipped(!isFlipped)}
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={isFlipped ? 'back' : 'front'}
                                initial={{ rotateY: 90, opacity: 0 }}
                                animate={{ rotateY: 0, opacity: 1 }}
                                exit={{ rotateY: -90, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-center w-full"
                              >
                                <p className="text-base font-medium leading-relaxed">
                                  {isFlipped ? currentFlashcard.back : currentFlashcard.front}
                                </p>
                              </motion.div>
                            </AnimatePresence>
                            
                            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to {isFlipped ? 'see question' : 'reveal answer'}
                            </div>
                            
                            <Badge className={`absolute top-4 right-4 ${
                              currentFlashcard.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              currentFlashcard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {currentFlashcard.difficulty}
                            </Badge>
                          </div>

                          {isFlipped && (
                            <div className="flex justify-center space-x-4 mt-4">
                              <Button
                                variant="outline"
                                onClick={() => handleFlashcardAnswer(false)}
                                className="flex-1"
                              >
                                Hard 😰
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleFlashcardAnswer(true)}
                                className="flex-1"
                              >
                                Easy 😊
                              </Button>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsFlipped(false)
                                setCurrentFlashcardIndex(prev => 
                                  prev > 0 ? prev - 1 : flashcards.length - 1
                                )
                              }}
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              Previous
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsFlipped(false)
                                setCurrentFlashcardIndex(prev => 
                                  prev < flashcards.length - 1 ? prev + 1 : 0
                                )
                              }}
                            >
                              Next
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Quiz Tab */}
                  {activeTab === 'quiz' && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full p-4 flex flex-col"
                    >
                      {!quizCompleted ? (
                        <>
                          <div className="text-center mb-4">
                            <p className="text-sm text-muted-foreground">
                              Question {currentQuestionIndex + 1} of {quizQuestions.length}
                            </p>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` 
                                }}
                              />
                            </div>
                          </div>

                          {currentQuestion && (
                            <div className="flex-1 flex flex-col">
                              <Card className="mb-4 border-2">
                                <CardContent className="p-4">
                                  <h3 className="font-medium mb-4">{currentQuestion.question}</h3>
                                  
                                  <div className="space-y-2">
                                    {currentQuestion.options.map((option, index) => (
                                      <Button
                                        key={index}
                                        variant={
                                          selectedAnswer === null ? "outline" :
                                          index === currentQuestion.correctAnswer ? "default" :
                                          selectedAnswer === index ? "destructive" : "outline"
                                        }
                                        className={`w-full justify-start text-left ${
                                          selectedAnswer !== null && index === currentQuestion.correctAnswer 
                                            ? 'bg-green-100 text-green-800 border-green-300' : ''
                                        }`}
                                        onClick={() => selectedAnswer === null && handleQuizAnswer(index)}
                                        disabled={selectedAnswer !== null}
                                      >
                                        <span className="mr-2 font-medium">
                                          {String.fromCharCode(65 + index)}:
                                        </span>
                                        {option}
                                      </Button>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>

                              {showExplanation && (
                                <Card className="mb-4 bg-blue-50 border-blue-200">
                                  <CardContent className="p-4">
                                    <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
                                    <p className="text-blue-700 text-sm">{currentQuestion.explanation}</p>
                                  </CardContent>
                                </Card>
                              )}

                              {showExplanation && (
                                <Button onClick={nextQuestion} className="w-full">
                                  {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <div className="mb-6">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Quiz Completed!</h3>
                            <p className="text-4xl font-bold text-primary mb-2">
                              {Math.round((quizScore.correct / quizScore.total) * 100)}%
                            </p>
                            <p className="text-muted-foreground">
                              {quizScore.correct} out of {quizScore.total} correct
                            </p>
                          </div>
                          
                          <Button onClick={resetQuiz} className="w-full">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retake Quiz
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Other tabs placeholders */}
                  {activeTab === 'mindmap' && (
                    <motion.div
                      key="mindmap"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full p-4 flex items-center justify-center"
                    >
                      <div className="text-center text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Mind Map visualization coming soon
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'notes' && (
                    <motion.div
                      key="notes"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full p-4 overflow-y-auto space-y-3"
                    >
                      {notes.map((note) => (
                        <Card key={note.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium">{note.title}</h3>
                              <Badge variant={
                                note.importance === 'high' ? 'destructive' :
                                note.importance === 'medium' ? 'default' : 'secondary'
                              }>
                                {note.importance}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{note.content}</p>
                            <Badge variant="outline" className="mt-2">
                              {note.category}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'summary' && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full p-4"
                    >
                      <Card className="h-full border">
                        <CardContent className="p-4 h-full overflow-y-auto">
                          <h3 className="font-medium mb-3">Document Summary</h3>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">🎯 Key Points:</h4>
                              <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                                <li>• Machine learning enables computers to learn from data</li>
                                <li>• Three main types: supervised, unsupervised, reinforcement</li>
                                <li>• Neural networks mimic biological neural networks</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2">💡 Important Concepts:</h4>
                              <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                                <li>• Training data quality affects model performance</li>
                                <li>• Overfitting occurs when models memorize rather than generalize</li>
                                <li>• Feature engineering improves model accuracy</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}