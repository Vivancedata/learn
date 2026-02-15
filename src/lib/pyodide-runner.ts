/**
 * Pyodide Runner - In-browser Python execution using WebAssembly
 *
 * This module provides a singleton pattern for loading and running Python code
 * in the browser using Pyodide (Python compiled to WebAssembly).
 */

// Type definitions for Pyodide
interface PyodideInterface {
  runPython: (code: string) => unknown
  runPythonAsync: (code: string) => Promise<unknown>
  loadPackage: (packages: string | string[]) => Promise<void>
  loadPackagesFromImports: (code: string) => Promise<void>
  globals: {
    get: (name: string) => unknown
    set: (name: string, value: unknown) => void
  }
  pyimport: (module: string) => unknown
  FS: {
    writeFile: (path: string, data: string) => void
    readFile: (path: string, options: { encoding: string }) => string
  }
}

interface LoadPyodideOptions {
  indexURL: string
  stdout?: (text: string) => void
  stderr?: (text: string) => void
}

declare global {
  interface Window {
    loadPyodide?: (options: LoadPyodideOptions) => Promise<PyodideInterface>
  }
}

// Singleton Pyodide instance
let pyodideInstance: PyodideInterface | null = null
let loadingPromise: Promise<PyodideInterface> | null = null

// Pyodide CDN configuration
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
const PYODIDE_SCRIPT_URL = `${PYODIDE_CDN_URL}pyodide.js`

// Execution timeout (30 seconds)
const EXECUTION_TIMEOUT_MS = 30000

// Common data science packages that can be loaded
export const AVAILABLE_PACKAGES = [
  'numpy',
  'pandas',
  'matplotlib',
  'scipy',
  'scikit-learn',
  'seaborn',
] as const

export type AvailablePackage = typeof AVAILABLE_PACKAGES[number]

export interface PythonExecutionResult {
  output: string
  error: string | null
  executionTime: number
  success: boolean
}

export interface PyodideLoadingState {
  isLoading: boolean
  isReady: boolean
  error: string | null
  loadingProgress: string
}

/**
 * Load the Pyodide script from CDN
 */
async function loadPyodideScript(): Promise<void> {
  // Check if script is already loaded
  if (typeof window !== 'undefined' && window.loadPyodide) {
    return
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = PYODIDE_SCRIPT_URL
    script.async = true

    script.onload = () => {
      resolve()
    }

    script.onerror = () => {
      reject(new Error('Failed to load Pyodide script from CDN'))
    }

    document.head.appendChild(script)
  })
}

/**
 * Initialize Pyodide with custom stdout/stderr handlers
 * Uses singleton pattern - only loads once per session
 */
export async function loadPyodide(
  onProgress?: (message: string) => void
): Promise<PyodideInterface> {
  // Return existing instance if already loaded
  if (pyodideInstance) {
    return pyodideInstance
  }

  // Return existing loading promise if currently loading
  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    try {
      onProgress?.('Loading Pyodide runtime...')

      // Load the Pyodide script
      await loadPyodideScript()

      onProgress?.('Initializing Python environment...')

      // Initialize Pyodide
      pyodideInstance = await window.loadPyodide!({
        indexURL: PYODIDE_CDN_URL,
      })

      onProgress?.('Python environment ready!')

      return pyodideInstance
    } catch (error) {
      loadingPromise = null
      throw error
    }
  })()

  return loadingPromise
}

/**
 * Check if Pyodide is loaded and ready
 */
export function isPyodideReady(): boolean {
  return pyodideInstance !== null
}

/**
 * Get the current Pyodide instance (or null if not loaded)
 */
export function getPyodideInstance(): PyodideInterface | null {
  return pyodideInstance
}

/**
 * Load additional Python packages (e.g., numpy, pandas)
 */
export async function loadPackages(
  packages: AvailablePackage[],
  onProgress?: (message: string) => void
): Promise<void> {
  const pyodide = await loadPyodide(onProgress)

  for (const pkg of packages) {
    onProgress?.(`Loading ${pkg}...`)
    await pyodide.loadPackage(pkg)
  }

  onProgress?.('All packages loaded!')
}

/**
 * Execute Python code and return the result
 * Captures stdout/stderr and handles timeouts
 */
export async function runPython(
  code: string,
  onProgress?: (message: string) => void
): Promise<PythonExecutionResult> {
  const startTime = performance.now()

  // Captured output
  let stdout = ''
  let stderr = ''

  try {
    // Ensure Pyodide is loaded
    const pyodide = await loadPyodide(onProgress)

    // Set up output capture by redirecting stdout/stderr in Python
    const captureCode = `
import sys
from io import StringIO

# Capture stdout and stderr
_stdout_buffer = StringIO()
_stderr_buffer = StringIO()
_original_stdout = sys.stdout
_original_stderr = sys.stderr
sys.stdout = _stdout_buffer
sys.stderr = _stderr_buffer
`

    const restoreCode = `
# Restore original stdout/stderr and get captured output
sys.stdout = _original_stdout
sys.stderr = _original_stderr
_captured_stdout = _stdout_buffer.getvalue()
_captured_stderr = _stderr_buffer.getvalue()
`

    // Set up capture
    pyodide.runPython(captureCode)

    // Execute user code with timeout
    const executeWithTimeout = async (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Execution timed out after ${EXECUTION_TIMEOUT_MS / 1000} seconds`))
        }, EXECUTION_TIMEOUT_MS)

        try {
          // Try to auto-load packages from imports
          pyodide.loadPackagesFromImports(code)
            .then(() => {
              pyodide.runPython(code)
              clearTimeout(timeoutId)
              resolve()
            })
            .catch((err) => {
              clearTimeout(timeoutId)
              reject(err)
            })
        } catch (error) {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
    }

    await executeWithTimeout()

    // Restore and capture output
    pyodide.runPython(restoreCode)
    stdout = pyodide.globals.get('_captured_stdout') as string || ''
    stderr = pyodide.globals.get('_captured_stderr') as string || ''

    const executionTime = performance.now() - startTime

    return {
      output: stdout,
      error: stderr || null,
      executionTime,
      success: !stderr,
    }
  } catch (error) {
    const executionTime = performance.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Try to restore stdout/stderr if possible
    try {
      const pyodide = getPyodideInstance()
      if (pyodide) {
        pyodide.runPython(`
import sys
sys.stdout = _original_stdout if '_original_stdout' in dir() else sys.stdout
sys.stderr = _original_stderr if '_original_stderr' in dir() else sys.stderr
`)
      }
    } catch {
      // Ignore cleanup errors
    }

    return {
      output: stdout,
      error: formatPythonError(errorMessage),
      executionTime,
      success: false,
    }
  }
}

/**
 * Reset the Python environment by clearing global variables
 */
export async function resetPythonEnvironment(): Promise<void> {
  const pyodide = getPyodideInstance()
  if (!pyodide) return

  // Clear user-defined variables while preserving builtins
  pyodide.runPython(`
import sys

# Get list of user-defined names (exclude builtins and system modules)
_builtin_names = set(dir(__builtins__)) if hasattr(__builtins__, '__iter__') else set()
_system_names = {'sys', '__builtins__', '__name__', '__doc__', '__package__',
                 '__loader__', '__spec__', '__annotations__', '__file__'}

# Get current global names
_to_delete = [name for name in list(globals().keys())
              if not name.startswith('_')
              and name not in _system_names
              and name not in _builtin_names]

# Delete user variables
for _name in _to_delete:
    del globals()[_name]
`)
}

/**
 * Format Python error messages for better readability
 */
function formatPythonError(error: string): string {
  // Extract the most relevant part of Python tracebacks
  const lines = error.split('\n')
  const relevantLines: string[] = []

  let inTraceback = false
  for (const line of lines) {
    if (line.includes('Traceback') || line.includes('Error:')) {
      inTraceback = true
    }
    if (inTraceback) {
      // Skip internal Pyodide file references
      if (!line.includes('pyodide') && !line.includes('<exec>')) {
        relevantLines.push(line)
      } else if (line.includes('line')) {
        // Keep line number references but simplify them
        const match = line.match(/line (\d+)/)
        if (match) {
          relevantLines.push(`  Line ${match[1]}`)
        }
      }
    }
  }

  // If we filtered out everything, return original
  if (relevantLines.length === 0) {
    return error
  }

  return relevantLines.join('\n').trim()
}

/**
 * Validate Python code without executing it
 * Returns syntax errors if any
 */
export async function validatePythonSyntax(code: string): Promise<string | null> {
  const pyodide = await loadPyodide()

  try {
    pyodide.runPython(`
import ast
ast.parse('''${code.replace(/'/g, "\\'")}''')
`)
    return null
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('SyntaxError')) {
      return formatPythonError(errorMessage)
    }
    return null
  }
}

/**
 * Run Python code with test assertions
 * Returns test results
 */
export interface TestResult {
  passed: boolean
  name: string
  expected?: string
  actual?: string
  error?: string
}

export async function runPythonWithTests(
  code: string,
  testCases: Array<{ name: string; test: string; expected: string }>
): Promise<{ results: TestResult[]; allPassed: boolean }> {
  const results: TestResult[] = []

  // First run the user's code
  const initialResult = await runPython(code)
  if (!initialResult.success) {
    return {
      results: [{
        passed: false,
        name: 'Code Execution',
        error: initialResult.error || 'Unknown error',
      }],
      allPassed: false,
    }
  }

  // Then run each test
  for (const testCase of testCases) {
    try {
      const testResult = await runPython(testCase.test)
      const output = testResult.output.trim()
      const passed = output === testCase.expected.trim()

      results.push({
        passed,
        name: testCase.name,
        expected: testCase.expected,
        actual: output,
        error: testResult.error || undefined,
      })
    } catch (error) {
      results.push({
        passed: false,
        name: testCase.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    results,
    allPassed: results.every(r => r.passed),
  }
}
