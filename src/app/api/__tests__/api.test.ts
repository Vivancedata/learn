import { GET as getCourses } from '../courses/route'
import { GET as getPaths } from '../paths/route'
import { GET as getLesson } from '../lessons/[id]/route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    course: {
      findMany: jest.fn(),
    },
    path: {
      findMany: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
  },
}))

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/courses', () => {
    it('should return courses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'Course 1',
          description: 'Test course',
          difficulty: 'Beginner',
          durationHours: 10,
          pathId: 'path-1',
          sections: [],
          path: { id: 'path-1', title: 'Path 1' },
        },
      ]

      // @ts-expect-error - mock implementation
      prisma.course.findMany.mockResolvedValue(mockCourses)

      const response = await getCourses()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.timestamp).toBeDefined()
      expect(prisma.course.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.course.findMany.mockRejectedValue(new Error('Database error'))

      const response = await getCourses()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('Database error')
    })
  })

  describe('GET /api/paths', () => {
    it('should return paths', async () => {
      const mockPaths = [
        {
          id: 'path-1',
          title: 'Path 1',
          description: 'Test path',
          courses: [],
        },
      ]

      // @ts-expect-error - mock implementation
      prisma.path.findMany.mockResolvedValue(mockPaths)

      const response = await getPaths()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.timestamp).toBeDefined()
      expect(prisma.path.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.path.findMany.mockRejectedValue(new Error('Database error'))

      const response = await getPaths()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('Database error')
    })
  })

  describe('GET /api/lessons/[id]', () => {
    // Helper to create async params as required by Next.js 16+
    const createAsyncParams = (id: string) => ({ params: Promise.resolve({ id }) })

    // Valid UUID for testing
    const validLessonId = '123e4567-e89b-12d3-a456-426614174000'
    const validSectionId = '123e4567-e89b-12d3-a456-426614174001'

    it('should return a lesson', async () => {
      const mockLesson = {
        id: validLessonId,
        title: 'Lesson 1',
        content: 'Test content',
        type: 'lesson',
        hasProject: false,
        section: {
          id: validSectionId,
          title: 'Section 1',
          course: {
            id: 'course-1',
            title: 'Course 1',
          },
        },
        quizQuestions: [],
        discussions: [],
      }

      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue(mockLesson)

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`)
      const response = await getLesson(request, createAsyncParams(validLessonId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(prisma.lesson.findUnique).toHaveBeenCalledTimes(1)
    })

    it('should return 404 if lesson not found', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999'

      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/lessons/${nonExistentId}`)
      const response = await getLesson(request, createAsyncParams(nonExistentId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/lessons/invalid-id')
      const response = await getLesson(request, createAsyncParams('invalid-id'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
    })

    it('should handle errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`)
      const response = await getLesson(request, createAsyncParams(validLessonId))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })
})
