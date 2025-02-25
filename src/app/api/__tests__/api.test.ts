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
          sections: [],
          path: { id: 'path-1', title: 'Path 1' },
        },
      ]

      // @ts-expect-error - mock implementation
      prisma.course.findMany.mockResolvedValue(mockCourses)

      const response = await getCourses()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCourses)
      expect(prisma.course.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.course.findMany.mockRejectedValue(new Error('Database error'))

      const response = await getCourses()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch courses' })
    })
  })

  describe('GET /api/paths', () => {
    it('should return paths', async () => {
      const mockPaths = [
        {
          id: 'path-1',
          title: 'Path 1',
          courses: [],
        },
      ]

      // @ts-expect-error - mock implementation
      prisma.path.findMany.mockResolvedValue(mockPaths)

      const response = await getPaths()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockPaths)
      expect(prisma.path.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.path.findMany.mockRejectedValue(new Error('Database error'))

      const response = await getPaths()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch paths' })
    })
  })

  describe('GET /api/lessons/[id]', () => {
    it('should return a lesson', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Lesson 1',
        section: {
          id: 'section-1',
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

      const request = new NextRequest('http://localhost:3000/api/lessons/lesson-1')
      const response = await getLesson(request, { params: { id: 'lesson-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockLesson)
      expect(prisma.lesson.findUnique).toHaveBeenCalledTimes(1)
      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        include: expect.any(Object),
      })
    })

    it('should return 404 if lesson not found', async () => {
      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/lessons/non-existent')
      const response = await getLesson(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Lesson not found' })
    })

    it('should handle errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/lessons/lesson-1')
      const response = await getLesson(request, { params: { id: 'lesson-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch lesson' })
    })
  })
})
