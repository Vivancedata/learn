/**
 * AI Tutor Components
 * Export all AI tutor related components and hooks
 */

// Main components
export { ChatContainer, AiTutorButton } from './chat-container'
export { ChatMessage, TypingIndicator } from './chat-message'
export { ChatInput } from './chat-input'
export { SuggestedQuestions, WelcomeMessage } from './suggested-questions'
export { TutorProvider, useTutorContext } from './tutor-provider'

// Re-export types for convenience
export type {
  ChatMessage as ChatMessageType,
  TutorContext,
  SuggestedQuestion,
  TutorState,
  TutorActions,
  TutorContextValue,
  QuickAction,
  ChatInputState,
  MessageRenderOptions,
} from '@/types/ai-tutor'
