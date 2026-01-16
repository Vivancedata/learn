# PRD.md - Eureka Learning Platform

This document outlines bugs, incomplete features, and work needed to make the platform production-ready.

---

## Completed Items

### P0 - Critical (Build/Test Blocking) - DONE
- [x] **Next.js 15 Dynamic Route Parameter Type Error** - Fixed in `src/app/api/lessons/[id]/route.ts`
- [x] **Jest Test Suite Failure** - Fixed mock setup in `jest.setup.js`

### P1 - Authentication & Core Features - DONE
- [x] **Clerk Authentication** - Conditionally enabled based on environment variables
  - Created `.env.example` with required Clerk variables
  - ClerkProvider wraps app when configured
  - Sign-in/sign-up pages use Clerk components when available
  - Middleware protects non-public routes

- [x] **Progress Tracking** - Fully implemented
  - `GET /api/progress/[courseId]` - Get course progress
  - `POST /api/progress/[courseId]/lessons/[lessonId]` - Mark lesson complete
  - `DELETE /api/progress/[courseId]/lessons/[lessonId]` - Unmark lesson
  - Progress hook (`useProgress`) for frontend integration
  - Course page shows completion checkmarks and progress percentage

### P2 - Feature Implementation - DONE
- [x] **Project Submissions CRUD**
  - `GET /api/submissions` - List user submissions
  - `POST /api/submissions` - Create submission
  - `GET/PATCH/DELETE /api/submissions/[id]` - Individual submission operations
  - Component fetches/persists submissions via API

- [x] **Community Discussions CRUD**
  - `GET/POST /api/discussions` - List and create discussions
  - `GET/PATCH/DELETE /api/discussions/[id]` - Individual discussion operations
  - `POST /api/discussions/[id]/replies` - Add replies
  - Like functionality, reply threading

- [x] **Settings Persistence**
  - `GET/PATCH /api/user/settings` - User profile management
  - Theme toggle uses next-themes (persisted to localStorage)
  - Account settings (name, email, GitHub) saved to database

### P3 - UX Improvements - PARTIAL
- [x] **Mobile Navigation Menu** - Implemented with dropdown toggle

---

## Remaining Work

### P3 - Lower Priority (Not Yet Implemented)

#### Quiz Score Persistence
**Files:** `src/components/knowledge-check.tsx`, needs new API
- Quiz scores are calculated but not saved to database
- Need `POST /api/quiz-scores` endpoint
- Need to update knowledge-check component to call API on completion

#### Certificate Generation
**Files:** `src/components/course-certificate.tsx`, needs new API
- Certificate component renders preview but no actual generation
- Need `POST /api/certificates` to generate certificate
- Need `GET /api/certificates/[id]` for verification
- Need PDF/image generation for download

---

## API Endpoints Summary

### Implemented
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/courses` | GET | List all courses |
| `/api/paths` | GET | List all learning paths |
| `/api/lessons/[id]` | GET | Get lesson details |
| `/api/progress/[courseId]` | GET | Get course progress |
| `/api/progress/[courseId]/lessons/[lessonId]` | POST, DELETE | Mark lesson complete/incomplete |
| `/api/submissions` | GET, POST | List/create project submissions |
| `/api/submissions/[id]` | GET, PATCH, DELETE | Manage individual submission |
| `/api/discussions` | GET, POST | List/create discussions |
| `/api/discussions/[id]` | GET, PATCH, DELETE | Manage individual discussion |
| `/api/discussions/[id]/replies` | POST | Add reply to discussion |
| `/api/user/settings` | GET, PATCH | Get/update user settings |

### Still Needed
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/quiz-scores` | POST | Save quiz score |
| `/api/certificates` | POST | Generate certificate |
| `/api/certificates/[id]` | GET | Verify/download certificate |

---

## Setup Instructions

### Enable Authentication
1. Create a Clerk account at https://dashboard.clerk.com
2. Copy `.env.example` to `.env.local`
3. Add your Clerk API keys:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
4. Restart the dev server

### Demo Mode (Without Auth)
The app works without Clerk keys - it uses a demo user (`demo-user`) for all authenticated operations. This is suitable for local development and testing.

---

## Notes

- All API routes handle both authenticated (Clerk) and demo modes
- Progress, submissions, and discussions are tied to user IDs
- Theme preference is stored in localStorage via next-themes
- Notification preferences in settings are currently UI-only (no backend)
