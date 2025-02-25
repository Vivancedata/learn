"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { ProgressSummary } from "@/components/progress-summary"
import { ArrowRight, BookOpen, Award, Calendar, Clock, CheckCircle2 } from "lucide-react"
import { Course, Path } from "@/types/course"
import { getAllCourses, getAllPaths } from "@/lib/content"

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load courses and paths
        const [loadedCourses, loadedPaths] = await Promise.all([
          getAllCourses(),
          getAllPaths()
        ])
        
        setCourses(loadedCourses)
        setPaths(loadedPaths)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get in-progress courses (courses with progress data)
  const inProgressCourses = courses.filter(course => course.progress)
  
  // Calculate overall progress
  const totalLessons = courses.reduce((acc, course) => {
    return acc + (course.progress?.total || 0)
  }, 0)
  
  const completedLessons = courses.reduce((acc, course) => {
    return acc + (course.progress?.completed || 0)
  }, 0)
  
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
  
  // Get recently accessed courses
  const recentCourses = [...inProgressCourses]
    .sort((a, b) => {
      const dateA = a.progress?.lastAccessed ? new Date(a.progress.lastAccessed).getTime() : 0
      const dateB = b.progress?.lastAccessed ? new Date(b.progress.lastAccessed).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 3)

  // Get recommended next courses
  const recommendedCourses = courses
    .filter(course => !course.progress || course.progress.completed < course.progress.total)
    .slice(0, 3)

  // Get achievements
  const achievements = [
    {
      id: "first-lesson",
      title: "First Steps",
      description: "Completed your first lesson",
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      earned: completedLessons > 0
    },
    {
      id: "first-course",
      title: "Course Graduate",
      description: "Completed your first course",
      icon: <Award className="h-8 w-8 text-primary" />,
      earned: inProgressCourses.some(course => 
        course.progress?.completed === course.progress?.total
      )
    },
    {
      id: "streak-7",
      title: "Consistency Champion",
      description: "Studied for 7 days in a row",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      earned: false
    },
    {
      id: "hours-10",
      title: "Dedicated Learner",
      description: "Spent 10+ hours learning",
      icon: <Clock className="h-8 w-8 text-primary" />,
      earned: completedLessons >= 10
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress and continue your learning journey
          </p>
        </div>
        <ProgressCircle 
          progress={overallProgress}
          size="lg"
          showPercentage
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Your learning journey so far</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressSummary 
              totalCourses={courses.length}
              completedCourses={inProgressCourses.filter(c => 
                c.progress?.completed === c.progress?.total
              ).length}
              totalLessons={totalLessons}
              completedLessons={completedLessons}
            />
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/courses">
                View All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCourses.length > 0 ? (
              recentCourses.map(course => (
                <div key={course.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Link 
                      href={`/courses/${course.id}`}
                      className="font-medium hover:underline"
                    >
                      {course.title}
                    </Link>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">
                        {course.difficulty}
                      </Badge>
                      {course.progress && (
                        <span>
                          {course.progress.completed}/{course.progress.total} lessons
                        </span>
                      )}
                    </div>
                  </div>
                  {course.progress && (
                    <ProgressCircle 
                      progress={(course.progress.completed / course.progress.total) * 100}
                      size="sm"
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No courses in progress yet</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/courses">
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Next</CardTitle>
            <CardDescription>Courses to explore next</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedCourses.length > 0 ? (
              recommendedCourses.map(course => (
                <div key={course.id} className="space-y-1">
                  <Link 
                    href={`/courses/${course.id}`}
                    className="font-medium hover:underline"
                  >
                    {course.title}
                  </Link>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Badge variant="outline" className="mr-2">
                      {course.difficulty}
                    </Badge>
                    <span>{course.durationHours} hours</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No recommendations available</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/paths">
                Explore Learning Paths
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Learning Paths</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paths.slice(0, 3).map(path => {
            // Get courses for this path
            const pathCourses = courses.filter(course => path.courses.includes(course.id))
            const totalPathCourses = pathCourses.length
            const completedPathCourses = pathCourses.filter(
              course => 
                course.progress?.completed !== undefined && 
                course.progress?.total !== undefined &&
                course.progress.completed === course.progress.total
            ).length
            const pathProgress = totalPathCourses > 0 ? (completedPathCourses / totalPathCourses) * 100 : 0

            return (
              <Card key={path.id}>
                <CardHeader className="relative">
                  <div className="absolute right-4 top-4">
                    <ProgressCircle 
                      progress={pathProgress}
                      size="md"
                      showPercentage
                    />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    {path.icon && (
                      <span className="text-2xl">
                        {path.icon === 'globe' && '🌐'}
                        {path.icon === 'file' && '📄'}
                        {path.icon === 'window' && '🖥️'}
                      </span>
                    )}
                    {path.title}
                  </CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {completedPathCourses}/{totalPathCourses} courses completed
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pathCourses.slice(0, 2).map(course => (
                        <Badge key={course.id} variant="outline">
                          {course.title}
                        </Badge>
                      ))}
                      {pathCourses.length > 2 && (
                        <Badge variant="outline">
                          +{pathCourses.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/paths/${path.id}`} className="flex items-center gap-2">
                      {pathProgress > 0 ? "Continue Path" : "Start Path"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Achievements</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {achievements.map(achievement => (
            <Card key={achievement.id} className={achievement.earned ? "" : "opacity-50"}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                {achievement.icon}
                <div>
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter>
                {achievement.earned ? (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Earned
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Not yet earned</div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
