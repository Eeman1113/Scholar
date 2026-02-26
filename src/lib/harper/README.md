# Harper.js Grammar & Spelling Check Integration

This directory contains the integration of Harper.js grammar and spelling checker into the Scholar application.

## Overview

Harper.js is a privacy-first, offline grammar checker that runs entirely on-device with no data sent to external servers. It provides fast grammar and spelling suggestions in under 10 milliseconds.

## Files

### `service.ts`
- **HarperService**: Main service class that wraps Harper.js functionality
- **HarperLint**: Interface for representing grammar/spelling errors
- **HarperSuggestion**: Interface for representing fix suggestions
- **HarperConfig**: Configuration options for the grammar checker

### Key Features:
- **Privacy-focused**: All processing happens locally
- **Worker support**: Uses Web Workers to prevent blocking the UI
- **Configurable**: Supports different English dialects
- **Dictionary management**: Add words to custom dictionary
- **Ignore functionality**: Ignore specific grammar suggestions

## TipTap Integration

### `../components/editor/extensions/HarperExtension.ts`
- Custom TipTap extension that integrates Harper.js with the rich text editor
- Provides real-time grammar checking with visual decorations
- Supports debounced linting to improve performance
- Emits custom DOM events for lint interactions

### Features:
- **Real-time checking**: Lints text as you type (with configurable debounce)
- **Visual decorations**: Underlines grammar issues with wavy lines
- **Click handling**: Click on underlined text to see suggestions
- **Commands**: TipTap commands for applying suggestions and managing dictionary

## UI Components

### `../components/editor/HarperSuggestions.tsx`
- Popup component that shows grammar suggestions when clicking on errors
- Displays error message, severity, and available fixes
- Supports applying suggestions, ignoring errors, and adding words to dictionary

### `../components/editor/HarperStatus.tsx`
- Status indicator in the editor toolbar
- Shows grammar checking state and error counts
- Toggle to enable/disable grammar checking

## Usage

### Basic Setup
```typescript
import { harperService } from '@/lib/harper/service'

// Initialize the service
await harperService.initialize()

// Lint text
const lints = await harperService.lintText('This are a test sentence.')

// Apply a suggestion
const correctedText = await harperService.applySuggestion(
  originalText, 
  lint, 
  suggestion
)
```

### TipTap Integration
```typescript
import HarperExtension from './extensions/HarperExtension'

const editor = useEditor({
  extensions: [
    // ... other extensions
    HarperExtension.configure({
      enabled: true,
      debounceMs: 1500,
      onLintUpdate: (lints) => {
        // Handle lint updates
      }
    })
  ]
})
```

## Configuration

The Harper service supports different English dialects:

- `Dialect.AmericanEnglish` (default)
- `Dialect.BritishEnglish`

```typescript
import { HarperService, Dialect } from '@/lib/harper/service'

const harper = new HarperService({
  dialect: Dialect.BritishEnglish,
  useWorker: true // Use Web Worker (recommended for web apps)
})
```

## Visual Styling

Grammar errors are styled with CSS classes:

- `.harper-lint`: Base style for all grammar errors
- `.harper-lint--error`: Spelling errors (red underline)
- `.harper-lint--warning`: Grammar warnings (yellow underline)
- `.harper-lint--info`: Info suggestions (blue underline)

The styles include hover effects and dark mode support.

## Performance

- **Web Workers**: Grammar checking runs in a separate thread to avoid blocking the UI
- **Debounced linting**: Text is only checked after the user stops typing (1.5s default)
- **Efficient decorations**: Only visible lints are rendered as TipTap decorations
- **Memory management**: Proper cleanup and disposal of Harper instances

## Privacy & Security

- **No network requests**: All grammar checking happens locally
- **No data collection**: No user text is sent to external services
- **Offline capable**: Works without internet connection
- **WASM-based**: Uses WebAssembly for fast, native-speed processing

## Error Handling

The integration includes comprehensive error handling:

- Graceful degradation if Harper.js fails to initialize
- Console warnings for non-critical errors
- Safe fallbacks for all asynchronous operations
- Proper disposal and cleanup

## Browser Compatibility

Harper.js requires modern browser features:

- WebAssembly support
- Web Workers (for optimal performance)
- ES2018+ features

Falls back to LocalLinter if Web Workers are not available (e.g., in Node.js environments).

## Future Enhancements

Potential improvements:

- Custom rule configuration
- Multiple language support
- Integration with writing statistics
- Accessibility improvements (screen reader support)
- Performance metrics and monitoring