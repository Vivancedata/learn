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
  TutorState,
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
 * Initial state for the tutor
 */
const initialState: TutorState = {
  messages: [],
  isOpen: false,
  isLoading: false,
  isExpanded: false,
  error: null,
  context: {},
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
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<TutorContext>({})

  /**
   * Load messages from session storage on mount
   */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[]
        // Convert timestamp strings back to Date objects
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

      // Truncate message if too long
      const truncatedMessage = messageText.slice(0, MAX_MESSAGE_LENGTH)

      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: truncatedMessage,
        timestamp: new Date(),
        lessonContext: context.lessonId,
      }

      // Add user message to history
      setMessages((prev) => {
        const updated = [...prev, userMessage]
        // Keep only the last MAX_MESSAGES
        return updated.slice(-MAX_MESSAGES)
      })

      setIsLoading(true)
      setError(null)

      try {
        // Create a simulated AI response
        // In production, this would call an actual AI API
        const aiResponse = await simulateAiResponse(truncatedMessage, context)

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          lessonContext: context.lessonId,
        }

        setMessages((prev) => {
          const updated = [...prev, assistantMessage]
          return updated.slice(-MAX_MESSAGES)
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get response from AI tutor'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, context]
  )

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(() => {
    setMessages([])
    setError(null)
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
    setContext(newContext)
  }, [])

  /**
   * Open the chat panel
   */
  const openChat = useCallback(() => {
    setIsOpen(true)
  }, [])

  /**
   * Close the chat panel
   */
  const closeChat = useCallback(() => {
    setIsOpen(false)
    setIsExpanded(false)
  }, [])

  /**
   * Toggle expanded state
   */
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Memoized context value
   */
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

/**
 * Simulate an AI response (placeholder for actual API integration)
 * In production, this would call the AI backend API
 */
async function simulateAiResponse(
  message: string,
  context: TutorContext
): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

  const lowerMessage = message.toLowerCase()

  // Context-aware responses
  if (context.lessonTitle) {
    if (lowerMessage.includes("don't understand") || lowerMessage.includes("confused")) {
      return `I understand that **${context.lessonTitle}** can be challenging. Let me break it down for you:\n\n1. **Start with the basics** - Make sure you understand the fundamental concepts first.\n2. **Practice with examples** - Try working through the code examples in the lesson.\n3. **Take it step by step** - Don't try to learn everything at once.\n\nWhat specific part would you like me to explain in more detail?`
    }

    if (lowerMessage.includes('example') || lowerMessage.includes('show me')) {
      return `Here's a practical example related to **${context.lessonTitle}**:\n\n\`\`\`python\n# Example code\ndef example_function():\n    """This demonstrates the concept."""\n    result = process_data()\n    return result\n\n# Usage\noutput = example_function()\nprint(output)\n\`\`\`\n\nWould you like me to explain how this works step by step?`
    }

    if (lowerMessage.includes('hint') || lowerMessage.includes('help')) {
      return `Here's a hint for the current topic (**${context.lessonTitle}**):\n\n> **Tip:** Focus on understanding the *why* before the *how*. Once you grasp the underlying concept, the implementation becomes much clearer.\n\nTry breaking the problem into smaller pieces. What's the first small step you can take?`
    }
  }

  // General responses
  if (lowerMessage.includes('what should i learn next')) {
    return `Based on your current progress${context.courseName ? ` in **${context.courseName}**` : ''}, I recommend:\n\n1. **Complete the current lesson** - Make sure you've practiced all the concepts.\n2. **Review any quizzes** - Check your understanding with the knowledge checks.\n3. **Try a mini-project** - Apply what you've learned to a small project.\n\nWould you like me to suggest some practice exercises?`
  }

  if (lowerMessage.includes('practice') || lowerMessage.includes('exercise')) {
    return `Here's a practice problem for you:\n\n**Challenge:** Write a function that takes a list of numbers and returns only the even ones.\n\n\`\`\`python\ndef get_even_numbers(numbers):\n    # Your code here\n    pass\n\n# Test your solution\ntest = [1, 2, 3, 4, 5, 6]\nprint(get_even_numbers(test))  # Should print [2, 4, 6]\n\`\`\`\n\nGive it a try! Let me know if you need a hint.`
  }

  if (lowerMessage.includes('explain') && lowerMessage.includes('differently')) {
    return `Let me try a different approach:\n\n**Analogy:** Think of it like cooking a recipe. Just as you need ingredients (data) and steps (functions) to make a dish, programming combines data and logic to create results.\n\n**Visual way to think about it:**\n- Input goes in one side\n- Processing happens in the middle\n- Output comes out the other side\n\nDoes this perspective help? Would you like me to use another analogy?`
  }

  // Default helpful response
  return `Great question! Here's what I can help you with:\n\n1. **Explain concepts** - I can break down any topic from your current lesson.\n2. **Provide examples** - I'll show you practical code examples.\n3. **Give hints** - If you're stuck, I can guide you without giving away the answer.\n4. **Suggest next steps** - I can recommend what to learn next.\n\nWhat would you like to explore?${context.lessonTitle ? `\n\nYou're currently studying: **${context.lessonTitle}**` : ''}`
}
