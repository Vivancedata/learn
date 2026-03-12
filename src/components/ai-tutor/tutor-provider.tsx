'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react'
import type {
  ChatMessage,
  TutorContext,
  TutorContextValue,
} from '@/types/ai-tutor'
const STORAGE_KEY = 'ai-tutor-messages'
const MAX_MESSAGES = 100
const MAX_MESSAGE_LENGTH = 2000

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Type for the API response from /api/ai-tutor/chat
 */
interface ChatApiResponse {
  data: {
    message: string
    conversationId: string
    suggestedQuestions?: string[]
    tokenCount?: number
  }
}

/**
 * Context for the AI Tutor
 */
const TutorContextProvider = createContext<TutorContextValue | undefined>(undefined)

/**
 * Props for the TutorProvider component
 */
interface TutorProviderProps {
  children: ReactNode
}

/**
 * TutorProvider component
 * Manages the state and actions for the AI Tutor chat interface
 */
export function TutorProvider({ children }: TutorProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [tutorState, setTutorState] = useState<{
    isOpen: boolean
    isLoading: boolean
    isExpanded: boolean
    error: string | null
    context: TutorContext
    conversationId: string | undefined
  }>({
    isOpen: false,
    isLoading: false,
    isExpanded: false,
    error: null,
    context: {},
    conversationId: undefined,
  })
  const { isOpen, isLoading, isExpanded, error, context, conversationId } = tutorState

  /**
   * Load messages from session storage on mount
   */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[]
        const messagesWithDates = parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(messagesWithDates)
      }
    } catch {
      // Ignore errors when loading from storage
    }
  }, [])

  /**
   * Save messages to session storage when they change
   */
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // Ignore errors when saving to storage
    }
  }, [messages])

  /**
   * Send a message to the AI tutor
   */
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return

      const truncatedMessage = messageText.slice(0, MAX_MESSAGE_LENGTH)

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: truncatedMessage,
        timestamp: new Date(),
        lessonContext: context.lessonId,
      }

      setMessages((prev) => {
        const updated = [...prev, userMessage]
        return updated.slice(-MAX_MESSAGES)
      })

      setTutorState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const requestBody: {
          message: string
          conversationId?: string
          context?: {
            lessonId?: string
            lessonTitle?: string
            courseId?: string
            courseName?: string
          }
        } = { message: truncatedMessage }

        if (conversationId) {
          requestBody.conversationId = conversationId
        }

        if (context.lessonId || context.lessonTitle || context.courseId || context.courseName) {
          requestBody.context = {
            lessonId: context.lessonId,
            lessonTitle: context.lessonTitle,
            courseId: context.courseId,
            courseName: context.courseName,
          }
        }

        const response = await fetch('/api/ai-tutor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const message =
            (errorData as { message?: string }).message ||
            "I'm having trouble connecting. Please try again."
          throw new Error(message)
        }

        const data = (await response.json()) as ChatApiResponse

        if (data.data.conversationId) {
          setTutorState((prev) => ({ ...prev, conversationId: data.data.conversationId }))
        }

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
          lessonContext: context.lessonId,
        }

        setMessages((prev) => {
          const updated = [...prev, assistantMessage]
          return updated.slice(-MAX_MESSAGES)
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "I'm having trouble connecting. Please try again."
        setTutorState((prev) => ({ ...prev, error: errorMessage }))
      } finally {
        setTutorState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [isLoading, context, conversationId]
  )

  /**
   * Clear chat history and reset conversation
   */
  const clearHistory = useCallback(() => {
    setMessages([])
    setTutorState((prev) => ({ ...prev, error: null, conversationId: undefined }))
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  /**
   * Set the current lesson context
   */
  const setLessonContext = useCallback((newContext: TutorContext) => {
    setTutorState((prev) => ({ ...prev, context: newContext }))
  }, [])

  const openChat = useCallback(() => {
    setTutorState((prev) => ({ ...prev, isOpen: true }))
  }, [])

  const closeChat = useCallback(() => {
    setTutorState((prev) => ({ ...prev, isOpen: false, isExpanded: false }))
  }, [])

  const toggleExpand = useCallback(() => {
    setTutorState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }))
  }, [])

  const clearError = useCallback(() => {
    setTutorState((prev) => ({ ...prev, error: null }))
  }, [])

  const value = useMemo<TutorContextValue>(
    () => ({
      messages,
      isOpen,
      isLoading,
      isExpanded,
      error,
      context,
      sendMessage,
      clearHistory,
      setLessonContext,
      openChat,
      closeChat,
      toggleExpand,
      clearError,
    }),
    [
      messages,
      isOpen,
      isLoading,
      isExpanded,
      error,
      context,
      sendMessage,
      clearHistory,
      setLessonContext,
      openChat,
      closeChat,
      toggleExpand,
      clearError,
    ]
  )

  return (
    <TutorContextProvider.Provider value={value}>
      {children}
    </TutorContextProvider.Provider>
  )
}

/**
 * Hook to access the AI Tutor context
 */
export function useTutorContext(): TutorContextValue {
  const context = useContext(TutorContextProvider)
  if (context === undefined) {
    throw new Error('useTutorContext must be used within a TutorProvider')
  }
  return context
}
