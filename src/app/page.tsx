import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Sparkles,
  Rocket,
  Trophy,
  Users,
  ArrowRight,
  Zap,
  Brain,
  Code2,
  Bot
} from "lucide-react"
import { getAllCourses, getAllPaths } from "@/lib/content"

export default async function Home() {
  const [courses, paths] = await Promise.all([
    getAllCourses(),
    getAllPaths()
  ])

  const stats = [
    { label: "Courses", value: courses.length.toString(), icon: BookOpen },
    { label: "Learning Paths", value: paths.length.toString(), icon: Rocket },
    { label: "Lessons", value: courses.reduce((acc, c) => acc + c.sections.reduce((s, sec) => s + sec.lessons.length, 0), 0).toString(), icon: Trophy },
    { label: "Active Learners", value: "1.2k+", icon: Users },
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
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : course.difficulty === 'Intermediate'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
                Join thousands of learners who are building the skills of tomorrow.
                Start with any course and learn at your own pace.
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
