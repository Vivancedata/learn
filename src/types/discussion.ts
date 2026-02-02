// API response types (from backend)
export interface ApiUser {
  id: string
  name: string | null
  email: string
  points?: number
}

export interface ApiDiscussionReply {
  id: string
  discussionId: string
  userId: string
  content: string
  likes: number
  createdAt: string
  user: ApiUser
}

export interface ApiDiscussion {
  id: string
  userId: string
  courseId: string | null
  lessonId: string | null
  content: string
  likes: number
  createdAt: string
  user: ApiUser
  replies: ApiDiscussionReply[]
}

// Transformed types for component use
export interface Discussion {
  id: string
  userId: string
  username: string
  userPoints: number
  content: string
  createdAt: string
  likes: number
  replies?: DiscussionReply[]
}

export interface DiscussionReply {
  id: string
  discussionId: string
  content: string
  userId: string
  username: string
  userPoints: number
  createdAt: string
  likes: number
}

export interface CommunityDiscussionsProps {
  courseId?: string
  lessonId?: string
}

// Helper function to transform API data to component format
export function transformApiDiscussion(apiDiscussion: ApiDiscussion): Discussion {
  return {
    id: apiDiscussion.id,
    userId: apiDiscussion.userId,
    username: apiDiscussion.user.name || apiDiscussion.user.email.split('@')[0],
    userPoints: apiDiscussion.user.points || 0,
    content: apiDiscussion.content,
    createdAt: apiDiscussion.createdAt,
    likes: apiDiscussion.likes,
    replies: apiDiscussion.replies?.map(transformApiReply),
  }
}

export function transformApiReply(apiReply: ApiDiscussionReply): DiscussionReply {
  return {
    id: apiReply.id,
    discussionId: apiReply.discussionId,
    content: apiReply.content,
    userId: apiReply.userId,
    username: apiReply.user.name || apiReply.user.email.split('@')[0],
    userPoints: apiReply.user.points || 0,
    createdAt: apiReply.createdAt,
    likes: apiReply.likes,
  }
}
