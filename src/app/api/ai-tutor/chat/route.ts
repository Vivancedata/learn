/**
 * AI Tutor Chat API
 * POST /api/ai-tutor/chat - Send a message to the AI tutor
 */

import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
  ApiError,
} from '@/lib/api-errors'
import { chatMessageSchema } from '@/lib/validations'
import { getAuthenticatedUserId } from '@/lib/authorization'
import {
  chat,
  checkDailyLimit,
  recordUsage,
  createConversation,
  addMessage,
  getConversation,
  generateSuggestedQuestions,
  type Message,
  type TutorContext,
} from '@/lib/ai-tutor'

/**
 * POST /api/ai-tutor/chat
 * Send a message to the AI tutor and receive a response
 *
 * @body message - The user's message
 * @body conversationId - Optional conversation ID to continue an existing conversation
 * @body context - Optional context about the current lesson/course
 *
 * @returns AI tutor response with conversation ID and suggested follow-up questions
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Parse and validate request body
    const body = await parseRequestBody(request, chatMessageSchema)
    const { message, conversationId, context } = body

    // Check if user has a Pro subscription for unlimited messages
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { status: true },
    })
    const isPro = subscription?.status === 'active'

    // Check daily message limit for free users
    const limitCheck = await checkDailyLimit(userId, isPro)
    if (!limitCheck.allowed) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `You have reached your daily limit of ${limitCheck.limit} messages. ` +
          'Upgrade to Pro for unlimited AI tutor access.',
        { remaining: limitCheck.remaining, limit: limitCheck.limit }
      )
    }

    // Get or create conversation
    let activeConversationId: string
    let conversationMessages: Message[] = []

    if (conversationId) {
      // Load the conversation (messages are needed for context) and verify
      // the user owns it in one query; a missing conversation is reported as
      // forbidden, as before
      const existingConversation = await getConversation(conversationId)
      if (!existingConversation || existingConversation.userId !== userId) {
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          'You do not have access to this conversation'
        )
      }

      activeConversationId = conversationId
      conversationMessages = existingConversation.messages.map(
        (m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })
      )
    } else {
      // Create a new conversation
      const tutorContext: TutorContext | undefined = context
        ? {
            lessonId: context.lessonId,
            lessonTitle: context.lessonTitle,
            courseId: context.courseId,
            courseName: context.courseName,
            currentContent: context.currentContent,
          }
        : undefined

      const newConversation = await createConversation(userId, tutorContext)
      activeConversationId = newConversation.id
    }

    // Add user message to conversation history
    conversationMessages.push({
      role: 'user',
      content: message,
    })

    // Prepare context for the LLM
    const tutorContext: TutorContext | undefined = context
      ? {
          lessonId: context.lessonId,
          lessonTitle: context.lessonTitle,
          courseId: context.courseId,
          courseName: context.courseName,
          currentContent: context.currentContent,
        }
      : undefined

    // Call the AI tutor
    const response = await chat(conversationMessages, tutorContext)

    // Record usage and store the messages (user first, then assistant, to
    // keep their order) -- the two are independent
    await Promise.all([
      recordUsage(userId, response.tokenCount),
      addMessage(activeConversationId, 'user', message).then(() =>
        addMessage(
          activeConversationId,
          'assistant',
          response.content,
          response.tokenCount
        )
      ),
    ])

    // Generate suggested follow-up questions
    const suggestedQuestions = context?.currentContent
      ? generateSuggestedQuestions(context.currentContent, conversationMessages)
      : undefined

    // Get updated limit info
    const updatedLimit = await checkDailyLimit(userId, isPro)

    return apiSuccess(
      {
        message: response.content,
        conversationId: activeConversationId,
        suggestedQuestions,
        usage: {
          remaining: updatedLimit.remaining,
          limit: updatedLimit.limit,
          isPro,
        },
      },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error, { route: '/api/ai-tutor/chat' })
  }
}
