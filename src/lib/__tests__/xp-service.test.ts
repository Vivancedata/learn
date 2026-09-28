import { awardXp } from '@/lib/xp-service'
import { calculateLevelFromXp } from '@/lib/xp-config'

// A tiny in-memory stand-in for the one user row awardXp touches. Reads
// yield to the event loop first, as a real query does, so two concurrent
// awards interleave the way they do against Postgres.
const row = { totalXp: 0, level: 1, xpToNextLevel: 100 }

type UserUpdate = {
  data: {
    totalXp?: number | { increment: number }
    level?: number
    xpToNextLevel?: number
  }
}

function applyUserUpdate({ data }: UserUpdate) {
  if (typeof data.totalXp === 'number') row.totalXp = data.totalXp
  else if (data.totalXp) row.totalXp += data.totalXp.increment
  if (data.level !== undefined) row.level = data.level
  if (data.xpToNextLevel !== undefined) row.xpToNextLevel = data.xpToNextLevel
  return { ...row }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

jest.mock('@/lib/db', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = {
    user: {
      findUnique: jest.fn(async () => {
        await tick()
        return { ...row }
      }),
      update: jest.fn(async (args: UserUpdate) => {
        await tick()
        return applyUserUpdate(args)
      }),
    },
    xpTransaction: { create: jest.fn(async () => ({})) },
    $transaction: jest.fn(async (arg: unknown): Promise<unknown> =>
      typeof arg === 'function' ? arg(client) : Promise.all(arg as Promise<unknown>[])
    ),
  }
  return { __esModule: true, default: client }
})

describe('awardXp', () => {
  beforeEach(() => {
    Object.assign(row, { totalXp: 0, level: 1, xpToNextLevel: 100 })
  })

  it('adds the award to the stored total', async () => {
    const result = await awardXp('user-1', 50, 'LESSON_COMPLETE', 'lesson-1')

    expect(row.totalXp).toBe(50)
    expect(result.newTotalXp).toBe(50)
    expect(result.xpAwarded).toBe(50)
  })

  it('does not lose XP when two awards land at the same time', async () => {
    await Promise.all([
      awardXp('user-1', 50, 'LESSON_COMPLETE', 'lesson-1'),
      awardXp('user-1', 30, 'QUIZ_PASS', 'lesson-2'),
    ])

    expect(row.totalXp).toBe(80)
    expect(row.level).toBe(calculateLevelFromXp(80))
  })

  it('reports a level-up computed from the stored total', async () => {
    Object.assign(row, { totalXp: 90, level: calculateLevelFromXp(90) })

    const result = await awardXp('user-1', 5000, 'ACHIEVEMENT')

    expect(result.previousLevel).toBe(calculateLevelFromXp(90))
    expect(result.newLevel).toBe(calculateLevelFromXp(5090))
    expect(result.leveledUp).toBe(true)
  })
})

describe('calculateLevelFromXp', () => {
  it('returns level 1 instead of looping forever on a non-finite total', () => {
    expect(calculateLevelFromXp(NaN)).toBe(1)
  })
})
