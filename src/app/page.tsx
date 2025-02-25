import { Course } from "@/types/course"
import { CourseList } from "@/components/course-list"

const sampleCourses: Course[] = [
  {
    id: "web-dev-101",
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript.",
    difficulty: "Beginner",
    durationHours: 20,
    pathId: "web-dev",
    sections: [
      {
        id: "getting-started",
        title: "Getting Started",
        order: 1,
        lessons: [
          {
            id: "intro",
            title: "Introduction to Web Development",
            content: "# Introduction to Web Development",
            type: "lesson"
          }
        ]
      }
    ]
  },
  {
    id: "react-basics",
    title: "React Fundamentals",
    description: "Master the basics of React including components, props, state, and hooks.",
    difficulty: "Intermediate",
    durationHours: 15,
    pathId: "web-dev",
    sections: [
      {
        id: "react-intro",
        title: "Introduction to React",
        order: 1,
        lessons: [
          {
            id: "react-overview",
            title: "React Overview",
            content: "# React Overview",
            type: "lesson"
          }
        ]
      }
    ]
  },
  {
    id: "typescript-advanced",
    title: "Advanced TypeScript",
    description: "Deep dive into TypeScript&apos;s advanced features and design patterns.",
    difficulty: "Advanced",
    durationHours: 12,
    pathId: "advanced-programming",
    sections: [
      {
        id: "ts-advanced",
        title: "Advanced TypeScript Features",
        order: 1,
        lessons: [
          {
            id: "ts-types",
            title: "Advanced Types",
            content: "# Advanced Types in TypeScript",
            type: "lesson"
          }
        ]
      }
    ]
  },
  {
    id: "ui-ux-design",
    title: "UI/UX Design Principles",
    description: "Learn the core principles of user interface and user experience design.",
    difficulty: "Beginner",
    durationHours: 10,
    pathId: "design",
    sections: [
      {
        id: "design-basics",
        title: "Design Basics",
        order: 1,
        lessons: [
          {
            id: "design-principles",
            title: "Design Principles",
            content: "# Design Principles",
            type: "lesson"
          }
        ]
      }
    ]
  },
  {
    id: "node-backend",
    title: "Node.js Backend Development",
    description: "Build scalable backend applications with Node.js and Express.",
    difficulty: "Intermediate",
    durationHours: 18,
    pathId: "web-dev",
    sections: [
      {
        id: "node-intro",
        title: "Introduction to Node.js",
        order: 1,
        lessons: [
          {
            id: "node-basics",
            title: "Node.js Basics",
            content: "# Node.js Basics",
            type: "lesson"
          }
        ]
      }
    ]
  },
  {
    id: "cloud-arch",
    title: "Cloud Architecture",
    description: "Master cloud computing concepts and architecture design patterns.",
    difficulty: "Advanced",
    durationHours: 25,
    pathId: "advanced-programming",
    sections: [
      {
        id: "cloud-intro",
        title: "Introduction to Cloud Computing",
        order: 1,
        lessons: [
          {
            id: "cloud-concepts",
            title: "Cloud Computing Concepts",
            content: "# Cloud Computing Concepts",
            type: "lesson"
          }
        ]
      }
    ]
  }
]

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Eureka</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover your next learning adventure
        </p>
      </div>
      <CourseList courses={sampleCourses} />
    </div>
  )
}
