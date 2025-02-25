import { Path, Course } from "@/types/course"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressCircle } from "@/components/ui/progress-circle"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface PathCardProps {
  path: Path
  courses: Course[]
}

export function PathCard({ path, courses }: PathCardProps) {
  const pathCourses = courses.filter(course => course.pathId === path.id)
  const totalCourses = pathCourses.length
  const completedCourses = pathCourses.filter(
    course => 
      course.progress?.completed !== undefined && 
      course.progress?.total !== undefined &&
      course.progress.completed === course.progress.total
  ).length

  const progress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0
  const hasStarted = pathCourses.some(course => 
    course.progress?.completed !== undefined && 
    course.progress.completed > 0
  )

  return (
    <Card className="relative">
      <div className="absolute right-4 top-4">
        <ProgressCircle 
          progress={progress}
          size="md"
          showPercentage
        />
      </div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {path.icon && (
            <span className="text-2xl">{path.icon}</span>
          )}
          {path.title}
        </CardTitle>
        <CardDescription>{path.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {totalCourses} {totalCourses === 1 ? 'course' : 'courses'}
          </p>
          <div className="flex flex-wrap gap-2">
            {pathCourses.slice(0, 3).map(course => (
              <Badge key={course.id} variant="outline">
                {course.title}
              </Badge>
            ))}
            {pathCourses.length > 3 && (
              <Badge variant="outline">
                +{pathCourses.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="ml-auto" variant={hasStarted ? "default" : "outline"}>
          <Link href={`/paths/${path.id}`} className="flex items-center gap-2">
            {hasStarted ? "Continue Path" : "View Path"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
