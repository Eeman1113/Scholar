import { useState, useCallback, useEffect } from 'react'
import { History, X, RotateCcw, Save, GitBranch, Clock, FileText, 
         Eye, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'

interface VersionHistoryProps {
  documentContent?: string
  onRestoreVersion?: (content: string) => void
  onPreviewVersion?: (content: string) => void
  className?: string
}

interface DocumentVersion {
  id: string
  content: string
  wordCount: number
  timestamp: Date
  description: string
  type: 'auto' | 'manual' | 'milestone'
  changesSummary?: string
  aiContribution?: number
  author: 'user' | 'ai' | 'collaborative'
}

// Mock version history data
const mockVersions: DocumentVersion[] = [
  {
    id: 'v12',
    content: `# The Future of AI in Education\n\nArtificial Intelligence is revolutionizing the educational landscape in unprecedented ways. This essay explores the transformative impact of AI technologies on modern learning environments, examining both the opportunities and challenges that lie ahead.\n\n## Introduction\n\nThe integration of artificial intelligence in educational settings has moved beyond theoretical discussions to practical implementations that are reshaping how students learn and teachers instruct...`,
    wordCount: 1247,
    timestamp: new Date('2024-01-25T14:30:00'),
    description: 'Current version',
    type: 'manual',
    changesSummary: 'Added conclusion and references',
    aiContribution: 15,
    author: 'collaborative'
  },
  {
    id: 'v11',
    content: `# The Future of AI in Education\n\nArtificial Intelligence is revolutionizing the educational landscape in unprecedented ways. This essay explores the transformative impact of AI technologies on modern learning environments, examining both the opportunities and challenges that lie ahead.\n\n## Introduction\n\nThe integration of artificial intelligence in educational settings has moved beyond theoretical discussions to practical implementations...`,
    wordCount: 1156,
    timestamp: new Date('2024-01-25T13:45:00'),
    description: 'Added methodology section',
    type: 'auto',
    changesSummary: 'Expanded methodology with AI agent suggestions',
    aiContribution: 25,
    author: 'collaborative'
  },
  {
    id: 'v10',
    content: `# The Future of AI in Education\n\nArtificial Intelligence is revolutionizing the educational landscape. This essay explores the impact of AI on education.\n\n## Introduction\n\nAI in education is becoming more important...`,
    wordCount: 892,
    timestamp: new Date('2024-01-25T12:20:00'),
    description: 'Major revision milestone',
    type: 'milestone',
    changesSummary: 'Complete restructure of arguments',
    aiContribution: 35,
    author: 'collaborative'
  },
  {
    id: 'v9',
    content: `# AI in Education\n\nThis essay discusses artificial intelligence in schools and universities...`,
    wordCount: 654,
    timestamp: new Date('2024-01-25T11:15:00'),
    description: 'First draft completion',
    type: 'manual',
    changesSummary: 'Completed first draft',
    aiContribution: 20,
    author: 'user'
  },
  {
    id: 'v8',
    content: `# AI in Education Draft\n\nSome initial thoughts about AI in education...`,
    wordCount: 234,
    timestamp: new Date('2024-01-25T10:30:00'),
    description: 'Initial outline',
    type: 'auto',
    changesSummary: 'Auto-saved initial draft',
    aiContribution: 10,
    author: 'user'
  }
]

export function VersionHistory({ 
  documentContent, 
  onRestoreVersion, 
  onPreviewVersion,
  className = '' 
}: VersionHistoryProps) {
  const { 
    panels,
    toggleVersionHistory 
  } = useUiStore()

  const [versions, setVersions] = useState<DocumentVersion[]>(mockVersions)
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  // Create a new version
  const createVersion = useCallback((type: DocumentVersion['type'] = 'auto', description?: string) => {
    if (!documentContent) return

    const newVersion: DocumentVersion = {
      id: `v${versions.length + 1}`,
      content: documentContent,
      wordCount: documentContent.split(/\s+/).length,
      timestamp: new Date(),
      description: description || (type === 'auto' ? 'Auto-saved' : 'Manual save'),
      type,
      changesSummary: 'Content updated',
      aiContribution: 15, // TODO: Calculate actual AI contribution
      author: 'user'
    }

    setVersions(prev => [newVersion, ...prev])
    return newVersion.id
  }, [documentContent, versions.length])

  // Auto-save functionality
  useEffect(() => {
    if (!documentContent || !panels.isVersionHistoryOpen) return

    const autoSaveTimer = setTimeout(() => {
      // Check if content has changed significantly
      const currentWordCount = documentContent.split(/\s+/).length
      const lastVersion = versions[0]
      
      if (!lastVersion || Math.abs(currentWordCount - lastVersion.wordCount) > 10) {
        createVersion('auto')
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer)
  }, [documentContent, versions, createVersion, panels.isVersionHistoryOpen])

  const handleRestore = (version: DocumentVersion) => {
    onRestoreVersion?.(version.content)
    setSelectedVersion(null)
    setPreviewMode(false)
  }

  const handlePreview = (version: DocumentVersion) => {
    setSelectedVersion(version)
    setPreviewMode(true)
    onPreviewVersion?.(version.content)
  }

  const handleClosePreview = () => {
    setSelectedVersion(null)
    setPreviewMode(false)
    // TODO: Restore original content
  }

  const handleDeleteVersion = (versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId))
  }

  const getVersionTypeIcon = (type: DocumentVersion['type']) => {
    switch (type) {
      case 'auto':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'manual':
        return <Save className="w-4 h-4 text-green-500" />
      case 'milestone':
        return <GitBranch className="w-4 h-4 text-purple-500" />
    }
  }

  const getAuthorColor = (author: DocumentVersion['author']) => {
    switch (author) {
      case 'user':
        return 'bg-blue-100 text-blue-800'
      case 'ai':
        return 'bg-purple-100 text-purple-800'
      case 'collaborative':
        return 'bg-green-100 text-green-800'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return timestamp.toLocaleDateString()
  }

  const getWordCountDiff = (currentWordCount: number, previousWordCount: number) => {
    const diff = currentWordCount - previousWordCount
    if (diff === 0) return null
    
    return {
      value: Math.abs(diff),
      type: diff > 0 ? 'added' : 'removed',
      color: diff > 0 ? 'text-green-600' : 'text-red-600',
      sign: diff > 0 ? '+' : '-'
    }
  }

  if (!panels.isVersionHistoryOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed top-16 left-4 w-96 max-h-[calc(100vh-6rem)] z-50 ${className}`}
      >
        <Card className="h-full flex flex-col glass-card shadow-2xl border bg-background/95 backdrop-blur-xl">
          {/* Header */}
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5 text-primary" />
                <span>Version History</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVersionHistory}
                className="w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => createVersion('manual', 'Manual checkpoint')}
                disabled={!documentContent}
                className="text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Point
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => createVersion('milestone', 'Milestone checkpoint')}
                disabled={!documentContent}
                className="text-xs"
              >
                <GitBranch className="w-3 h-3 mr-1" />
                Milestone
              </Button>
            </div>
          </CardHeader>

          <Separator />

          {/* Preview Mode Header */}
          {previewMode && selectedVersion && (
            <div className="flex-shrink-0 p-4 bg-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-800">Preview Mode</h3>
                  <p className="text-sm text-blue-600">{selectedVersion.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleRestore(selectedVersion)}
                    className="text-xs"
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClosePreview}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Visualization */}
          {versions.length > 1 && (
            <div className="flex-shrink-0 p-4 border-b">
              <div className="relative">
                <div className="w-full h-2 bg-muted rounded-full">
                  <div 
                    className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{versions[versions.length - 1]?.wordCount || 0} words</span>
                  <span>{versions[0]?.wordCount || 0} words</span>
                </div>
              </div>
            </div>
          )}

          {/* Versions List */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto p-4 space-y-3">
              {versions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No version history yet</p>
                  <p className="text-xs mt-1">Start editing to create automatic save points</p>
                </div>
              ) : (
                <AnimatePresence>
                  {versions.map((version, index) => {
                    const previousVersion = versions[index + 1]
                    const wordDiff = previousVersion ? 
                      getWordCountDiff(version.wordCount, previousVersion.wordCount) : null

                    return (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`group relative ${
                          selectedVersion?.id === version.id ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <Card className={`hover:shadow-md transition-all cursor-pointer border ${
                          version.type === 'milestone' ? 'border-purple-200 bg-purple-50' : ''
                        }`}>
                          <CardContent className="p-4">
                            {/* Version Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getVersionTypeIcon(version.type)}
                                <span className="font-medium text-sm">{version.id}</span>
                                <Badge className={getAuthorColor(version.author)}>
                                  {version.author}
                                </Badge>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                {formatTimestamp(version.timestamp)}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mb-2">
                              {version.description}
                            </p>

                            {/* Changes Summary */}
                            {version.changesSummary && (
                              <p className="text-xs text-muted-foreground mb-2 italic">
                                {version.changesSummary}
                              </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-3">
                                <span className="flex items-center">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {version.wordCount} words
                                </span>
                                
                                {wordDiff && (
                                  <span className={`flex items-center ${wordDiff.color}`}>
                                    {wordDiff.sign}{wordDiff.value} words
                                  </span>
                                )}

                                {version.aiContribution !== undefined && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    {version.aiContribution}% AI
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePreview(version)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRestore(version)}
                                  className="h-6 px-2 text-xs"
                                  disabled={index === 0} // Can't restore current version
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Restore
                                </Button>
                              </div>

                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // TODO: Download version as file
                                    console.log('Download version:', version.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Download version"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                
                                {index > 0 && version.type !== 'milestone' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteVersion(version.id)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    title="Delete version"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Timeline Connector */}
                        {index < versions.length - 1 && (
                          <div className="absolute left-6 top-full w-px h-3 bg-border" />
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </CardContent>

          {/* Footer Statistics */}
          <div className="flex-shrink-0 p-4 border-t bg-muted/30">
            <div className="text-xs text-muted-foreground text-center">
              <div className="flex justify-between items-center">
                <span>{versions.length} versions</span>
                <span>
                  {versions.reduce((total, v) => total + (v.aiContribution || 0), 0) / versions.length || 0}% avg AI contribution
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}