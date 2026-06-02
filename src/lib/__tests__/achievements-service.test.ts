import { runAchievementsCheck } from '@/lib/achievements-service'
import prisma from '@/lib/db'
import { awardAchievementXp, hasReceivedXpFor } from '@/lib/xp-service'

// Mock Prisma and the XP service so only achievements-service (+ the pure
// achievements definitions) are exercised here.
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    path: { findMany: jest.fn() },
    course: { count: jest.fn() },
    achievement: { findUnique: jest.fn(), create: jest.fn() },
    userAchievement: { create: jest.fn() },
  },
}))

jest.mock('@/lib/xp-service', () => ({
  awardAchievementXp: jest.fn(),
  hasReceivedXpFor: jest.fn(),
}))

const USER_ID = 'user-1'

function userWith(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    achievements: [],
    courses: [],
    projectSubmissions: [],
    certificates: [],
    discussions: [],
    discussionReplies: [],
    ...overrides,
  }
}

const lessonCourse = (lessonIds: string[], extra: Record<string, unknown> = {}) => ({
  completedLessons: lessonIds.map((id) => ({ id })),
  quizScores: [],
  course: {
    pathId: null,
    durationHours: 1,
    sections: [{ lessons: lessonIds.map((id) => ({ id })) }],
  },
  ...extra,
})

describe('runAchievementsCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.course.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.path.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.achievement.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.achievement.create as jest.Mock).mockResolvedValue({})
    ;(prisma.userAchievement.create as jest.Mock).mockResolvedValue({})
    ;(hasReceivedXpFor as jest.Mock).mockResolvedValue(true) // skip bonus XP by default
    ;(awardAchievementXp as jest.Mock).mockResolvedValue({})
  })

  it('returns null when the user does not exist', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    expect(await runAchievementsCheck(USER_ID)).toBeNull()
  })

  it('awards no achievements for a user with no progress', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(userWith({ achievements: [{ achievement: { id: 'early-adopter' } }] }))
      .mockResolvedValueOnce({ achievements: [] })
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.newAchievements).toHaveLength(0)
    expect(result?.stats.completedLessons).toBe(0)
  })

  it('awards first-lesson on a first completed lesson', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(userWith({ courses: [lessonCourse(['l1'])] }))
      .mockResolvedValueOnce({ achievements: [] })
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.newAchievements).toContain('first-lesson')
    expect(prisma.achievement.create).toHaveBeenCalled()
  })

  it('distinguishes perfect quizzes from merely-passed', async () => {
    const passedOnly = {
      completedLessons: [],
      quizScores: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}`, score: 7, maxScore: 10 })),
      course: { pathId: null, durationHours: 1, sections: [{ lessons: [{ id: 'l1' }] }] },
    }
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(userWith({ courses: [passedOnly] }))
      .mockResolvedValueOnce({ achievements: [] })
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.stats.quizzesPassed).toBe(10)
    expect(result?.stats.perfectQuizzes).toBe(0)
    expect(result?.newAchievements).not.toContain('perfect-score')
    expect(result?.newAchievements).toContain('quiz-rookie')
  })

  it('awards completionist against the live course count', async () => {
    ;(prisma.course.count as jest.Mock).mockResolvedValue(2)
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(
        userWith({ courses: [lessonCourse(['a']), lessonCourse(['b'])] })
      )
      .mockResolvedValueOnce({ achievements: [] })
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.stats.completedCourses).toBe(2)
    expect(result?.stats.totalCoursesAvailable).toBe(2)
    expect(result?.newAchievements).toContain('completionist')
  })

  it('computes completed paths from started paths', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(
        userWith({
          courses: [
            {
              courseId: 'c1',
              completedLessons: [{ id: 'l1' }, { id: 'l2' }],
              quizScores: [],
              course: { pathId: 'p1', durationHours: 2, sections: [{ lessons: [{ id: 'l1' }, { id: 'l2' }] }] },
            },
          ],
        })
      )
      .mockResolvedValueOnce({ achievements: [] })
    ;(prisma.path.findMany as jest.Mock).mockResolvedValue([
      { id: 'p1', courses: [{ id: 'c1', sections: [{ lessons: [{ id: 'l1' }, { id: 'l2' }] }] }] },
    ])
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.stats.completedPaths).toBe(1)
    expect(result?.newAchievements).toContain('path-pioneer')
  })

  it('grants bonus XP for a newly earned achievement when not yet received', async () => {
    ;(hasReceivedXpFor as jest.Mock).mockResolvedValue(false)
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(userWith({ courses: [lessonCourse(['l1'])] }))
      .mockResolvedValueOnce({ achievements: [] })
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.newAchievements).toContain('first-lesson')
    expect(awardAchievementXp).toHaveBeenCalledWith(USER_ID, 'first-lesson', expect.any(String))
  })

  it('does not fail when bonus XP throws', async () => {
    ;(hasReceivedXpFor as jest.Mock).mockResolvedValue(false)
    ;(awardAchievementXp as jest.Mock).mockRejectedValue(new Error('xp down'))
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(userWith({ courses: [lessonCourse(['l1'])] }))
      .mockResolvedValueOnce({ achievements: [] })
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.newAchievements).toContain('first-lesson')
  })

  it('skips achievements the user already owns', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(
        userWith({
          courses: [lessonCourse(['l1'])],
          achievements: [{ achievement: { id: 'first-lesson' } }],
        })
      )
      .mockResolvedValueOnce({ achievements: [] })
    const result = await runAchievementsCheck(USER_ID)
    expect(result?.newAchievements).not.toContain('first-lesson')
  })
})
