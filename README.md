# VivanceData Learning Platform

[![Security](https://img.shields.io/badge/Runtime_Audit-0_Vulnerabilities-success)]() [![Tests](https://img.shields.io/badge/Test_Suites-19_Passing-success)]()

VivanceData Learning is a comprehensive educational platform focused on AI and data science skills, providing structured courses, interactive content, and community-driven learning experiences.

## 🎯 Production Status

This platform is deployable with hardened runtime checks, but production readiness still depends on correct infrastructure setup:
- ✅ Runtime dependency audit clean (`npm audit --omit=dev`)
- ✅ Authentication, authorization, rate limiting, and security headers in place
- ✅ Migration-aware production build (`prisma migrate deploy` in `build:ci`)
- ⚠️ Dev-tooling audit warnings can still appear in full `npm audit`

See the [Production Deployment](#production-deployment) section below for deployment guide.

## Overview

The VivanceData Learning Platform is designed to help professionals and organizations build AI literacy and technical skills through structured learning paths, hands-on projects, and industry-relevant content. Developed by AI experts at VivanceData, this platform bridges the gap between theoretical knowledge and practical implementation.

## Key Features

- **Structured Learning Paths**: Curated educational journeys for various AI specializations and skill levels
- **Interactive Courses**: Comprehensive courses with lessons, practical exercises, and real-world projects
- **Knowledge Checks**: Regular assessments to reinforce learning and identify knowledge gaps
- **Project Submissions**: Apply knowledge through guided projects with expert feedback
- **Course Certificates**: Earn verifiable certificates upon course completion
- **Progress Tracking**: Monitor learning progress across courses and paths
- **Community Discussions**: Engage with peers and experts in subject-specific forums
- **Success Stories**: Showcase real-world applications of skills learned on the platform
- **Dark Mode**: Full dark mode support with system preference detection
- **Markdown Content Pipeline**: Auto-import course content from markdown files with quiz extraction
- **Semantic UI System**: Consistent design tokens with success, warning, and info states

## Tech Stack

- **Framework**: Next.js 15+ (App Router with Turbopack)
- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI components
- **Database**: Prisma ORM with SQLite/LibSQL
- **Authentication**: Custom JWT-based authentication with jose and bcryptjs
- **Content Management**: Markdown-based course content with MDX for interactive elements
- **Testing**: Jest and React Testing Library
- **Validation**: Zod schema validation for all API endpoints

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vivancedata/learn.git
cd learn
```

2. Install dependencies:
```bash
npm install
# or
yarn
# or
bun install
```

3. Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-secret-key-here"

# Test Users (optional, for development)
TEST_ADMIN_EMAIL="admin@example.com"
TEST_ADMIN_PASSWORD="Admin123456"
TEST_USER_EMAIL="user@example.com"
TEST_USER_PASSWORD="User123456"
```

4. Set up the database:
```bash
npx prisma migrate dev
npm run db:seed  # This will import content from markdown files
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Creating Course Content

The platform supports authoring courses in Markdown format. Content is automatically imported into the database when you run `npm run db:seed`.

1. **Create a Learning Path** (`content/paths/your-path.md`):
```markdown
---
id: your-path-id
title: Your Path Title
description: Path description
icon: globe
estimatedHours: 100
difficulty: Beginner to Advanced
---

# Your Learning Path

Content goes here...
```

2. **Create a Course** (`content/courses/your-course.md`):
```markdown
---
id: your-course-id
title: Your Course Title
description: Course description
difficulty: Beginner
durationHours: 20
pathId: your-path-id
---

# Your Course

## Learning Outcomes
- Outcome 1
- Outcome 2

## Prerequisites
- Prerequisite 1
- Prerequisite 2
```

3. **Create Lessons** (`content/courses/your-course-id/lessons/lesson-name.md`):
```markdown
---
id: lesson-id
title: Lesson Title
type: lesson
duration: 60 mins
order: 1
section: section-name
---

# Lesson Content

Your markdown content here...

## Knowledge Check

1. Question text?
   - Option 1
   - Option 2
   - Option 3
   - Option 4
```

4. **Import Content**:
```bash
npm run db:seed
```

The content importer will:
- Parse all markdown files with frontmatter
- Extract learning outcomes and prerequisites
- Auto-generate quiz questions from "Knowledge Check" sections
- Create proper database relationships (paths → courses → sections → lessons)

## Project Structure

```
learn/
├── content/             # Course and path content (Markdown/MDX)
│   ├── courses/         # Individual course content
│   └── paths/           # Learning path definitions
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── src/
    ├── app/             # Next.js App Router pages
    │   ├── api/         # API routes
    │   ├── courses/     # Course pages
    │   ├── paths/       # Learning path pages
    │   └── ...
    ├── components/      # React components
    │   ├── ui/          # UI components
    │   └── ...
    ├── lib/             # Utility functions
    └── types/           # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run build:ci` - Production CI/deploy build (runs migrations + build)
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run smoke` - Run lint + tests + production build gate
- `npm run test:e2e` - Alias for smoke gate in this repository
- `npm run db:seed` - Import markdown content and seed database
- `npm run db:migrate:deploy` - Apply pending migrations (production-safe command)
- `npm run prisma:studio` - Open Prisma Studio to manage the database
- `npx prisma migrate dev` - Create and apply database migrations
- `npx prisma generate` - Generate Prisma Client

## Current Learning Paths

The platform currently offers the following learning paths:

1. **Web Development** - From basics to advanced frontend and backend development
2. **Data Science** - Statistical analysis, data visualization, and machine learning
3. **Mobile Development** - Cross-platform and native mobile application development

## Rate Limiting with Redis

The platform uses Redis-based rate limiting for production scalability. This ensures rate limits persist across server restarts and work correctly in distributed environments (multiple instances, serverless).

### Rate Limit Configuration

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication (`/api/auth/*`) | 5 requests | 15 minutes |
| API (`/api/*`) | 100 requests | 15 minutes |
| General | 1000 requests | 15 minutes |

### Setting Up Redis (Upstash)

For production deployments, you need to configure Redis. We recommend [Upstash](https://upstash.com/) for serverless-compatible Redis.

1. **Create an Upstash account** at [upstash.com](https://upstash.com/)

2. **Create a new Redis database**:
   - Select your preferred region
   - Choose the free tier (10,000 requests/day) for development/small apps

3. **Get your credentials**:
   - Copy the `UPSTASH_REDIS_REST_URL` from the dashboard
   - Copy the `UPSTASH_REDIS_REST_TOKEN` from the dashboard

4. **Add to your environment**:
   ```bash
   UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="xxx"
   ```

### Development Mode

In development, if Redis is not configured, the rate limiter automatically falls back to in-memory storage. You will see a warning in the console:

```
[RateLimit] WARNING: Using in-memory rate limiting (development only).
```

This is acceptable for local development but NOT suitable for:
- Production deployments
- Multiple server instances
- Serverless environments (Vercel, AWS Lambda)

### Health Check Endpoint

The `/api/health` endpoint provides status information including Redis connectivity:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "0.1.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "up", "latencyMs": 5 },
    "redis": { "status": "up", "latencyMs": 10, "mode": "redis" }
  }
}
```

### Rate Limit Headers

All API responses include rate limit information:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: ISO timestamp when the window resets
- `Retry-After`: Seconds to wait (only on 429 responses)

## Authentication

The platform uses JWT (JSON Web Token) based authentication with secure HTTP-only cookies.

### Authentication Endpoints

- `POST /api/auth/signup` - Create a new user account
  - Body: `{ email, password, name?, githubUsername? }`
  - Returns: User data and JWT token

- `POST /api/auth/signin` - Authenticate a user
  - Body: `{ email, password }`
  - Returns: User data and JWT token

- `POST /api/auth/signout` - Sign out the current user
  - Clears the authentication cookie

- `GET /api/auth/me` - Get current authenticated user
  - Requires: Authentication (cookie or Bearer token)
  - Returns: Current user data

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Protected Routes

All API endpoints (except `/api/auth/*`) require authentication. Include the JWT token either as:
- HTTP-only cookie (automatically set on signin/signup)
- `Authorization: Bearer <token>` header

## API Endpoints

### Courses & Paths
- `GET /api/courses` - Get all courses with sections and lessons
- `GET /api/paths` - Get all learning paths with course information
- `GET /api/lessons/[id]` - Get a specific lesson by ID (with quiz questions and discussions)

### Progress Tracking
- `POST /api/progress/lessons` - Mark a lesson as complete
  - Body: `{ userId, courseId, lessonId }`
- `GET /api/progress/lessons?userId=xxx&courseId=xxx` - Get user's progress for a course

### Project Submissions
- `POST /api/projects` - Submit a project for review
  - Body: `{ userId, lessonId, githubUrl, liveUrl?, notes? }`
- `GET /api/projects?userId=xxx&lessonId=xxx&status=xxx` - Get project submissions
- `POST /api/projects/[id]/review` - Review a project submission
  - Body: `{ status, feedback, reviewedBy }`

### Discussions
- `POST /api/discussions` - Create a new discussion
  - Body: `{ userId, content, courseId?, lessonId? }`
- `GET /api/discussions?courseId=xxx&lessonId=xxx` - Get discussions
- `POST /api/discussions/[id]/replies` - Add a reply to a discussion
  - Body: `{ userId, content }`
- `GET /api/discussions/[id]/replies` - Get all replies for a discussion

### Quiz & Assessment
- `POST /api/quiz/submit` - Submit quiz answers and get score
  - Body: `{ userId, courseId, lessonId, answers: number[] }`
- `GET /api/quiz/submit?userId=xxx&lessonId=xxx` - Get quiz attempt history

**Note**: All API endpoints return standardized JSON responses with:
- Success: `{ data: {...}, timestamp: "..." }`
- Error: `{ error: "...", message: "...", details?: {...}, timestamp: "..." }`

## Recent Improvements

### Styling & UI (Latest)
- ✅ **Semantic Color System**: Added success, warning, and info color tokens for consistent theming
- ✅ **Dark Mode**: Full dark mode support with theme toggle in navbar and settings
- ✅ **Component Library**: Created reusable Spinner and StatusBadge components
- ✅ **Form Consistency**: All forms now use consistent Input/Label components
- ✅ **Theme Persistence**: Dark mode preference persists using localStorage

### Content Pipeline
- ✅ **Markdown Importer**: Automatically imports course content from markdown files
- ✅ **Quiz Extraction**: Auto-parses quiz questions from "Knowledge Check" sections
- ✅ **Frontmatter Support**: Full support for YAML frontmatter in content files
- ✅ **Relationship Management**: Proper handling of paths → courses → sections → lessons

### Platform Status
- **Build Status**: Zero TypeScript errors
- **Runtime Security**: 0 vulnerabilities in production dependencies (`npm audit --omit=dev`)
- **Styling Consistency**: 9/10 (up from 7.5/10)
- **Infrastructure**: Deployable when required production env vars are configured

## Production Deployment

### Environment Variables (Required)

```bash
# Database (use hosted LibSQL in production)
DATABASE_URL="libsql://your-db-name.turso.io?authToken=your-token"

# Optional escape hatch for single-node file DB deployments (not recommended)
# ALLOW_FILE_DATABASE_IN_PRODUCTION="true"

# Authentication (generate with: openssl rand -base64 32)
JWT_SECRET="your-secure-random-secret"

# Public app URL (required in production for email/Stripe links)
NEXT_PUBLIC_APP_URL="https://learn.yourdomain.com"

# CORS - comma-separated list of allowed origins
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Redis for rate limiting (recommended for production)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# Environment
NODE_ENV="production"
```

### Deployment Steps

```bash
# 1. Install dependencies
npm ci

# 2. Run production build (includes `prisma migrate deploy`)
npm run build:ci

# 3. Start production server
npm start
```

### Security Checklist

The platform includes these security features out of the box:

- **Authentication**: JWT-based with HTTP-only secure cookies (7-day expiration)
- **Authorization**: Middleware protection on all API routes with resource ownership verification
- **Password Security**: bcryptjs hashing with 10 salt rounds, strength requirements enforced
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Rate Limiting**: 5 req/15min for auth, 100 req/15min for API endpoints
- **Input Validation**: Zod validation on all API endpoints
- **Error Handling**: Standardized responses with React Error Boundaries

### Post-Deployment Verification

```bash
# Test API health endpoint
curl https://yourdomain.com/api/health

# Verify security headers
curl -I https://yourdomain.com

# Check SSL certificate at ssllabs.com
# Check security headers at securityheaders.com
```

## Contributing

We welcome contributions to the VivanceData Learning Platform! Please review our contributing guidelines before submitting pull requests.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

© 2025 VivanceData, Inc. All Rights Reserved.
