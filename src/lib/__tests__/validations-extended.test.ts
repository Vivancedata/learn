import {
  getSolutionsQuerySchema,
  givePointSchema,
  pushSubscriptionSchema,
  unsubscribePushSchema,
  notificationPreferencesSchema,
  sendNotificationSchema,
  dismissRecommendationSchema,
  clickRecommendationSchema,
  refreshRecommendationsSchema,
  getLeaderboardSchema,
  refreshLeaderboardSchema,
  videoProgressSchema,
  getVideoProgressSchema,
  xpHistoryQuerySchema,
  assessmentSlugParamsSchema,
  getAssessmentsQuerySchema,
  startAssessmentSchema,
  submitAssessmentSchema,
  getUserAssessmentsSchema,
  assessmentUserParamsSchema,
  createCheckoutSessionSchema,
  createPortalSessionSchema,
  tutorContextSchema,
  chatMessageSchema,
  createConversationSchema,
  getConversationsQuerySchema,
  conversationIdParamsSchema,
  subscriptionStatusValues,
  questionTypeValues,
  difficultyValues,
} from '../validations'

describe('Validation Schemas (Extended)', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000'
  const validUuid = '123e4567-e89b-12d3-a456-426614174001'

  it('validates and transforms solutions query params', () => {
    const parsed = getSolutionsQuerySchema.parse({
      lessonId: validUuid,
      page: '2',
      limit: '24',
    })

    expect(parsed.page).toBe(2)
    expect(parsed.limit).toBe(24)
  })

  it('uses defaults for optional solutions query params', () => {
    const parsed = getSolutionsQuerySchema.parse({ lessonId: validUuid })
    expect(parsed.page).toBe(1)
    expect(parsed.limit).toBe(12)
  })

  it('enforces givePoint refine rules', () => {
    expect(
      givePointSchema.safeParse({
        recipientId: validUserId,
      }).success
    ).toBe(false)

    expect(
      givePointSchema.safeParse({
        recipientId: validUserId,
        discussionId: validUuid,
        replyId: validUuid,
      }).success
    ).toBe(false)

    expect(
      givePointSchema.safeParse({
        recipientId: validUserId,
        discussionId: validUuid,
      }).success
    ).toBe(true)
  })

  it('validates push notification schemas', () => {
    expect(
      pushSubscriptionSchema.safeParse({
        userId: validUserId,
        subscription: {
          endpoint: 'https://push.example.com/subscription',
          keys: { p256dh: 'abc', auth: 'xyz' },
        },
      }).success
    ).toBe(true)

    expect(
      unsubscribePushSchema.safeParse({
        userId: validUserId,
        endpoint: 'https://push.example.com/subscription',
      }).success
    ).toBe(true)
  })

  it('validates notification payload schemas', () => {
    expect(
      notificationPreferencesSchema.safeParse({
        quietHoursStart: 22,
        quietHoursEnd: 6,
        streakReminders: true,
      }).success
    ).toBe(true)

    expect(
      sendNotificationSchema.safeParse({
        userId: validUserId,
        title: 'Hello',
        body: 'World',
        url: 'https://learn.example.com/dashboard',
      }).success
    ).toBe(true)
  })

  it('validates recommendation schemas', () => {
    expect(
      dismissRecommendationSchema.safeParse({
        userId: validUserId,
        courseId: 'course-1',
      }).success
    ).toBe(true)

    expect(
      clickRecommendationSchema.safeParse({
        userId: validUserId,
        courseId: 'course-1',
      }).success
    ).toBe(true)

    expect(
      refreshRecommendationsSchema.safeParse({
        userId: validUserId,
      }).success
    ).toBe(true)
  })

  it('validates leaderboard schemas and defaults', () => {
    const defaults = getLeaderboardSchema.parse({})
    expect(defaults.type).toBe('xp')
    expect(defaults.period).toBe('all_time')
    expect(defaults.limit).toBe(50)

    expect(
      refreshLeaderboardSchema.safeParse({
        type: 'streaks',
        period: 'weekly',
      }).success
    ).toBe(true)
  })

  it('validates video progress schemas', () => {
    expect(
      videoProgressSchema.safeParse({
        lessonId: validUuid,
        watchedSeconds: 10,
        totalSeconds: 100,
      }).success
    ).toBe(true)

    expect(
      getVideoProgressSchema.safeParse({
        lessonId: validUuid,
      }).success
    ).toBe(true)
  })

  it('validates XP history query defaults and transforms', () => {
    const defaults = xpHistoryQuerySchema.parse({})
    expect(defaults.page).toBe(1)
    expect(defaults.limit).toBe(10)

    const parsed = xpHistoryQuerySchema.parse({
      page: '3',
      limit: '25',
      source: 'LESSON_COMPLETE',
    })
    expect(parsed.page).toBe(3)
    expect(parsed.limit).toBe(25)
    expect(parsed.source).toBe('LESSON_COMPLETE')
  })

  it('validates assessment-related schemas', () => {
    expect(assessmentSlugParamsSchema.safeParse({ slug: 'python-basics' }).success).toBe(true)

    const queryDefaults = getAssessmentsQuerySchema.parse({})
    expect(queryDefaults.page).toBe(1)
    expect(queryDefaults.limit).toBe(10)

    expect(startAssessmentSchema.safeParse({ userId: validUserId }).success).toBe(true)
    expect(getUserAssessmentsSchema.safeParse({ userId: validUserId }).success).toBe(true)
    expect(assessmentUserParamsSchema.safeParse({ userId: validUserId }).success).toBe(true)

    const queryWithPagination = getAssessmentsQuerySchema.parse({
      page: '4',
      limit: '20',
      difficulty: 'Advanced',
      skillArea: 'backend',
    })
    expect(queryWithPagination.page).toBe(4)
    expect(queryWithPagination.limit).toBe(20)
    expect(queryWithPagination.difficulty).toBe('Advanced')

    expect(
      submitAssessmentSchema.safeParse({
        attemptId: validUuid,
        userId: validUserId,
        timeSpent: 123,
        answers: { q1: 'A' },
      }).success
    ).toBe(true)
  })

  it('requires at least one answer in submitAssessmentSchema', () => {
    expect(
      submitAssessmentSchema.safeParse({
        attemptId: validUuid,
        userId: validUserId,
        answers: {},
      }).success
    ).toBe(false)
  })

  it('validates stripe schemas', () => {
    expect(createCheckoutSessionSchema.safeParse({ priceId: 'price_123' }).success).toBe(true)
    expect(createPortalSessionSchema.safeParse({ returnUrl: 'https://learn.example.com/settings' }).success).toBe(true)
    expect(createPortalSessionSchema.safeParse({}).success).toBe(true)
  })

  it('validates AI tutor schemas and transforms', () => {
    expect(
      tutorContextSchema.safeParse({
        lessonId: validUuid,
        lessonTitle: 'Intro',
        courseId: 'course-1',
        courseName: 'Course 1',
        currentContent: 'Some content',
      }).success
    ).toBe(true)

    const parsedMessage = chatMessageSchema.parse({
      message: '<b>Hello</b>',
      conversationId: validUuid,
      context: { lessonId: validUuid },
    })
    expect(parsedMessage.message).toContain('&lt;b&gt;Hello&lt;&#x2F;b&gt;')

    expect(createConversationSchema.safeParse({ context: { lessonId: validUuid } }).success).toBe(true)

    const conversationsQuery = getConversationsQuerySchema.parse({})
    expect(conversationsQuery.limit).toBe(20)

    const conversationsQueryWithLimit = getConversationsQuerySchema.parse({ limit: '35' })
    expect(conversationsQueryWithLimit.limit).toBe(35)

    expect(conversationIdParamsSchema.safeParse({ id: validUuid }).success).toBe(true)
  })

  it('exports expected enum values', () => {
    expect(subscriptionStatusValues).toContain('active')
    expect(questionTypeValues).toContain('SINGLE_CHOICE')
    expect(difficultyValues).toContain('Advanced')
  })
})
