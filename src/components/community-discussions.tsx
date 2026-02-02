"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, Reply, MoreHorizontal, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

import {
  CommunityDiscussionsProps,
  Discussion,
  ApiDiscussion,
  transformApiDiscussion,
} from "@/types/discussion"

export function CommunityDiscussions({ courseId, lessonId }: CommunityDiscussionsProps) {
  const { user } = useAuth()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [newDiscussion, setNewDiscussion] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [replyLoading, setReplyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch discussions from API
  const fetchDiscussions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (courseId) params.append('courseId', courseId)
      if (lessonId) params.append('lessonId', lessonId)

      const response = await fetch(`/api/discussions?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch discussions')
      }

      const data = await response.json()
      const apiDiscussions: ApiDiscussion[] = data.data?.discussions || []
      const transformedDiscussions = apiDiscussions.map(transformApiDiscussion)
      setDiscussions(transformedDiscussions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discussions')
    }
  }, [courseId, lessonId])

  // Fetch discussions on mount and when courseId/lessonId changes
  useEffect(() => {
    const loadDiscussions = async () => {
      setInitialLoading(true)
      await fetchDiscussions()
      setInitialLoading(false)
    }
    loadDiscussions()
  }, [fetchDiscussions])

  const handlePostDiscussion = async () => {
    if (!newDiscussion.trim()) return
    if (!user) {
      setError("You must be logged in to post a discussion")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HTTP-only auth cookie
        body: JSON.stringify({
          userId: user.id,
          content: newDiscussion,
          courseId,
          lessonId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to post discussion')
      }

      // Clear the input and refresh discussions from the API
      setNewDiscussion("")
      await fetchDiscussions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post discussion')
    } finally {
      setLoading(false)
    }
  }

  const handlePostReply = async (discussionId: string) => {
    if (!replyContent.trim()) return
    if (!user) {
      setError("You must be logged in to reply")
      return
    }

    setReplyLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HTTP-only auth cookie
        body: JSON.stringify({
          userId: user.id,
          discussionId,
          content: replyContent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to post reply')
      }

      // Clear the input, close the reply form, and refresh discussions
      setReplyContent("")
      setReplyingTo(null)
      setExpandedReplies(prev => ({ ...prev, [discussionId]: true }))
      await fetchDiscussions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply')
    } finally {
      setReplyLoading(false)
    }
  }

  const handleLike = async (_discussionId: string) => {
    // TODO: Implement like functionality when API endpoint is available
    // This would require a new endpoint like PUT /api/discussions/[id]/like
  }
  
  const toggleReplies = (discussionId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [discussionId]: !prev[discussionId]
    }))
  }
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      
      // Convert to appropriate time unit
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)
      
      if (diffDay > 30) {
        return date.toLocaleDateString()
      } else if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
      } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
      } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
      } else {
        return 'just now'
      }
    } catch {
      return "recently"
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Community Discussions
        </CardTitle>
        <CardDescription>
          Discuss this {lessonId ? "lesson" : "course"} with other students
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Textarea
            placeholder="Share your thoughts or ask a question..."
            value={newDiscussion}
            onChange={(e) => setNewDiscussion(e.target.value)}
            rows={3}
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button onClick={handlePostDiscussion} disabled={!newDiscussion.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          {initialLoading ? (
            <div className="text-center py-6">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading discussions...</p>
            </div>
          ) : discussions.length > 0 ? (
            discussions.map(discussion => (
              <div key={discussion.id} className="space-y-4">
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar>
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                          {discussion.username.charAt(0).toUpperCase()}
                        </div>
                      </Avatar>
                      <div>
                        <div className="font-medium">{discussion.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(discussion.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm mb-3">{discussion.content}</p>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 h-auto py-1"
                      onClick={() => handleLike(discussion.id)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-xs">{discussion.likes}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 h-auto py-1"
                      onClick={() => {
                        if (replyingTo === discussion.id) {
                          setReplyingTo(null)
                        } else {
                          setReplyingTo(discussion.id)
                          setReplyContent("")
                        }
                      }}
                    >
                      <Reply className="h-4 w-4" />
                      <span className="text-xs">Reply</span>
                    </Button>
                    
                    {discussion.replies && discussion.replies.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1 h-auto py-1"
                        onClick={() => toggleReplies(discussion.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs">
                          {discussion.replies.length} {discussion.replies.length === 1 ? "reply" : "replies"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {replyingTo === discussion.id && (
                  <div className="pl-6 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={2}
                      disabled={replyLoading}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                        disabled={replyLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePostReply(discussion.id)}
                        disabled={!replyContent.trim() || replyLoading}
                      >
                        {replyLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          'Reply'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {discussion.replies && discussion.replies.length > 0 && expandedReplies[discussion.id] && (
                  <div className="pl-6 space-y-3">
                    {discussion.replies.map(reply => (
                      <div key={reply.id} className="bg-muted/20 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar>
                              <div className="flex h-full w-full items-center justify-center bg-primary/80 text-primary-foreground">
                                {reply.username.charAt(0).toUpperCase()}
                              </div>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{reply.username}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(reply.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-2">{reply.content}</p>
                        
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center gap-1 h-auto py-1"
                            onClick={() => handleLike(reply.id)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span className="text-xs">{reply.likes}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No discussions yet. Be the first to start a conversation!</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Please be respectful and follow our community guidelines
        </div>
      </CardFooter>
    </Card>
  )
}
