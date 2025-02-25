import { Course } from "@/types/course"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressCircle } from "@/components/ui/progress-circle"
import Link from "next/link"

interface CourseListProps {
  courses: Course[]
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
                variant={
                  course.difficulty === "Beginner" ? "default" :
                  course.difficulty === "Intermediate" ? "secondary" : "destructive"
                }
              >
                {course.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {course.durationHours} hours
              </span>
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
