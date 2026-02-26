import { useState, useCallback } from 'react'
import { ClipboardList, Upload, FileText, CheckCircle, AlertTriangle, XCircle, 
         Lightbulb, Target, BookOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

interface RubricModeProps {
  documentContent?: string
  onInsertContent?: (content: string) => void
  className?: string
}

interface RubricCriteria {
  id: string
  name: string
  description: string
  maxPoints: number
  levels: Array<{
    score: number
    label: string
    description: string
  }>
}

interface RubricAnalysis {
  criteriaId: string
  status: 'met' | 'partial' | 'missing'
  score: number
  maxPoints: number
  feedback: string
  suggestions: string[]
  confidence: number // 0-100
}

interface ParsedRubric {
  title: string
  totalPoints: number
  criteria: RubricCriteria[]
}

const mockRubric: ParsedRubric = {
  title: 'Research Essay Rubric',
  totalPoints: 100,
  criteria: [
    {
      id: '1',
      name: 'Thesis Statement',
      description: 'Clear, specific, and arguable thesis statement',
      maxPoints: 20,
      levels: [
        { score: 20, label: 'Excellent', description: 'Clear, specific, and strongly arguable thesis' },
        { score: 15, label: 'Good', description: 'Clear and arguable thesis with minor issues' },
        { score: 10, label: 'Satisfactory', description: 'Thesis present but lacks clarity or specificity' },
        { score: 5, label: 'Needs Improvement', description: 'Weak or unclear thesis statement' },
        { score: 0, label: 'Missing', description: 'No identifiable thesis statement' }
      ]
    },
    {
      id: '2',
      name: 'Evidence & Citations',
      description: 'Use of credible sources with proper citations',
      maxPoints: 25,
      levels: [
        { score: 25, label: 'Excellent', description: 'Multiple credible sources, properly cited' },
        { score: 20, label: 'Good', description: 'Good sources with mostly correct citations' },
        { score: 15, label: 'Satisfactory', description: 'Adequate sources with some citation errors' },
        { score: 10, label: 'Needs Improvement', description: 'Limited or questionable sources' },
        { score: 0, label: 'Missing', description: 'No sources or citations provided' }
      ]
    },
    {
      id: '3',
      name: 'Organization & Structure',
      description: 'Logical flow and clear paragraph structure',
      maxPoints: 20,
      levels: [
        { score: 20, label: 'Excellent', description: 'Clear introduction, body, conclusion with smooth transitions' },
        { score: 15, label: 'Good', description: 'Generally well-organized with minor structural issues' },
        { score: 10, label: 'Satisfactory', description: 'Basic organization present but could be clearer' },
        { score: 5, label: 'Needs Improvement', description: 'Poor organization, unclear structure' },
        { score: 0, label: 'Missing', description: 'No clear organizational structure' }
      ]
    },
    {
      id: '4',
      name: 'Analysis & Critical Thinking',
      description: 'Depth of analysis and original thinking',
      maxPoints: 25,
      levels: [
        { score: 25, label: 'Excellent', description: 'Sophisticated analysis with original insights' },
        { score: 20, label: 'Good', description: 'Good analysis with some original thinking' },
        { score: 15, label: 'Satisfactory', description: 'Basic analysis, mostly summarizing sources' },
        { score: 10, label: 'Needs Improvement', description: 'Limited analysis, heavy reliance on sources' },
        { score: 0, label: 'Missing', description: 'No evidence of analysis or critical thinking' }
      ]
    },
    {
      id: '5',
      name: 'Writing Quality',
      description: 'Grammar, syntax, and overall writing quality',
      maxPoints: 10,
      levels: [
        { score: 10, label: 'Excellent', description: 'Error-free writing with varied sentence structure' },
        { score: 8, label: 'Good', description: 'Minor errors, generally clear writing' },
        { score: 6, label: 'Satisfactory', description: 'Some errors but meaning is clear' },
        { score: 4, label: 'Needs Improvement', description: 'Frequent errors that impede understanding' },
        { score: 0, label: 'Missing', description: 'Numerous errors make text difficult to understand' }
      ]
    }
  ]
}

const mockAnalysis: RubricAnalysis[] = [
  {
    criteriaId: '1',
    status: 'met',
    score: 18,
    maxPoints: 20,
    feedback: 'Strong thesis statement that clearly states your position on AI in education.',
    suggestions: ['Consider adding more specificity about which aspects of education you\'ll focus on'],
    confidence: 85
  },
  {
    criteriaId: '2',
    status: 'partial',
    score: 15,
    maxPoints: 25,
    feedback: 'Good use of sources, but some citations need formatting fixes.',
    suggestions: [
      'Add 2-3 more peer-reviewed sources',
      'Fix APA formatting for Johnson et al. citation',
      'Include page numbers for direct quotes'
    ],
    confidence: 78
  },
  {
    criteriaId: '3',
    status: 'met',
    score: 17,
    maxPoints: 20,
    feedback: 'Clear organization with logical flow between paragraphs.',
    suggestions: ['Add transition sentences between major sections'],
    confidence: 90
  },
  {
    criteriaId: '4',
    status: 'partial',
    score: 20,
    maxPoints: 25,
    feedback: 'Good analysis in most sections, but some paragraphs rely heavily on summarizing sources.',
    suggestions: [
      'Add more of your own interpretation in paragraph 3',
      'Connect your analysis back to the thesis more explicitly',
      'Consider counterarguments to strengthen your position'
    ],
    confidence: 72
  },
  {
    criteriaId: '5',
    status: 'met',
    score: 8,
    maxPoints: 10,
    feedback: 'Generally well-written with good sentence variety.',
    suggestions: ['Proofread for a few minor grammatical errors'],
    confidence: 95
  }
]

export function RubricMode({ documentContent, onInsertContent, className = '' }: RubricModeProps) {
  const [rubric, setRubric] = useState<ParsedRubric | null>(mockRubric)
  const [analysis, setAnalysis] = useState<RubricAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [uploadedRubricText, setUploadedRubricText] = useState('')
  const [isUploadMode, setIsUploadMode] = useState(false)

  // Calculate total score
  const totalScore = analysis.reduce((sum, item) => sum + item.score, 0)
  const totalPossible = rubric?.totalPoints || 0
  const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0

  const analyzeDocument = useCallback(async () => {
    if (!documentContent || !rubric) return
    
    setIsAnalyzing(true)
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // TODO: Integrate with Sage/Prose agent to analyze document against rubric
    // For now, we'll use the mock analysis
    setAnalysis(mockAnalysis)
    setShowAnalysis(true)
    
    setIsAnalyzing(false)
  }, [documentContent, rubric])

  const parseRubricText = (text: string): ParsedRubric | null => {
    // Simple rubric parsing logic - in reality, this would be more sophisticated
    // TODO: Implement proper rubric parsing with AI
    
    if (!text.trim()) return null
    
    try {
      // Basic parsing for demonstration
      const lines = text.split('\n').filter(line => line.trim())
      const title = lines[0] || 'Uploaded Rubric'
      
      return {
        title,
        totalPoints: 100,
        criteria: [
          {
            id: 'parsed-1',
            name: 'Parsed Criteria 1',
            description: 'Criteria extracted from uploaded rubric',
            maxPoints: 25,
            levels: [
              { score: 25, label: 'Excellent', description: 'Meets all requirements' },
              { score: 15, label: 'Good', description: 'Meets most requirements' },
              { score: 5, label: 'Needs Improvement', description: 'Meets some requirements' },
              { score: 0, label: 'Missing', description: 'Does not meet requirements' }
            ]
          }
        ]
      }
    } catch (error) {
      console.error('Failed to parse rubric:', error)
      return null
    }
  }

  const uploadRubric = () => {
    const parsed = parseRubricText(uploadedRubricText)
    if (parsed) {
      setRubric(parsed)
      setAnalysis([])
      setShowAnalysis(false)
      setIsUploadMode(false)
      setUploadedRubricText('')
    }
  }

  const getStatusIcon = (status: RubricAnalysis['status']) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusColor = (status: RubricAnalysis['status']) => {
    switch (status) {
      case 'met':
        return 'border-l-green-500 bg-green-50'
      case 'partial':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'missing':
        return 'border-l-red-500 bg-red-50'
    }
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 ${className}`}>
      <Card className="glass-card shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              <span>Assignment Rubric Analysis</span>
            </CardTitle>
            
            {showAnalysis && (
              <div className="text-right">
                <div className={`text-3xl font-bold ${getGradeColor(percentage)}`}>
                  {percentage}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {totalScore} / {totalPossible} points
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant={isUploadMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsUploadMode(!isUploadMode)}
            >
              <Upload className="w-4 h-4 mr-2" />
              {rubric?.title === 'Research Essay Rubric' ? 'Upload Rubric' : 'Change Rubric'}
            </Button>
            
            {!isUploadMode && rubric && (
              <Button
                onClick={analyzeDocument}
                disabled={!documentContent || isAnalyzing}
                className="text-sm"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Analyze Document
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Upload Rubric Mode */}
          {isUploadMode && (
            <Card className="border-dashed border-2">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Upload Assignment Rubric</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste your rubric text below and we'll analyze your document against it
                  </p>
                </div>
                
                <textarea
                  value={uploadedRubricText}
                  onChange={(e) => setUploadedRubricText(e.target.value)}
                  placeholder="Paste your assignment rubric here..."
                  className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={uploadRubric}
                    disabled={!uploadedRubricText.trim()}
                  >
                    Parse Rubric
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rubric Display */}
          {rubric && !isUploadMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{rubric.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total Points: {rubric.totalPoints}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rubric.criteria.map((criteria) => {
                    const criteriaAnalysis = analysis.find(a => a.criteriaId === criteria.id)
                    
                    return (
                      <Card
                        key={criteria.id}
                        className={`border-l-4 transition-all duration-200 ${
                          criteriaAnalysis ? getStatusColor(criteriaAnalysis.status) : 'border-l-gray-200'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium">{criteria.name}</h3>
                                {criteriaAnalysis && getStatusIcon(criteriaAnalysis.status)}
                                <Badge variant="outline">
                                  {criteriaAnalysis ? `${criteriaAnalysis.score}/${criteria.maxPoints}` : `${criteria.maxPoints} pts`}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {criteria.description}
                              </p>
                            </div>
                          </div>

                          {/* Analysis Results */}
                          {criteriaAnalysis && (
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t"
                              >
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium text-sm mb-1 flex items-center">
                                      <BookOpen className="w-4 h-4 mr-1" />
                                      Feedback
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {criteriaAnalysis.feedback}
                                    </p>
                                  </div>
                                  
                                  {criteriaAnalysis.suggestions.length > 0 && (
                                    <div>
                                      <h4 className="font-medium text-sm mb-2 flex items-center">
                                        <Lightbulb className="w-4 h-4 mr-1" />
                                        Suggestions
                                      </h4>
                                      <ul className="space-y-1">
                                        {criteriaAnalysis.suggestions.map((suggestion, index) => (
                                          <li key={index} className="text-sm text-muted-foreground flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{suggestion}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Confidence: {criteriaAnalysis.confidence}%</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const improvementText = `\n\n**${criteria.name} Improvements:**\n${criteriaAnalysis.suggestions.map(s => `- ${s}`).join('\n')}\n`
                                        onInsertContent?.(improvementText)
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      Insert Suggestions
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Grade Summary */}
          {showAnalysis && (
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Overall Assessment</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm">
                          {analysis.filter(a => a.status === 'met').length} criteria met
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm">
                          {analysis.filter(a => a.status === 'partial').length} need improvement
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm">
                          {analysis.filter(a => a.status === 'missing').length} missing
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getGradeColor(percentage)}`}>
                      {percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {percentage}% ({totalScore}/{totalPossible})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Analyzing Your Document</h3>
                    <p className="text-sm text-muted-foreground">
                      Evaluating your work against the rubric criteria...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}