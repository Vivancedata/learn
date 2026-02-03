'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  loadPyodide,
  runPython,
  resetPythonEnvironment,
  isPyodideReady,
  type PythonExecutionResult,
} from '@/lib/pyodide-runner'
import { Play, RotateCcw, Terminal, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export interface PythonRunnerProps {
  /** The Python code to execute */
  code: string
  /** Whether to run the code automatically on mount */
  autoRun?: boolean
  /** Callback when output is produced */
  onOutput?: (result: PythonExecutionResult) => void
  /** Callback when execution starts */
  onExecutionStart?: () => void
  /** Callback when execution ends */
  onExecutionEnd?: () => void
  /** Additional CSS classes */
  className?: string
  /** Whether to show the toolbar with run/reset buttons */
  showToolbar?: boolean
  /** Whether to show execution time */
  showExecutionTime?: boolean
  /** Custom label for the run button */
  runButtonLabel?: string
}

type RunnerState = 'idle' | 'loading-pyodide' | 'running' | 'success' | 'error'

/**
 * PythonRunner - Executes Python code using Pyodide (WebAssembly)
 *
 * Features:
 * - Lazy loads Pyodide on first use
 * - Shows loading state while Pyodide initializes (~3-5 seconds)
 * - Execute button with keyboard shortcut (Ctrl/Cmd + Enter)
 * - Output panel showing stdout/stderr
 * - Reset button to clear state
 * - Execution timeout protection
 */
export function PythonRunner({
  code,
  autoRun = false,
  onOutput,
  onExecutionStart,
  onExecutionEnd,
  className,
  showToolbar = true,
  showExecutionTime = true,
  runButtonLabel = 'Run',
}: PythonRunnerProps) {
  const [state, setState] = useState<RunnerState>('idle')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [output, setOutput] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Check if Pyodide is already loaded
  useEffect(() => {
    if (isPyodideReady()) {
      setState('idle')
    }
  }, [])

  // Auto-scroll output to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output, error])

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
    onExecutionStart?.()

    try {
      // Load Pyodide if not already loaded
      await loadPyodide(handleProgress)

      setState('running')
      setLoadingMessage('Executing code...')

      // Run the Python code
      const result = await runPython(code, handleProgress)

      setOutput(result.output)
      setError(result.error)
      setExecutionTime(result.executionTime)
      setState(result.success ? 'success' : 'error')

      onOutput?.(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      setState('error')

      onOutput?.({
        output: '',
        error: errorMessage,
        executionTime: 0,
        success: false,
      })
    } finally {
      onExecutionEnd?.()
    }
  }, [code, handleProgress, onOutput, onExecutionStart, onExecutionEnd])

  // Reset the Python environment
  const handleReset = useCallback(async () => {
    setOutput('')
    setError(null)
    setExecutionTime(null)
    setState('idle')

    if (isPyodideReady()) {
      await resetPythonEnvironment()
    }
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [executeCode, state])

  const isLoading = state === 'loading-pyodide' || state === 'running'

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 border-b rounded-t-lg">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={executeCode}
              disabled={isLoading}
              variant={state === 'success' ? 'success' : 'default'}
              className="gap-1.5"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>{state === 'loading-pyodide' ? 'Loading...' : 'Running...'}</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>{runButtonLabel}</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {showExecutionTime && executionTime !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {executionTime.toFixed(0)}ms
              </span>
            )}
            <span className="hidden sm:inline">Ctrl+Enter to run</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && loadingMessage && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 border-b text-sm">
          <Spinner size="sm" />
          <span className="text-muted-foreground">{loadingMessage}</span>
        </div>
      )}

      {/* Output Panel */}
      <div
        ref={outputRef}
        className={cn(
          'relative min-h-[100px] max-h-[300px] overflow-auto',
          'bg-[#1e1e2e] rounded-b-lg',
          'font-mono text-sm',
          !showToolbar && 'rounded-t-lg'
        )}
      >
        {/* Output Header */}
        <div className="sticky top-0 flex items-center gap-2 px-3 py-2 bg-[#181825] border-b border-[#313244] text-[#6c7086]">
          <Terminal className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Output</span>
          {state === 'success' && (
            <CheckCircle2 className="h-3.5 w-3.5 text-success ml-auto" />
          )}
          {state === 'error' && (
            <AlertCircle className="h-3.5 w-3.5 text-destructive ml-auto" />
          )}
        </div>

        {/* Output Content */}
        <div className="p-3">
          {/* Empty state */}
          {state === 'idle' && !output && !error && (
            <div className="text-[#6c7086] italic">
              Click "Run" to execute your code...
            </div>
          )}

          {/* Success output */}
          {output && (
            <pre className="whitespace-pre-wrap text-[#a6e3a1] m-0">
              {output}
            </pre>
          )}

          {/* Error output */}
          {error && (
            <pre className="whitespace-pre-wrap text-[#f38ba8] m-0">
              {error}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact version of PythonRunner for inline use
 */
export function InlinePythonRunner({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return (
    <PythonRunner
      code={code}
      className={className}
      showToolbar={false}
      showExecutionTime={false}
    />
  )
}
