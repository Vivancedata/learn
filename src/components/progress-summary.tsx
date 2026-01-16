import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressCircle } from "@/components/ui/progress-circle"
import Link from "next/link"
import { ArrowRight, Clock, Trophy, BookOpen, Sparkles, TrendingUp } from "lucide-react"
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

  const courseProgress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0
  const lessonProgress = totalLessons ? ((completedLessons || 0) / totalLessons) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Course Progress Card */}
      <Card className="relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Course Progress</CardTitle>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold tracking-tight">{completedCourses}/{totalCourses}</div>
            <ProgressCircle
              progress={courseProgress}
              size="sm"
              showPercentage
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {completedCourses === totalCourses && totalCourses > 0 ? (
              <span className="flex items-center gap-1 text-success">
                <Sparkles className="h-3 w-3" />
                All courses completed!
              </span>
            ) : (
              "Courses completed"
            )}
          </p>
        </CardContent>
      </Card>

      {/* Lesson Progress or Active Courses */}
      {totalLessons !== undefined && completedLessons !== undefined ? (
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lesson Progress</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold tracking-tight">{completedLessons}/{totalLessons}</div>
            </div>
            {/* Progress bar */}
            <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${lessonProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Lessons completed
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-warning/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold tracking-tight">{inProgressCourses}</div>
            <p className="text-sm text-muted-foreground">
              {inProgressCourses === 1 ? "Course in progress" : "Courses in progress"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Path Progress */}
      {paths && (
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Path Progress</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success/10">
              <Trophy className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold tracking-tight">{completedPaths}/{totalPaths}</div>
            <p className="text-sm text-muted-foreground">
              {completedPaths === totalPaths && totalPaths > 0 ? (
                <span className="flex items-center gap-1 text-success">
                  <Sparkles className="h-3 w-3" />
                  All paths mastered!
                </span>
              ) : (
                "Learning paths completed"
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Continue Learning */}
      {lastAccessedCourse && (
        <Card className="relative overflow-hidden group border-primary/20 hover:border-primary/40 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">Continue Learning</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent">
              <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <Link
              href={`/courses/${lastAccessedCourse.id}`}
              className="text-base font-semibold hover:text-primary transition-colors line-clamp-1"
            >
              {lastAccessedCourse.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              Last accessed {new Date(lastAccessedCourse.progress?.lastAccessed || '').toLocaleDateString()}
            </p>
            {lastAccessedCourse.progress && (
              <div className="pt-2">
                <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                    style={{
                      width: `${lastAccessedCourse.progress.total > 0
                        ? (lastAccessedCourse.progress.completed / lastAccessedCourse.progress.total) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
