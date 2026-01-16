"use client"

import { useState, useEffect, useCallback } from 'react'

interface Progress {
  courseId: string
  completedLessonIds: string[]
  completedCount: number
  totalLessons: number
  percentComplete: number
  lastAccessed?: string
}

interface UseProgressReturn {
  progress: Progress | null
  isLoading: boolean
  error: string | null
  markLessonComplete: (lessonId: string) => Promise<void>
  markLessonIncomplete: (lessonId: string) => Promise<void>
  isLessonComplete: (lessonId: string) => boolean
  refetch: () => Promise<void>
}

export function useProgress(courseId: string): UseProgressReturn {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/progress/${courseId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch progress')
      }

      const data = await response.json()
      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress')
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const markLessonComplete = useCallback(async (lessonId: string) => {
    try {
      const response = await fetch(`/api/progress/${courseId}/lessons/${lessonId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark lesson complete')
      }

      const data = await response.json()

      // Update local state
      setProgress(prev => prev ? {
        ...prev,
        completedLessonIds: [...prev.completedLessonIds, lessonId],
        completedCount: data.completedCount,
        percentComplete: data.percentComplete,
      } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark lesson complete')
      throw err
    }
  }, [courseId])

  const markLessonIncomplete = useCallback(async (lessonId: string) => {
    try {
      const response = await fetch(`/api/progress/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to mark lesson incomplete')
      }

      // Update local state
      setProgress(prev => prev ? {
        ...prev,
        completedLessonIds: prev.completedLessonIds.filter(id => id !== lessonId),
        completedCount: prev.completedCount - 1,
        percentComplete: prev.totalLessons > 0
          ? Math.round(((prev.completedCount - 1) / prev.totalLessons) * 100)
          : 0,
      } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark lesson incomplete')
      throw err
    }
  }, [courseId])

  const isLessonComplete = useCallback((lessonId: string) => {
    return progress?.completedLessonIds.includes(lessonId) ?? false
  }, [progress])

  return {
    progress,
    isLoading,
    error,
    markLessonComplete,
    markLessonIncomplete,
    isLessonComplete,
    refetch: fetchProgress,
  }
}
