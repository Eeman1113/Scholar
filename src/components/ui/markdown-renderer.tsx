import React, { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

// Import KaTeX CSS for math rendering
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
  enableMath?: boolean
  enableCodeHighlighting?: boolean
  enableGitHubFlavored?: boolean
  allowRawHTML?: boolean
  components?: Record<string, React.ComponentType<any>>
  isPreview?: boolean
  onTogglePreview?: () => void
}

export function MarkdownRenderer({
  content,
  className = '',
  enableMath = true,
  enableCodeHighlighting = true,
  enableGitHubFlavored = true,
  allowRawHTML = false,
  components = {},
  isPreview: _isPreview = false,
  onTogglePreview: _onTogglePreview
}: MarkdownRendererProps) {
  const remarkPlugins = useMemo(() => {
    const plugins: any[] = []
    
    if (enableGitHubFlavored) {
      plugins.push(remarkGfm)
    }
    
    if (enableMath) {
      plugins.push(remarkMath)
    }
    
    return plugins
  }, [enableGitHubFlavored, enableMath])

  const rehypePlugins = useMemo(() => {
    const plugins: any[] = []
    
    if (allowRawHTML) {
      plugins.push(rehypeRaw)
    }
    
    if (enableMath) {
      plugins.push(rehypeKatex)
    }
    
    if (enableCodeHighlighting) {
      plugins.push([
        rehypeHighlight,
        {
          detect: true,
          ignoreMissing: true
        }
      ])
    }
    
    return plugins
  }, [allowRawHTML, enableMath, enableCodeHighlighting])

  const defaultComponents = useMemo(() => ({
    // Headers
    h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 
        className={cn(
          "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl mb-4",
          className
        )} 
        {...props} 
      />
    ),
    h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 
        className={cn(
          "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mb-3 mt-6",
          className
        )} 
        {...props} 
      />
    ),
    h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 
        className={cn(
          "scroll-m-20 text-2xl font-semibold tracking-tight mb-2 mt-4",
          className
        )} 
        {...props} 
      />
    ),
    h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 
        className={cn(
          "scroll-m-20 text-xl font-semibold tracking-tight mb-2 mt-3",
          className
        )} 
        {...props} 
      />
    ),
    h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h5 
        className={cn(
          "scroll-m-20 text-lg font-semibold tracking-tight mb-1 mt-2",
          className
        )} 
        {...props} 
      />
    ),
    h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h6 
        className={cn(
          "scroll-m-20 text-base font-semibold tracking-tight mb-1 mt-2",
          className
        )} 
        {...props} 
      />
    ),
    
    // Paragraphs and text
    p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p 
        className={cn(
          "leading-7 mb-4 [&:not(:first-child)]:mt-4",
          className
        )} 
        {...props} 
      />
    ),
    
    // Lists
    ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul 
        className={cn(
          "my-4 ml-6 list-disc [&>li]:mt-1",
          className
        )} 
        {...props} 
      />
    ),
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol 
        className={cn(
          "my-4 ml-6 list-decimal [&>li]:mt-1",
          className
        )} 
        {...props} 
      />
    ),
    li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li 
        className={cn(
          "leading-6",
          className
        )} 
        {...props} 
      />
    ),
    
    // Blockquotes
    blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote 
        className={cn(
          "mt-6 border-l-4 border-primary/30 pl-6 italic text-muted-foreground bg-muted/30 py-2 rounded-r-md",
          className
        )} 
        {...props} 
      />
    ),
    
    // Code
    code: ({ className, inline, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => (
      <code 
        className={cn(
          inline 
            ? "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
            : "block",
          className
        )} 
        {...props} 
      />
    ),
    pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre 
        className={cn(
          "mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-sm",
          className
        )} 
        {...props} 
      />
    ),
    
    // Tables
    table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="my-6 w-full overflow-y-auto">
        <table 
          className={cn(
            "relative w-full overflow-hidden rounded-md border text-sm",
            className
          )} 
          {...props} 
        />
      </div>
    ),
    thead: ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead 
        className={cn(
          "bg-muted",
          className
        )} 
        {...props} 
      />
    ),
    tbody: ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody 
        className={cn(
          "[&_tr:last-child]:border-0",
          className
        )} 
        {...props} 
      />
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr 
        className={cn(
          "border-b transition-colors hover:bg-muted/50",
          className
        )} 
        {...props} 
      />
    ),
    th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th 
        className={cn(
          "h-10 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
          className
        )} 
        {...props} 
      />
    ),
    td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td 
        className={cn(
          "p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
          className
        )} 
        {...props} 
      />
    ),
    
    // Links
    a: ({ className, ...props }: React.HTMLAttributes<HTMLAnchorElement>) => (
      <a 
        className={cn(
          "font-medium underline underline-offset-4 hover:text-primary transition-colors",
          className
        )} 
        {...props} 
      />
    ),
    
    // Emphasis
    em: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <em 
        className={cn(
          "italic",
          className
        )} 
        {...props} 
      />
    ),
    strong: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong 
        className={cn(
          "font-semibold",
          className
        )} 
        {...props} 
      />
    ),
    
    // Horizontal rule
    hr: ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
      <hr 
        className={cn(
          "my-8 border-border",
          className
        )} 
        {...props} 
      />
    ),
    
    // Images
    img: ({ className, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img 
        className={cn(
          "rounded-md border my-4 max-w-full h-auto",
          className
        )}
        alt={alt}
        loading="lazy"
        {...props} 
      />
    ),
    
    // Task lists (GitHub Flavored Markdown)
    input: ({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            className={cn(
              "mr-2 rounded border-border focus:ring-primary",
              className
            )}
            {...props}
          />
        )
      }
      return <input type={type} className={className} {...props} />
    },
  }), [])

  const finalComponents = {
    ...defaultComponents,
    ...components
  }

  // Handle empty content
  if (!content || content.trim().length === 0) {
    return (
      <div className={cn(
        "text-muted-foreground italic text-center py-8",
        className
      )}>
        No content to display
      </div>
    )
  }

  return (
    <div className={cn(
      "prose prose-slate dark:prose-invert max-w-none",
      "prose-headings:font-semibold prose-headings:text-foreground",
      "prose-p:text-foreground prose-p:leading-relaxed",
      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
      "prose-strong:text-foreground prose-strong:font-semibold",
      "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
      "prose-pre:bg-muted prose-pre:border",
      "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
      "prose-th:text-foreground prose-td:text-foreground",
      className
    )}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={finalComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Specialized markdown renderers for specific use cases
export function MessageMarkdownRenderer({ 
  content, 
  className = '', 
  ...props 
}: MarkdownRendererProps) {
  return (
    <MarkdownRenderer
      content={content}
      className={cn(
        "text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      enableMath={true}
      enableCodeHighlighting={true}
      enableGitHubFlavored={true}
      {...props}
    />
  )
}

export function DocumentMarkdownRenderer({ 
  content, 
  className = '', 
  ...props 
}: MarkdownRendererProps) {
  return (
    <MarkdownRenderer
      content={content}
      className={cn(
        "max-w-4xl mx-auto",
        className
      )}
      enableMath={true}
      enableCodeHighlighting={true}
      enableGitHubFlavored={true}
      allowRawHTML={true}
      {...props}
    />
  )
}

export function PreviewMarkdownRenderer({ 
  content, 
  className = '', 
  ...props 
}: MarkdownRendererProps) {
  return (
    <MarkdownRenderer
      content={content}
      className={cn(
        "text-sm text-muted-foreground [&>*]:mb-2 [&>*:last-child]:mb-0",
        className
      )}
      enableMath={false}
      enableCodeHighlighting={false}
      enableGitHubFlavored={false}
      {...props}
    />
  )
}

// Aliases for backward compatibility
export const MarkdownPreview = MarkdownRenderer

// Utility functions
export function useMarkdownCopy() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  const copyMarkdown = async (text: string) => {
    return copyToClipboard(text)
  }

  return { 
    copyToClipboard,
    copyMarkdown,
    copied
  }
}

export function hasMarkdownSyntax(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headers
    /\*\*.*?\*\*/,           // Bold
    /\*.*?\*/,               // Italic
    /\[.*?\]\(.*?\)/,        // Links
    /`.*?`/,                 // Inline code
    /^```[\s\S]*?```$/m,     // Code blocks
    /^[-*+]\s+/m,            // Lists
    /^\d+\.\s+/m,            // Numbered lists
    /^>/m,                   // Blockquotes
  ]

  return markdownPatterns.some(pattern => pattern.test(text))
}