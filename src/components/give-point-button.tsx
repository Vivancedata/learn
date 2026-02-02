'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface GivePointButtonProps {
  recipientId: string
  recipientName: string
  discussionId?: string
  replyId?: string
  hasGivenPoint?: boolean
  onPointGiven?: () => void
  size?: 'sm' | 'default'
}

export function GivePointButton({
  recipientId,
  recipientName,
  discussionId,
  replyId,
  hasGivenPoint = false,
  onPointGiven,
  size = 'sm',
}: GivePointButtonProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [given, setGiven] = useState(hasGivenPoint)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Don't show button if user is not logged in or is viewing their own post
  if (!user || user.id === recipientId) {
    return null
  }

  // If point already given, show a "Thanked" indicator
  if (given) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-success"
        title={`You thanked ${recipientName}`}
      >
        <Check className="h-3 w-3" />
        <span>Thanked</span>
      </span>
    )
  }

  const handleGivePoint = async () => {
    if (!discussionId && !replyId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/points/give', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipientId,
          discussionId,
          replyId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to give point')
      }

      setGiven(true)
      setShowConfirm(false)
      onPointGiven?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to give point')
    } finally {
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Thank {recipientName}?
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-success hover:bg-success/10"
          onClick={handleGivePoint}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Yes'
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="inline-flex flex-col">
      <Button
        variant="ghost"
        size={size}
        className="flex items-center gap-1 h-auto py-1 text-muted-foreground hover:text-primary"
        onClick={() => setShowConfirm(true)}
        title={`Give thanks to ${recipientName} for their helpful response`}
        aria-label={`Give thanks to ${recipientName}`}
      >
        <Heart className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        <span className="text-xs">Thanks</span>
      </Button>
      {error && (
        <span className="text-xs text-destructive mt-1">{error}</span>
      )}
    </div>
  )
}
