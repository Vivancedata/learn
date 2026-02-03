/**
 * AI Tutor Types
 * Type definitions for the AI Tutor chat interface
 */

/**
 * Represents a single message in the chat history
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  lessonContext?: string
  isStreaming?: boolean
}

/**
 * Context information about the current learning environment
 */
export interface TutorContext {
  lessonId?: string
  lessonTitle?: string
  courseId?: string
  courseName?: string
  currentTopic?: string
  sectionTitle?: string
}

/**
 * Suggested question for the user
 */
export interface SuggestedQuestion {
  id: string
  text: string
  category: 'understanding' | 'practice' | 'example' | 'navigation'
  icon?: string
}

/**
 * State of the AI Tutor
 */
export interface TutorState {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  isExpanded: boolean
  error: string | null
  context: TutorContext
}

/**
 * Actions available for the AI Tutor
 */
export interface TutorActions {
  sendMessage: (message: string) => Promise<void>
  clearHistory: () => void
  setLessonContext: (context: TutorContext) => void
  openChat: () => void
  closeChat: () => void
  toggleExpand: () => void
  clearError: () => void
}

/**
 * Combined type for the tutor context value
 */
export type TutorContextValue = TutorState & TutorActions

/**
 * Quick action button type
 */
export interface QuickAction {
  id: string
  label: string
  prompt: string
  icon: 'help' | 'lightbulb' | 'code' | 'arrow-right'
}

/**
 * Chat input state
 */
export interface ChatInputState {
  value: string
  isDisabled: boolean
  charCount: number
  maxChars: number
}

/**
 * Message render options
 */
export interface MessageRenderOptions {
  showTimestamp: boolean
  showAvatar: boolean
  enableCodeHighlight: boolean
  animateTyping: boolean
}
