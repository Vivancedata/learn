/**
 * AI Tutor Conversations API
 * GET /api/ai-tutor/conversations - List user's conversations
 * POST /api/ai-tutor/conversations - Create a new conversation
 */

import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
} from '@/lib/api-errors'
import {
  createConversationSchema,
  getConversationsQuerySchema,
} from '@/lib/validations'
import { getAuthenticatedUserId } from '@/lib/authorization'
import {
  createConversation,
  getUserConversations,
  getUsageStats,
  type TutorContext,
} from '@/lib/ai-tutor'

/**
 * GET /api/ai-tutor/conversations
 * List the authenticated user's conversations
 *
 * @query limit - Maximum number of conversations to return (default: 20, max: 50)
 *
 * @returns List of conversations with their most recent message
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = getConversationsQuerySchema.parse({
      limit: searchParams.get('limit'),
    })

    // Get user's conversations
    const conversations = await getUserConversations(userId, queryParams.limit)

    // Get usage stats
    const usageStats = await getUsageStats(userId)

    // Define type for conversation with messages
    interface ConversationWithMessages {
      id: string
      title: string | null
      lessonId: string | null
      courseId: string | null
      createdAt: Date
      updatedAt: Date
      messages: Array<{
        content: string
        role: string
        createdAt: Date
      }>
    }

    // Format response
    const formattedConversations = (
      conversations as ConversationWithMessages[]
    ).map((conv) => ({
      id: conv.id,
      title: conv.title,
      lessonId: conv.lessonId,
      courseId: conv.courseId,
      lastMessage: conv.messages[0]
        ? {
            content:
              conv.messages[0].content.slice(0, 100) +
              (conv.messages[0].content.length > 100 ? '...' : ''),
            role: conv.messages[0].role,
            createdAt: conv.messages[0].createdAt,
          }
        : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }))

    return apiSuccess({
      conversations: formattedConversations,
      total: conversations.length,
      usage: usageStats,
    })
  } catch (error) {
    return handleApiError(error, { route: '/api/ai-tutor/conversations' })
  }
}

/**
 * POST /api/ai-tutor/conversations
 * Create a new conversation
 *
 * @body context - Optional context about the lesson/course
 *
 * @returns The newly created conversation
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Parse and validate request body
    const body = await parseRequestBody(request, createConversationSchema)

    // Build tutor context if provided
    const tutorContext: TutorContext | undefined = body.context
      ? {
          lessonId: body.context.lessonId,
          lessonTitle: body.context.lessonTitle,
          courseId: body.context.courseId,
          courseName: body.context.courseName,
          currentContent: body.context.currentContent,
        }
      : undefined

    // Create the conversation
    const conversation = await createConversation(userId, tutorContext)

    return apiSuccess(
      {
        id: conversation.id,
        title: conversation.title,
        message: 'Conversation created successfully',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error, { route: '/api/ai-tutor/conversations' })
  }
}
