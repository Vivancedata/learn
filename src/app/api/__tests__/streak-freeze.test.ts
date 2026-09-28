import { NextRequest } from 'next/server'
import { POST as useStreakFreeze } from '../streaks/freeze/route'

const USER_ID = '550e8400-e29b-41d4-a716-446655440000'

// In-memory user row. Every query yields to the event loop first, so two
// requests in flight interleave the way they do against Postgres.
const mockRow = {
  id: USER_ID,
  currentStreak: 5,
  longestStreak: 5,
  lastActivityDate: null as Date | null,
  streakFreezes: 1,
}

const mockTick = () => new Promise((resolve) => setTimeout(resolve, 0))

type Where = {
  id: string
  streakFreezes?: { gt: number }
  lastActivityDate?: Date | null
}
type Data = { streakFreezes?: { decrement: number }; lastActivityDate?: Date }

function mockMatches(where: Where) {
  if (where.streakFreezes && !(mockRow.streakFreezes > where.streakFreezes.gt)) return false
  if ('lastActivityDate' in where) {
    const expected = where.lastActivityDate?.getTime() ?? null
    const actual = mockRow.lastActivityDate?.getTime() ?? null
    if (expected !== actual) return false
  }
  return true
}

function mockApply(data: Data) {
  if (data.streakFreezes) mockRow.streakFreezes -= data.streakFreezes.decrement
  if (data.lastActivityDate) mockRow.lastActivityDate = data.lastActivityDate
}

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(async () => {
        await mockTick()
        return { ...mockRow }
      }),
      update: jest.fn(async ({ data }: { data: Data }) => {
        await mockTick()
        mockApply(data)
        return { ...mockRow }
      }),
      updateMany: jest.fn(async ({ where, data }: { where: Where; data: Data }) => {
        await mockTick()
        if (!mockMatches(where)) return { count: 0 }
        mockApply(data)
        return { count: 1 }
      }),
    },
    dailyActivity: { upsert: jest.fn(async () => ({})) },
  },
}))

function freezeRequest() {
  return new NextRequest('http://localhost/api/streaks/freeze', {
    method: 'POST',
    body: JSON.stringify({ userId: USER_ID }),
    headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
  })
}

describe('POST /api/streaks/freeze', () => {
  beforeEach(() => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setHours(0, 0, 0, 0)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    Object.assign(mockRow, { streakFreezes: 1, currentStreak: 5, lastActivityDate: twoDaysAgo })
  })

  it('uses one freeze to cover the missed day', async () => {
    const response = await useStreakFreeze(freezeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.streakFreezes).toBe(0)
    expect(mockRow.streakFreezes).toBe(0)
  })

  it('spends only one freeze when the request is sent twice at once', async () => {
    mockRow.streakFreezes = 2

    const responses = await Promise.all([
      useStreakFreeze(freezeRequest()),
      useStreakFreeze(freezeRequest()),
    ])

    expect(responses.map((r) => r.status).sort()).toEqual([200, 409])
    expect(mockRow.streakFreezes).toBe(1)
  })
})

describe('POST /api/streaks/freeze rejections', () => {
  function daysAgo(days: number) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - days)
    return date
  }

  beforeEach(() => {
    Object.assign(mockRow, { streakFreezes: 1, currentStreak: 5, lastActivityDate: daysAgo(2) })
  })

  it.each([
    ['no freezes are left', { streakFreezes: 0 }, /No streak freezes available/],
    ['there is no streak to protect', { currentStreak: 0 }, /No active streak/],
    ['the user was active today', { lastActivityDate: daysAgo(0) }, /already active today/],
    ['the streak is still alive from yesterday', { lastActivityDate: daysAgo(1) }, /still active/],
    ['more than one day was missed', { lastActivityDate: daysAgo(4) }, /Too much time has passed/],
  ])('refuses when %s, without spending a freeze', async (_case, state, message) => {
    Object.assign(mockRow, state)
    const freezesBefore = mockRow.streakFreezes

    const response = await useStreakFreeze(freezeRequest())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(JSON.stringify(body)).toMatch(message)
    expect(mockRow.streakFreezes).toBe(freezesBefore)
  })

  it('applies a freeze for a streak with no recorded activity date', async () => {
    mockRow.lastActivityDate = null

    const response = await useStreakFreeze(freezeRequest())

    expect(response.status).toBe(200)
    expect(mockRow.streakFreezes).toBe(0)
  })

  it('answers 404 for an unknown user', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prisma = require('@/lib/db').default
    prisma.user.findUnique.mockResolvedValueOnce(null)

    const response = await useStreakFreeze(freezeRequest())

    expect(response.status).toBe(404)
  })
})
