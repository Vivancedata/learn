'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Snowflake, AlertTriangle, Check, X } from 'lucide-react'

interface StreakFreezeButtonProps {
  freezesRemaining: number
  streakStatus: 'active' | 'at_risk' | 'broken'
  currentStreak: number
  onUseFreeze: () => Promise<void>
  disabled?: boolean
  className?: string
}

/**
 * StreakFreezeButton - Button to use a streak freeze with confirmation dialog
 * Shows remaining freezes and provides confirmation before using
 */
export function StreakFreezeButton({
  freezesRemaining,
  streakStatus,
  currentStreak,
  onUseFreeze,
  disabled = false,
  className,
}: StreakFreezeButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const canUseFreeze = freezesRemaining > 0 && streakStatus === 'at_risk' && currentStreak > 0 && !disabled

  const handleUseFreeze = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onUseFreeze()
      setSuccess(true)
      setTimeout(() => {
        setShowConfirmation(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use streak freeze')
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirmation) {
    return (
      <Card className={cn('w-full max-w-sm', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {success ? (
              <>
                <Check className="h-5 w-5 text-success" />
                Freeze Applied!
              </>
            ) : (
              <>
                <Snowflake className="h-5 w-5 text-blue-500" />
                Use Streak Freeze?
              </>
            )}
          </CardTitle>
          {!success && (
            <CardDescription>
              This will protect your {currentStreak}-day streak from breaking.
            </CardDescription>
          )}
        </CardHeader>

        {!success && (
          <>
            <CardContent className="pb-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">This action cannot be undone</p>
                  <p className="text-muted-foreground mt-1">
                    You have {freezesRemaining} freeze{freezesRemaining !== 1 ? 's' : ''} remaining.
                    Using this freeze will protect yesterday as an active day.
                  </p>
                </div>
              </div>
              {error && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUseFreeze}
                disabled={isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <Snowflake className="h-4 w-4" />
                    </span>
                    Using...
                  </>
                ) : (
                  <>
                    <Snowflake className="h-4 w-4 mr-2" />
                    Use Freeze
                  </>
                )}
              </Button>
            </CardFooter>
          </>
        )}

        {success && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your streak is now protected! Complete a lesson today to keep it going.
            </p>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={() => setShowConfirmation(true)}
      disabled={!canUseFreeze}
      className={cn(
        'gap-2',
        canUseFreeze && 'border-blue-400/50 hover:bg-blue-500/10 hover:border-blue-400',
        className
      )}
    >
      <Snowflake
        className={cn(
          'h-4 w-4',
          canUseFreeze ? 'text-blue-500' : 'text-muted-foreground'
        )}
      />
      <span>
        {freezesRemaining} Freeze{freezesRemaining !== 1 ? 's' : ''}
      </span>
    </Button>
  )
}

/**
 * StreakFreezeInfo - Displays information about streak freezes
 */
export function StreakFreezeInfo({
  freezesRemaining,
  className,
}: {
  freezesRemaining: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-blue-500/10 border border-blue-400/30',
        className
      )}
    >
      <Snowflake className="h-5 w-5 text-blue-500" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {freezesRemaining} Streak Freeze{freezesRemaining !== 1 ? 's' : ''} Available
        </p>
        <p className="text-xs text-muted-foreground">
          Freezes protect your streak when you miss a day
        </p>
      </div>
    </div>
  )
}

export default StreakFreezeButton
