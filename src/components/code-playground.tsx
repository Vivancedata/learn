'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { CodeEditor } from '@/components/code-editor'
import {
  loadPyodide,
  runPython,
  runPythonWithTests,
  resetPythonEnvironment,
  isPyodideReady,
  type PythonExecutionResult,
  type TestResult,
} from '@/lib/pyodide-runner'
import {
  Play,
  RotateCcw,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
} from 'lucide-react'

export interface TestCase {
  /** Name of the test */
  name: string
  /** Python code to run as the test (should print expected output) */
  test: string
  /** Expected output from the test */
  expected: string
}

export interface CodePlaygroundProps {
  /** Initial code to display in the editor */
  initialCode?: string
  /** Expected output for simple validation (optional) */
  expectedOutput?: string
  /** Test cases for validation (optional) */
  testCases?: TestCase[]
  /** Lesson ID for tracking (optional) */
  lessonId?: string
  /** Whether to run the code automatically on mount */
  autoRun?: boolean
  /** Additional CSS classes */
  className?: string
  /** Title to display above the playground */
  title?: string
  /** Description to display below the title */
  description?: string
  /** Whether the code is read-only */
  readOnly?: boolean
  /** Minimum height of the editor */
  editorMinHeight?: string
  /** Callback when code is submitted successfully */
  onSuccess?: (result: PythonExecutionResult) => void
  /** Callback when code execution fails */
  onError?: (error: string) => void
}

type PlaygroundState = 'idle' | 'loading-pyodide' | 'running' | 'success' | 'error'

/**
 * CodePlayground - Combined code editor and Python execution environment
 *
 * Features:
 * - Split view: editor on left, output on right (stacked on mobile)
 * - Run button in toolbar
 * - Reset, copy, download buttons
 * - Optional test case validation
 * - Fullscreen mode
 * - Responsive design
 */
export function CodePlayground({
  initialCode = '',
  expectedOutput,
  testCases,
  lessonId,
  autoRun = false,
  className,
  title,
  description,
  readOnly = false,
  editorMinHeight = '200px',
  onSuccess,
  onError,
}: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode)
  const [state, setState] = useState<PlaygroundState>('idle')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [output, setOutput] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Reset to initial code when it changes
  useEffect(() => {
    setCode(initialCode)
  }, [initialCode])

  // Progress callback for Pyodide loading
  const handleProgress = useCallback((message: string) => {
    setLoadingMessage(message)
  }, [])

  // Execute Python code
  const executeCode = useCallback(async () => {
    if (!code.trim()) {
      setOutput('')
      setError('No code to execute')
      setState('error')
      return
    }

    setState('loading-pyodide')
    setOutput('')
    setError(null)
    setExecutionTime(null)
    setTestResults(null)

    try {
      // Load Pyodide if not already loaded
      await loadPyodide(handleProgress)

      setState('running')
      setLoadingMessage('Executing code...')

      // Check if we have test cases
      if (testCases && testCases.length > 0) {
        const { results, allPassed } = await runPythonWithTests(code, testCases)
        setTestResults(results)

        // Get output from first code execution
        const initialResult = await runPython(code, handleProgress)
        setOutput(initialResult.output)
        setError(initialResult.error)
        setExecutionTime(initialResult.executionTime)

        if (allPassed) {
          setState('success')
          onSuccess?.(initialResult)
        } else {
          setState('error')
          onError?.('Some tests failed')
        }
      } else {
        // Run code without tests
        const result = await runPython(code, handleProgress)

        setOutput(result.output)
        setError(result.error)
        setExecutionTime(result.executionTime)

        // Check expected output if provided
        if (expectedOutput && result.success) {
          const outputMatches = result.output.trim() === expectedOutput.trim()
          setState(outputMatches ? 'success' : 'error')
          if (!outputMatches) {
            setError(`Expected output:\n${expectedOutput}\n\nActual output:\n${result.output}`)
            onError?.('Output does not match expected')
          } else {
            onSuccess?.(result)
          }
        } else {
          setState(result.success ? 'success' : 'error')
          if (result.success) {
            onSuccess?.(result)
          } else {
            onError?.(result.error || 'Execution failed')
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      setState('error')
      onError?.(errorMessage)
    }
  }, [code, expectedOutput, testCases, handleProgress, onSuccess, onError])

  // Reset the editor and Python environment
  const handleReset = useCallback(async () => {
    setCode(initialCode)
    setOutput('')
    setError(null)
    setExecutionTime(null)
    setTestResults(null)
    setState('idle')

    if (isPyodideReady()) {
      await resetPythonEnvironment()
    }
  }, [initialCode])

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_err) {
      // Copy failed - user can try manual copy
    }
  }, [code])

  // Download code as file
  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/x-python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = lessonId ? `${lessonId}.py` : 'code.py'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [code, lessonId])

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Auto-run on mount if enabled
  useEffect(() => {
    if (autoRun && code.trim()) {
      executeCode()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (state !== 'loading-pyodide' && state !== 'running') {
          executeCode()
        }
      }
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [executeCode, state, isFullscreen])

  const isLoading = state === 'loading-pyodide' || state === 'running'

  return (
    <Card
      className={cn(
        'overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50 m-0 rounded-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          {title && <h3 className="font-semibold text-sm">{title}</h3>}
          {state === 'success' && (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Success
            </span>
          )}
          {state === 'error' && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              Error
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Run Button */}
          <Button
            size="sm"
            onClick={executeCode}
            disabled={isLoading || readOnly}
            variant={state === 'success' ? 'success' : 'default'}
            className="gap-1.5"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span className="hidden sm:inline">
                  {state === 'loading-pyodide' ? 'Loading...' : 'Running...'}
                </span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Run</span>
              </>
            )}
          </Button>

          {/* Reset Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            disabled={isLoading}
            title="Reset code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          {/* Copy Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Download Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            title="Download code"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          {/* Fullscreen Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30 border-b">
          {description}
        </div>
      )}

      {/* Main Content - Editor and Output */}
      <div
        className={cn(
          'grid gap-0',
          isFullscreen ? 'grid-cols-1 lg:grid-cols-2 h-[calc(100%-60px)]' : 'grid-cols-1 lg:grid-cols-2'
        )}
      >
        {/* Code Editor */}
        <div className={cn('border-b lg:border-b-0 lg:border-r', isFullscreen && 'h-full')}>
          <CodeEditor
            initialCode={code}
            onCodeChange={setCode}
            readOnly={readOnly}
            language="python"
            minHeight={isFullscreen ? '100%' : editorMinHeight}
            maxHeight={isFullscreen ? '100%' : '400px'}
            className="rounded-none border-0"
          />
        </div>

        {/* Output Panel */}
        <div
          className={cn(
            'flex flex-col bg-[#1e1e2e]',
            isFullscreen && 'h-full'
          )}
        >
          {/* Loading State */}
          {isLoading && loadingMessage && (
            <div className="flex items-center gap-2 p-3 bg-[#181825] border-b border-[#313244] text-sm">
              <Spinner size="sm" />
              <span className="text-[#6c7086]">{loadingMessage}</span>
            </div>
          )}

          {/* Output Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-b border-[#313244]">
            <div className="flex items-center gap-2 text-[#6c7086]">
              <Terminal className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Output</span>
            </div>
            {executionTime !== null && (
              <span className="flex items-center gap-1 text-xs text-[#6c7086]">
                <Clock className="h-3 w-3" />
                {executionTime.toFixed(0)}ms
              </span>
            )}
          </div>

          {/* Output Content */}
          <div
            className={cn(
              'flex-1 overflow-auto p-3',
              isFullscreen ? 'max-h-none' : 'min-h-[100px] max-h-[300px]'
            )}
          >
            {/* Empty state */}
            {state === 'idle' && !output && !error && (
              <div className="text-[#6c7086] italic text-sm">
                Click &quot;Run&quot; or press Ctrl+Enter to execute your code...
              </div>
            )}

            {/* Success output */}
            {output && (
              <pre className="whitespace-pre-wrap text-[#a6e3a1] m-0 text-sm font-mono">
                {output}
              </pre>
            )}

            {/* Error output */}
            {error && (
              <pre className="whitespace-pre-wrap text-[#f38ba8] m-0 text-sm font-mono">
                {error}
              </pre>
            )}

            {/* Test Results */}
            {testResults && testResults.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#313244]">
                <h4 className="text-xs font-medium text-[#6c7086] mb-2">Test Results</h4>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-start gap-2 p-2 rounded text-sm',
                        result.passed ? 'bg-[#a6e3a1]/10' : 'bg-[#f38ba8]/10'
                      )}
                    >
                      {result.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-[#a6e3a1] flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-[#f38ba8] flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className={result.passed ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}>
                          {result.name}
                        </div>
                        {!result.passed && result.expected && result.actual && (
                          <div className="text-xs text-[#6c7086] mt-1">
                            Expected: <code className="text-[#f5c2e7]">{result.expected}</code>
                            <br />
                            Got: <code className="text-[#f38ba8]">{result.actual}</code>
                          </div>
                        )}
                        {result.error && (
                          <div className="text-xs text-[#f38ba8] mt-1">{result.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/30 border-t">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl</kbd> +{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to run
      </div>
    </Card>
  )
}

/**
 * Minimal code playground for simple examples
 */
export function MiniPlayground({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return (
    <CodePlayground
      initialCode={code}
      className={className}
      editorMinHeight="120px"
    />
  )
}
