# Scholar - AI-Powered Writing & Research Workspace

Scholar is a cutting-edge AI-powered writing and research workspace designed for students. It features multi-agent assistance, intelligent citations, study pack generation, and a beautiful modern interface that makes academic writing engaging and productive.

## 🌟 Features

- **Multi-Agent AI System**: 7 specialized AI agents (Sage, Atlas, Prose, Cite, Euler, Socrates, Mnemo)
- **Rich Text Editor**: TipTap-based editor with slash commands and AI suggestions
- **Citation Manager**: Support for APA, MLA, Chicago, and Harvard formats
- **Study Pack Generator**: Flashcards, quizzes, mind maps, and key terms
- **Focus Mode**: Distraction-free writing with Pomodoro timer
- **Assignment Rubric Mode**: Document analysis against rubric criteria
- **Version History**: Track changes with AI-generated summaries
- **AI Contribution Tracker**: Monitor AI assistance for academic honesty

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+ (current version warns but works with 21.7.3+)
- npm or yarn
- Anthropic API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Anthropic API key
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm run reinstall` - Clean reinstall dependencies

## 🏗️ Project Structure

```
src/
├── components/
│   ├── editor/         # TipTap editor with slash commands & AI features
│   ├── agents/         # Multi-agent chat system & spawning
│   ├── features/       # Citation, Study Pack, Rubric, Focus modes
│   └── ui/            # Header, StatusBar, shared components
├── agents/            # Agent configurations & orchestrator logic
├── store/             # Zustand stores for state management  
├── hooks/             # Custom hooks for streaming, autosave, etc.
├── lib/               # API utilities, document context extraction
└── styles/            # Global CSS, animations, design tokens
```

## 🛠️ Technology Stack

### Core
- **React 18** with TypeScript (strict mode)
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom design system
- **Framer Motion** for animations

### Editor
- **TipTap** (ProseMirror-based) rich text editor
- Custom extensions for AI integration
- Slash commands and bubble toolbar
- Ghost text AI suggestions

### State Management
- **Zustand** for lightweight state management
- Separate stores for document, agents, and UI state

### AI Integration
- **Anthropic Claude API** (claude-sonnet-4-20250514)
- Server-sent events for streaming responses
- Multi-agent orchestration system

### UI Components
- **shadcn/ui** for base components
- **Radix UI** primitives
- **Lucide React** for icons
- **reactbits** and **21st.dev** premium components

## 🎨 Design System

Scholar uses a comprehensive design system with:

- **Typography**: Instrument Serif (headings), Geist/DM Sans (UI), JetBrains Mono (code)
- **Color Palette**: Blue-based with neutral grays and semantic colors
- **Spacing**: Consistent scale from xs (0.25rem) to 2xl (3rem)
- **Animations**: Subtle micro-interactions with 200ms timing
- **Dark Mode**: Full theme support with automatic detection

### CSS Custom Properties

All design tokens are defined as CSS custom properties in `src/styles/globals.css`:

```css
--color-primary-500: #3b82f6;
--font-serif: 'Instrument Serif', serif;
--space-md: 1rem;
--transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

## 🤖 Agent System

Scholar includes 7 specialized AI agents:

1. **Sage** - Orchestrator agent that coordinates tasks
2. **Atlas** - Research and fact-finding specialist  
3. **Prose** - Writing and editing expert
4. **Cite** - Citation and bibliography manager
5. **Euler** - Mathematics and science specialist
6. **Socrates** - Critical thinking and argumentation
7. **Mnemo** - Study materials and memory aids

### Custom Agent Spawning
Users can create custom agents for specific tasks with tailored prompts and tools.

## 🔧 Configuration

### API Keys
Set your Anthropic API key in environment variables:
```bash
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

### Build Configuration
The project uses optimized Vite configuration with:
- Code splitting for vendor, editor, and UI chunks
- Path aliases for clean imports (@/components, @/lib, etc.)
- TypeScript strict mode with comprehensive linting

### Tailwind Configuration
Custom Tailwind config includes:
- Extended font families
- Custom animations and keyframes
- Design system color palette
- Responsive breakpoints

## 🚀 Deployment

### Production Build
```bash
npm run build
```

This generates optimized assets in the `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting for optimal loading
- Static asset optimization

### Deployment Platforms
Scholar is configured for deployment on:
- **Vercel** (recommended)
- **Netlify**
- **Cloudflare Pages**
- Any static hosting service

## 🧪 Development

### Code Quality
The project enforces high code quality with:
- **ESLint** with TypeScript rules
- **TypeScript** strict mode
- **Prettier** code formatting (configured in editor)
- Consistent import organization

### Performance
Built-in performance optimizations:
- React.memo for component memoization
- Lazy loading for feature modules
- Optimized bundle splitting
- Efficient re-rendering strategies

### Accessibility
Scholar follows WCAG 2.1 guidelines:
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## 📚 Documentation

### Key Concepts

#### Document Context
All agents receive real-time document context including:
```typescript
{
  fullText: string,
  selectedText: string,
  wordCount: number,
  cursorParagraph: string,
  documentTitle: string,
  documentType: string,
  academicLevel: string
}
```

#### Streaming Architecture
AI responses stream in real-time using Server-Sent Events:
- Token-by-token display
- Tool call visualization
- Graceful error handling
- Retry mechanisms

#### State Management
Zustand stores provide clean state management:
- `documentStore` - Content, history, metadata
- `agentStore` - Active agents, conversations
- `uiStore` - Panel states, theme, settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Keep components focused and composable

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [TipTap Documentation](https://tiptap.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

---

**Built with ❤️ for students who want the coolest writing tool ever created.**