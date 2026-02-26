import { Editor } from './Editor'

interface EditorPanelProps {
  className?: string
}

export function EditorPanel({ className = '' }: EditorPanelProps) {
  return <Editor className={className} />
}