'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  Bot,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAiTutor } from '@/hooks/useAiTutor'
import { ChatMessage, TypingIndicator } from './chat-message'
import { ChatInput } from './chat-input'
import { WelcomeMessage, SuggestedQuestions } from './suggested-questions'

/**
 * Floating button to open the chat
 */
function FloatingButton({
  onClick,
  hasMessages,
}: {
  onClick: () => void
  hasMessages: boolean
}) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'w-14 h-14 rounded-full shadow-lg',
        'bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90',
        'transition-all duration-300 hover:scale-105 hover:shadow-glow',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      aria-label="Open AI Tutor chat"
    >
      <Bot className="w-6 h-6" aria-hidden="true" />
      {hasMessages && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"
          aria-label="You have messages"
        />
      )}
    </Button>
  )
}

/**
 * Chat panel header
 */
function ChatHeader({
  onClose,
  onToggleExpand,
  onClearHistory,
  isExpanded,
  hasMessages,
}: {
  onClose: () => void
  onToggleExpand: () => void
  onClearHistory: () => void
  isExpanded: boolean
  hasMessages: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">AI Tutor</h2>
          <p className="text-xs text-muted-foreground">Here to help you learn</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {hasMessages && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onClearHistory}
            aria-label="Clear chat history"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Minimize chat' : 'Maximize chat'}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Main chat panel container
 */
function ChatPanel({
  isExpanded,
  children,
}: {
  isExpanded: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col',
        'bg-background/95 backdrop-blur-md',
        'border border-border rounded-xl shadow-elevation-3',
        'transition-all duration-300 ease-out',
        // Mobile: full screen drawer from bottom
        'sm:bottom-6 sm:right-6',
        'bottom-0 right-0 left-0 sm:left-auto',
        // Desktop: expandable panel
        isExpanded
          ? 'sm:w-[600px] sm:h-[700px] max-h-[90vh]'
          : 'sm:w-[400px] sm:h-[550px]',
        // Mobile specific
        'h-[85vh] sm:h-auto',
        'rounded-b-none sm:rounded-xl'
      )}
      role="dialog"
      aria-label="AI Tutor chat"
      aria-modal="true"
    >
      {children}
    </div>
  )
}

/**
 * Messages container with scroll
 */
function MessagesContainer({
  messages,
  isLoading,
  context,
  onQuestionClick,
  suggestedQuestions,
}: {
  messages: ReturnType<typeof useAiTutor>['messages']
  isLoading: boolean
  context: ReturnType<typeof useAiTutor>['context']
  onQuestionClick: (text: string) => void
  suggestedQuestions: ReturnType<typeof useAiTutor>['suggestedQuestions']
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  /**
   * Scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const hasMessages = messages.length > 0

  return (
    <ScrollArea className="flex-1 px-4">
      <div ref={scrollRef} className="py-4 space-y-4">
        {!hasMessages ? (
          <WelcomeMessage
            lessonTitle={context.lessonTitle}
            courseName={context.courseName}
            onQuestionClick={onQuestionClick}
            isLoading={isLoading}
          />
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLatest={index === messages.length - 1}
                showTimestamp={true}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
            {/* Show suggested questions after AI response */}
            {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
              <div className="pt-2">
                <SuggestedQuestions
                  questions={suggestedQuestions}
                  onQuestionClick={onQuestionClick}
                  isLoading={isLoading}
                  variant="compact"
                />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

/**
 * Backdrop overlay for mobile
 */
function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 sm:hidden"
      onClick={onClick}
      aria-hidden="true"
    />
  )
}

/**
 * Main ChatContainer component
 * Provides the full chat interface with floating button, expandable panel, and mobile drawer
 */
export function ChatContainer() {
  const {
    messages,
    isOpen,
    isLoading,
    isExpanded,
    error,
    context,
    suggestedQuestions,
    hasMessages,
    sendMessage,
    clearHistory,
    openChat,
    closeChat,
    toggleExpand,
    clearError,
    askForExplanation,
    askForHint,
    askForExample,
  } = useAiTutor()

  /**
   * Handle question click from suggested questions
   */
  const handleQuestionClick = useCallback(
    (text: string) => {
      sendMessage(text)
    },
    [sendMessage]
  )

  /**
   * Handle keyboard events for accessibility
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeChat])

  /**
   * Trap focus within the chat panel when open
   */
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll on mobile when chat is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Show floating button when chat is closed
  if (!isOpen) {
    return <FloatingButton onClick={openChat} hasMessages={hasMessages} />
  }

  return (
    <>
      {/* Mobile backdrop */}
      <Backdrop onClick={closeChat} />

      {/* Chat panel */}
      <ChatPanel isExpanded={isExpanded}>
        {/* Header */}
        <ChatHeader
          onClose={closeChat}
          onToggleExpand={toggleExpand}
          onClearHistory={clearHistory}
          isExpanded={isExpanded}
          hasMessages={hasMessages}
        />

        {/* Error banner */}
        {error && (
          <div
            className="mx-4 mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between"
            role="alert"
          >
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-destructive hover:text-destructive"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Messages */}
        <MessagesContainer
          messages={messages}
          isLoading={isLoading}
          context={context}
          onQuestionClick={handleQuestionClick}
          suggestedQuestions={suggestedQuestions}
        />

        {/* Input */}
        <ChatInput
          onSendMessage={sendMessage}
          onExplainClick={askForExplanation}
          onHintClick={askForHint}
          onExampleClick={askForExample}
          isLoading={isLoading}
          placeholder={
            context.lessonTitle
              ? `Ask about ${context.lessonTitle}...`
              : 'Ask me anything about your course...'
          }
          showQuickActions={!hasMessages || messages[messages.length - 1]?.role === 'assistant'}
        />
      </ChatPanel>
    </>
  )
}

/**
 * AiTutorButton - A standalone button to open the AI tutor from any component
 * Useful for "Ask AI about this" buttons on lesson pages
 */
interface AiTutorButtonProps {
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  prefillMessage?: string
}

export function AiTutorButton({
  label = 'Ask AI Tutor',
  variant = 'outline',
  size = 'sm',
  className,
  prefillMessage,
}: AiTutorButtonProps) {
  const { openChat, sendMessage } = useAiTutor()

  const handleClick = useCallback(() => {
    openChat()
    if (prefillMessage) {
      // Small delay to ensure chat is open before sending
      setTimeout(() => {
        sendMessage(prefillMessage)
      }, 100)
    }
  }, [openChat, sendMessage, prefillMessage])

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
      onClick={handleClick}
    >
      <MessageSquare className="w-4 h-4" aria-hidden="true" />
      {label}
    </Button>
  )
}
