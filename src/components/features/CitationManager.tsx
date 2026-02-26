import { useState, useCallback, useEffect } from 'react'
import { Search, X, BookOpen, ExternalLink, Plus, Copy, Check, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Cite } from 'citation-js'

interface Citation {
  id: string
  title: string
  authors: string[]
  year: number
  type: 'journal' | 'book' | 'website' | 'conference' | 'thesis' | 'other'
  doi?: string
  url?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  credibilityScore: number // 0-100
  tags: string[]
  added: Date
  lastAccessed?: Date
}

interface CitationManagerProps {
  onInsertCitation?: (citation: Citation, format: CitationFormat) => void
  className?: string
}

type CitationFormat = 'APA' | 'MLA' | 'Chicago' | 'Harvard'

// Mock citations data
const mockCitations: Citation[] = [
  {
    id: '1',
    title: 'The Impact of Artificial Intelligence on Modern Education',
    authors: ['Smith, J.', 'Johnson, M.'],
    year: 2023,
    type: 'journal',
    doi: '10.1234/example.2023',
    journal: 'Journal of Educational Technology',
    volume: '45',
    issue: '3',
    pages: '123-145',
    credibilityScore: 95,
    tags: ['AI', 'Education', 'Technology'],
    added: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Machine Learning Fundamentals',
    authors: ['Brown, A.', 'Davis, K.', 'Wilson, R.'],
    year: 2022,
    type: 'book',
    publisher: 'Tech Publications',
    credibilityScore: 88,
    tags: ['Machine Learning', 'Computer Science'],
    added: new Date('2024-01-10')
  },
  {
    id: '3',
    title: 'Climate Change and Global Warming Trends',
    authors: ['García, L.'],
    year: 2024,
    type: 'website',
    url: 'https://example.com/climate-trends',
    credibilityScore: 72,
    tags: ['Climate', 'Environment', 'Data Analysis'],
    added: new Date('2024-01-20')
  }
]

export function CitationManager({ onInsertCitation, className = '' }: CitationManagerProps) {
  const { 
    panels,
    toggleCitationManager,
    setCitationManagerPosition 
  } = useUiStore()

  const [citations, setCitations] = useState<Citation[]>(mockCitations)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('APA')
  const [filteredCitations, setFilteredCitations] = useState<Citation[]>(citations)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filter citations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCitations(citations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = citations.filter(citation => 
      citation.title.toLowerCase().includes(query) ||
      citation.authors.some(author => author.toLowerCase().includes(query)) ||
      citation.tags.some(tag => tag.toLowerCase().includes(query)) ||
      citation.journal?.toLowerCase().includes(query) ||
      citation.publisher?.toLowerCase().includes(query)
    )
    
    setFilteredCitations(filtered)
  }, [searchQuery, citations])

  const formatCitation = useCallback((citation: Citation, format: CitationFormat): string => {
    try {
      const citeData = {
        title: citation.title,
        author: citation.authors.map(a => ({ literal: a })),
        issued: { 'date-parts': [[citation.year]] },
        type: citation.type === 'journal' ? 'article-journal' : 
              citation.type === 'book' ? 'book' : 
              citation.type === 'website' ? 'webpage' : 'article',
        ...(citation.journal && { 'container-title': citation.journal }),
        ...(citation.volume && { volume: citation.volume }),
        ...(citation.issue && { issue: citation.issue }),
        ...(citation.pages && { page: citation.pages }),
        ...(citation.publisher && { publisher: citation.publisher }),
        ...(citation.doi && { DOI: citation.doi }),
        ...(citation.url && { URL: citation.url })
      }

      const cite = new Cite(citeData)
      const style = format.toLowerCase() === 'chicago' ? 'chicago-author-date' : 
                   format.toLowerCase() === 'mla' ? 'modern-language-association' :
                   format.toLowerCase() === 'harvard' ? 'harvard1' :
                   'apa'
      
      return cite.format('bibliography', { format: 'text', template: style })
    } catch (error) {
      console.error('Citation formatting error:', error)
      
      // Fallback manual formatting
      const authors = citation.authors.join(', ')
      switch (format) {
        case 'APA':
          return `${authors} (${citation.year}). ${citation.title}. ${citation.journal || citation.publisher || 'Retrieved from ' + citation.url}`
        case 'MLA':
          return `${authors}. "${citation.title}." ${citation.journal || citation.publisher}, ${citation.year}.`
        case 'Chicago':
          return `${authors}. "${citation.title}." ${citation.journal || citation.publisher} ${citation.year}.`
        case 'Harvard':
          return `${authors} ${citation.year}, '${citation.title}', ${citation.journal || citation.publisher}.`
        default:
          return `${authors} (${citation.year}). ${citation.title}.`
      }
    }
  }, [])

  const handleInsertCitation = (citation: Citation) => {
    onInsertCitation?.(citation, selectedFormat)
    // Update last accessed
    setCitations(prev => 
      prev.map(c => 
        c.id === citation.id 
          ? { ...c, lastAccessed: new Date() }
          : c
      )
    )
  }

  const handleCopyCitation = async (citation: Citation) => {
    const formattedCitation = formatCitation(citation, selectedFormat)
    
    try {
      await navigator.clipboard.writeText(formattedCitation)
      setCopiedId(citation.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy citation:', error)
    }
  }

  const getCredibilityColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  if (!panels.isCitationManagerOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: panels.citationManagerPosition === 'right' ? 400 : -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: panels.citationManagerPosition === 'right' ? 400 : -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`
          fixed top-16 ${panels.citationManagerPosition === 'right' ? 'right-4' : 'left-4'} 
          w-96 max-h-[calc(100vh-6rem)] z-50 
          ${className}
        `}
      >
        <Card className="h-full flex flex-col glass-card shadow-2xl border bg-background/95 backdrop-blur-xl">
          {/* Header */}
          <CardHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Citations</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCitationManagerPosition(
                    panels.citationManagerPosition === 'right' ? 'left' : 'right'
                  )}
                  className="w-8 h-8"
                  title="Move panel"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCitationManager}
                  className="w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search citations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Format Selector */}
            <div className="flex space-x-2">
              {(['APA', 'MLA', 'Chicago', 'Harvard'] as CitationFormat[]).map((format) => (
                <Button
                  key={format}
                  variant={selectedFormat === format ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFormat(format)}
                  className="text-xs"
                >
                  {format}
                </Button>
              ))}
            </div>
          </CardHeader>

          <Separator />

          {/* Citations List */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {filteredCitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  {searchQuery ? 'No citations found' : 'No citations added yet'}
                </div>
              ) : (
                <AnimatePresence>
                  {filteredCitations.map((citation) => (
                    <motion.div
                      key={citation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                        <CardContent className="p-4">
                          {/* Citation Header */}
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-sm leading-5 line-clamp-2 flex-1">
                              {citation.title}
                            </h3>
                            <Badge className={`ml-2 text-xs ${getCredibilityColor(citation.credibilityScore)}`}>
                              {citation.credibilityScore}%
                            </Badge>
                          </div>

                          {/* Authors and Year */}
                          <p className="text-xs text-muted-foreground mb-2">
                            {citation.authors.slice(0, 2).join(', ')}
                            {citation.authors.length > 2 && ` et al.`} ({citation.year})
                          </p>

                          {/* Source Info */}
                          {(citation.journal || citation.publisher) && (
                            <p className="text-xs text-muted-foreground mb-2 italic">
                              {citation.journal || citation.publisher}
                            </p>
                          )}

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {citation.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleInsertCitation(citation)}
                                className="text-xs h-7 px-3"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Insert
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyCitation(citation)}
                                className="text-xs h-7 px-3"
                              >
                                {copiedId === citation.id ? (
                                  <Check className="w-3 h-3 mr-1 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 mr-1" />
                                )}
                                {copiedId === citation.id ? 'Copied' : 'Copy'}
                              </Button>
                            </div>
                            
                            {(citation.doi || citation.url) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(citation.doi ? `https://doi.org/${citation.doi}` : citation.url, '_blank')}
                                className="text-xs h-7 px-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </CardContent>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t">
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => {
                // TODO: Implement add citation modal
                console.log('Add new citation')
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Citation
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}