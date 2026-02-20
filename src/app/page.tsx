import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Sparkles,
  Rocket,
  Trophy,
  ArrowRight,
  Zap,
  Brain,
  Code2,
  Bot,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  TrendingUp
} from "lucide-react"
import { getAllCourses, getAllPaths } from "@/lib/content"

export const dynamic = 'force-dynamic'

export default async function Home() {
  let courses: Awaited<ReturnType<typeof getAllCourses>> = []
  let paths: Awaited<ReturnType<typeof getAllPaths>> = []

  try {
    ;[courses, paths] = await Promise.all([
      getAllCourses(),
      getAllPaths(),
    ])
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Home] Failed to load catalog data:', error)
    }
  }

  const totalLessons = courses.reduce(
    (acc, course) => acc + course.sections.reduce((sum, section) => sum + section.lessons.length, 0),
    0
  )
  const totalHours = courses.reduce((acc, course) => acc + course.durationHours, 0)
  const coursesWithLessons = courses.filter(course =>
    course.sections.some(section => section.lessons.length > 0)
  ).length
  const averageLessonsPerCourse = courses.length > 0 ? (totalLessons / courses.length).toFixed(1) : '0'

  const stats = [
    { label: "Courses", value: courses.length.toString(), icon: BookOpen },
    { label: "Learning Paths", value: paths.length.toString(), icon: Rocket },
    { label: "Lessons", value: totalLessons.toString(), icon: Trophy },
    { label: "Curriculum Hours", value: `${totalHours}h`, icon: Clock3 },
  ]

  const featuredCourses = courses.slice(0, 3)

  const features = [
    {
      icon: Zap,
      title: "Learn at Your Pace",
      description: "Self-paced courses designed for busy professionals and enthusiastic learners alike."
    },
    {
      icon: Brain,
      title: "AI-Powered Content",
      description: "Stay ahead with courses on the latest AI technologies and development practices."
    },
    {
      icon: Code2,
      title: "Hands-on Projects",
      description: "Build real-world projects and add them to your portfolio as you learn."
    },
    {
      icon: Bot,
      title: "Interactive Learning",
      description: "Quizzes, discussions, and community support to reinforce your knowledge."
    }
  ]

  const momentumSteps = [
    {
      icon: Rocket,
      title: 'Pick Your Mission',
      description: 'Start from a curated path, not a random playlist.',
    },
    {
      icon: Clock3,
      title: 'Build Daily Cadence',
      description: 'Short focused lessons keep consistency realistic.',
    },
    {
      icon: MessageSquareText,
      title: 'Get Feedback Fast',
      description: 'Assessments and discussions expose gaps quickly.',
    },
    {
      icon: CheckCircle2,
      title: 'Ship Real Skills',
      description: 'Track progress, complete projects, and level up.',
    },
  ]

  const momentumSignals = [
    { label: 'Courses with lesson plans', value: `${coursesWithLessons}/${courses.length}` },
    { label: 'Average lessons per course', value: averageLessonsPerCourse },
    { label: 'Total guided hours', value: `${totalHours}h` },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container relative px-4 py-24 md:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in-down">
              <Sparkles className="h-4 w-4" />
              <span>New: AI Agents Development Course</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
              Master{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-shift">
                AI & Tech Skills
              </span>
              <br />
              for the Future
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 animate-fade-in-up [animation-delay:100ms]">
              Discover cutting-edge courses on AI, automation, and modern development.
              Learn from practical, hands-on content designed for real-world impact.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up [animation-delay:200ms]">
              <Button variant="gradient" size="xl" asChild>
                <Link href="/courses" className="gap-2">
                  Explore Courses
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/paths">
                  View Learning Paths
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose{" "}
              <span className="text-gradient">Eureka</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform is designed to help you succeed with practical, project-based learning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="group border-0 bg-gradient-to-b from-muted/50 to-transparent animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Momentum Section */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container px-4">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-stretch">
            <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="inline-flex items-center gap-2 w-fit rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Learning Momentum Engine
                </div>
                <CardTitle className="text-2xl md:text-3xl mt-3">
                  A Structured Loop That Keeps Learners Moving
                </CardTitle>
                <CardDescription className="text-base">
                  Eureka blends guided direction, bite-sized execution, and immediate feedback to turn effort into measurable progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {momentumSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="relative flex gap-4 rounded-2xl border border-border/50 bg-background/60 p-4 animate-fade-in-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-5">
              {momentumSignals.map((signal, index) => (
                <Card
                  key={signal.label}
                  className="border-border/60 bg-gradient-to-br from-background to-muted/60 animate-fade-in-up"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{signal.label}</p>
                    <p className="text-3xl md:text-4xl font-bold mt-1">{signal.value}</p>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-accent/20 to-background">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-primary mb-2">Ready for your next milestone?</p>
                  <p className="text-sm text-muted-foreground mb-5">
                    Move from course completion to real-world confidence with project-driven progression.
                  </p>
                  <Button variant="gradient" asChild className="w-full">
                    <Link href="/paths" className="gap-2">
                      Start a Learning Path
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Featured Courses
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl">
                Start learning with our most popular courses designed by experts.
              </p>
            </div>
            <Button variant="outline" asChild className="mt-6 md:mt-0">
              <Link href="/courses" className="gap-2">
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course, index) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full overflow-hidden">
                  {/* Course image placeholder with gradient */}
                  <div className="h-40 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-primary/50 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        course.difficulty === 'Beginner'
                          ? 'bg-success/10 text-success'
                          : course.difficulty === 'Intermediate'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {course.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {course.durationHours}h
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                    <div className="mt-4 flex items-center text-sm text-primary font-medium">
                      Start Learning
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-8 md:p-16 text-center">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Build practical AI and data skills with structured paths, hands-on lessons,
                and assessments you can apply immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" variant="secondary" asChild className="bg-white text-primary hover:bg-white/90">
                  <Link href="/courses" className="gap-2">
                    Browse All Courses
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
                  <Link href="/paths">
                    Explore Learning Paths
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
