'use client'

import { cn } from '@/lib/utils'
import type { RecommendationType } from '@prisma/client'

interface RecommendationReasonProps {
  reasonType: RecommendationType
  reason: string
  className?: string
  showIcon?: boolean
}

/**
 * Get icon for recommendation reason type
 */
function getReasonIcon(reasonType: RecommendationType): string {
  switch (reasonType) {
    case 'CONTINUE_PATH':
      return 'M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z' // Arrow right circle
    case 'SIMILAR_TOPIC':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' // Check circle
    case 'SKILL_GAP':
      return 'M13 10V3L4 14h7v7l9-11h-7z' // Lightning bolt
    case 'POPULAR':
      return 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' // Fire
    case 'PREREQUISITE_MET':
      return 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' // Badge check
    case 'COMPLEMENT':
      return 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' // Adjustments
    default:
      return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' // Book open
  }
}

/**
 * Get color classes for recommendation reason type
 */
function getReasonColorClasses(reasonType: RecommendationType): {
  badge: string
  icon: string
  text: string
} {
  switch (reasonType) {
    case 'CONTINUE_PATH':
      return {
        badge: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200',
      }
    case 'SIMILAR_TOPIC':
      return {
        badge: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-800 dark:text-purple-200',
      }
    case 'SKILL_GAP':
      return {
        badge: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-800 dark:text-amber-200',
      }
    case 'POPULAR':
      return {
        badge: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-800 dark:text-orange-200',
      }
    case 'PREREQUISITE_MET':
      return {
        badge: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-800 dark:text-green-200',
      }
    case 'COMPLEMENT':
      return {
        badge: 'bg-teal-100 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
        icon: 'text-teal-600 dark:text-teal-400',
        text: 'text-teal-800 dark:text-teal-200',
      }
    default:
      return {
        badge: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        icon: 'text-gray-600 dark:text-gray-400',
        text: 'text-gray-800 dark:text-gray-200',
      }
  }
}

export function RecommendationReason({
  reasonType,
  reason,
  className,
  showIcon = true,
}: RecommendationReasonProps) {
  const colors = getReasonColorClasses(reasonType)
  const iconPath = getReasonIcon(reasonType)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
        colors.badge,
        className
      )}
      role="status"
      aria-label={`Recommendation reason: ${reason}`}
    >
      {showIcon && (
        <svg
          className={cn('w-3.5 h-3.5 flex-shrink-0', colors.icon)}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={iconPath}
          />
        </svg>
      )}
      <span className={colors.text}>{reason}</span>
    </div>
  )
}

export default RecommendationReason
