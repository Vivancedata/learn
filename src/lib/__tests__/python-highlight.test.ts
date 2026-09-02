import { highlightPython, escapeHtml } from '@/lib/python-highlight'

/** The sample the critique's bug report is about: a `class`, a `def`, a string
 *  containing `#`, and numbers all in one block. */
const SAMPLE = `# Count the frames
class FrameCounter:
    """Counts frames. #1 tool."""

    def __init__(self, limit=120):
        self.limit = limit
        self.ratio = 0.75

    def report(self):
        print("frames: #" + str(self.limit))
`

const SPAN_OPEN = /<span class="[a-z0-9 #[\]-]+">/g
const SPAN_CLOSE = /<\/span>/g

/** Everything the browser would render as text, with tags removed. */
function textContent(html: string): string {
  return html.replace(SPAN_OPEN, '').replace(SPAN_CLOSE, '')
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

describe('highlightPython', () => {
  const html = highlightPython(SAMPLE)

  it('never leaks a class attribute into text content', () => {
    // The old implementation re-highlighted its own output, so the keyword pass
    // matched `class` inside `class="text-info"` and emitted
    // `<span <span class="text-brand font-semibold">class</span>="text-info">`,
    // which the browser rendered as the literal text `class="text-info">120`.
    expect(textContent(html)).not.toContain('class="')
    expect(textContent(html)).not.toContain('<span')
    expect(html).not.toContain('<span <span')
  })

  it('escapes exactly once', () => {
    expect(html).not.toContain('&amp;amp;')
    expect(html).not.toContain('&amp;lt;')
    expect(html).not.toContain('&amp;gt;')
    expect(html).not.toContain('&amp;quot;')
  })

  it('reproduces the source exactly, character for character', () => {
    expect(unescapeHtml(textContent(html))).toBe(SAMPLE)
  })

  it('emits balanced spans', () => {
    expect((html.match(SPAN_OPEN) || []).length).toBe((html.match(SPAN_CLOSE) || []).length)
  })

  it('classifies keywords, definitions, numbers and builtins', () => {
    expect(html).toContain('<span class="text-brand font-semibold">class</span>')
    expect(html).toContain('<span class="text-warning">FrameCounter</span>')
    expect(html).toContain('<span class="text-brand font-semibold">def</span>')
    expect(html).toContain('<span class="text-warning">__init__</span>')
    expect(html).toContain('<span class="text-info">120</span>')
    expect(html).toContain('<span class="text-info">0.75</span>')
    expect(html).toContain('<span class="text-accent">print</span>')
  })

  it('does not highlight inside strings or comments', () => {
    // The `#` inside the docstring belongs to the string, not to a comment.
    expect(html).toContain(
      '<span class="text-success">&quot;&quot;&quot;Counts frames. #1 tool.&quot;&quot;&quot;</span>'
    )
    // The whole first line is one comment, including the words inside it.
    expect(html).toContain(
      '<span class="text-muted-foreground italic"># Count the frames</span>'
    )
    // "frames: #" is a string, so its `#` starts no comment and the rest of the
    // line is still tokenised.
    expect(html).toContain('<span class="text-success">&quot;frames: #&quot;</span>')
    expect(html).toContain('<span class="text-accent">str</span>')
  })

  it('escapes HTML in the source so code cannot inject markup', () => {
    const injected = highlightPython('x = "<img src=x onerror=alert(1)>" & 5 < 6')
    expect(injected).not.toContain('<img')
    expect(injected).toContain('&lt;img src=x onerror=alert(')
    expect(injected).toContain('&amp;')
    expect(unescapeHtml(textContent(injected))).toBe('x = "<img src=x onerror=alert(1)>" & 5 < 6')
  })

  it('handles empty input', () => {
    expect(highlightPython('')).toBe('')
  })
})

describe('escapeHtml', () => {
  it('escapes the four characters that break out of markup', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  })
})
