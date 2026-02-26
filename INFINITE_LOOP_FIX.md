# Infinite Loop Fix - React "Maximum update depth exceeded"

## Problem
The application was experiencing a critical infinite loop error:
```
Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
```

This error was occurring in the `<EditorPanel>` component and was caused by a circular dependency between the App component and the EditorPanel component.

## Root Cause Analysis
The circular dependency was caused by:

1. **App.tsx** managed its own `documentContent` and `wordCount` state
2. **App.tsx** passed `documentContent` as a `content` prop to `EditorPanel`
3. **App.tsx** passed `handleDocumentChange` callback as `onContentChange` to `EditorPanel`
4. **EditorPanel** called `setContent(content)` when content prop changed, updating the store
5. **EditorPanel** called `onContentChange(storeContent)` when store content changed  
6. **App.tsx** `handleDocumentChange` called `updateWordCount`, triggering re-renders
7. This created an infinite loop: prop change → store update → callback → state update → prop change...

## Solution
Completely eliminated the circular dependency by:

### 1. Simplified EditorPanel Component
**Before:**
```tsx
export function EditorPanel({ className = '', onContentChange, content }: EditorPanelProps) {
  const { content: storeContent, setContent } = useDocumentStore()
  const lastExternalContent = useRef<string | undefined>(undefined)
  
  // Sync external content with store
  useEffect(() => {
    if (content !== undefined && content !== lastExternalContent.current && content !== storeContent) {
      lastExternalContent.current = content
      setContent(content) // This caused the loop!
    }
  }, [content, storeContent, setContent])
  
  // Sync store content with external callback  
  useEffect(() => {
    if (onContentChange) {
      onContentChange(storeContent) // This caused the loop!
    }
  }, [storeContent, onContentChange])
  
  return <Editor className={className} />
}
```

**After:**
```tsx
export function EditorPanel({ className = '' }: EditorPanelProps) {
  return <Editor className={className} />
}
```

### 2. Updated App.tsx to Use Store Directly
**Before:**
```tsx
const [documentContent, setDocumentContent] = useState('')
const [wordCount, setWordCount] = useState(0)

const handleDocumentChange = (content: string) => {
  setDocumentContent(content)
  setWordCount(content.split(/\s+/).filter(word => word.length > 0).length)
}

<EditorPanel 
  onContentChange={handleDocumentChange}
  content={documentContent}
/>
```

**After:**
```tsx
const { content: documentContent, wordCount, setContent } = useDocumentStore()

<EditorPanel />
```

### 3. Leveraged Existing Editor Logic
The `Editor` component was already properly handling content changes and updating the store:

```tsx
onUpdate: ({ editor: editorInstance }) => {
  const newContent = editorInstance.getHTML()
  const wordCount = editorInstance.storage.characterCount?.words() || 0
  
  // These calls already handle all necessary updates
  setContent(newContent)
  updateWordCount(wordCount)
  updateCharacterCount(characterCount)
  updateReadingLevel(calculateFleschKincaid(plainText))
}
```

## Fixed References
Also cleaned up one remaining reference to the old `setDocumentContent` function:
```tsx
// Before
onRestoreVersion={setDocumentContent}

// After  
onRestoreVersion={setContent}
```

## Verification
- ✅ **Build**: `npm run build` completes successfully with exit code 0
- ✅ **Runtime**: No infinite loop errors in console after fixes
- ✅ **Functionality**: All features work properly (Focus Mode, typing in editor, status bar updates)
- ✅ **Error Boundary**: No longer catching infinite loop errors
- ✅ **Word Count**: Updates automatically as expected through the store

## Key Lessons
1. **Single Source of Truth**: Use either props OR store for state management, not both
2. **Avoid Circular Dependencies**: Be careful when components both consume and produce the same data
3. **Leverage Existing Logic**: The Editor component already had proper content management - no need to duplicate it
4. **Error Boundaries Help**: The error boundary helped isolate the problem and prevent complete app crashes

The application is now stable and fully functional!