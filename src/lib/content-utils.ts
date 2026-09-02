/**
 * Client-safe content utility functions.
 * These functions do NOT import Prisma and can be used in client components.
 */

import type { Question } from '@/types/knowledge-check'

const HEADING = '## Knowledge Check'

/**
 * Locate the "## Knowledge Check" section in a lesson's markdown.
 * Returns the index of the heading and the index just past the section,
 * or null when there is no such section.
 */
function locateKnowledgeCheck(content: string): { start: number; end: number } | null {
  if (!content || typeof content !== 'string') return null

  const start = content.indexOf(HEADING)
  if (start === -1) return null

  const afterHeading = content.slice(start + HEADING.length)
  const nextHeading = afterHeading.match(/\n(?=#)/)

  return {
    start,
    end: nextHeading
      ? start + HEADING.length + (nextHeading.index ?? 0)
      : content.length,
  }
}

/**
 * Parse knowledge check questions from lesson content.
 *
 * Expected markdown format in lesson .md files:
 *
 * ## Knowledge Check
 *
 * 1. Question text here?
 *    - First option (this is the correct answer — always listed first)
 *    - Second option
 *
 * Rules:
 * - The section begins with the heading `## Knowledge Check` (case-sensitive).
 * - Each question is a numbered list item (`1.`, `2.`, …).
 * - Options are indented bullet points (`- ` or `* `) below the question.
 * - The FIRST option listed is always the correct answer (correctAnswer 0).
 * - The section ends at the next `#`-level heading or at end of file.
 *
 * @param content - Raw markdown string of the lesson
 * @returns Object with a `questions` array, or `null` when no section is found
 */
export function parseKnowledgeCheck(content: string): { questions: Question[] } | null {
  const bounds = locateKnowledgeCheck(content)
  if (!bounds) return null

  const sectionText = content.slice(bounds.start + HEADING.length, bounds.end)
  if (!sectionText || sectionText.trim() === '') return null

  // Each block starts with a numbered list marker (e.g. "1. ", "2. ").
  const questionBlocks = sectionText
    .split(/(?=^\d+\.\s)/m)
    .map(block => block.trim())
    .filter(block => /^\d+\.\s/.test(block))

  if (questionBlocks.length === 0) return null

  const questions: Question[] = []

  for (const block of questionBlocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line !== '')
    if (lines.length === 0) continue

    const questionLineMatch = lines[0].match(/^\d+\.\s+(.+)$/)
    if (!questionLineMatch) continue

    const options: string[] = []
    for (let i = 1; i < lines.length; i++) {
      const optionMatch = lines[i].match(/^[-*]\s+(.+)$/)
      if (optionMatch) {
        options.push(optionMatch[1].trim())
      }
    }

    if (options.length === 0) continue

    questions.push({
      question: questionLineMatch[1].trim(),
      options,
      // The first option listed in the markdown is always the correct answer
      correctAnswer: 0,
    })
  }

  return questions.length > 0 ? { questions } : null
}

/**
 * Remove the "## Knowledge Check" section from lesson markdown.
 *
 * The section is the answer key: the first bullet under every question is the
 * correct answer. Rendering the lesson body verbatim printed it directly above
 * the interactive quiz, so the quiz could be passed without reading anything.
 *
 * @param content - Raw markdown string of the lesson
 * @returns The markdown with the section removed (unchanged if absent)
 */
export function stripKnowledgeCheck(content: string): string {
  const bounds = locateKnowledgeCheck(content)
  if (!bounds) return content

  return (content.slice(0, bounds.start) + content.slice(bounds.end)).trimEnd()
}
