import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressCircle } from "@/components/ui/progress-circle"
import Link from "next/link"
import { ArrowRight, Clock, Trophy, BookOpen } from "lucide-react"
import { ProgressSummaryProps } from "@/types/progress"

export function ProgressSummary({ 
  courses, 
  paths,
  totalCourses: propsTotalCourses,
  completedCourses: propsCompletedCourses,
  totalLessons,
  completedLessons
}: ProgressSummaryProps) {
  // If courses are provided, calculate stats from them
  const totalCourses = propsTotalCourses !== undefined ? propsTotalCourses : courses?.length || 0
  const completedCourses = propsCompletedCourses !== undefined ? propsCompletedCourses : 
    courses?.filter(
      course => 
        course.progress?.completed !== undefined && 
        course.progress?.total !== undefined &&
        course.progress.completed === course.progress.total
    ).length || 0

  const inProgressCourses = courses?.filter(
    course => 
      course.progress?.completed !== undefined && 
      course.progress?.total !== undefined &&
      course.progress.completed > 0 &&
      course.progress.completed < course.progress.total
  ).length || 0

  const totalPaths = paths?.length || 0
  const completedPaths = paths && courses ? paths.filter(path => {
    const pathCourses = courses.filter(course => course.pathId === path.id)
    return pathCourses.every(course => 
      course.progress?.completed === course.progress?.total
    )
  }).length : 0

  const lastAccessedCourse = courses ? [...courses]
    .filter(course => course.progress?.lastAccessed)
    .sort((a, b) => {
      const dateA = a.progress?.lastAccessed ? new Date(a.progress.lastAccessed) : new Date(0)
      const dateB = b.progress?.lastAccessed ? new Date(b.progress.lastAccessed) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })[0] : undefined

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Course Progress</CardTitle>
          <ProgressCircle 
            progress={totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0}
            size="sm"
            showPercentage
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedCourses}/{totalCourses}</div>
          <p className="text-xs text-muted-foreground">
            Courses completed
          </p>
        </CardContent>
      </Card>

      {totalLessons !== undefined && completedLessons !== undefined ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lesson Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}/{totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              Lessons completed
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCourses}</div>
            <p className="text-xs text-muted-foreground">
              Courses in progress
            </p>
          </CardContent>
        </Card>
      )}

      {paths && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Path Progress</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPaths}/{totalPaths}</div>
            <p className="text-xs text-muted-foreground">
              Learning paths completed
            </p>
          </CardContent>
        </Card>
      )}

      {lastAccessedCourse && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Continue Learning</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link 
              href={`/courses/${lastAccessedCourse.id}`}
              className="text-sm font-medium hover:underline"
            >
              {lastAccessedCourse.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              Last accessed {new Date(lastAccessedCourse.progress?.lastAccessed || '').toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
