import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AtlasTools, ProseTools, CiteTools, EulerTools, SocratesTools, MnemoTools } from '@/agents/realTools'

export function ToolTester() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testWebSearch = async () => {
    setLoading(true)
    try {
      const result = await AtlasTools.webSearch({ query: 'artificial intelligence' })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testGrammarCheck = async () => {
    setLoading(true)
    try {
      const result = await ProseTools.checkGrammar({ 
        text: 'This are a test sentence with grammar error. I has been writing for a long time.' 
      })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testCitation = async () => {
    setLoading(true)
    try {
      const result = await CiteTools.formatCitation({
        source_info: 'Author: John Smith, Title: "AI Research", Year: 2023, Publisher: MIT Press',
        citation_style: 'APA'
      })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testMathEquation = async () => {
    setLoading(true)
    try {
      const result = await EulerTools.formatEquation({
        equation: 'E = mc^2',
        display_mode: 'block'
      })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testArgumentAnalysis = async () => {
    setLoading(true)
    try {
      const result = await SocratesTools.analyzeArgument({
        argument: 'All students should use AI tools because they improve learning outcomes. Since AI provides instant feedback, it helps students learn faster. Therefore, schools must adopt AI technologies.'
      })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testFlashcards = async () => {
    setLoading(true)
    try {
      const result = await MnemoTools.createFlashcards({
        content: 'Photosynthesis is the process by which plants convert light energy into chemical energy. Chlorophyll is the green pigment that captures sunlight. The Calvin cycle occurs in the chloroplasts and produces glucose.'
      })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Real API Tool Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button onClick={testWebSearch} disabled={loading}>
              Test Web Search (DuckDuckGo + Wikipedia)
            </Button>
            <Button onClick={testGrammarCheck} disabled={loading}>
              Test Grammar Check (NLP)
            </Button>
            <Button onClick={testCitation} disabled={loading}>
              Test Citation Formatting
            </Button>
            <Button onClick={testMathEquation} disabled={loading}>
              Test Math Equation (KaTeX)
            </Button>
            <Button onClick={testArgumentAnalysis} disabled={loading}>
              Test Argument Analysis (NLP)
            </Button>
            <Button onClick={testFlashcards} disabled={loading}>
              Test Flashcard Generation (NLP)
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Testing API...</p>
            </div>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}