'use client'

import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/types/ai-tutor'
import type { Components } from 'react-markdown'

interface ChatMessageProps {
  message: ChatMessageType
  showTimestamp?: boolean
  isLatest?: boolean
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Markdown components for rendering AI responses
 */
const markdownComponents: Components = {
  // Code blocks with syntax highlighting
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match

    if (isInline) {
      return (
        <code
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <div className="relative my-3">
        <div className="absolute top-0 left-0 px-2 py-1 text-xs text-muted-foreground bg-muted rounded-tl rounded-br font-mono">
          {match[1]}
        </div>
        <pre className="bg-muted p-4 pt-8 rounded-lg overflow-x-auto">
          <code className="text-sm font-mono" {...props}>
            {children}
          </code>
        </pre>
      </div>
    )
  },
  // Styled paragraphs
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  // Styled lists
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  // Styled headings
  h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
  // Styled blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/50 pl-3 my-2 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  // Styled strong text
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  // Styled links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
    >
      {children}
    </a>
  ),
}

/**
 * Typing indicator animation
 */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

/**
 * AI Avatar component with gradient
 */
function AiAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-sm"
      aria-hidden="true"
    >
      <Bot className="w-4 h-4 text-primary-foreground" />
    </div>
  )
}

/**
 * User Avatar component
 */
function UserAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
      aria-hidden="true"
    >
      <User className="w-4 h-4 text-secondary-foreground" />
    </div>
  )
}

/**
 * ChatMessage component
 * Displays a single message in the chat with proper styling based on role
 */
function ChatMessageComponent({
  message,
  showTimestamp = true,
  isLatest = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming

  const timestamp = useMemo(
    () => formatTimestamp(message.timestamp),
    [message.timestamp]
  )

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      role="article"
      aria-label={`${isUser ? 'Your' : 'AI Tutor'} message`}
    >
      {/* Avatar */}
      {isUser ? <UserAvatar /> : <AiAvatar />}

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-md'
              : 'bg-card border border-border rounded-tl-md shadow-sm',
            isLatest && !isUser && 'ring-1 ring-primary/20'
          )}
        >
          {isStreaming ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && !isStreaming && (
          <span
            className={cn(
              'text-xs text-muted-foreground mt-1 px-1',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Memoized ChatMessage to prevent unnecessary re-renders
 */
export const ChatMessage = memo(ChatMessageComponent)
ChatMessage.displayName = 'ChatMessage'

/**
 * Export typing indicator for use elsewhere
 */
export { TypingIndicator }
