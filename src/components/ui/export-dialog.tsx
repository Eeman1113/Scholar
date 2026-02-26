import { useState } from 'react'
import { X, Download, FileText, Globe, Book, PenTool, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Separator } from './separator'
import { useExport, type ExportOptions } from '@/hooks/useExport'
import { useDocumentStore } from '@/store/documentStore'
import { cn } from '@/lib/utils'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const formatOptions = [
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Plain text with formatting syntax',
    icon: FileText,
    extension: '.md',
    compatibility: 'Universal - works with GitHub, Notion, etc.'
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web-formatted document',
    icon: Globe,
    extension: '.html',
    compatibility: 'Opens in any web browser'
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Simple text without formatting',
    icon: PenTool,
    extension: '.txt',
    compatibility: 'Compatible with any text editor'
  },
  {
    id: 'docx',
    name: 'Word Document',
    description: 'Microsoft Word format (exported as HTML)',
    icon: Book,
    extension: '.html',
    compatibility: 'Can be opened in Word, Google Docs'
  }
] as const

export function ExportDialog({ isOpen, onClose, className = '' }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('markdown')
  const [includeCitations, setIncludeCitations] = useState(true)
  const [includeAiReport, setIncludeAiReport] = useState(false)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [customFilename, setCustomFilename] = useState('')

  const { title, wordCount, aiContributions } = useDocumentStore()
  const { isExporting, error, exportDocument, clearError } = useExport()

  if (!isOpen) return null

  const handleExport = async () => {
    await exportDocument({
      format: selectedFormat,
      includeCitations,
      includeAiReport,
      includeMetadata,
      filename: customFilename.trim() || undefined
    })

    if (!error) {
      onClose()
    }
  }

  const selectedFormatInfo = formatOptions.find(f => f.id === selectedFormat)
  const hasAiContributions = aiContributions.length > 0

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
      className
    )}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Export Document</CardTitle>
              <CardDescription className="mt-1">
                Export "{title}" in your preferred format
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Document Stats */}
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            <Badge variant="outline">
              {wordCount.toLocaleString()} words
            </Badge>
            {hasAiContributions && (
              <Badge variant="info">
                {aiContributions.length} AI contribution{aiContributions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 border border-red-200 bg-red-50 rounded-lg text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-auto h-6 w-6 p-0 text-red-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Export Format</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formatOptions.map((format) => {
                const Icon = format.icon
                const isSelected = selectedFormat === format.id

                return (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id as ExportOptions['format'])}
                    className={cn(
                      "relative flex flex-col items-start p-4 border rounded-lg text-left transition-colors hover:bg-accent/50",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{format.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format.extension}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {format.description}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      {format.compatibility}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Export Options</h3>
            
            <div className="space-y-3">
              {/* Metadata */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <div>
                  <span className="text-sm font-medium">Include Metadata</span>
                  <p className="text-xs text-muted-foreground">
                    Document title, type, word count, and export date
                  </p>
                </div>
              </label>

              {/* Citations */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCitations}
                  onChange={(e) => setIncludeCitations(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <div>
                  <span className="text-sm font-medium">Include Citations</span>
                  <p className="text-xs text-muted-foreground">
                    Preserve citation formatting and references
                  </p>
                </div>
              </label>

              {/* AI Report */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAiReport}
                  onChange={(e) => setIncludeAiReport(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                  disabled={!hasAiContributions}
                />
                <div>
                  <span className={cn(
                    "text-sm font-medium",
                    !hasAiContributions && "text-muted-foreground"
                  )}>
                    Include AI Contribution Report
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {hasAiContributions
                      ? 'Detailed report of all AI assistance used'
                      : 'No AI contributions to report'
                    }
                  </p>
                </div>
              </label>
            </div>

            {/* Custom Filename */}
            <div className="space-y-2">
              <label htmlFor="filename" className="text-sm font-medium">
                Custom Filename (optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="filename"
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="Leave empty for auto-generated name"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">
                  {selectedFormatInfo?.extension}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Exporting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export {selectedFormatInfo?.name}
                </div>
              )}
            </Button>
          </div>

          {/* Preview Information */}
          {selectedFormatInfo && (
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">Export Preview:</p>
              <p>Format: {selectedFormatInfo.name} ({selectedFormatInfo.extension})</p>
              <p>Size: ~{Math.round(wordCount * 6)} characters</p>
              {includeAiReport && hasAiContributions && (
                <p>+ AI contribution report with {aiContributions.length} entries</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}