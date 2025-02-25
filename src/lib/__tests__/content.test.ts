import { calculateCourseProgress, parseKnowledgeCheck } from '../content'
import { Course } from '@/types/course'

describe('Content Utilities', () => {
  describe('calculateCourseProgress', () => {
    it('should calculate total lessons and projects correctly', () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test Description',
        difficulty: 'Beginner',
        durationHours: 10,
        pathId: 'path-1',
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            order: 1,
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1',
                content: 'Content 1',
                type: 'lesson',
                hasProject: false,
              },
              {
                id: 'lesson-2',
                title: 'Lesson 2',
                content: 'Content 2',
                type: 'project',
                hasProject: true,
              },
            ],
          },
          {
            id: 'section-2',
            title: 'Section 2',
            order: 2,
            lessons: [
              {
                id: 'lesson-3',
                title: 'Lesson 3',
                content: 'Content 3',
                type: 'lesson',
                hasProject: false,
              },
              {
                id: 'lesson-4',
                title: 'Lesson 4',
                content: 'Content 4',
                type: 'project',
                hasProject: true,
              },
            ],
          },
        ],
      } as Course

      const progress = calculateCourseProgress(mockCourse)

      expect(progress.totalLessons).toBe(4)
      expect(progress.totalProjects).toBe(2)
    })

    it('should handle empty course sections', () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test Description',
        difficulty: 'Beginner',
        durationHours: 10,
        pathId: 'path-1',
        sections: [],
      } as Course

      const progress = calculateCourseProgress(mockCourse)

      expect(progress.totalLessons).toBe(0)
      expect(progress.totalProjects).toBe(0)
    })
  })

  describe('parseKnowledgeCheck', () => {
    it('should parse knowledge check questions from content', () => {
      const content = `
# Lesson Title

Some content here.

## Knowledge Check

1. What is HTML?
   - Hypertext Markup Language
   - High-Tech Modern Language
   - Hyper Tool Markup Language
   - Home Text Management Language

## Another Section

More content here.
      `

      const result = parseKnowledgeCheck(content)
      
      expect(result).not.toBeNull()
      expect(result?.questions).toHaveLength(1)
      expect(result?.questions[0].question).toBe('What is HTML?')
      expect(result?.questions[0].options).toHaveLength(4)
      expect(result?.questions[0].correctAnswer).toBe(0)
    })

    it('should return null if no knowledge check section is found', () => {
      const content = `
# Lesson Title

Some content here.

## Another Section

More content here.
      `

      const result = parseKnowledgeCheck(content)
      
      expect(result).toBeNull()
    })
  })
})
