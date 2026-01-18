'use client'

import React, { useState, useEffect } from 'react'
import AchievementBadge from './achievement-badge'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

interface UserAchievement {
  achievementId: string
  earnedAt: string
  achievement: Achievement
}

interface AchievementShowcaseProps {
  userId: string
}

export default function AchievementShowcase({ userId }: AchievementShowcaseProps) {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [allAchievements, setAllAchievements] = useState<{ byCategory: Record<string, Achievement[]>; all: Achievement[] }>({
    byCategory: {},
    all: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchAchievements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchAchievements = async () => {
    try {
      // Fetch user's achievements
      const userResponse = await fetch(`/api/achievements/user/${userId}`)
      const userData = await userResponse.json()

      // Fetch all available achievements
      const allResponse = await fetch('/api/achievements/all')
      const allData = await allResponse.json()

      setUserAchievements(userData.data.achievements)
      setAllAchievements(allData.data)
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId))
  const earnedMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua.earnedAt])
  )

  const categories = [
    { id: 'all', name: 'All Achievements', icon: '🏅' },
    { id: 'lessons', name: 'Lessons', icon: '📚' },
    { id: 'courses', name: 'Courses', icon: '✅' },
    { id: 'quizzes', name: 'Quizzes', icon: '📝' },
    { id: 'projects', name: 'Projects', icon: '🔨' },
    { id: 'certificates', name: 'Certificates', icon: '📜' },
    { id: 'community', name: 'Community', icon: '💬' },
    { id: 'consistency', name: 'Consistency', icon: '📅' },
  ]

  const getAchievementsToDisplay = () => {
    if (selectedCategory === 'all') {
      return allAchievements.all
    }
    return allAchievements.byCategory[selectedCategory] || []
  }

  const achievementsToDisplay = getAchievementsToDisplay()
  const earnedCount = achievementsToDisplay.filter((a: Achievement) => earnedIds.has(a.id)).length
  const totalCount = achievementsToDisplay.length
  const progress = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0

  return (
    <div className="achievement-showcase">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Achievements</h2>
        <p className="text-gray-600 mb-4">
          Track your learning milestones and accomplishments
        </p>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {earnedCount} of {totalCount} achievements earned ({Math.round(progress)}%)
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => {
          const categoryAchievements =
            category.id === 'all'
              ? allAchievements.all
              : allAchievements.byCategory[category.id] || []
          const categoryEarned = categoryAchievements.filter((a: Achievement) =>
            earnedIds.has(a.id)
          ).length

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name}{' '}
              <span className="text-sm">
                ({categoryEarned}/{categoryAchievements.length})
              </span>
            </button>
          )
        })}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {achievementsToDisplay.map((achievement: Achievement) => {
          const isEarned = earnedIds.has(achievement.id)
          const earnedAt = earnedMap.get(achievement.id)

          return (
            <AchievementBadge
              key={achievement.id}
              achievement={{
                ...achievement,
                earnedAt: isEarned ? earnedAt : undefined,
              }}
              locked={!isEarned}
              size="medium"
            />
          )
        })}
      </div>

      {achievementsToDisplay.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No achievements in this category yet.
        </div>
      )}
    </div>
  )
}
