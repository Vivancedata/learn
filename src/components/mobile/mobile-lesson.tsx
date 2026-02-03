'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useHorizontalSwipe } from '@/hooks/useSwipeGesture'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Play,
  FileText,
  AlertCircle
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  type: 'lesson' | 'project' | 'quiz'
  duration?: number
  isCompleted?: boolean
}

interface MobileLessonProps {
  /** Current lesson data */
  lesson: {
    id: string
    title: string
    type: 'lesson' | 'project' | 'quiz'
    duration?: number
    content?: string
  }
  /** Course information */
  course: {
    id: string
    title: string
    totalLessons: number
    completedLessons: number
  }
  /** Previous lesson (if exists) */
  previousLesson?: Lesson | null
  /** Next lesson (if exists) */
  nextLesson?: Lesson | null
  /** Whether the current lesson is completed */
  isCompleted?: boolean
  /** Whether the lesson is being marked complete */
  isMarkingComplete?: boolean
  /** Callback when mark complete is clicked */
  onMarkComplete?: () => void
  /** Callback to navigate to lesson */
  onNavigateToLesson?: (lessonId: string) => void
  /** Children (lesson content) */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Mobile-optimized lesson view component
 *
 * Features:
 * - Progress bar at top showing course completion
 * - Swipe left/right to navigate between lessons
 * - Floating "Mark Complete" button
 * - Large touch targets
 * - Optimized reading experience
 */
export function MobileLesson({
  lesson,
  course,
  previousLesson,
  nextLesson,
  isCompleted = false,
  isMarkingComplete = false,
  onMarkComplete,
  onNavigateToLesson,
  children,
  className
}: MobileLessonProps) {
  const router = useRouter()
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  // Calculate progress
  const progressPercent = course.totalLessons > 0
    ? Math.round((course.completedLessons / course.totalLessons) * 100)
    : 0

  // Handle lesson navigation
  const navigateToLesson = useCallback((lessonId: string) => {
    if (onNavigateToLesson) {
      onNavigateToLesson(lessonId)
    } else {
      router.push(`/courses/${course.id}/lessons/${lessonId}`)
    }
  }, [onNavigateToLesson, router, course.id])

  const handleSwipeLeft = useCallback(() => {
    if (nextLesson) {
      setSwipeDirection('left')
      setTimeout(() => {
        navigateToLesson(nextLesson.id)
      }, 150)
    }
  }, [nextLesson, navigateToLesson])

  const handleSwipeRight = useCallback(() => {
    if (previousLesson) {
      setSwipeDirection('right')
      setTimeout(() => {
        navigateToLesson(previousLesson.id)
      }, 150)
    }
  }, [previousLesson, navigateToLesson])

  // Set up swipe gesture
  const { ref, state } = useHorizontalSwipe(
    handleSwipeLeft,
    handleSwipeRight,
    { threshold: 75, minVelocity: 0.4 }
  )

  // Hide swipe hint after first interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  // Get lesson type icon and label
  const getLessonTypeInfo = (type: string) => {
    switch (type) {
      case 'project':
        return { icon: FileText, label: 'Project', color: 'text-warning' }
      case 'quiz':
        return { icon: Play, label: 'Quiz', color: 'text-info' }
      default:
        return { icon: BookOpen, label: 'Lesson', color: 'text-primary' }
    }
  }

  const typeInfo = getLessonTypeInfo(lesson.type)
  const TypeIcon = typeInfo.icon

  return (
    <div
      ref={ref}
      className={cn(
        'min-h-screen flex flex-col md:hidden',
        swipeDirection === 'left' && 'animate-slide-out-left',
        swipeDirection === 'right' && 'animate-slide-out-right',
        className
      )}
    >
      {/* Progress header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <Progress
          value={progressPercent}
          className="h-1 rounded-none"
        />
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {course.title}
            </p>
            <p className="text-sm font-medium">
              {course.completedLessons} of {course.totalLessons} complete
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {progressPercent}%
          </Badge>
        </div>
      </div>

      {/* Lesson header */}
      <div className="px-4 py-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <TypeIcon className={cn('h-4 w-4', typeInfo.color)} />
          <span className="text-sm text-muted-foreground">{typeInfo.label}</span>
          {lesson.duration && (
            <>
              <span className="text-muted-foreground">-</span>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{lesson.duration} min</span>
            </>
          )}
          {isCompleted && (
            <Badge variant="default" className="ml-auto bg-success">
              <Check className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
      </div>

      {/* Lesson content */}
      <div className="flex-1 px-4 py-6">
        <div className="prose prose-sm dark:prose-invert max-w-none mobile-lesson-content">
          {children}
        </div>
      </div>

      {/* Swipe hint */}
      {showSwipeHint && (previousLesson || nextLesson) && (
        <div
          className={cn(
            'fixed bottom-32 left-1/2 -translate-x-1/2',
            'px-4 py-2 rounded-full',
            'bg-muted/90 backdrop-blur-sm',
            'text-xs text-muted-foreground',
            'animate-in fade-in slide-in-from-bottom-4 duration-500',
            'flex items-center gap-2'
          )}
        >
          <ChevronLeft className="h-3 w-3" />
          <span>Swipe to navigate</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      )}

      {/* Navigation bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
        <div className="flex items-center justify-between p-4 gap-4">
          {/* Previous button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => previousLesson && navigateToLesson(previousLesson.id)}
            disabled={!previousLesson}
            className={cn(
              'flex-1 h-12',
              'touch-manipulation',
              !previousLesson && 'opacity-50'
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            <span className="sr-only sm:not-sr-only">Previous</span>
          </Button>

          {/* Mark Complete button */}
          {onMarkComplete && (
            <Button
              variant={isCompleted ? 'outline' : 'default'}
              size="lg"
              onClick={onMarkComplete}
              disabled={isCompleted || isMarkingComplete}
              className={cn(
                'flex-[2] h-12',
                'touch-manipulation',
                isCompleted && 'bg-success/10 border-success text-success hover:bg-success/20'
              )}
            >
              {isMarkingComplete ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                  Saving...
                </>
              ) : isCompleted ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          )}

          {/* Next button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
            disabled={!nextLesson}
            className={cn(
              'flex-1 h-12',
              'touch-manipulation',
              !nextLesson && 'opacity-50'
            )}
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Swipe progress indicator */}
      {state.isSwiping && state.progress > 0.1 && (
        <div
          className={cn(
            'fixed top-1/2 -translate-y-1/2',
            'px-4 py-3 rounded-full',
            'bg-primary/90 text-primary-foreground',
            'flex items-center gap-2',
            'animate-in fade-in zoom-in duration-150',
            state.direction === 'left' ? 'right-4' : 'left-4'
          )}
          style={{
            opacity: state.progress
          }}
        >
          {state.direction === 'left' && nextLesson ? (
            <>
              <span className="text-sm font-medium truncate max-w-[150px]">
                {nextLesson.title}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          ) : state.direction === 'right' && previousLesson ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium truncate max-w-[150px]">
                {previousLesson.title}
              </span>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

/**
 * Offline indicator for lesson content
 */
export function MobileLessonOffline({
  lessonTitle,
  onRetry
}: {
  lessonTitle: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Lesson Unavailable Offline</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        &quot;{lessonTitle}&quot; hasn&apos;t been cached for offline viewing. Connect to the internet to access this lesson.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}
