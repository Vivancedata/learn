import prisma from '@/lib/db'
import {
  awardAchievementXp,
  awardDailyLoginXp,
  awardHelpingOthersXp,
  awardLessonCompleteXp,
  awardProjectApprovedXp,
  awardProjectSubmitXp,
  awardQuizXp,
  awardStreakBonusXp,
  awardXp,
  getUserXpInfo,
  getXpHistory,
  hasReceivedXpFor,
} from '@/lib/xp-service'
import {
  calculateLevelFromXp,
  calculateLevelProgress,
  calculateXpToNextLevel,
  getTierConfigForLevel,
  getTierForLevel,
  STREAK_BONUSES,
  XP_VALUES,
} from '@/lib/xp-config'

// The concurrency behaviour of awardXp is covered in xp-service.test.ts. This
// file checks what each award helper records, and the read-side queries.
const row = { totalXp: 0, level: 1 }

jest.mock('@/lib/db', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    xpTransaction: {
      create: jest.fn(async () => ({})),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(client)),
  }
  return { __esModule: true, default: client }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

function lastTransaction() {
  const calls = db.xpTransaction.create.mock.calls
  return calls[calls.length - 1][0].data
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(row, { totalXp: 0, level: 1 })
  db.user.findUnique.mockImplementation(async () => ({ ...row }))
  db.user.update.mockImplementation(
    async ({ data }: { data: { totalXp?: { increment: number }; level?: number } }) => {
      if (data.totalXp) row.totalXp += data.totalXp.increment
      if (data.level !== undefined) row.level = data.level
      return { ...row }
    }
  )
})

describe('awardXp', () => {
  it('rejects an unknown user without recording anything', async () => {
    db.user.findUnique.mockResolvedValueOnce(null)

    await expect(awardXp('ghost', 50, 'LESSON_COMPLETE')).rejects.toThrow('User not found')
    expect(db.xpTransaction.create).not.toHaveBeenCalled()
  })

  it('falls back to the default description for the source', async () => {
    await awardXp('user-1', 10, 'DAILY_LOGIN')

    expect(lastTransaction().description).toBe('Daily login bonus')
  })

  it('reports a level-up and progress toward the next level', async () => {
    const result = await awardXp('user-1', 400, 'PROJECT_APPROVED')

    expect(result.leveledUp).toBe(true)
    expect(result.newLevel).toBe(calculateLevelFromXp(400))
    expect(result.xpToNextLevel).toBe(calculateXpToNextLevel(400))
    expect(result.levelProgress).toBe(calculateLevelProgress(400))
  })
})

describe('award helpers', () => {
  it.each([
    ['lesson', () => awardLessonCompleteXp('u', 'l1', 'Intro'), 'LESSON_COMPLETE', 'Completed lesson: Intro'],
    ['project submit', () => awardProjectSubmitXp('u', 'p1', 'CLI'), 'PROJECT_SUBMIT', 'Submitted project: CLI'],
    ['project approved', () => awardProjectApprovedXp('u', 'p1', 'CLI'), 'PROJECT_APPROVED', 'Project approved: CLI'],
    ['daily login', () => awardDailyLoginXp('u'), 'DAILY_LOGIN', 'Daily login bonus'],
    ['helping others', () => awardHelpingOthersXp('u', 'post-1'), 'HELPING_OTHERS', 'Received a point for helping another learner'],
  ])('%s records the source, amount and description', async (_name, award, source, description) => {
    await award()

    const tx = lastTransaction()
    expect(tx.source).toBe(source)
    expect(tx.amount).toBe(XP_VALUES[source as keyof typeof XP_VALUES])
    expect(tx.description).toBe(description)
  })

  it.each([
    ['lesson', () => awardLessonCompleteXp('u', 'l1'), 'Completed a lesson'],
    ['project submit', () => awardProjectSubmitXp('u', 'p1'), 'Submitted a project'],
    ['project approved', () => awardProjectApprovedXp('u', 'p1'), 'Project approved'],
  ])('%s without a title uses the default description', async (_name, award, description) => {
    await award()

    expect(lastTransaction().description).toBe(description)
  })

  it('awards nothing for a failed quiz', async () => {
    await expect(awardQuizXp('u', 'l1', 69)).resolves.toBeNull()
    expect(db.xpTransaction.create).not.toHaveBeenCalled()
  })

  it('awards the pass bonus with the score in the description', async () => {
    await awardQuizXp('u', 'l1', 85, 'Loops')
    expect(lastTransaction()).toMatchObject({
      source: 'QUIZ_PASS',
      amount: XP_VALUES.QUIZ_PASS,
      description: 'Passed quiz: Loops (85%)',
    })

    await awardQuizXp('u', 'l1', 70)
    expect(lastTransaction().description).toBe('Passed quiz (70%)')
  })

  it('awards the perfect bonus for 100%', async () => {
    await awardQuizXp('u', 'l1', 100, 'Loops')
    expect(lastTransaction()).toMatchObject({
      source: 'QUIZ_PERFECT',
      amount: XP_VALUES.QUIZ_PERFECT,
      description: 'Perfect quiz score: Loops',
    })

    await awardQuizXp('u', 'l1', 100)
    expect(lastTransaction().description).toBe('Perfect quiz score')
  })

  it('pays streak bonuses only on milestone days', async () => {
    await expect(awardStreakBonusXp('u', 3)).resolves.toBeNull()

    await awardStreakBonusXp('u', STREAK_BONUSES.WEEK.days)
    expect(lastTransaction()).toMatchObject({ source: 'STREAK_BONUS', amount: STREAK_BONUSES.WEEK.xp })

    await awardStreakBonusXp('u', STREAK_BONUSES.MONTH.days)
    expect(lastTransaction()).toMatchObject({
      amount: STREAK_BONUSES.MONTH.xp,
      description: '30-day streak milestone',
    })
  })

  it('uses the achievement amount when given, else the default', async () => {
    await awardAchievementXp('u', 'a1', 'First Steps', 250)
    expect(lastTransaction()).toMatchObject({ amount: 250, description: 'Earned achievement: First Steps' })

    await awardAchievementXp('u', 'a1', 'First Steps')
    expect(lastTransaction().amount).toBe(XP_VALUES.ACHIEVEMENT)
  })
})

describe('getUserXpInfo', () => {
  it('returns null for an unknown user', async () => {
    db.user.findUnique.mockResolvedValueOnce(null)
    await expect(getUserXpInfo('ghost')).resolves.toBeNull()
  })

  it('maps recent transactions and fills missing descriptions', async () => {
    const createdAt = new Date('2026-01-01')
    db.user.findUnique.mockResolvedValueOnce({
      totalXp: 150,
      level: 2,
      xpToNextLevel: 200,
      xpTransactions: [
        { id: 't1', amount: 50, source: 'LESSON_COMPLETE', description: null, createdAt },
        { id: 't2', amount: 100, source: 'QUIZ_PERFECT', description: 'Perfect', createdAt },
      ],
    })

    const info = await getUserXpInfo('u', 2)

    expect(db.user.findUnique.mock.calls[0][0].select.xpTransactions.take).toBe(2)
    expect(info).toMatchObject({ totalXp: 150, level: 2, levelProgress: calculateLevelProgress(150) })
    expect(info!.recentTransactions.map((t) => t.description)).toEqual(['', 'Perfect'])
  })
})

describe('getXpHistory', () => {
  it('pages with defaults and no source filter', async () => {
    db.xpTransaction.findMany.mockResolvedValueOnce([
      { id: 't1', amount: 5, source: 'HELPING_OTHERS', sourceId: null, description: null, createdAt: new Date() },
    ])
    db.xpTransaction.count.mockResolvedValueOnce(21)

    const history = await getXpHistory('u')

    expect(db.xpTransaction.findMany.mock.calls[0][0]).toMatchObject({ where: { userId: 'u' }, skip: 0, take: 10 })
    expect(history).toMatchObject({ total: 21, page: 1, limit: 10, totalPages: 3 })
    expect(history.transactions[0].description).toBe('')
  })

  it('filters by source and offsets later pages', async () => {
    db.xpTransaction.findMany.mockResolvedValueOnce([])
    db.xpTransaction.count.mockResolvedValueOnce(0)

    const history = await getXpHistory('u', { page: 3, limit: 5, source: 'QUIZ_PASS' })

    expect(db.xpTransaction.findMany.mock.calls[0][0]).toMatchObject({
      where: { userId: 'u', source: 'QUIZ_PASS' },
      skip: 10,
      take: 5,
    })
    expect(history.totalPages).toBe(0)
  })
})

describe('hasReceivedXpFor', () => {
  it('is true only when a matching transaction exists', async () => {
    db.xpTransaction.findFirst.mockResolvedValueOnce({ id: 't1' }).mockResolvedValueOnce(null)

    await expect(hasReceivedXpFor('u', 'LESSON_COMPLETE', 'l1')).resolves.toBe(true)
    await expect(hasReceivedXpFor('u', 'LESSON_COMPLETE', 'l2')).resolves.toBe(false)
  })
})

describe('level tiers', () => {
  it.each([
    [1, 'bronze'],
    [10, 'bronze'],
    [11, 'silver'],
    [26, 'gold'],
    [51, 'diamond'],
  ])('level %i is %s', (level, tier) => {
    expect(getTierForLevel(level)).toBe(tier)
    expect(getTierConfigForLevel(level).name.toLowerCase()).toBe(tier)
  })

  it('treats a non-finite total as level 1', () => {
    expect(calculateLevelFromXp(Number.NaN)).toBe(1)
  })
})
