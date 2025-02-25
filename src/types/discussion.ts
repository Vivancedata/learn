export interface Discussion {
  id: string
  userId: string
  username: string
  content: string
  createdAt: string
  likes: number
  replies?: Discussion[]
}

export interface CommunityDiscussionsProps {
  discussions: Discussion[]
  courseId?: string
  lessonId?: string
}

export interface DiscussionReply {
  discussionId: string
  content: string
  userId: string
  username: string
  createdAt: string
}
