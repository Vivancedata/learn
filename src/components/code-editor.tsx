'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { escapeHtml, highlightPython } from '@/lib/python-highlight'

export interface CodeEditorProps {
  /** Initial code to display in the editor */
  initialCode?: string
  /** Programming language for syntax highlighting */
  language?: 'python' | 'javascript' | 'typescript' | 'sql'
  /** Whether the editor is read-only */
  readOnly?: boolean
  /** Callback when code changes */
  onCodeChange?: (code: string) => void
  /** Placeholder text when empty */
  placeholder?: string
  /** Additional CSS classes */
  className?: string
  /** Minimum height of the editor */
  minHeight?: string
  /** Maximum height of the editor */
  maxHeight?: string
  /** Whether to show line numbers */
  showLineNumbers?: boolean
  /** Font size in pixels */
  fontSize?: number
}

/**
 * CodeEditor - A lightweight code editor component with syntax highlighting
 *
 * Features:
 * - Syntax highlighting for Python (overlay technique)
 * - Line numbers
 * - Tab key support
 * - Auto-indentation
 * - Responsive design
 * - Dark mode support
 * - Accessible with keyboard navigation
 */
export function CodeEditor({
  initialCode = '',
  language = 'python',
  readOnly = false,
  onCodeChange,
  placeholder = '# Write your Python code here…',
  className,
  minHeight = '200px',
  maxHeight = '500px',
  showLineNumbers = true,
  fontSize = 14,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [prevInitialCode, setPrevInitialCode] = useState(initialCode)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  // Set by Escape so the next Tab moves focus instead of indenting.
  const tabEscapesRef = useRef(false)

  // Sync initial code during render rather than in an effect, which cost an
  // extra render pass per change.
  if (initialCode !== prevInitialCode) {
    setPrevInitialCode(initialCode)
    setCode(initialCode)
  }

  // Derive highlighted code from the source; for non-Python, just escape HTML
  const highlightedCode = useMemo(
    () => (language === 'python' ? highlightPython(code) : escapeHtml(code)),
    [code, language]
  )

  // Generate line numbers
  const lineNumbers = code.split('\n').map((_, i) => i + 1)

  // Handle code changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value
      setCode(newCode)
      onCodeChange?.(newCode)
    },
    [onCodeChange]
  )

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  // Handle Tab key for indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Read-only code has nothing to indent: leave Tab and Enter to the browser
      if (readOnly) return

      // Escape, then Tab, leaves the editor so keyboard users are not trapped
      if (e.key === 'Escape') {
        tabEscapesRef.current = true
        return
      }
      if (tabEscapesRef.current) {
        tabEscapesRef.current = false
        if (e.key === 'Tab') return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        // Insert 4 spaces for tab
        const newCode = code.substring(0, start) + '    ' + code.substring(end)
        setCode(newCode)
        onCodeChange?.(newCode)

        // Move cursor after the inserted spaces
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4
        })
      }

      // Auto-indent on Enter
      if (e.key === 'Enter') {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const currentLine = code.substring(0, start).split('\n').pop() || ''
        const indent = currentLine.match(/^\s*/)?.[0] || ''

        // Add extra indent after colon
        const extraIndent = currentLine.trimEnd().endsWith(':') ? '    ' : ''

        e.preventDefault()
        const newCode =
          code.substring(0, start) + '\n' + indent + extraIndent + code.substring(start)
        setCode(newCode)
        onCodeChange?.(newCode)

        // Move cursor to the new line with proper indentation
        requestAnimationFrame(() => {
          const newPosition = start + 1 + indent.length + extraIndent.length
          textarea.selectionStart = textarea.selectionEnd = newPosition
        })
      }
    },
    [code, onCodeChange, readOnly]
  )

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden',
        // The textarea hides its own outline, so show focus on the frame
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        'dark:bg-[#1e1e2e] dark:text-[#cdd6f4]',
        className
      )}
      style={{ minHeight, maxHeight }}
    >
      <div className="flex h-full" style={{ minHeight, maxHeight }}>
        {/* Line Numbers */}
        {showLineNumbers && (
          <div
            className="flex-shrink-0 select-none bg-[#181825] text-[#6c7086] text-right py-3 px-2 border-r border-[#313244] overflow-hidden"
            style={{ fontSize }}
            aria-hidden="true"
          >
            {lineNumbers.map((num) => (
              <div key={num} className="leading-6">
                {num}
              </div>
            ))}
          </div>
        )}

        {/* Editor Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Highlighted Code Overlay */}
          <pre
            ref={highlightRef}
            className="absolute inset-0 m-0 py-3 px-4 overflow-auto pointer-events-none whitespace-pre-wrap break-words"
            style={{
              fontSize,
              lineHeight: '1.5rem',
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            }}
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html:
                highlightedCode ||
                `<span class="text-[#6c7086]">${escapeHtml(placeholder)}</span>`,
            }}
          />

          {/* Textarea (transparent, for editing) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className={cn(
              'absolute inset-0 w-full h-full m-0 py-3 px-4',
              'bg-transparent text-transparent caret-[#f5e0dc]',
              'resize-none outline-none border-none',
              'overflow-auto whitespace-pre-wrap break-words',
              readOnly && 'cursor-default'
            )}
            style={{
              fontSize,
              lineHeight: '1.5rem',
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            }}
            aria-label={`${language} code editor`}
            aria-description={readOnly ? undefined : 'Press Escape then Tab to move focus out of the editor'}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Lightweight read-only code display with syntax highlighting
 */
export function CodeDisplay({
  code,
  language = 'python',
  className,
  showLineNumbers = true,
  fontSize = 14,
}: {
  code: string
  language?: 'python' | 'javascript' | 'typescript' | 'sql'
  className?: string
  showLineNumbers?: boolean
  fontSize?: number
}) {
  return (
    <CodeEditor
      initialCode={code}
      language={language}
      readOnly
      className={className}
      showLineNumbers={showLineNumbers}
      fontSize={fontSize}
      minHeight="auto"
      maxHeight="none"
    />
  )
}
