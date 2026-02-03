'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
  FormEvent,
} from 'react'
import { Send, Lightbulb, HelpCircle, Code, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_CHARS = 2000
const MIN_ROWS = 1
const MAX_ROWS = 6

interface QuickActionButton {
  id: string
  label: string
  icon: typeof HelpCircle
  onClick: () => void
}

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>
  onExplainClick?: () => void
  onHintClick?: () => void
  onExampleClick?: () => void
  isLoading?: boolean
  placeholder?: string
  showQuickActions?: boolean
}

/**
 * ChatInput component
 * Provides text input with send button, multiline support, and quick action buttons
 */
export function ChatInput({
  onSendMessage,
  onExplainClick,
  onHintClick,
  onExampleClick,
  isLoading = false,
  placeholder = 'Ask me anything about this lesson...',
  showQuickActions = true,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charCount = value.length
  const isOverLimit = charCount > MAX_CHARS
  const canSend = value.trim().length > 0 && !isLoading && !isOverLimit

  /**
   * Auto-resize textarea based on content
   */
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Calculate the line height (approximately 24px per line)
    const lineHeight = 24
    const minHeight = lineHeight * MIN_ROWS
    const maxHeight = lineHeight * MAX_ROWS

    // Set the height based on content, clamped between min and max
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${newHeight}px`
  }, [])

  /**
   * Adjust height when value changes
   */
  useEffect(() => {
    adjustTextareaHeight()
  }, [value, adjustTextareaHeight])

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }, [])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!canSend) return

      const message = value.trim()
      setValue('')

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      await onSendMessage(message)
    },
    [canSend, value, onSendMessage]
  )

  /**
   * Handle keyboard events for send on Enter (without Shift)
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (canSend) {
          handleSubmit(e as unknown as FormEvent)
        }
      }
    },
    [canSend, handleSubmit]
  )

  /**
   * Quick action buttons configuration
   */
  const quickActions: QuickActionButton[] = [
    {
      id: 'explain',
      label: 'Explain this',
      icon: HelpCircle,
      onClick: onExplainClick || (() => {}),
    },
    {
      id: 'hint',
      label: 'Give me a hint',
      icon: Lightbulb,
      onClick: onHintClick || (() => {}),
    },
    {
      id: 'example',
      label: 'Show example',
      icon: Code,
      onClick: onExampleClick || (() => {}),
    },
  ].filter((action) => action.onClick !== (() => {}))

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3 space-y-3">
      {/* Quick action buttons */}
      {showQuickActions && quickActions.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick actions">
          {onExplainClick && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2.5 rounded-full"
              onClick={onExplainClick}
              disabled={isLoading}
            >
              <HelpCircle className="w-3 h-3 mr-1.5" aria-hidden="true" />
              Explain this
            </Button>
          )}
          {onHintClick && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2.5 rounded-full"
              onClick={onHintClick}
              disabled={isLoading}
            >
              <Lightbulb className="w-3 h-3 mr-1.5" aria-hidden="true" />
              Give me a hint
            </Button>
          )}
          {onExampleClick && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2.5 rounded-full"
              onClick={onExampleClick}
              disabled={isLoading}
            >
              <Code className="w-3 h-3 mr-1.5" aria-hidden="true" />
              Show example
            </Button>
          )}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            'flex items-end gap-2 rounded-xl border bg-background p-2 transition-all duration-200',
            isFocused && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
            isOverLimit && 'border-destructive'
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isLoading}
            rows={MIN_ROWS}
            className={cn(
              'flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground',
              'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[24px] py-1.5 px-2'
            )}
            aria-label="Type your message"
            aria-describedby="char-count"
          />

          <Button
            type="submit"
            size="icon"
            variant={canSend ? 'default' : 'ghost'}
            className={cn(
              'h-8 w-8 rounded-lg flex-shrink-0 transition-all duration-200',
              canSend && 'bg-primary hover:bg-primary/90'
            )}
            disabled={!canSend}
            aria-label={isLoading ? 'Sending message' : 'Send message'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Character count */}
        <div
          id="char-count"
          className={cn(
            'flex justify-between items-center mt-1 px-2 text-xs',
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          <span className="sr-only">
            {charCount} of {MAX_CHARS} characters used
          </span>
          <span aria-hidden="true">
            Press Shift+Enter for new line
          </span>
          <span aria-hidden="true">
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </form>
    </div>
  )
}
