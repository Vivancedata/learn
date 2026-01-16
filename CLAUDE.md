# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eureka is an educational learning platform for AI and data science courses built with Next.js 15 (App Router), React 19, and TypeScript. It uses Prisma with SQLite for data persistence and Clerk for authentication (optional).

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Jest tests
npm run test:watch   # Jest watch mode
npm run db:seed      # Seed database (ts-node prisma/seed.ts)
npm run prisma:studio # Open Prisma Studio GUI
```

**Database commands:**
```bash
npx prisma migrate dev    # Create/apply migrations
npx prisma generate       # Regenerate Prisma client after schema changes
```

## Architecture

### Data Flow
- **API Routes** (`src/app/api/`) fetch data using Prisma client from `src/lib/db.ts`
- **Content utilities** (`src/lib/content.ts`) provide `getAllCourses()`, `getCourseById()`, `getAllPaths()`, `getPathById()`, `getLessonById()`
- **Custom hooks** (`src/lib/hooks/`) provide `useProgress()` for progress tracking
- **Type definitions** live in `src/types/` with interfaces for Course, Path, Lesson, etc.

### Key Patterns
- **Prisma singleton**: `src/lib/db.ts` exports a global Prisma client to prevent connection exhaustion in development
- **Conditional auth**: Clerk is used when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set, otherwise falls back to demo user
- **Path alias**: `@/*` maps to `./src/*`
- **UI components**: Shadcn/UI components in `src/components/ui/`, feature components in `src/components/`

### Database Schema (SQLite via Prisma)
Core models: User, Course, CourseSection, Lesson, Path, CourseProgress, PathProgress, QuizQuestion, QuizScore, ProjectSubmission, Discussion, DiscussionReply, Certificate, Achievement

Relationships:
- Path → Course → CourseSection → Lesson
- User tracks progress via CourseProgress and PathProgress
- Lessons can have QuizQuestions and ProjectSubmissions

### API Endpoints
**Content:**
- `GET /api/courses` - All courses with sections/lessons
- `GET /api/paths` - All learning paths
- `GET /api/lessons/[id]` - Single lesson by ID

**Progress:**
- `GET /api/progress/[courseId]` - Get user's course progress
- `POST /api/progress/[courseId]/lessons/[lessonId]` - Mark lesson complete
- `DELETE /api/progress/[courseId]/lessons/[lessonId]` - Mark lesson incomplete

**Submissions:**
- `GET/POST /api/submissions` - List/create project submissions
- `GET/PATCH/DELETE /api/submissions/[id]` - Manage submission

**Discussions:**
- `GET/POST /api/discussions` - List/create discussions
- `GET/PATCH/DELETE /api/discussions/[id]` - Manage discussion
- `POST /api/discussions/[id]/replies` - Add reply

**User:**
- `GET/PATCH /api/user/settings` - Get/update user profile

## Testing

Jest with React Testing Library. Test files go in `__tests__/` directories or use `.test.ts`/`.test.tsx` suffix. Mocks for NextRequest/NextResponse are configured in `jest.setup.js`.

Run a single test file:
```bash
npm test -- path/to/file.test.ts
```

## Authentication

Clerk is optional. Without Clerk keys, the app uses a demo user for all authenticated operations. To enable Clerk:
1. Copy `.env.example` to `.env.local`
2. Add your Clerk API keys
3. Restart the dev server

## Styling

Tailwind CSS with class-based dark mode. Theme variables use HSL format. The `@tailwindcss/typography` plugin is available for prose content.
