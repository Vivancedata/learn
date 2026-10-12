import { cn } from "@/lib/utils"
import { DIFFICULTY_BADGE_CLASSES, DIFFICULTY_DOT_CLASSES } from "@/lib/difficulty"
import type { CourseDifficulty } from "@/types/assessment"

/**
 * Course difficulty badge: hue in the border and the dot, label in ink.
 *
 * Coloured label text on a tinted background failed WCAG AA in the light
 * theme (1.87:1 for Intermediate). The dot keeps the colour signal at a size
 * where contrast is a 3:1 non-text requirement rather than a 4.5:1 text one.
 */
export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: CourseDifficulty
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        DIFFICULTY_BADGE_CLASSES[difficulty],
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DIFFICULTY_DOT_CLASSES[difficulty])}
        aria-hidden="true"
      />
      {difficulty}
    </span>
  )
}
