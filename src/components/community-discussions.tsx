"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, Reply, MoreHorizontal, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { GivePointButton } from "@/components/give-point-button"
import { PointsBadge } from "@/components/helper-badge"

import {
  CommunityDiscussionsProps,
  Discussion,
} from "@/types/discussion"

function useCommunityDiscussionsContent({ discussions, courseId, lessonId, onRefresh }: CommunityDiscussionsProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [discussionState, setDiscussionState] = useState({
    newDiscussion: "",
    replyingTo: null as string | null,
    replyContent: "",
    expandedReplies: {} as Record<string, boolean>,
    loading: false,
    replyLoading: false,
    error: null as string | null,
  })
  const {
    newDiscussion,
    replyingTo,
    replyContent,
    expandedReplies,
    loading,
    replyLoading,
    error,
  } = discussionState
  const signInHref = pathname ? `/sign-in?redirect=${encodeURIComponent(pathname)}` : '/sign-in'

  const handlePostDiscussion = async () => {
    if (!newDiscussion.trim()) return
    if (!user) {
      setDiscussionState((prev) => ({
        ...prev,
        error: "You must be logged in to post a discussion",
      }))
      return
    }

    setDiscussionState((prev) => ({ ...prev, loading: true, error: null }))

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
      setDiscussionState((prev) => ({ ...prev, newDiscussion: "" }))

      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      setDiscussionState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to post discussion',
      }))
    } finally {
      setDiscussionState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handlePostReply = async (discussionId: string) => {
    if (!replyContent.trim()) return
    if (!user) {
      setDiscussionState((prev) => ({
        ...prev,
        error: "You must be logged in to reply",
      }))
      return
    }

    setDiscussionState((prev) => ({ ...prev, replyLoading: true, error: null }))

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
      setDiscussionState((prev) => ({
        ...prev,
        replyContent: "",
        replyingTo: null,
      }))

      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      setDiscussionState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to post reply',
      }))
    } finally {
      setDiscussionState((prev) => ({ ...prev, replyLoading: false }))
    }
  }

  const handleLike = async (id: string, type: "discussion" | "reply") => {
    if (!user) {
      setDiscussionState((prev) => ({
        ...prev,
        error: "You must be logged in to like posts",
      }))
      return
    }

    try {
      const endpoint =
        type === "discussion"
          ? `/api/discussions/${id}/like`
          : `/api/discussions/replies/${id}/like`

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update like")
      }

      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      setDiscussionState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to update like",
      }))
    }
  }
  
  const toggleReplies = (discussionId: string) => {
    setDiscussionState(prev => ({
      ...prev,
      expandedReplies: {
        ...prev.expandedReplies,
        [discussionId]: !prev.expandedReplies[discussionId],
      },
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
  
  const displayedDiscussions: Discussion[] = discussions || []

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
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Share your thoughts or ask a question..."
              value={newDiscussion}
              onChange={(e) =>
                setDiscussionState((prev) => ({ ...prev, newDiscussion: e.target.value }))
              }
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
        ) : (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Read discussions freely. Sign in to ask questions, reply, and like helpful posts.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href={signInHref}>Sign In to Participate</Link>
            </Button>
          </div>
        )}
        
        <div className="space-y-6">
          {displayedDiscussions.length > 0 ? (
            displayedDiscussions.map(discussion => (
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
                        <div className="font-medium flex items-center gap-2">
                          {discussion.username}
                          <PointsBadge points={discussion.userPoints} />
                        </div>
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
                      onClick={() => handleLike(discussion.id, "discussion")}
                      disabled={!user}
                      title={!user ? 'Sign in to like posts' : undefined}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-xs">{discussion.likes}</span>
                    </Button>

                    {user && (
                      <GivePointButton
                        recipientId={discussion.userId}
                        recipientName={discussion.username}
                        discussionId={discussion.id}
                        onPointGiven={onRefresh}
                      />
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 h-auto py-1"
                      onClick={() => {
                        if (replyingTo === discussion.id) {
                          setDiscussionState((prev) => ({ ...prev, replyingTo: null }))
                        } else {
                          setDiscussionState((prev) => ({
                            ...prev,
                            replyingTo: discussion.id,
                            replyContent: "",
                          }))
                        }
                      }}
                      disabled={!user}
                      title={!user ? 'Sign in to reply' : undefined}
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
                      onChange={(e) =>
                        setDiscussionState((prev) => ({ ...prev, replyContent: e.target.value }))
                      }
                      rows={2}
                      disabled={replyLoading}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscussionState((prev) => ({ ...prev, replyingTo: null }))}
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
                              <div className="font-medium text-sm flex items-center gap-2">
                                {reply.username}
                                <PointsBadge points={reply.userPoints} />
                              </div>
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
                            onClick={() => handleLike(reply.id, "reply")}
                            disabled={!user}
                            title={!user ? 'Sign in to like posts' : undefined}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span className="text-xs">{reply.likes}</span>
                          </Button>

                          {user && (
                            <GivePointButton
                              recipientId={reply.userId}
                              recipientName={reply.username}
                              replyId={reply.id}
                              onPointGiven={onRefresh}
                              size="sm"
                            />
                          )}
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

export function CommunityDiscussions(props: CommunityDiscussionsProps) {
  return useCommunityDiscussionsContent(props)
}
