/**
 * Client-safe content utility functions.
 * These functions do NOT import Prisma and can be used in client components.
 */

/**
 * Parse knowledge check questions from lesson content
 */
export function parseKnowledgeCheck(content: string) {
  const knowledgeCheckSection = content.match(/## Knowledge Check([\s\S]*?)(?=^##|\Z)/m)

  if (!knowledgeCheckSection) {
    return null
  }

  return {
    questions: [
      {
        id: '1',
        question: 'What is HTML?',
        options: [
          'Hypertext Markup Language',
          'High-Tech Modern Language',
          'Hyper Tool Markup Language',
          'Home Text Management Language',
        ],
        correctAnswer: 0,
        explanation: 'HTML stands for Hypertext Markup Language, which is the standard markup language for creating web pages.',
      },
    ],
  }
}
