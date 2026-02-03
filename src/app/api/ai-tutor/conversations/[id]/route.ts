/**
 * AI Tutor Single Conversation API
 * GET /api/ai-tutor/conversations/[id] - Get a conversation with messages
 * DELETE /api/ai-tutor/conversations/[id] - Delete a conversation
 */

import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  validateParams,
  HTTP_STATUS,
  ApiError,
} from '@/lib/api-errors'
import { conversationIdParamsSchema } from '@/lib/validations'
import { getAuthenticatedUserId } from '@/lib/authorization'
import {
  getConversation,
  deleteConversation,
  userOwnsConversation,
} from '@/lib/ai-tutor'

/**
 * GET /api/ai-tutor/conversations/[id]
 * Get a conversation with all its messages
 *
 * @param id - The conversation ID
 *
 * @returns The conversation with messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Validate and extract params (Next.js 16+ async params)
    const { id } = await params
    validateParams({ id }, conversationIdParamsSchema)

    // Check if user owns the conversation
    const ownsConversation = await userOwnsConversation(userId, id)
    if (!ownsConversation) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have access to this conversation'
      )
    }

    // Get the conversation
    const conversation = await getConversation(id)
    if (!conversation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found')
    }

    // Define type for message
    interface ConversationMessageType {
      id: string
      role: string
      content: string
      createdAt: Date
    }

    // Format response
    return apiSuccess({
      id: conversation.id,
      title: conversation.title,
      lessonId: conversation.lessonId,
      courseId: conversation.courseId,
      messages: (conversation.messages as ConversationMessageType[]).map(
        (m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })
      ),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    })
  } catch (error) {
    return handleApiError(error, { route: '/api/ai-tutor/conversations/[id]' })
  }
}

/**
 * DELETE /api/ai-tutor/conversations/[id]
 * Delete a conversation and all its messages
 *
 * @param id - The conversation ID
 *
 * @returns Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Validate and extract params (Next.js 16+ async params)
    const { id } = await params
    validateParams({ id }, conversationIdParamsSchema)

    // Check if user owns the conversation
    const ownsConversation = await userOwnsConversation(userId, id)
    if (!ownsConversation) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have access to this conversation'
      )
    }

    // Verify conversation exists
    const conversation = await getConversation(id)
    if (!conversation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found')
    }

    // Delete the conversation (messages are deleted via cascade)
    await deleteConversation(id)

    return apiSuccess({
      message: 'Conversation deleted successfully',
    })
  } catch (error) {
    return handleApiError(error, { route: '/api/ai-tutor/conversations/[id]' })
  }
}
