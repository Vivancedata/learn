import {
  parseLessonMinutes,
  courseDurationMinutes,
  formatMinutes,
  courseDurationLabel,
} from '@/lib/course-duration'

describe('parseLessonMinutes', () => {
  it('parses the "N mins" form used by every lesson in the catalogue', () => {
    expect(parseLessonMinutes('45 mins')).toBe(45)
    expect(parseLessonMinutes('60 mins')).toBe(60)
    expect(parseLessonMinutes('120 mins')).toBe(120)
  })

  it('parses singular, long and abbreviated units', () => {
    expect(parseLessonMinutes('1 minute')).toBe(1)
    expect(parseLessonMinutes('30m')).toBe(30)
    expect(parseLessonMinutes('2 hours')).toBe(120)
    expect(parseLessonMinutes('1h 30m')).toBe(90)
    expect(parseLessonMinutes('1 hr 5 min')).toBe(65)
  })

  it('treats a bare number as minutes', () => {
    expect(parseLessonMinutes('50')).toBe(50)
  })

  it('returns null when there is no usable figure', () => {
    expect(parseLessonMinutes(undefined)).toBeNull()
    expect(parseLessonMinutes(null)).toBeNull()
    expect(parseLessonMinutes('')).toBeNull()
    expect(parseLessonMinutes('a while')).toBeNull()
    expect(parseLessonMinutes('0 mins')).toBeNull()
  })
})

describe('courseDurationMinutes', () => {
  it('sums lesson durations rather than trusting the authored durationHours', () => {
    // The real computer-vision-fundamentals course: 50 declared hours,
    // 205 minutes of lessons.
    const course = {
      sections: [
        { lessons: [{ duration: '45 mins' }, { duration: '50 mins' }] },
        { lessons: [{ duration: '60 mins' }, { duration: '50 mins' }] },
      ],
    }

    expect(courseDurationMinutes(course)).toBe(205)
    expect(courseDurationLabel(course)).toBe('3 hr 25 min')
  })

  it('ignores lessons with no duration but still counts the rest', () => {
    const course = {
      sections: [{ lessons: [{ duration: '30 mins' }, { duration: undefined }] }],
    }

    expect(courseDurationMinutes(course)).toBe(30)
  })

  it('returns null when no lesson carries a duration, so callers can drop the figure', () => {
    expect(courseDurationMinutes({ sections: [{ lessons: [{ duration: undefined }] }] })).toBeNull()
    expect(courseDurationMinutes({ sections: [] })).toBeNull()
    expect(courseDurationMinutes(null)).toBeNull()
  })
})

describe('formatMinutes', () => {
  it('formats minutes, whole hours and mixed values', () => {
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(60)).toBe('1 hr')
    expect(formatMinutes(205)).toBe('3 hr 25 min')
  })

  it('returns null rather than printing a zero', () => {
    expect(formatMinutes(0)).toBeNull()
    expect(formatMinutes(null)).toBeNull()
  })
})
