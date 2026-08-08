import type { CourseDifficulty } from '@/types/assessment'

// The StatusBadge grammar from the design system: border-X bg-X/10 text-X.
// One place to map difficulty -> status token so course cards, featured
// cards, and any future surface agree (they previously used three unrelated
// treatments: ink fill, plain text, and a red destructive fill).
export const DIFFICULTY_BADGE_CLASSES: Record<CourseDifficulty, string> = {
  Beginner: 'border-success bg-success/10 text-success',
  Intermediate: 'border-warning bg-warning/10 text-warning',
  Advanced: 'border-destructive bg-destructive/10 text-destructive',
}
