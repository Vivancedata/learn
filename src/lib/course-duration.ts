/**
 * Course duration derived from lesson data.
 *
 * The `Course.durationHours` column is an authored marketing figure that does
 * not match the lessons that exist: computer-vision-fundamentals declares 50
 * hours against four lessons totalling 205 minutes. Anything shown to a learner
 * is summed from the lesson `duration` strings instead, and is omitted entirely
 * when no lesson in the course carries one.
 */

interface DurationLesson {
  duration?: string | null
}

interface DurationSection {
  lessons: DurationLesson[]
}

interface DurationCourse {
  sections: DurationSection[]
}

/**
 * Parse a lesson duration string ("45 mins", "1h 30m", "90 minutes") into whole
 * minutes. Returns null when the string carries no usable figure.
 */
export function parseLessonMinutes(duration?: string | null): number | null {
  if (!duration || typeof duration !== 'string') return null

  const text = duration.toLowerCase()
  let total = 0
  let matched = false

  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b/)
  if (hours) {
    total += parseFloat(hours[1]) * 60
    matched = true
  }

  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes|minute|mins|min|m)\b/)
  if (minutes) {
    total += parseFloat(minutes[1])
    matched = true
  }

  if (!matched) {
    const bare = text.match(/^\s*(\d+(?:\.\d+)?)\s*$/)
    if (!bare) return null
    total = parseFloat(bare[1])
  }

  const rounded = Math.round(total)
  return rounded > 0 ? rounded : null
}

/**
 * Sum the durations of every lesson in a course. Returns null when no lesson
 * declares one, so callers can drop the figure rather than print a zero.
 */
export function courseDurationMinutes(course: DurationCourse | null | undefined): number | null {
  if (!course?.sections) return null

  let total = 0
  let counted = 0

  for (const section of course.sections) {
    for (const lesson of section?.lessons ?? []) {
      const minutes = parseLessonMinutes(lesson?.duration)
      if (minutes !== null) {
        total += minutes
        counted += 1
      }
    }
  }

  return counted > 0 ? total : null
}

/** Render minutes as "45 min", "1 hr", or "3 hr 25 min". */
export function formatMinutes(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined || minutes <= 0) return null

  const whole = Math.round(minutes)
  if (whole < 60) return `${whole} min`

  const hours = Math.floor(whole / 60)
  const remainder = whole % 60
  const hourLabel = `${hours} hr`

  return remainder === 0 ? hourLabel : `${hourLabel} ${remainder} min`
}

/** Convenience: the printable duration of a course, or null when unknown. */
export function courseDurationLabel(course: DurationCourse | null | undefined): string | null {
  return formatMinutes(courseDurationMinutes(course))
}
