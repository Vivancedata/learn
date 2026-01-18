import {
  getAllCourses,
  getCourseById,
  getLessonById,
  getAllPaths,
  getPathById,
  calculateCourseProgress,
  parseKnowledgeCheck,
} from '../content'
import { Course } from '@/types/course'
import prisma from '@/lib/db'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    path: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Content Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllCourses', () => {
    it('should return all courses with sections and lessons', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'Test Course',
          description: 'Description',
          difficulty: 'Beginner',
          durationHours: 10,
          pathId: 'path-1',
          prerequisites: '["prereq1"]',
          learningOutcomes: '["outcome1"]',
          sections: [
            {
              id: 'section-1',
              title: 'Section 1',
              description: 'Section desc',
              order: 1,
              courseId: 'course-1',
              lessons: [
                {
                  id: 'lesson-1',
                  title: 'Lesson 1',
                  content: 'Content',
                  type: 'lesson',
                  duration: 30,
                  hasProject: false,
                  githubUrl: null,
                  nextLessonId: null,
                  prevLessonId: null,
                  sectionId: 'section-1',
                },
              ],
            },
          ],
          path: {
            id: 'path-1',
            title: 'Path 1',
            description: 'Path desc',
            icon: 'icon',
            prerequisites: null,
            estimatedHours: 20,
            difficulty: 'Beginner',
          },
        },
      ]

      ;(mockPrisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

      const result = await getAllCourses()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('course-1')
      expect(result[0].sections).toHaveLength(1)
      expect(mockPrisma.course.findMany).toHaveBeenCalled()
    })

    it('should return empty array on error', async () => {
      ;(mockPrisma.course.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await getAllCourses()

      expect(result).toEqual([])
    })
  })

  describe('getCourseById', () => {
    it('should return a course by ID', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Description',
        difficulty: 'Beginner',
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

      ;(mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse)

      const result = await getCourseById('course-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('course-1')
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'course-1' },
        })
      )
    })

    it('should return null if course not found', async () => {
      ;(mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getCourseById('non-existent')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      ;(mockPrisma.course.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await getCourseById('course-1')

      expect(result).toBeNull()
    })
  })

  describe('getLessonById', () => {
    it('should return a lesson by ID when it belongs to the course', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Lesson 1',
        content: 'Content',
        type: 'lesson',
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

      ;(mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson)

      const result = await getLessonById('course-1', 'lesson-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('lesson-1')
    })

    it('should return null if lesson does not belong to course', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Lesson 1',
        content: 'Content',
        type: 'lesson',
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
            id: 'different-course',
            title: 'Different Course',
          },
        },
        quizQuestions: [],
      }

      ;(mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson)

      const result = await getLessonById('course-1', 'lesson-1')

      expect(result).toBeNull()
    })

    it('should return null if lesson not found', async () => {
      ;(mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getLessonById('course-1', 'non-existent')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      ;(mockPrisma.lesson.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await getLessonById('course-1', 'lesson-1')

      expect(result).toBeNull()
    })

    it('should include knowledge check if quiz questions exist', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Lesson 1',
        content: 'Content',
        type: 'quiz',
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
        quizQuestions: [
          {
            id: 'q-1',
            question: 'What is 1+1?',
            options: '["1", "2", "3", "4"]',
            correctAnswer: 1,
            explanation: 'Basic math',
          },
        ],
      }

      ;(mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson)

      const result = await getLessonById('course-1', 'lesson-1')

      expect(result).not.toBeNull()
      expect(result?.knowledgeCheck).toBeDefined()
      expect(result?.knowledgeCheck?.questions).toHaveLength(1)
      expect(result?.knowledgeCheck?.questions[0].question).toBe('What is 1+1?')
    })
  })

  describe('getAllPaths', () => {
    it('should return all learning paths', async () => {
      const mockPaths = [
        {
          id: 'path-1',
          title: 'Path 1',
          description: 'Description',
          icon: 'globe',
          prerequisites: '["prereq"]',
          estimatedHours: 40,
          difficulty: 'Beginner',
          courses: [{ id: 'course-1' }, { id: 'course-2' }],
        },
      ]

      ;(mockPrisma.path.findMany as jest.Mock).mockResolvedValue(mockPaths)

      const result = await getAllPaths()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('path-1')
      expect(result[0].courses).toEqual(['course-1', 'course-2'])
    })

    it('should return empty array on error', async () => {
      ;(mockPrisma.path.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await getAllPaths()

      expect(result).toEqual([])
    })
  })

  describe('getPathById', () => {
    it('should return a path by ID', async () => {
      const mockPath = {
        id: 'path-1',
        title: 'Path 1',
        description: 'Description',
        icon: null,
        prerequisites: null,
        estimatedHours: null,
        difficulty: null,
        courses: [{ id: 'course-1' }],
      }

      ;(mockPrisma.path.findUnique as jest.Mock).mockResolvedValue(mockPath)

      const result = await getPathById('path-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('path-1')
    })

    it('should return null if path not found', async () => {
      ;(mockPrisma.path.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getPathById('non-existent')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      ;(mockPrisma.path.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await getPathById('path-1')

      expect(result).toBeNull()
    })
  })

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
              { id: 'lesson-1', title: 'Lesson 1', content: '', type: 'lesson', hasProject: false },
              { id: 'lesson-2', title: 'Lesson 2', content: '', type: 'project', hasProject: true },
            ],
          },
          {
            id: 'section-2',
            title: 'Section 2',
            order: 2,
            lessons: [
              { id: 'lesson-3', title: 'Lesson 3', content: '', type: 'lesson', hasProject: false },
              { id: 'lesson-4', title: 'Lesson 4', content: '', type: 'project', hasProject: true },
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
