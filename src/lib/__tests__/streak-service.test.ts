import { recordActivityAndUpdateStreak } from '@/lib/streak-service'
import prisma from '@/lib/db'

// Only the streak service is under test; its single external dependency is the
// Prisma client, which we mock so this stays a focused unit test.
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    dailyActivity: { upsert: jest.fn() },
  },
}))

const USER_ID = 'user-1'

function userState(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakFreezes: 0,
    ...overrides,
  }
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

describe('recordActivityAndUpdateStreak', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue({
      date: daysAgo(0),
      xpEarned: 0,
      lessonsCompleted: 0,
      quizzesTaken: 0,
      timeSpentMinutes: 0,
    })
    // user.update echoes back the persisted streak fields
    ;(prisma.user.update as jest.Mock).mockImplementation(({ data }) =>
      Promise.resolve({
        id: USER_ID,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastActivityDate: data.lastActivityDate,
        streakFreezes: 0,
      })
    )
  })

  it('throws NotFoundError when the user does not exist', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(recordActivityAndUpdateStreak(USER_ID)).rejects.toThrow('User not found')
  })

  it('starts a streak on the first ever activity', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userState())
    const result = await recordActivityAndUpdateStreak(USER_ID, { lessonsCompleted: 1 })
    expect(result.streakAction).toBe('started')
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(1)
    expect(result.todayActivity).toBeDefined()
  })

  it('extends the streak when the last activity was yesterday', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(
      userState({ currentStreak: 5, longestStreak: 10, lastActivityDate: daysAgo(1) })
    )
    const result = await recordActivityAndUpdateStreak(USER_ID, { xpEarned: 10 })
    expect(result.streakAction).toBe('extended')
    expect(result.currentStreak).toBe(6)
    expect(result.longestStreak).toBe(10)
  })

  it('raises longestStreak when the extended streak exceeds it', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(
      userState({ currentStreak: 10, longestStreak: 10, lastActivityDate: daysAgo(1) })
    )
    const result = await recordActivityAndUpdateStreak(USER_ID)
    expect(result.currentStreak).toBe(11)
    expect(result.longestStreak).toBe(11)
  })

  it('maintains the streak when already active today', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(
      userState({ currentStreak: 5, longestStreak: 5, lastActivityDate: daysAgo(0) })
    )
    const result = await recordActivityAndUpdateStreak(USER_ID, { quizzesTaken: 1 })
    expect(result.streakAction).toBe('maintained')
    expect(result.currentStreak).toBe(5)
  })

  it('resets the streak when more than one day was missed without a freeze', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(
      userState({ currentStreak: 9, longestStreak: 9, lastActivityDate: daysAgo(3), streakFreezes: 0 })
    )
    const result = await recordActivityAndUpdateStreak(USER_ID)
    expect(result.streakAction).toBe('started')
    expect(result.currentStreak).toBe(1)
  })

  it('consumes a freeze when exactly one day was missed', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(
      userState({ currentStreak: 7, longestStreak: 7, lastActivityDate: daysAgo(2), streakFreezes: 1 })
    )
    const result = await recordActivityAndUpdateStreak(USER_ID, { timeSpentMinutes: 20 })
    expect(result.streakAction).toBe('continued')
    expect(result.currentStreak).toBe(8)
    // freeze decrement happens via a separate user.update call
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { streakFreezes: { decrement: 1 } } })
    )
  })
})
