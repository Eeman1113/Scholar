import { useState, useCallback } from 'react'
import TurndownService from 'turndown'
import { useDocumentStore } from '@/store/documentStore'

export interface ExportOptions {
  format: 'markdown' | 'docx' | 'pdf' | 'html' | 'txt'
  includeCitations: boolean
  includeAiReport: boolean
  includeMetadata: boolean
  filename?: string
}

export interface ExportHook {
  isExporting: boolean
  error: string | null
  exportDocument: (options: ExportOptions) => Promise<void>
  generateAiReport: () => string
  downloadFile: (content: string, filename: string, type: string) => void
  clearError: () => void
}

export function useExport(): ExportHook {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const documentStore = useDocumentStore()
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  })

  const generateAiReport = useCallback((): string => {
    const {
      aiContributions,
      wordCount,
      title,
      documentType,
      academicLevel
    } = documentStore

    const totalAiWords = aiContributions.reduce((acc, contrib) => {
      return acc + (contrib.endPos - contrib.startPos) / 5 // Rough word estimate
    }, 0)
    
    const aiPercentage = wordCount > 0 ? Math.round((totalAiWords / wordCount) * 100) : 0

    const report = `
# AI Contribution Report

**Document**: ${title}
**Type**: ${documentType}
**Academic Level**: ${academicLevel}
**Generated**: ${new Date().toLocaleString()}

## Summary
- **Total Words**: ${wordCount.toLocaleString()}
- **AI Contributed Words**: ~${Math.round(totalAiWords).toLocaleString()}
- **AI Contribution Percentage**: ${aiPercentage}%

## AI Contributions Breakdown
${aiContributions.length === 0 ? 'No AI contributions recorded.' : aiContributions.map((contrib, index) => `
### Contribution ${index + 1}
- **Type**: ${contrib.type}
- **Position**: Characters ${contrib.startPos}-${contrib.endPos}
- **Length**: ${contrib.endPos - contrib.startPos} characters
- **Date**: ${new Date(contrib.timestamp).toLocaleString()}
- **Status**: ${contrib.accepted ? 'Accepted' : 'Pending'}
- **Content Preview**: "${contrib.content.substring(0, 100)}${contrib.content.length > 100 ? '...' : ''}"
`).join('\n')}

## Academic Integrity Statement
This report documents all AI assistance used in creating this document. The human author:
- Initiated all AI requests
- Reviewed and edited all AI suggestions
- Takes responsibility for the final content
- Used AI as a writing aid, not as a replacement for original thought

---
*This report was generated automatically by Scholar AI Workspace*
    `.trim()

    return report
  }, [documentStore])

  const exportToMarkdown = useCallback((content: string): string => {
    // Convert HTML content to Markdown
    try {
      return turndownService.turndown(content)
    } catch {
      // If conversion fails, clean up HTML tags manually
      return content
        .replace(/<h([1-6])>/g, (_, level) => '#'.repeat(parseInt(level)) + ' ')
        .replace(/<\/h[1-6]>/g, '\n\n')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
        .replace(/\n{3,}/g, '\n\n') // Clean up multiple newlines
    }
  }, [turndownService])

  const exportToHTML = useCallback((content: string, title: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        h1 { font-size: 2.5rem; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.5rem; }
        p { margin-bottom: 1rem; }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 1rem;
            margin-left: 0;
            font-style: italic;
            color: #555;
        }
        pre, code {
            background-color: #f8f9fa;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        pre {
            padding: 1rem;
            overflow-x: auto;
        }
        code {
            padding: 0.2rem 0.4rem;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 0.75rem;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .metadata {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 2rem;
            padding: 1rem;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .ai-contribution {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 0.5rem;
            margin: 0.5rem 0;
            border-radius: 0 4px 4px 0;
        }
    </style>
</head>
<body>
    <div class="metadata">
        <strong>${title}</strong><br>
        Generated: ${new Date().toLocaleString()}<br>
        Word count: ${content.split(/\s+/).length.toLocaleString()}<br>
        Exported from Scholar AI Workspace
    </div>
    ${content}
</body>
</html>`
  }, [])

  const exportToPlainText = useCallback((content: string): string => {
    // Strip all HTML and convert to plain text
    return content
      .replace(/<script[^>]*>.*?<\/script>/gs, '') // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gs, '') // Remove styles
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&lt;/g, '<') // Decode HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n') // Clean up multiple newlines
      .trim()
  }, [])

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      setError(`Failed to download file: ${error}`)
    }
  }, [])

  const exportDocument = useCallback(async (options: ExportOptions) => {
    setIsExporting(true)
    setError(null)

    try {
      const {
        content: documentContent,
        title,
        documentType,
        academicLevel,
        wordCount
      } = documentStore

      if (!documentContent.trim()) {
        throw new Error('Cannot export empty document')
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const safeTitle = title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_')
      const baseFilename = options.filename || `${safeTitle}_${timestamp}`

      let exportContent = documentContent
      let finalContent = ''
      let mimeType = 'text/plain'

      // Add metadata if requested
      if (options.includeMetadata) {
        const metadata = `Title: ${title}
Type: ${documentType}
Academic Level: ${academicLevel}
Word Count: ${wordCount.toLocaleString()}
Exported: ${new Date().toLocaleString()}
Generated by: Scholar AI Workspace

---

`
        exportContent = metadata + documentContent
      }

      // Generate format-specific content
      switch (options.format) {
        case 'markdown':
          finalContent = exportToMarkdown(exportContent)
          mimeType = 'text/markdown'
          break
          
        case 'html':
          finalContent = exportToHTML(exportContent, title)
          mimeType = 'text/html'
          break
          
        case 'txt':
          finalContent = exportToPlainText(exportContent)
          mimeType = 'text/plain'
          break
          
        case 'docx':
          // For DOCX, we'll export as HTML with Word-compatible styles
          finalContent = `
            <html>
              <head>
                <meta charset="utf-8">
                <title>${title}</title>
              </head>
              <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">
                ${exportContent}
              </body>
            </html>
          `
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
          
        case 'pdf':
          // For PDF, we'll create HTML and suggest browser printing
          finalContent = exportToHTML(exportContent, title)
          mimeType = 'text/html'
          alert('To convert to PDF, please use your browser\'s print function and select "Save as PDF"')
          break
          
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      // Add AI report if requested
      if (options.includeAiReport) {
        const aiReport = generateAiReport()
        
        switch (options.format) {
          case 'markdown':
            finalContent += '\n\n---\n\n' + aiReport
            break
          case 'html':
            finalContent = finalContent.replace('</body>', `
              <hr>
              <div class="ai-report">
                ${aiReport.replace(/\n/g, '<br>').replace(/^#+ (.+)$/gm, '<h3>$1</h3>')}
              </div>
              </body>
            `)
            break
          case 'txt':
            finalContent += '\n\n' + '='.repeat(50) + '\n\n' + aiReport
            break
          default:
            finalContent += '\n\n' + aiReport
        }
      }

      // Determine file extension
      let extension = options.format
      if (options.format === 'docx') extension = 'html' // Will be HTML until proper DOCX support
      
      const filename = `${baseFilename}.${extension}`

      // Download the file
      downloadFile(finalContent, filename, mimeType)

      // Show success message (you might want to use a toast notification instead)
      console.log(`Document exported successfully as ${filename}`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      setError(errorMessage)
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }, [documentStore, generateAiReport, exportToMarkdown, exportToHTML, exportToPlainText, downloadFile])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isExporting,
    error,
    exportDocument,
    generateAiReport,
    downloadFile,
    clearError
  }
}