/**
 * AI Tutor Service
 * Provides LLM-powered tutoring with support for multiple providers (Claude and OpenAI)
 */

import prisma from './db'
import { sanitizeHtml } from './validations'

// ============================================================================
// Types
// ============================================================================

export type LLMProvider = 'claude' | 'openai'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface TutorContext {
  lessonId?: string
  lessonTitle?: string
  courseId?: string
  courseName?: string
  currentContent?: string
}

export interface ChatResponse {
  message: string
  conversationId: string
  suggestedQuestions?: string[]
  tokenCount?: number
}

export interface ProviderConfig {
  model: string
  apiKey: string | undefined
  maxTokens: number
}

// ============================================================================
// Configuration
// ============================================================================

const PROVIDERS: Record<LLMProvider, ProviderConfig> = {
  claude: {
    model: 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 2048,
  },
  openai: {
    model: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY,
    maxTokens: 2048,
  },
}

// Default provider from environment or fallback to claude
const DEFAULT_PROVIDER: LLMProvider =
  (process.env.AI_TUTOR_PROVIDER as LLMProvider) || 'claude'

// Free tier daily message limit
const FREE_TIER_DAILY_LIMIT = parseInt(process.env.AI_TUTOR_FREE_LIMIT || '50', 10)

// ============================================================================
// System Prompt
// ============================================================================

const TUTOR_SYSTEM_PROMPT = `You are an AI tutor for VivanceData, an online learning platform focused on AI, data science, and programming.

Your role is to:
1. Help students understand concepts from their current lesson
2. Answer questions clearly and concisely
3. Provide examples and analogies when helpful
4. Give hints rather than direct answers for practice problems
5. Encourage students and maintain a supportive tone
6. Stay focused on the educational content

Guidelines:
- Use markdown for formatting when helpful
- Include code examples with proper syntax highlighting
- Break down complex topics into digestible pieces
- Ask clarifying questions if the student's question is unclear
- Suggest related topics they might want to explore
- Keep responses concise but thorough
- If asked about topics outside the lesson context, gently redirect to the current learning material

Current context will be provided about the lesson the student is viewing.`

// ============================================================================
// Provider API Implementations
// ============================================================================

/**
 * Call the Anthropic Claude API
 */
async function callClaude(
  messages: Message[],
  systemPrompt: string
): Promise<{ content: string; tokenCount: number }> {
  const config = PROVIDERS.claude

  if (!config.apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map((msg) => ({
    role: msg.role === 'system' ? 'user' : msg.role,
    content: msg.content,
  }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: anthropicMessages,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Claude API error: ${response.status} - ${JSON.stringify(errorData)}`
    )
  }

  const data = await response.json()

  // Extract text from the response
  const textContent = data.content?.find(
    (block: { type: string }) => block.type === 'text'
  )
  const content = textContent?.text || ''

  // Calculate token count from usage
  const tokenCount =
    (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)

  return { content, tokenCount }
}

/**
 * Call the OpenAI API
 */
async function callOpenAI(
  messages: Message[],
  systemPrompt: string
): Promise<{ content: string; tokenCount: number }> {
  const config = PROVIDERS.openai

  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Prepare messages with system prompt
  const openaiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: openaiMessages,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`
    )
  }

  const data = await response.json()

  const content = data.choices?.[0]?.message?.content || ''
  const tokenCount = data.usage?.total_tokens || 0

  return { content, tokenCount }
}

// ============================================================================
// Core Chat Functions
// ============================================================================

/**
 * Build the system prompt with context
 */
function buildSystemPrompt(context?: TutorContext): string {
  let prompt = TUTOR_SYSTEM_PROMPT

  if (context) {
    prompt += '\n\n---\nCurrent Learning Context:\n'

    if (context.courseName) {
      prompt += `Course: ${sanitizeHtml(context.courseName)}\n`
    }
    if (context.lessonTitle) {
      prompt += `Lesson: ${sanitizeHtml(context.lessonTitle)}\n`
    }
    if (context.currentContent) {
      // Truncate content to avoid token limits
      const truncatedContent = context.currentContent.slice(0, 6000)
      prompt += `\nLesson Content Summary:\n${sanitizeHtml(truncatedContent)}`
      if (context.currentContent.length > 6000) {
        prompt += '\n[Content truncated for brevity]'
      }
    }
  }

  return prompt
}

/**
 * Main chat function with provider fallback
 */
export async function chat(
  messages: Message[],
  context?: TutorContext,
  provider: LLMProvider = DEFAULT_PROVIDER
): Promise<{ content: string; tokenCount: number }> {
  const systemPrompt = buildSystemPrompt(context)

  try {
    // Try primary provider
    if (provider === 'claude') {
      return await callClaude(messages, systemPrompt)
    } else {
      return await callOpenAI(messages, systemPrompt)
    }
  } catch (primaryError) {
    // Fallback to alternative provider
    const fallbackProvider = provider === 'claude' ? 'openai' : 'claude'
    const fallbackConfig = PROVIDERS[fallbackProvider]

    if (fallbackConfig.apiKey) {
      console.warn(
        `Primary provider ${provider} failed, falling back to ${fallbackProvider}:`,
        primaryError
      )

      try {
        if (fallbackProvider === 'claude') {
          return await callClaude(messages, systemPrompt)
        } else {
          return await callOpenAI(messages, systemPrompt)
        }
      } catch (fallbackError) {
        console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError)
        throw new Error(
          'AI tutor service temporarily unavailable. Please try again later.'
        )
      }
    }

    // No fallback available
    throw primaryError
  }
}

/**
 * Generate suggested follow-up questions based on conversation
 */
export function generateSuggestedQuestions(
  lessonContent: string,
  conversationHistory: Message[]
): string[] {
  // Extract key topics from lesson content for suggestions
  const suggestions: string[] = []

  // Check what's been discussed to avoid repetition
  const discussedTopics = conversationHistory
    .map((m) => m.content.toLowerCase())
    .join(' ')

  // Generate context-aware suggestions
  const contentLower = lessonContent.toLowerCase()

  // Code-related suggestions
  if (
    contentLower.includes('function') ||
    contentLower.includes('def ') ||
    contentLower.includes('const ')
  ) {
    if (!discussedTopics.includes('example')) {
      suggestions.push('Can you show me a code example?')
    }
    if (!discussedTopics.includes('error') && !discussedTopics.includes('debug')) {
      suggestions.push('What are common mistakes to avoid?')
    }
  }

  // Concept-related suggestions
  if (!discussedTopics.includes('explain') && !discussedTopics.includes('understand')) {
    suggestions.push('Can you explain this concept in simpler terms?')
  }

  // Practice suggestions
  if (!discussedTopics.includes('practice') && !discussedTopics.includes('exercise')) {
    suggestions.push('Can you give me a practice problem?')
  }

  // Real-world application
  if (!discussedTopics.includes('real world') && !discussedTopics.includes('practical')) {
    suggestions.push('How is this used in real-world applications?')
  }

  // Return up to 3 suggestions
  return suggestions.slice(0, 3)
}

// ============================================================================
// Usage Tracking & Rate Limiting
// ============================================================================

/**
 * Check if user has reached their daily message limit
 */
export async function checkDailyLimit(
  userId: string,
  isPro: boolean
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Pro users have unlimited messages
  if (isPro) {
    return { allowed: true, remaining: Infinity, limit: Infinity }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const usage = await prisma.aITutorUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  })

  const messageCount = usage?.messages || 0
  const remaining = Math.max(0, FREE_TIER_DAILY_LIMIT - messageCount)

  return {
    allowed: messageCount < FREE_TIER_DAILY_LIMIT,
    remaining,
    limit: FREE_TIER_DAILY_LIMIT,
  }
}

/**
 * Record a message for usage tracking
 */
export async function recordUsage(
  userId: string,
  tokenCount: number
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.aITutorUsage.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      messages: { increment: 1 },
      tokens: { increment: tokenCount },
    },
    create: {
      userId,
      date: today,
      messages: 1,
      tokens: tokenCount,
    },
  })
}

/**
 * Get user's current usage stats
 */
export async function getUsageStats(
  userId: string
): Promise<{ today: { messages: number; tokens: number }; total: { messages: number; tokens: number } }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayUsage, totalUsage] = await Promise.all([
    prisma.aITutorUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    }),
    prisma.aITutorUsage.aggregate({
      where: { userId },
      _sum: {
        messages: true,
        tokens: true,
      },
    }),
  ])

  return {
    today: {
      messages: todayUsage?.messages || 0,
      tokens: todayUsage?.tokens || 0,
    },
    total: {
      messages: totalUsage._sum.messages || 0,
      tokens: totalUsage._sum.tokens || 0,
    },
  }
}

// ============================================================================
// Conversation Management
// ============================================================================

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  context?: TutorContext
): Promise<{ id: string; title: string | null }> {
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      lessonId: context?.lessonId || null,
      courseId: context?.courseId || null,
      title: context?.lessonTitle
        ? `Help with: ${context.lessonTitle}`
        : 'New Conversation',
    },
  })

  return {
    id: conversation.id,
    title: conversation.title,
  }
}

/**
 * Get conversation with messages
 */
export async function getConversation(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

/**
 * Get user's conversations
 */
export async function getUserConversations(
  userId: string,
  limit: number = 20
) {
  return prisma.conversation.findMany({
    where: { userId },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokenCount?: number
) {
  // Create the message
  const message = await prisma.conversationMessage.create({
    data: {
      conversationId,
      role,
      content,
      tokenCount,
    },
  })

  // Update conversation timestamp and auto-generate title if needed
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })

  if (conversation && !conversation.title && role === 'user') {
    // Auto-generate title from first user message
    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title, updatedAt: new Date() },
    })
  } else {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })
  }

  return message
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await prisma.conversation.delete({
    where: { id: conversationId },
  })
}

/**
 * Check if a user owns a conversation
 */
export async function userOwnsConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  })

  return conversation?.userId === userId
}
