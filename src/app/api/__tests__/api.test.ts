import { GET as getCourses } from '../courses/route'
import { GET as getPaths } from '../paths/route'
import { GET as getLesson } from '../lessons/[id]/route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

const prismaMock = prisma as unknown as {
  course: { findMany: jest.Mock }
  path: { findMany: jest.Mock }
  lesson: { findUnique: jest.Mock }
}

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

      prismaMock.course.findMany.mockResolvedValue(mockCourses)

      const response = await getCourses()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.timestamp).toBeDefined()
      expect(prismaMock.course.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors', async () => {
      prismaMock.course.findMany.mockRejectedValue(new Error('Database error'))

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

      prismaMock.path.findMany.mockResolvedValue(mockPaths)

      const response = await getPaths()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.timestamp).toBeDefined()
      expect(prismaMock.path.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors', async () => {
      prismaMock.path.findMany.mockRejectedValue(new Error('Database error'))

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

      prismaMock.lesson.findUnique.mockResolvedValue(mockLesson)

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`)
      const response = await getLesson(request, createAsyncParams(validLessonId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(prismaMock.lesson.findUnique).toHaveBeenCalledTimes(1)
    })

    it('should return 404 if lesson not found', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999'

      prismaMock.lesson.findUnique.mockResolvedValue(null)

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
      prismaMock.lesson.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/lessons/${validLessonId}`)
      const response = await getLesson(request, createAsyncParams(validLessonId))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })
})
