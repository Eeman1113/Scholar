import { useState } from 'react'
import { MarkdownPreview } from '@/components/ui/markdown-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Eye, EyeOff } from 'lucide-react'

const sampleMarkdown = `# Markdown Demo for Scholar AI

This demonstrates the **full markdown support** now available in Scholar AI.

## Features Showcase

### Text Formatting
- **Bold text** for emphasis
- *Italic text* for subtle emphasis  
- ~~Strikethrough text~~ for corrections
- \`inline code\` for technical terms

### Mathematical Equations
Inline math: $E = mc^2$ and $\\sum_{i=1}^{n} x_i$

Block equations:
$$
\\frac{d}{dx}\\int_{a}^{x} f(t) dt = f(x)
$$

### Code Blocks with Syntax Highlighting

\`\`\`javascript
// AI Agent Example
class ScholarAgent {
  constructor(name, expertise) {
    this.name = name;
    this.expertise = expertise;
  }
  
  async processQuery(query) {
    const context = await this.analyzeContext(query);
    return await this.generateResponse(context);
  }
}

const sage = new ScholarAgent('Sage', 'orchestration');
\`\`\`

\`\`\`python
# Data Analysis Example
import pandas as pd
import numpy as np

def analyze_learning_data(student_data):
    """Analyze student learning patterns"""
    performance = pd.DataFrame(student_data)
    correlation = performance.corr()
    return {
        'mean_score': performance.score.mean(),
        'improvement_rate': calculate_improvement(performance)
    }
\`\`\`

### Tables

| Agent | Specialty | Status | Tools |
|-------|-----------|---------|--------|
| **Sage** | Orchestration | ✅ Active | Task delegation, Outlines |
| **Atlas** | Research | ✅ Active | Web search, Fact-check |
| **Prose** | Writing | ✅ Active | Grammar check, Style |
| **Cite** | Citations | ✅ Active | APA, MLA, Chicago |
| **Euler** | Math/Science | ✅ Active | Equations, Data analysis |
| **Socrates** | Critical Thinking | ✅ Active | Argument analysis |
| **Mnemo** | Study Materials | ✅ Active | Flashcards, Quizzes |

### Task Lists
- [x] ✅ Rich markdown rendering
- [x] ✅ GitHub Flavored Markdown support
- [x] ✅ Mathematical equations (KaTeX)
- [x] ✅ Syntax highlighting for code
- [x] ✅ Interactive tables and links
- [x] ✅ Copy-to-clipboard functionality
- [ ] 🚧 Mermaid diagram support (future)
- [ ] 📋 Custom markdown extensions

### Blockquotes

> 💡 **Scholar AI Tip**: You can now use full markdown in your conversations with AI agents! This enables rich formatting for research notes, technical documentation, and academic writing.

> ⚠️ **Note**: Mathematical equations are rendered using KaTeX, supporting LaTeX syntax for complex mathematical expressions.

### Links and References
- [OpenRouter API](https://openrouter.ai) for AI model access
- [Scholar AI Documentation](https://github.com/scholar-ai) 
- [Markdown Guide](https://www.markdownguide.org/) for syntax reference

### Advanced Features

#### Nested Lists with Mixed Content
1. **Research Phase**
   - Literature review
   - Source verification with \`Atlas\` agent
   - Citation formatting via \`Cite\` agent
   
2. **Writing Phase**  
   - Draft creation in rich text editor
   - Style improvement with \`Prose\` agent
   - Mathematical content via \`Euler\` agent
   
3. **Review Phase**
   - Critical analysis by \`Socrates\` agent
   - Study material generation via \`Mnemo\` agent
   - Final formatting and export

#### Complex Mathematical Expressions

The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Matrix operations:
$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

Statistical formulas:
$$
\\sigma = \\sqrt{\\frac{\\sum_{i=1}^{n}(x_i - \\mu)^2}{n}}
$$

---

## Summary

Scholar AI now provides **production-grade markdown support** with:
- 🎯 **Real-time rendering** in chat and editor
- 🔧 **Developer-friendly** code highlighting  
- 📊 **Academic formatting** with equations and tables
- 🎨 **Beautiful styling** that matches the app theme
- 📱 **Responsive design** for all screen sizes

*Ready to enhance your academic and research workflows!*`

export function MarkdownDemo() {
  const [isPreview, setIsPreview] = useState(true)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sampleMarkdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy markdown:', err)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Markdown Support Demo</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copied ? 'Copied!' : 'Copy Source'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className="text-xs"
              >
                {isPreview ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Show Source
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Show Preview
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownPreview
            content={sampleMarkdown}
            isPreview={isPreview}
            onTogglePreview={() => setIsPreview(!isPreview)}
          />
        </CardContent>
      </Card>
    </div>
  )
}