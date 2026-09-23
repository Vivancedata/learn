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
  }, [context.lessonTitle, context.currentTopic, sendMessage])

  /**
   * Ask for a hint
   */
  const askForHint = useCallback(async () => {
    const topic = context.lessonTitle || 'the current topic'
    await sendMessage(`Give me a hint about ${topic}`)
  }, [context.lessonTitle, sendMessage])

  /**
   * Ask for an example
   */
  const askForExample = useCallback(async () => {
    const topic = context.lessonTitle || context.currentTopic || 'this'
    await sendMessage(`Show me a practical example of ${topic}`)
  }, [context.lessonTitle, context.currentTopic, sendMessage])

  const hasMessages = messages.length > 0

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
    hasMessages,
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
  }
}

/**
 * Type exports for convenience
 */
export type { ChatMessage, TutorContext, SuggestedQuestion }
