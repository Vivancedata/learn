'use client'

import { useCallback, useMemo } from 'react'
import { useTutorContext } from '@/components/ai-tutor/tutor-provider'
import type { TutorContext, ChatMessage, SuggestedQuestion } from '@/types/ai-tutor'

/**
 * Hook to interact with the AI Tutor
 * Provides a simplified interface to the tutor context
 */
export function useAiTutor() {
  const {
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
  } = useTutorContext()

  /**
   * Send a message with optional pre-processing
   */
  const send = useCallback(
    async (message: string) => {
      if (!message.trim()) return
      await sendMessage(message)
    },
    [sendMessage]
  )

  /**
   * Ask for explanation of current topic
   */
  const askForExplanation = useCallback(async () => {
    const topic = context.lessonTitle || context.currentTopic || 'this concept'
    await sendMessage(`Can you explain ${topic} in simpler terms?`)
  }, [context, sendMessage])

  /**
   * Ask for a hint
   */
  const askForHint = useCallback(async () => {
    const topic = context.lessonTitle || 'the current topic'
    await sendMessage(`Give me a hint about ${topic}`)
  }, [context, sendMessage])

  /**
   * Ask for an example
   */
  const askForExample = useCallback(async () => {
    const topic = context.lessonTitle || context.currentTopic || 'this'
    await sendMessage(`Show me a practical example of ${topic}`)
  }, [context, sendMessage])

  /**
   * Ask what to learn next
   */
  const askWhatNext = useCallback(async () => {
    await sendMessage('What should I learn next?')
  }, [sendMessage])

  /**
   * Get the last few messages for preview
   */
  const recentMessages = useMemo(() => {
    return messages.slice(-5)
  }, [messages])

  /**
   * Check if there are any messages
   */
  const hasMessages = useMemo(() => messages.length > 0, [messages])

  /**
   * Get the last message
   */
  const lastMessage = useMemo(() => {
    return messages[messages.length - 1] || null
  }, [messages])

  /**
   * Get only user messages
   */
  const userMessages = useMemo(() => {
    return messages.filter((msg) => msg.role === 'user')
  }, [messages])

  /**
   * Get only assistant messages
   */
  const assistantMessages = useMemo(() => {
    return messages.filter((msg) => msg.role === 'assistant')
  }, [messages])

  /**
   * Generate suggested questions based on context
   */
  const suggestedQuestions = useMemo((): SuggestedQuestion[] => {
    const questions: SuggestedQuestion[] = []

    if (context.lessonTitle) {
      questions.push({
        id: 'understand',
        text: `I don't understand ${context.lessonTitle}`,
        category: 'understanding',
        icon: 'help',
      })
      questions.push({
        id: 'explain',
        text: 'Can you explain this differently?',
        category: 'understanding',
        icon: 'lightbulb',
      })
    }

    questions.push({
      id: 'practice',
      text: 'Give me a practice problem',
      category: 'practice',
      icon: 'code',
    })

    questions.push({
      id: 'next',
      text: 'What should I learn next?',
      category: 'navigation',
      icon: 'arrow-right',
    })

    return questions
  }, [context.lessonTitle])

  return {
    // State
    messages,
    isOpen,
    isLoading,
    isExpanded,
    error,
    context,
    recentMessages,
    hasMessages,
    lastMessage,
    userMessages,
    assistantMessages,
    suggestedQuestions,

    // Actions
    sendMessage: send,
    clearHistory,
    setLessonContext,
    openChat,
    closeChat,
    toggleExpand,
    clearError,

    // Quick actions
    askForExplanation,
    askForHint,
    askForExample,
    askWhatNext,
  }
}

/**
 * Hook to set lesson context when entering a lesson page
 */
export function useLessonTutorContext(lessonContext: TutorContext | null) {
  const { setLessonContext } = useTutorContext()

  // Update context when lesson changes
  useMemo(() => {
    if (lessonContext) {
      setLessonContext(lessonContext)
    }
  }, [lessonContext, setLessonContext])
}

/**
 * Type exports for convenience
 */
export type { ChatMessage, TutorContext, SuggestedQuestion }
