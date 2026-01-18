/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  adaptCourse,
  adaptCourses,
  adaptCourseSection,
  adaptLesson,
  adaptLessonWithQuiz,
  adaptPath,
  adaptPaths,
} from '../type-adapters'

// Helper to create mock Prisma data with required fields
const mockDate = new Date('2025-01-01')

describe('Type Adapters', () => {
  describe('adaptLesson', () => {
    it('should adapt a basic lesson', () => {
      const prismaLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        content: 'Lesson content',
        type: 'lesson' as const,
        duration: '30',
        hasProject: false,
        githubUrl: 'https://github.com/test',
        nextLessonId: 'lesson-2',
        prevLessonId: null,
        sectionId: 'section-1',
        createdAt: mockDate,
        updatedAt: mockDate,
      }

      const result = adaptLesson(prismaLesson as Parameters<typeof adaptLesson>[0])

      expect(result.id).toBe('lesson-1')
      expect(result.title).toBe('Test Lesson')
      expect(result.content).toBe('Lesson content')
      expect(result.type).toBe('lesson')
      expect(result.duration).toBe('30')
      expect(result.hasProject).toBe(false)
      expect(result.githubUrl).toBe('https://github.com/test')
      expect(result.nextLessonId).toBe('lesson-2')
      expect(result.prevLessonId).toBeUndefined()
    })

    it('should handle null optional fields', () => {
      const prismaLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        content: 'Content',
        type: 'lesson' as const,
        duration: null,
        hasProject: false,
        githubUrl: null,
        nextLessonId: null,
        prevLessonId: null,
        sectionId: 'section-1',
        createdAt: mockDate,
        updatedAt: mockDate,
      }

      const result = adaptLesson(prismaLesson as Parameters<typeof adaptLesson>[0])

      expect(result.duration).toBeUndefined()
      expect(result.githubUrl).toBeUndefined()
      expect(result.nextLessonId).toBeUndefined()
      expect(result.prevLessonId).toBeUndefined()
    })
  })

  describe('adaptCourseSection', () => {
    it('should adapt a course section with lessons', () => {
      const prismaSection = {
        id: 'section-1',
        title: 'Section Title',
        description: 'Section description',
        order: 1,
        courseId: 'course-1',
        createdAt: mockDate,
        updatedAt: mockDate,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Lesson 1',
            content: 'Content 1',
            type: 'lesson' as const,
            duration: '20',
            hasProject: false,
            githubUrl: null,
            nextLessonId: null,
            prevLessonId: null,
            sectionId: 'section-1',
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ],
      }

      const result = adaptCourseSection(prismaSection as Parameters<typeof adaptCourseSection>[0])

      expect(result.id).toBe('section-1')
      expect(result.title).toBe('Section Title')
      expect(result.description).toBe('Section description')
      expect(result.order).toBe(1)
      expect(result.lessons).toHaveLength(1)
      expect(result.lessons[0].id).toBe('lesson-1')
    })

    it('should handle null description', () => {
      const prismaSection = {
        id: 'section-1',
        title: 'Section Title',
        description: null,
        order: 1,
        courseId: 'course-1',
        createdAt: mockDate,
        updatedAt: mockDate,
        lessons: [],
      }

      const result = adaptCourseSection(prismaSection as Parameters<typeof adaptCourseSection>[0])

      expect(result.description).toBeUndefined()
    })
  })

  describe('adaptCourse', () => {
    it('should adapt a course with all fields', () => {
      const prismaCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Course description',
        difficulty: 'Beginner' as const,
        durationHours: 10,
        pathId: 'path-1',
        prerequisites: '["prereq1", "prereq2"]',
        learningOutcomes: '["outcome1", "outcome2"]',
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            description: 'Desc',
            order: 1,
            courseId: 'course-1',
            lessons: [],
          },
        ],
        path: {
          id: 'path-1',
          title: 'Path 1',
          description: 'Path desc',
          icon: 'globe',
          prerequisites: null,
          estimatedHours: 40,
          difficulty: 'Beginner',
        },
      }

      const result = adaptCourse(prismaCourse as any)

      expect(result.id).toBe('course-1')
      expect(result.title).toBe('Test Course')
      expect(result.prerequisites).toEqual(['prereq1', 'prereq2'])
      expect(result.learningOutcomes).toEqual(['outcome1', 'outcome2'])
      expect(result.sections).toHaveLength(1)
    })

    it('should handle null JSON fields', () => {
      const prismaCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Description',
        difficulty: 'Beginner' as const,
        durationHours: 10,
        pathId: 'path-1',
        prerequisites: null,
        learningOutcomes: null,
        sections: [],
        path: {
          id: 'path-1',
          title: 'Path 1',
          description: 'Path desc',
          icon: null,
          prerequisites: null,
          estimatedHours: null,
          difficulty: null,
        },
      }

      const result = adaptCourse(prismaCourse as any)

      expect(result.prerequisites).toBeUndefined()
      expect(result.learningOutcomes).toBeUndefined()
    })

    it('should handle invalid JSON in fields', () => {
      const prismaCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Description',
        difficulty: 'Beginner' as const,
        durationHours: 10,
        pathId: 'path-1',
        prerequisites: 'invalid json {{{',
        learningOutcomes: 'also invalid',
        sections: [],
        path: {
          id: 'path-1',
          title: 'Path 1',
          description: 'Path desc',
          icon: null,
          prerequisites: null,
          estimatedHours: null,
          difficulty: null,
        },
      }

      const result = adaptCourse(prismaCourse as any)

      // Should use default empty array when JSON parsing fails
      expect(result.prerequisites).toEqual([])
      expect(result.learningOutcomes).toEqual([])
    })
  })

  describe('adaptCourses', () => {
    it('should adapt an array of courses', () => {
      const prismaCourses = [
        {
          id: 'course-1',
          title: 'Course 1',
          description: 'Desc 1',
          difficulty: 'Beginner' as const,
          durationHours: 10,
          pathId: 'path-1',
          prerequisites: null,
          learningOutcomes: null,
          sections: [],
          path: {
            id: 'path-1',
            title: 'Path 1',
            description: 'Path desc',
            icon: null,
            prerequisites: null,
            estimatedHours: null,
            difficulty: null,
          },
        },
        {
          id: 'course-2',
          title: 'Course 2',
          description: 'Desc 2',
          difficulty: 'Intermediate' as const,
          durationHours: 20,
          pathId: 'path-1',
          prerequisites: null,
          learningOutcomes: null,
          sections: [],
          path: {
            id: 'path-1',
            title: 'Path 1',
            description: 'Path desc',
            icon: null,
            prerequisites: null,
            estimatedHours: null,
            difficulty: null,
          },
        },
      ]

      const result = adaptCourses(prismaCourses as any)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('course-1')
      expect(result[1].id).toBe('course-2')
    })

    it('should handle empty array', () => {
      const result = adaptCourses([])

      expect(result).toEqual([])
    })
  })

  describe('adaptLessonWithQuiz', () => {
    it('should adapt a lesson with quiz questions', () => {
      const prismaLesson = {
        id: 'lesson-1',
        title: 'Quiz Lesson',
        content: 'Content',
        type: 'quiz' as const,
        duration: 15,
        hasProject: false,
        githubUrl: null,
        nextLessonId: null,
        prevLessonId: null,
        sectionId: 'section-1',
        section: {
          id: 'section-1',
          title: 'Section 1',
          description: null,
          order: 1,
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Course 1',
          },
        },
        quizQuestions: [
          {
            id: 'q-1',
            question: 'What is 2+2?',
            options: '["2", "3", "4", "5"]',
            correctAnswer: 2,
            explanation: 'Basic math: 2+2=4',
          },
          {
            id: 'q-2',
            question: 'What color is the sky?',
            options: '["Red", "Blue", "Green"]',
            correctAnswer: 1,
            explanation: null,
          },
        ],
      }

      const result = adaptLessonWithQuiz(prismaLesson as any)

      expect(result.id).toBe('lesson-1')
      expect(result.knowledgeCheck).toBeDefined()
      expect(result.knowledgeCheck?.questions).toHaveLength(2)
      expect(result.knowledgeCheck?.questions[0].question).toBe('What is 2+2?')
      expect(result.knowledgeCheck?.questions[0].options).toEqual(['2', '3', '4', '5'])
      expect(result.knowledgeCheck?.questions[0].correctAnswer).toBe(2)
      expect(result.knowledgeCheck?.questions[0].explanation).toBe('Basic math: 2+2=4')
      expect(result.knowledgeCheck?.questions[1].explanation).toBe('')
    })

    it('should not add knowledgeCheck if no quiz questions', () => {
      const prismaLesson = {
        id: 'lesson-1',
        title: 'Regular Lesson',
        content: 'Content',
        type: 'lesson' as const,
        duration: 30,
        hasProject: false,
        githubUrl: null,
        nextLessonId: null,
        prevLessonId: null,
        sectionId: 'section-1',
        section: {
          id: 'section-1',
          title: 'Section 1',
          description: null,
          order: 1,
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Course 1',
          },
        },
        quizQuestions: [],
      }

      const result = adaptLessonWithQuiz(prismaLesson as any)

      expect(result.knowledgeCheck).toBeUndefined()
    })

    it('should handle undefined quiz questions', () => {
      const prismaLesson = {
        id: 'lesson-1',
        title: 'Regular Lesson',
        content: 'Content',
        type: 'lesson' as const,
        duration: 30,
        hasProject: false,
        githubUrl: null,
        nextLessonId: null,
        prevLessonId: null,
        sectionId: 'section-1',
        section: {
          id: 'section-1',
          title: 'Section 1',
          description: null,
          order: 1,
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Course 1',
          },
        },
        quizQuestions: undefined,
      }

      const result = adaptLessonWithQuiz(prismaLesson as any)

      expect(result.knowledgeCheck).toBeUndefined()
    })

    it('should handle invalid JSON in quiz options', () => {
      const prismaLesson = {
        id: 'lesson-1',
        title: 'Quiz Lesson',
        content: 'Content',
        type: 'quiz' as const,
        duration: 15,
        hasProject: false,
        githubUrl: null,
        nextLessonId: null,
        prevLessonId: null,
        sectionId: 'section-1',
        section: {
          id: 'section-1',
          title: 'Section 1',
          description: null,
          order: 1,
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Course 1',
          },
        },
        quizQuestions: [
          {
            id: 'q-1',
            question: 'Test?',
            options: 'invalid json',
            correctAnswer: 0,
            explanation: null,
          },
        ],
      }

      const result = adaptLessonWithQuiz(prismaLesson as any)

      expect(result.knowledgeCheck?.questions[0].options).toEqual([])
    })
  })

  describe('adaptPath', () => {
    it('should adapt a path with all fields', () => {
      const prismaPath = {
        id: 'path-1',
        title: 'Learning Path',
        description: 'Path description',
        icon: 'globe',
        prerequisites: '["prereq1"]',
        estimatedHours: 40,
        difficulty: 'Intermediate',
        courses: [
          { id: 'course-1' },
          { id: 'course-2' },
        ],
      }

      const result = adaptPath(prismaPath as any)

      expect(result.id).toBe('path-1')
      expect(result.title).toBe('Learning Path')
      expect(result.description).toBe('Path description')
      expect(result.icon).toBe('globe')
      expect(result.courses).toEqual(['course-1', 'course-2'])
      expect(result.prerequisites).toEqual(['prereq1'])
      expect(result.estimatedHours).toBe(40)
      expect(result.difficulty).toBe('Intermediate')
    })

    it('should handle null optional fields', () => {
      const prismaPath = {
        id: 'path-1',
        title: 'Learning Path',
        description: 'Description',
        icon: null,
        prerequisites: null,
        estimatedHours: null,
        difficulty: null,
        courses: [],
      }

      const result = adaptPath(prismaPath as any)

      expect(result.icon).toBeUndefined()
      expect(result.prerequisites).toBeUndefined()
      expect(result.estimatedHours).toBeUndefined()
      expect(result.difficulty).toBeUndefined()
    })

    it('should handle invalid JSON in prerequisites', () => {
      const prismaPath = {
        id: 'path-1',
        title: 'Learning Path',
        description: 'Description',
        icon: null,
        prerequisites: 'invalid json',
        estimatedHours: null,
        difficulty: null,
        courses: [],
      }

      const result = adaptPath(prismaPath as any)

      expect(result.prerequisites).toEqual([])
    })
  })

  describe('adaptPaths', () => {
    it('should adapt an array of paths', () => {
      const prismaPaths = [
        {
          id: 'path-1',
          title: 'Path 1',
          description: 'Desc 1',
          icon: null,
          prerequisites: null,
          estimatedHours: null,
          difficulty: null,
          courses: [{ id: 'course-1' }],
        },
        {
          id: 'path-2',
          title: 'Path 2',
          description: 'Desc 2',
          icon: 'file',
          prerequisites: null,
          estimatedHours: 30,
          difficulty: 'Advanced',
          courses: [{ id: 'course-2' }, { id: 'course-3' }],
        },
      ]

      const result = adaptPaths(prismaPaths as any)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('path-1')
      expect(result[1].id).toBe('path-2')
      expect(result[1].courses).toEqual(['course-2', 'course-3'])
    })

    it('should handle empty array', () => {
      const result = adaptPaths([])

      expect(result).toEqual([])
    })
  })
})
