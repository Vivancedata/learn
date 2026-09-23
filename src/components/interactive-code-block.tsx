'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { CodeDisplay } from '@/components/code-editor'
import { Button } from '@/components/ui/button'
import { Play, Code2 } from 'lucide-react'

// The playground (editor chrome + the Pyodide runner) is only needed once a
// block is interactive or the reader clicks "Try it", so it is split out of
// the lesson bundle and loaded on demand.
const CodePlayground = dynamic(
  () => import('@/components/code-playground').then((mod) => mod.CodePlayground),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[220px] animate-pulse rounded-lg border bg-muted"
        role="status"
        aria-label="Loading code playground…"
      />
    ),
  }
)

export interface InteractiveCodeBlockProps {
  /** The code content */
  code: string
  /** Programming language */
  language: string
  /** Whether this is an interactive block (marked with 'interactive' in markdown) */
  interactive?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * InteractiveCodeBlock - Renders code blocks with optional interactivity
 *
 * Detects if a code block should be interactive based on the language tag.
 * For example: ```python interactive
 *
 * Non-interactive blocks render as static syntax-highlighted code.
 * Interactive blocks render as a full CodePlayground.
 */
export function InteractiveCodeBlock({
  code,
  language,
  interactive = false,
  className,
}: InteractiveCodeBlockProps) {
  const [isExpandedByUser, setIsExpandedByUser] = useState(false)

  // Clean up the code (remove trailing newlines)
  const cleanCode = code.trim()

  // Handle toggle between static and interactive view
  const toggleInteractive = useCallback(() => {
    setIsExpandedByUser((prev) => !prev)
  }, [])

  const isExpanded = interactive || isExpandedByUser

  // For Python, offer the option to make any code block interactive
  const canBeInteractive = language === 'python' || language === 'py'

  if (isExpanded) {
    // Render as full playground
    return (
      <div className={cn('my-4', className)}>
        <CodePlayground
          initialCode={cleanCode}
          editorMinHeight="150px"
        />
      </div>
    )
  }

  // Render as static code with optional "Try it" button
  return (
    <div className={cn('my-4 group relative', className)}>
      <CodeDisplay
        code={cleanCode}
        language={language as 'python' | 'javascript' | 'typescript' | 'sql'}
      />

      {/* "Try it" button for Python code blocks */}
      {canBeInteractive && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleInteractive}
            className="gap-1.5 shadow-md"
          >
            <Play className="h-3.5 w-3.5" />
            Try it
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Parse language string from markdown code fence
 * Handles formats like: python, python interactive, py interactive
 */
export function parseCodeBlockLanguage(langString: string): {
  language: string
  interactive: boolean
  meta: Record<string, string>
} {
  const parts = langString.trim().toLowerCase().split(/\s+/)
  const language = parts[0] || 'text'
  const interactive = parts.includes('interactive')

  // Parse any key=value pairs
  const meta: Record<string, string> = {}
  for (const part of parts.slice(1)) {
    if (part.includes('=')) {
      const [key, value] = part.split('=')
      meta[key] = value
    }
  }

  return { language, interactive, meta }
}

/**
 * Custom markdown code component that renders interactive Python blocks
 * Use this with react-markdown's components prop
 */
export function createInteractiveCodeComponent() {
  return function InteractiveCode({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
    // Extract language from className (e.g., "language-python")
    const match = /language-(\S+)/.exec(className || '')
    const fullLang = match ? match[1] : ''
    const { language, interactive } = parseCodeBlockLanguage(fullLang)

    // Get code content
    const code = String(children).replace(/\n$/, '')

    // Check if this is an inline code block
    const isInline = !className

    if (isInline) {
      return (
        <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      )
    }

    // For block code, use our interactive component
    return (
      <InteractiveCodeBlock
        code={code}
        language={language}
        interactive={interactive}
      />
    )
  }
}

/**
 * Wrapper for pre tags in markdown to handle code blocks
 */
export function InteractivePreBlock({
  children,
  className: _className,
  ..._props
}: React.HTMLAttributes<HTMLPreElement>) {
  // Just pass through - the code component handles everything
  return children
}

/**
 * Simple code runner button for inline use
 */
export function RunCodeButton({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  const [showPlayground, setShowPlayground] = useState(false)

  if (showPlayground) {
    return (
      <div className={cn('my-4', className)}>
        <CodePlayground
          initialCode={code}
          editorMinHeight="150px"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPlayground(false)}
          className="mt-2"
        >
          <Code2 className="h-3.5 w-3.5 mr-1.5" />
          Show as code
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowPlayground(true)}
      className={cn('gap-1.5', className)}
    >
      <Play className="h-3.5 w-3.5" />
      Run this code
    </Button>
  )
}
