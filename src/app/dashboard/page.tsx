"use client"

import Link from "next/link"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { ProgressSummary } from "@/components/progress-summary"
import { HelperBadge } from "@/components/helper-badge"
import { StreakPanel } from "@/components/streak-panel"
import { XpLevelDisplay } from "@/components/xp-level-display"
import { RecommendationsSection } from "@/components/recommendations-section"
import { ArrowRight, BookOpen, Award, Calendar, Clock, CheckCircle2, Heart, Users, Target, FileQuestion, Trophy, Globe, File, AppWindow } from "lucide-react"
import { CourseCatalogEntry, Path } from "@/types/course"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"

interface CourseProgressData {
  courseId: string
  courseTitle: string
  totalLessons: number
  completedLessons: number
  progress: number
  lastAccessed: string
}

interface UserProgress {
  userId: string
  courses: CourseProgressData[]
  overallStats: {
    totalCourses: number
    coursesStarted: number
    coursesCompleted: number
    totalLessons: number
    completedLessons: number
    overallProgress: number
  }
}

interface UserPointsData {
  user: {
    id: string
    name: string | null
    totalPoints: number
    pointsGiven: number
    badge: {
      level: string
      name: string
      minPoints: number
    } | null
  }
}

// Static icon elements, hoisted so they are not recreated on every render.
const ACHIEVEMENT_ICONS = {
  "first-lesson": <BookOpen className="h-8 w-8 text-brand" />,
  "first-course": <Award className="h-8 w-8 text-brand" />,
  "streak-7": <Calendar className="h-8 w-8 text-brand" />,
  "hours-10": <Clock className="h-8 w-8 text-brand" />,
}

const PATH_ICONS: Record<string, React.ReactNode> = {
  globe: <Globe className="h-6 w-6" aria-hidden="true" />,
  file: <File className="h-6 w-6" aria-hidden="true" />,
  window: <AppWindow className="h-6 w-6" aria-hidden="true" />,
}

function useDashboardContentView() {
  const { user } = useAuth()
  const { data, isLoading, error, mutate } = useSWR(
    user ? ['dashboard-data', user.id] as const : null,
    async ([, userId]) => {
      const [coursesResult, pathsResult, progressResult, pointsResult] = await Promise.allSettled([
        fetch('/api/courses').then(async (res) => {
          if (!res.ok) throw new Error('Failed to load courses')
          const payload = await res.json()
          return (payload.data || []) as CourseCatalogEntry[]
        }),
        fetch('/api/paths').then(async (res) => {
          if (!res.ok) throw new Error('Failed to load paths')
          const payload = await res.json()
          return (payload.data || []) as Path[]
        }),
        fetch(`/api/progress/user/${userId}`, {
          credentials: 'include',
        }).then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch progress')
          return ((await res.json()).data) as UserProgress
        }),
        fetch(`/api/points/user/${userId}`, {
          credentials: 'include',
        }).then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch points')
          const payload = await res.json()
          return payload.data as UserPointsData
        }),
      ])

      const loadErrors: string[] = []
      const baseCourses = coursesResult.status === 'fulfilled' ? coursesResult.value : []
      const paths = pathsResult.status === 'fulfilled' ? pathsResult.value : []
      const userProgress = progressResult.status === 'fulfilled' ? progressResult.value : null
      const userPoints = pointsResult.status === 'fulfilled' ? pointsResult.value : null

      if (coursesResult.status === 'rejected') loadErrors.push('Failed to load courses')
      if (pathsResult.status === 'rejected') loadErrors.push('Failed to load paths')

      const progressByCourseId = new Map(
        (userProgress?.courses ?? []).map((p: CourseProgressData) => [p.courseId, p])
      )
      const courses = userProgress
        ? baseCourses.map((course) => {
            const progressData = progressByCourseId.get(course.id)

            if (!progressData) return course

            return {
              ...course,
              progress: {
                completed: progressData.completedLessons,
                total: progressData.totalLessons,
                lastAccessed: progressData.lastAccessed,
              },
            }
          })
        : baseCourses

      return { courses, paths, userProgress, userPoints, loadErrors }
    }
  )

  const courses = data?.courses || []
  const paths = data?.paths || []
  const userProgress = data?.userProgress || null
  const userPoints = data?.userPoints || null
  const loadErrors = data?.loadErrors ?? []
  const displayError =
    error instanceof Error
      ? error.message
      : loadErrors.length > 0 && courses.length === 0 && paths.length === 0
        ? loadErrors.join('; ')
        : null

  // The error check has to come first: when the fetcher throws, SWR clears
  // `isLoading` but never fills `data`, so a loading return placed above this
  // would spin forever instead of ever reaching the retry card.
  if (displayError && courses.length === 0 && paths.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <h1 className="text-heading-3 font-semibold">We could not load your dashboard</h1>
          <p className="mt-2 text-body-sm text-muted-foreground">
            Your courses and progress did not come back this time. Nothing has been
            lost — it is the loading that failed, not your work.
          </p>
          <Button className="mt-6" onClick={() => void mutate()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand" aria-hidden="true"></div>
        <span className="sr-only">Loading dashboard…</span>
      </div>
    )
  }

  // Get in-progress courses (courses with progress data)
  const inProgressCourses = courses.filter(course => course.progress)

  // Calculate overall progress from real API data
  const totalLessons = userProgress?.overallStats.totalLessons || 0
  const completedLessons = userProgress?.overallStats.completedLessons || 0
  const overallProgress = userProgress?.overallStats.overallProgress || 0

  // Get recently accessed courses
  const recentCourses = [...inProgressCourses]
    .sort((a, b) => {
      const dateA = a.progress?.lastAccessed ? new Date(a.progress.lastAccessed).getTime() : 0
      const dateB = b.progress?.lastAccessed ? new Date(b.progress.lastAccessed).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 3)

  const starterCourse = courses.find(course =>
    course.sections.some(section => section.lessons.length > 0)
  )
  const starterSection = starterCourse?.sections.find(section => section.lessons.length > 0)
  const starterLesson = starterSection?.lessons[0]
  const starterLessonHref = starterCourse && starterLesson
    ? `/courses/${starterCourse.id}/${starterLesson.id}`
    : '/courses'
  const showGettingStarted = (userProgress?.overallStats.coursesStarted || 0) === 0 && completedLessons === 0

  // Get achievements
  const achievements = [
    {
      id: "first-lesson",
      title: "First Steps",
      description: "Completed your first lesson",
      icon: ACHIEVEMENT_ICONS["first-lesson"],
      earned: completedLessons > 0
    },
    {
      id: "first-course",
      title: "Course Graduate",
      description: "Completed your first course",
      icon: ACHIEVEMENT_ICONS["first-course"],
      earned: inProgressCourses.some(course =>
        course.progress?.completed === course.progress?.total
      )
    },
    {
      id: "streak-7",
      title: "Consistency Champion",
      description: "Studied for 7 days in a row",
      icon: ACHIEVEMENT_ICONS["streak-7"],
      earned: false
    },
    {
      id: "hours-10",
      title: "Dedicated Learner",
      description: "Spent 10+ hours learning",
      icon: ACHIEVEMENT_ICONS["hours-10"],
      earned: completedLessons >= 10
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header with welcome and progress */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div>
          <h1 className="text-heading-1 font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
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

      {/* Engagement Stats Row - Streak and XP */}
      {user && (
        <div className="grid gap-6 md:grid-cols-2">
          <StreakPanel userId={user.id} compact />
          <XpLevelDisplay userId={user.id} variant="compact" />
        </div>
      )}

      {/* AI-Powered Recommendations Section */}
      {user && (
        <RecommendationsSection
          userId={user.id}
          title="Recommended For You"
          description="Personalized course suggestions based on your learning journey"
          maxItems={3}
          variant="grid"
          emptyVariant="compact"
        />
      )}

      {showGettingStarted && (
        <Card className="border-brand/30 bg-gradient-to-br from-primary/10 via-background to-secondary/20">
          <CardHeader>
            <CardTitle>Start Here: Your First 30 Minutes</CardTitle>
            <CardDescription>
              Follow this quick sequence to build momentum on day one.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-body-sm">
              1. Open your first guided lesson
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-body-sm">
              2. Complete one knowledge check
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-body-sm">
              3. Take a baseline skill assessment
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="w-full sm:w-auto">
              <Link href={starterLessonHref}>
                Start First Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/assessments">
                Take Baseline Assessment
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Test Your Skills Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-2 font-semibold flex items-center gap-2">
              <Target className="h-6 w-6 text-brand" />
              Test Your Skills
            </h2>
            <p className="text-muted-foreground">
              Take assessments to measure your knowledge and earn skill badges
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/assessments">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group hover:border-brand/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileQuestion className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <CardTitle className="text-body">Skill Assessments</CardTitle>
                  <CardDescription>Test your knowledge</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-body-sm text-muted-foreground">
              Take timed assessments to validate your skills and earn badges for Python, SQL, Data Science, and more.
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/assessments">
                  Browse Assessments
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="group hover:border-success/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div>
                  <CardTitle className="text-body">Earn Skill Badges</CardTitle>
                  <CardDescription>Prove your expertise</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-body-sm text-muted-foreground">
              Score above the passing threshold to earn skill badges that showcase your proficiency level.
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/assessments">
                  Start Earning
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="group hover:border-accent/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Award className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-body">Track Progress</CardTitle>
                  <CardDescription>Improve over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-body-sm text-muted-foreground">
              Review your attempt history, see your best scores, and retake assessments to improve your rankings.
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/assessments">
                  View History
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Main Dashboard Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Your learning journey so far</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressSummary
              totalCourses={userProgress?.overallStats.totalCourses || courses.length}
              completedCourses={userProgress?.overallStats.coursesCompleted || 0}
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
                    <div className="flex items-center text-body-sm text-muted-foreground">
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

        {/* Community Points Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Community Points
            </CardTitle>
            <CardDescription>
              Points earned by helping others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-display font-bold text-brand">
                  {userPoints?.user.totalPoints || 0}
                </div>
                <p className="text-body-sm text-muted-foreground">points received</p>
              </div>
              {userPoints?.user.badge && (
                <div className="flex justify-center">
                  <HelperBadge
                    points={userPoints.user.totalPoints}
                    showPoints={false}
                  />
                </div>
              )}
              <div className="text-center text-body-sm text-muted-foreground">
                You have given {userPoints?.user.pointsGiven || 0} points to others
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-caption text-muted-foreground">
            Help others in discussions to earn points
          </CardFooter>
        </Card>
      </div>

      {/* Learning Paths Section */}
      <div className="space-y-6">
        <h2 className="text-heading-2 font-semibold">Your Learning Paths</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paths.slice(0, 3).map(path => {
            // Get courses for this path
            const pathCourseIds = new Set(path.courses)
            const pathCourses = courses.filter(course => pathCourseIds.has(course.id))
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
                    {path.icon && PATH_ICONS[path.icon]}
                    {path.title}
                  </CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-body-sm text-muted-foreground">
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

      {/* Community Helper Section */}
      <div className="space-y-6">
        <h2 className="text-heading-2 font-semibold">Community Contributions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-info" />
                Helper Badges
              </CardTitle>
              <CardDescription>
                Recognition for community contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`p-3 rounded-lg border ${(userPoints?.user.totalPoints || 0) >= 10 ? 'bg-info/10 border-info/20' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <HelperBadge points={10} showPoints={false} />
                  <div>
                    <div className="text-body-sm font-medium">Community Helper</div>
                    <div className="text-caption text-muted-foreground">Earn 10+ points</div>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${(userPoints?.user.totalPoints || 0) >= 40 ? 'bg-warning/10 border-warning/20' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <HelperBadge points={40} showPoints={false} />
                  <div>
                    <div className="text-body-sm font-medium">Super Helper</div>
                    <div className="text-caption text-muted-foreground">Earn 40+ points</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Earn points by helping the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-body-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Answer questions in course discussions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Share helpful tips and resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>When others find your help valuable, they give you a point</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Earn badges as you help more people</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                Top community helpers this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-body-sm text-muted-foreground text-center py-4">
                  Start helping others to appear on the leaderboard!
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/community">
                    Join Discussions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="space-y-6">
        <h2 className="text-heading-2 font-semibold">Your Achievements</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {achievements.map(achievement => (
            <Card key={achievement.id} className={achievement.earned ? "" : "opacity-50"}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                {achievement.icon}
                <div>
                  <CardTitle className="text-body-lg">{achievement.title}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter>
                {achievement.earned ? (
                  <div className="flex items-center text-body-sm text-success">
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Earned
                  </div>
                ) : (
                  <div className="text-body-sm text-muted-foreground">Not yet earned</div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  return useDashboardContentView()
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
