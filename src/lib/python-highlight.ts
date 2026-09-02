/**
 * Single-pass Python syntax highlighter.
 *
 * The previous implementation ran one `String.replace` per token class over the
 * output of the last one, so the keyword pass matched the word `class` inside
 * the `class="text-info"` attribute it had just emitted and wrapped it in
 * another span. Every lesson code block containing a number rendered literal
 * markup: `class="text-info">120`.
 *
 * This version scans the source exactly once with a single alternation and
 * decides each token in a callback. Source text is HTML-escaped exactly once,
 * on the way out, and emitted markup is never re-scanned.
 */

const PYTHON_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
  'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
  'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'True', 'False', 'None',
])

const PYTHON_BUILTINS = new Set([
  'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set',
  'tuple', 'bool', 'type', 'input', 'open', 'abs', 'all', 'any', 'bin',
  'chr', 'dir', 'enumerate', 'filter', 'format', 'hex', 'id', 'isinstance',
  'iter', 'map', 'max', 'min', 'next', 'oct', 'ord', 'pow', 'repr',
  'reversed', 'round', 'slice', 'sorted', 'sum', 'super', 'zip',
])

const CLASS_STRING = 'text-success'
const CLASS_COMMENT = 'text-muted-foreground italic'
const CLASS_NUMBER = 'text-info'
const CLASS_KEYWORD = 'text-brand font-semibold'
const CLASS_BUILTIN = 'text-accent'
const CLASS_DEFINITION = 'text-warning'

/**
 * One alternation, tried left to right at each position. Order is the
 * precedence: a `#` inside a string is part of the string, and a keyword
 * inside a comment is part of the comment, because the enclosing construct
 * matches first and consumes it.
 */
const PYTHON_TOKEN = new RegExp(
  [
    // Triple-quoted strings, then single-line strings (escape-aware).
    String.raw`"""[\s\S]*?"""`,
    String.raw`'''[\s\S]*?'''`,
    String.raw`"(?:[^"\\\n]|\\.)*"`,
    String.raw`'(?:[^'\\\n]|\\.)*'`,
    // Comment to end of line.
    String.raw`#[^\n]*`,
    // A definition: the keyword plus the name it introduces.
    String.raw`\b(?:def|class)[ \t]+[A-Za-z_]\w*`,
    // Identifiers (resolved to keyword / builtin / plain below).
    String.raw`\b[A-Za-z_]\w*`,
    // Numbers.
    String.raw`\b\d+(?:\.\d+)?`,
  ].join('|'),
  'g'
)

const DEFINITION = /^(def|class)([ \t]+)([A-Za-z_]\w*)$/

/** Escape source text for HTML. Applied to raw source only, exactly once. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrap(className: string, text: string): string {
  return `<span class="${className}">${escapeHtml(text)}</span>`
}

function renderToken(token: string): string {
  const first = token[0]

  if (first === '"' || first === "'") return wrap(CLASS_STRING, token)
  if (first === '#') return wrap(CLASS_COMMENT, token)

  const definition = DEFINITION.exec(token)
  if (definition) {
    return (
      wrap(CLASS_KEYWORD, definition[1]) +
      escapeHtml(definition[2]) +
      wrap(CLASS_DEFINITION, definition[3])
    )
  }

  if (first >= '0' && first <= '9') return wrap(CLASS_NUMBER, token)
  if (PYTHON_KEYWORDS.has(token)) return wrap(CLASS_KEYWORD, token)
  if (PYTHON_BUILTINS.has(token)) return wrap(CLASS_BUILTIN, token)

  return escapeHtml(token)
}

/**
 * Highlight Python source as HTML. Every character of the input appears in the
 * output exactly once, escaped exactly once.
 */
export function highlightPython(code: string): string {
  if (!code) return ''

  let out = ''
  let cursor = 0
  PYTHON_TOKEN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = PYTHON_TOKEN.exec(code)) !== null) {
    if (match.index > cursor) {
      out += escapeHtml(code.slice(cursor, match.index))
    }
    out += renderToken(match[0])
    cursor = match.index + match[0].length
  }

  if (cursor < code.length) {
    out += escapeHtml(code.slice(cursor))
  }

  return out
}
