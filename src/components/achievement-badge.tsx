'use client'

import React from 'react'

interface AchievementBadgeProps {
  achievement: {
    name: string
    description: string
    icon: string
    earnedAt?: string
  }
  locked?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function AchievementBadge({
  achievement,
  locked = false,
  size = 'medium'
}: AchievementBadgeProps) {
  const sizeClasses = {
    small: 'w-16 h-16 text-2xl',
    medium: 'w-24 h-24 text-4xl',
    large: 'w-32 h-32 text-5xl',
  }

  const containerClasses = locked
    ? 'opacity-40 grayscale'
    : 'hover:scale-105 transition-transform cursor-pointer'

  const formattedDate = achievement.earnedAt
    ? new Date(achievement.earnedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div className={`achievement-badge text-center ${containerClasses}`}>
      <div
        className={`${sizeClasses[size]} mx-auto mb-2 rounded-full flex items-center justify-center ${
          locked
            ? 'bg-gray-200 border-2 border-gray-300'
            : 'bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-300 shadow-lg'
        }`}
      >
        <span className="achievement-icon">{achievement.icon}</span>
      </div>
      <h4 className={`font-bold ${locked ? 'text-gray-500' : 'text-gray-800'}`}>
        {achievement.name}
      </h4>
      <p className={`text-sm ${locked ? 'text-gray-400' : 'text-gray-600'}`}>
        {achievement.description}
      </p>
      {formattedDate && !locked && (
        <p className="text-xs text-gray-500 mt-1">Earned {formattedDate}</p>
      )}
      {locked && <p className="text-xs text-gray-400 mt-1">🔒 Locked</p>}
    </div>
  )
}
