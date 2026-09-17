import type { CourseDifficulty } from '@/types/assessment'

// Difficulty is signalled by a coloured border and dot, never by coloured text.
//
// The previous `text-X` on `bg-X/10` failed WCAG AA badly in the light theme,
// measured on the tints it actually renders on:
//   Intermediate (warning) 1.87:1 · Beginner (success) 3.30:1 · Advanced
//   (destructive) 3.75:1 — against a 4.5:1 floor.
// The tokens are simply not dark enough to sit on their own 10% tint. Ink text
// on the same tint measures 15.0–16.8:1 in light and 13.1–15.2:1 in dark, so
// the label is `text-foreground` everywhere and the hue moves to the chrome.
export const DIFFICULTY_BADGE_CLASSES: Record<CourseDifficulty, string> = {
  Beginner: 'border-success bg-success/10 text-foreground',
  Intermediate: 'border-warning bg-warning/10 text-foreground',
  Advanced: 'border-destructive bg-destructive/10 text-foreground',
}

export const DIFFICULTY_DOT_CLASSES: Record<CourseDifficulty, string> = {
  Beginner: 'bg-success',
  Intermediate: 'bg-warning',
  Advanced: 'bg-destructive',
}
