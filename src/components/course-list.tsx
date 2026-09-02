import { CourseCardData } from "@/types/course"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { courseDurationLabel } from "@/lib/course-duration"
import { DIFFICULTY_BADGE_CLASSES } from "@/lib/difficulty"
import Link from "next/link"

interface CourseListProps {
  courses: CourseCardData[]
}

export function CourseList({ courses }: CourseListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="relative">
          {course.progress && (
            <div className="absolute right-4 top-4">
              <ProgressCircle 
                progress={(course.progress.completed / course.progress.total) * 100}
                size="sm"
                showPercentage
              />
            </div>
          )}
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription>{course.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={DIFFICULTY_BADGE_CLASSES[course.difficulty]}
              >
                {course.difficulty}
              </Badge>
              {courseDurationLabel(course) && (
                <span className="text-sm text-muted-foreground">
                  {courseDurationLabel(course)}
                </span>
              )}
              {typeof course.lessonCount === "number" && course.lessonCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
                </span>
              )}
            </div>
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Prerequisites:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {course.prerequisites.map((prereqId) => (
                    <Badge key={prereqId} variant="outline">
                      {courses.find(c => c.id === prereqId)?.title || prereqId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            {course.progress?.lastAccessed && (
              <span className="text-xs text-muted-foreground">
                Last accessed: {new Date(course.progress.lastAccessed).toLocaleDateString()}
              </span>
            )}
            <Button asChild className="ml-auto">
              <Link href={`/courses/${course.id}`}>
                {course.progress ? "Continue Learning" : "Start Learning"}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

/**
 * Placeholder cards shown while the catalog loads. Mirrors the real card's
 * geometry so the grid does not jump when the data lands.
 */
export function CourseListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading courses"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="space-y-3">
            <div className="h-5 w-3/5 rounded-md bg-muted" />
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3.5 w-4/5 rounded bg-muted" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-3.5 w-16 rounded bg-muted" />
              <div className="h-3.5 w-20 rounded bg-muted" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="ml-auto h-10 w-32 rounded-md bg-muted" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
