"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, Reply, MoreHorizontal } from "lucide-react"

import { CommunityDiscussionsProps } from "@/types/discussion"

export function CommunityDiscussions({ discussions, courseId, lessonId }: CommunityDiscussionsProps) {
  const [newDiscussion, setNewDiscussion] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  
  const handlePostDiscussion = () => {
    if (!newDiscussion.trim()) return
    
    // In a real app, we would send this to the backend
    console.log("Posting discussion:", {
      courseId,
      lessonId,
      content: newDiscussion
    })
    
    // Clear the input
    setNewDiscussion("")
  }
  
  const handlePostReply = (discussionId: string) => {
    if (!replyContent.trim()) return
    
    // In a real app, we would send this to the backend
    console.log("Posting reply:", {
      discussionId,
      content: replyContent
    })
    
    // Clear the input and close the reply form
    setReplyContent("")
    setReplyingTo(null)
  }
  
  const handleLike = (discussionId: string) => {
    // In a real app, we would send this to the backend
    console.log("Liking discussion:", discussionId)
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
        <div className="space-y-4">
          <Textarea
            placeholder="Share your thoughts or ask a question..."
            value={newDiscussion}
            onChange={(e) => setNewDiscussion(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handlePostDiscussion} disabled={!newDiscussion.trim()}>
              Post
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          {discussions.length > 0 ? (
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
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handlePostReply(discussion.id)}
                        disabled={!replyContent.trim()}
                      >
                        Reply
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
