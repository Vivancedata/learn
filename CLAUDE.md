# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VivanceData Learning Platform - A production-ready Next.js educational platform for AI and data science courses with structured learning paths, interactive content, and community features.

**Tech Stack:**
- Next.js 16+ (App Router with Turbopack)
- React 19 + TypeScript
- Prisma ORM with SQLite (dev) / PostgreSQL (production)
- Custom JWT authentication (jose + bcryptjs)
- Tailwind CSS + shadcn/ui components
- Zod validation on all API endpoints
- Jest + React Testing Library

## Development Commands

**Setup:**
```bash
npm install                    # Install dependencies
npx prisma migrate dev         # Run database migrations
npm run db:seed               # Seed database with sample data
```

**Development:**
```bash
npm run dev                   # Start dev server with Turbopack (http://localhost:3000)
npm run build                 # Production build
npm start                     # Start production server
npm run lint                  # Run ESLint
```

**Testing:**
```bash
npm test                      # Run all tests with Jest
npm run test:watch            # Run tests in watch mode
npm test -- path/to/test      # Run specific test file
```

**Database:**
```bash
npm run prisma:studio         # Open Prisma Studio GUI
npx prisma migrate dev        # Create and apply new migration
npx prisma generate           # Regenerate Prisma Client
npx prisma migrate deploy     # Apply migrations (production)
```

## Critical Architecture Patterns

### 1. Two-Layer Security Model

**Layer 1: Middleware Authentication** (`src/middleware.ts`)
- All `/api/*` routes (except `/api/auth/*`) require JWT authentication
- JWT validated from HTTP-only cookie OR `Authorization: Bearer <token>` header
- User info extracted and injected into request headers: `x-user-id`, `x-user-email`, `x-user-name`
- Rate limiting enforced: 5 req/15min for auth endpoints, 100 req/15min for API

**Layer 2: Route Authorization** (`src/lib/authorization.ts`)
- Individual routes use `requireOwnership(request, userId, resourceName)`
- Verifies authenticated user (from header) matches resource owner (from request body)
- Throws `UnauthorizedError` if mismatch

**CRITICAL**: When adding new API routes that accept `userId` in request body, you MUST add authorization:

```typescript
import { requireOwnership } from '@/lib/authorization'
import { parseRequestBody } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  const body = await parseRequestBody(request, mySchema)

  // REQUIRED: Verify user owns this resource
  requireOwnership(request, body.userId, 'quiz submission')

  // ... business logic
}
```

**Protected endpoints requiring authorization:**
- `/api/progress/lessons` - User progress tracking
- `/api/projects` - Project submissions
- `/api/quiz/submit` - Quiz submissions
- `/api/discussions` - Creating discussions
- `/api/discussions/[id]/replies` - Creating replies

### 2. Standardized API Pattern

**All API routes** follow this exact structure using `src/lib/api-errors.ts`:

```typescript
import { apiSuccess, handleApiError, parseRequestBody, NotFoundError, HTTP_STATUS } from '@/lib/api-errors'
import { mySchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate request body with Zod
    const body = await parseRequestBody(request, mySchema)

    // 2. Authorization check (if userId in body)
    requireOwnership(request, body.userId, 'resource-name')

    // 3. Business logic
    const result = await prisma.model.create({ data: body })

    // 4. Return standardized success
    return apiSuccess(result, HTTP_STATUS.CREATED)
  } catch (error) {
    // 5. Centralized error handling
    return handleApiError(error)
  }
}
```

**Response formats** (auto-handled by helpers):
- Success: `{ data: {...}, timestamp: "2025-..." }`
- Error: `{ error: "Not Found", message: "...", details: {...}, timestamp: "2025-..." }`

**Available error classes:**
- `NotFoundError(resourceName)` → 404
- `ValidationError(message, details)` → 400
- `UnauthorizedError(message)` → 401
- `ForbiddenError(message)` → 403
- `ApiError(statusCode, message, details)` → custom

### 3. Type Adapter Pattern (Critical for SQLite)

**Problem**: SQLite stores JSON arrays as strings. Prisma types don't match application types.

**Solution**: Type adapters in `src/lib/type-adapters.ts` safely convert Prisma → domain types:

```typescript
// BAD: Direct Prisma usage exposes string fields
const course = await prisma.course.findUnique({ where: { id } })
// course.prerequisites is string, not string[]

// GOOD: Use type adapters
const prismaCourse = await prisma.course.findUnique({
  where: { id },
  include: { sections: { include: { lessons: true }}, path: true }
})
const course = adaptCourse(prismaCourse)
// course.prerequisites is safely parsed string[]
```

**Available adapters:**
- `adaptCourse(prismaData)` - Single course
- `adaptCourses(prismaData[])` - Course array
- `adaptPath(prismaData)` - Single path
- `adaptPaths(prismaData[])` - Path array
- `adaptLesson(prismaData)` - Single lesson
- `adaptLessonWithQuiz(prismaData)` - Lesson + quiz questions
- `adaptCourseSection(prismaData)` - Course section

**Fields requiring adapters** (JSON stored as strings):
- `Course.prerequisites`, `Course.learningOutcomes`
- `Path.prerequisites`
- `QuizQuestion.options`
- `Certificate.skills`

**Always use `safeJsonParse()`** when creating new adapters - it returns default value on parse errors.

### 4. Next.js 16+ Dynamic Routes

**BREAKING CHANGE**: Next.js 16 made `params` async (Promise wrapper).

**Correct pattern** for routes like `[id]`:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Promise wrapper
) {
  const { id } = await params  // MUST await
  // ... use id
}
```

**Affected files** (already fixed):
- `src/app/api/lessons/[id]/route.ts`
- `src/app/api/projects/[id]/review/route.ts`
- `src/app/api/discussions/[id]/replies/route.ts`

## Database Architecture

### Core Models & Relationships

```
Path (1) → (M) Course (1) → (M) CourseSection (1) → (M) Lesson
                                                       ↓
                                                   QuizQuestion (M)

User (M) ←→ (M) CourseProgress ←→ (M) Lesson (completed lessons)
     ↓                ↓
     CourseProgress → QuizScore (quiz attempt history)

User (1) → (M) ProjectSubmission ← (1) Lesson
User (1) → (M) Discussion → (M) DiscussionReply
User (1) → (M) Certificate ← (1) Course
User (M) ←→ (M) Achievement (through UserAchievement)
```

### Enums (Prisma)

```prisma
enum CourseDifficulty { Beginner, Intermediate, Advanced }
enum LessonType { lesson, project, quiz }
enum ProjectStatus { pending, approved, rejected }
```

### Important Schema Notes

1. **JSON Fields**: Store arrays as strings in SQLite
   - Always use type adapters to access
   - Never `JSON.parse()` manually - use `safeJsonParse()`

2. **Progress Tracking**: `CourseProgress` has many-to-many with `Lesson` via `completedLessons`
   ```typescript
   // Mark lesson complete
   await prisma.courseProgress.update({
     where: { id: progressId },
     data: {
       completedLessons: { connect: { id: lessonId } }
     }
   })
   ```

3. **Indexes**: All foreign keys have indexes for query performance

4. **UUIDs**: All IDs are UUIDs except Course/Path which use slug IDs

### Schema Changes Workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_my_feature

# 3. Regenerate client
npx prisma generate

# 4. Update seed.ts if needed
# 5. Re-seed
npm run db:seed
```

## Validation Layer (Zod)

All user input validated by schemas in `src/lib/validations.ts`:

**Auth schemas:**
- `signUpSchema` - Email, password (min 8 chars, uppercase, lowercase, number), name, githubUsername
- `signInSchema` - Email, password

**Course schemas:**
- `courseIdSchema`, `lessonIdSchema`, `courseAndLessonSchema`

**Progress schemas:**
- `markLessonCompleteSchema` - userId (UUID), courseId, lessonId (UUID)
- `submitQuizSchema` - userId, courseId, lessonId, answers (number[])

**Project schemas:**
- `projectSubmissionSchema` - userId, lessonId, githubUrl (validated regex), liveUrl?, notes?
- `reviewProjectSchema` - submissionId, status (enum), feedback (10-2000 chars), reviewedBy

**Discussion schemas:**
- `createDiscussionSchema` - userId, content (10-5000 chars), courseId OR lessonId required
- `createReplySchema` - userId, discussionId, content (1-2000 chars)

**Pagination:**
- `paginationSchema` - page (default 1), limit (1-100, default 10)

**Helper functions:**
- `validate(schema, data)` - Returns `{ success: true, data }` or `{ success: false, errors }`
- `formatZodErrors(zodError)` - Converts to `{ fieldName: "error message" }`

## Security Requirements

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Hashed with bcryptjs, 10 salt rounds

### JWT Configuration
- Algorithm: HS256
- Secret: `JWT_SECRET` environment variable
- Expiration: 7 days
- Storage: HTTP-only cookie (secure in production, SameSite=Lax)

### Rate Limiting
- Auth endpoints: **5 requests / 15 minutes per IP**
- API endpoints: **100 requests / 15 minutes per IP**
- Returns 429 with `Retry-After` header
- Includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

### Security Headers (all responses)
- Content-Security-Policy (CSP) - configured in `next.config.ts`
- Strict-Transport-Security (HSTS) - 1 year, includeSubDomains, preload
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### CORS
- Configured in `src/lib/cors.ts`
- Allowed origins from `ALLOWED_ORIGINS` env var (comma-separated)
- Preflight request handling for OPTIONS

## Environment Variables

**Required** (see `.env.example`):
```bash
DATABASE_URL="file:./prisma/dev.db"           # SQLite for dev, PostgreSQL for prod
JWT_SECRET="change-to-secure-random-string"   # Generate: openssl rand -base64 32
ALLOWED_ORIGINS="http://localhost:3000,..."   # Comma-separated
NODE_ENV="development"                         # development | production
```

**Optional**:
```bash
TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_USER_EMAIL, TEST_USER_PASSWORD  # For seeding
MAX_REQUESTS_PER_MINUTE, NEXT_PUBLIC_APP_URL
```

## Content Management

Course content comes from **two sources**:

1. **Database (Primary)**: Structure, metadata, relationships
   - Access via `src/lib/content.ts`: `getAllCourses()`, `getCourseById()`, `getLessonById()`, `getAllPaths()`, `getPathById()`
   - Always returns adapted types via type adapters

2. **Markdown files (Secondary)**: Rich lesson content
   - `content/courses/[courseId]/[lessonId].md`
   - `content/paths/[pathId].md`
   - Parsed with `gray-matter` for frontmatter + markdown

## Common Development Workflows

### Adding a Protected API Endpoint

```typescript
// 1. Create Zod schema in src/lib/validations.ts
export const mySchema = z.object({
  userId: z.string().uuid(),
  data: z.string().min(1),
})

// 2. Create route in src/app/api/my-endpoint/route.ts
import { apiSuccess, handleApiError, parseRequestBody, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { mySchema } from '@/lib/validations'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, mySchema)
    requireOwnership(request, body.userId, 'my-resource')

    const result = await prisma.myModel.create({ data: body })
    return apiSuccess(result, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}
```

Middleware automatically enforces authentication. No additional code needed.

### Adding Prisma Model with JSON Field

```prisma
// 1. Add to prisma/schema.prisma
model MyModel {
  id        String   @id @default(uuid())
  jsonField String   // JSON stored as string in SQLite
}
```

```bash
# 2. Create migration
npx prisma migrate dev --name add_my_model
```

```typescript
// 3. Create type adapter in src/lib/type-adapters.ts
import type { MyModel as PrismaMyModel } from '@prisma/client'

export function adaptMyModel(prisma: PrismaMyModel): MyModel {
  return {
    id: prisma.id,
    jsonField: safeJsonParse<string[]>(prisma.jsonField, []),
  }
}
```

```typescript
// 4. Use adapter in API route
const prismaData = await prisma.myModel.findMany()
const adapted = prismaData.map(adaptMyModel)
return apiSuccess(adapted)
```

### Frontend Error Handling

React Error Boundaries configured in `src/app/layout.tsx`:
- `ErrorBoundary` - Global React error catcher
- `ApiErrorBoundary` - API/network error handler

Errors automatically caught and displayed with recovery UI.

## Testing

**Configuration**: `jest.config.js` with module aliases (`@/` → `src/`)

**Current coverage**: 99.55% lines, 100% functions, 262 tests passing

**Test structure**:
- Tests in `__tests__/` directories or `*.test.ts(x)` files
- Use `@testing-library/react` for components
- Use `@testing-library/jest-dom` for matchers

**Run tests**:
```bash
npm test                        # All tests
npm run test:watch             # Watch mode
npm test -- path/to/test.test.ts  # Single file
npm test -- --coverage          # With coverage report
```

**Mocking patterns**:
- Mock Prisma with `jest.mock('@/lib/db')` and `@ts-expect-error` for mock implementations
- Mock auth with `jest.mock('@/lib/auth')` for `requireAuth` and `getUserId`
- Use `as any` in test files for partial Prisma data (add `/* eslint-disable @typescript-eslint/no-explicit-any */`)

## Production Deployment

See `PRODUCTION_CHECKLIST.md` and `PRODUCTION_AUDIT_REPORT.md` for complete guide.

**Critical steps**:
1. Generate secure JWT secret: `openssl rand -base64 32`
2. Set `ALLOWED_ORIGINS` for your domain
3. Use PostgreSQL: `DATABASE_URL="postgresql://user:pass@host:5432/db"`
4. Run `npx prisma migrate deploy` (not `migrate dev`)
5. Set `NODE_ENV=production`
6. Build: `npm run build`
7. Verify: `npm audit` (should be 0 vulnerabilities)
8. Start: `npm start`

**Production Status**: ✅ **100% Production Ready**
- 0 security vulnerabilities (`npm audit`)
- 99.55% test coverage (262 tests)
- Complete authentication & authorization
- All security headers configured
- Rate limiting active
- Full error handling

## Code Style

**Enforced via ESLint** (`npx eslint src --ext .ts,.tsx`):
- TypeScript strict mode
- No explicit `any` (except test files)
- Single quotes, no semicolons
- 2-space indentation

**Naming conventions**:
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Tests: `*.test.ts`
- Constants: `SCREAMING_SNAKE_CASE`
