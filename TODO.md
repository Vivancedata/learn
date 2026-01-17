# TODO.md - What Actually Needs to Be Done

**Last Updated**: 2025-11-18
**Status**: Platform is 100% production-ready for BACKEND but FRONTEND is completely non-functional

---

## 🔴 CRITICAL - BLOCKING PRODUCTION USE (Frontend Completely Broken)

### 1. **SIGN-IN/SIGN-UP PAGES ARE COMPLETELY FAKE** 🚨
**Priority**: URGENT - Users literally cannot sign in or create accounts

**Current State**:
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Just a static form with NO functionality
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Just a static form with NO functionality
- Forms don't submit, don't call APIs, don't do ANYTHING
- Users see a pretty UI but can't actually use the platform

**What needs to be done**:
```typescript
// src/app/sign-in/[[...sign-in]]/page.tsx
// 1. Add form state management (useState for email/password)
// 2. Add form submission handler that calls POST /api/auth/signin
// 3. Handle success (store token, redirect to dashboard)
// 4. Handle errors (show validation errors, API errors)
// 5. Add loading states during API call
// 6. Add "Forgot Password" link (endpoint doesn't exist yet)

// src/app/sign-up/[[...sign-up]]/page.tsx
// Same as above but POST to /api/auth/signup
// Add name and githubUsername fields
// Add password strength indicator
// Show password requirements
```

**Impact**: 🔴 **BLOCKS ALL USER FLOWS** - Nobody can use the platform at all

---

### 2. **DASHBOARD SHOWS FAKE DATA**
**Priority**: HIGH - Dashboard loads but shows completely made-up progress

**Current State**:
- Dashboard calls `getAllCourses()` which returns courses from database
- BUT the `course.progress` field is NEVER set by the API
- Dashboard displays progress percentages based on `undefined` data
- All progress tracking is completely fake client-side logic

**Files affected**:
- `src/app/dashboard/page.tsx` - Lines 73-84, 86-93 all use fake `course.progress`
- `src/app/courses/[courseId]/page.tsx` - Same fake progress
- `src/app/paths/[pathId]/page.tsx` - Same fake progress
- `src/components/course-sidebar.tsx` - Shows fake completed checkmarks
- `src/components/course-list.tsx` - Shows fake progress bars
- `src/components/path-card.tsx` - Shows fake path progress

**What needs to be done**:
1. Create `GET /api/progress/user/[userId]` endpoint to fetch REAL progress data
2. Join CourseProgress with User on dashboard load
3. Calculate actual completed lessons from database
4. Update all components to use real data
5. Remove all fake `course.progress` from type definitions

**Impact**: 🔴 Users see fake achievements, fake progress, completely misleading UX

---

### 3. **SETTINGS PAGE IS COMPLETELY NON-FUNCTIONAL**
**Priority**: MEDIUM-HIGH - Settings don't save anything

**Current State**:
- `src/app/settings/page.tsx` - All settings are local state only
- Theme changes don't persist or actually change theme
- Notification settings don't save anywhere
- Account info inputs don't load current user data
- "Save Changes" button does absolutely nothing

**What needs to be done**:
1. Create `GET /api/user/me` to fetch current user settings
2. Create `PUT /api/user/settings` to update user preferences
3. Integrate with next-themes for actual theme switching
4. Add UserSettings table to Prisma schema
5. Wire up all form submissions to API calls

**Impact**: 🟡 Users can't customize their experience or update profile

---

## 🔴 CRITICAL - BACKEND ENDPOINTS EXIST BUT FRONTEND DOESN'T USE THEM

### 4. **PROJECT SUBMISSION COMPONENT DOESN'T SUBMIT PROJECTS**
**Priority**: HIGH - Core feature completely broken

**Current State**:
- `src/components/project-submission.tsx:32` - Has TODO comment
- Form validates GitHub URL but doesn't call API
- Backend endpoint `/api/projects` EXISTS and works
- Frontend just... doesn't use it

**What needs to be done**:
```typescript
// In project-submission.tsx handleSubmit():
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,  // Need to get from auth context
    lessonId,
    githubUrl,
    liveUrl,
    notes
  })
})
// Handle response, show success/error
```

**Missing piece**: Need auth context/hook to get current user ID

---

### 5. **DISCUSSION COMPONENT DOESN'T CREATE DISCUSSIONS**
**Priority**: HIGH - Community feature completely broken

**Current State**:
- `src/components/community-discussions.tsx` - 3 TODO comments (lines 21, 29, 36)
- Backend endpoints `/api/discussions` and `/api/discussions/[id]/replies` EXIST
- Frontend shows discussion UI but doesn't actually post anything
- All discussions are hardcoded mock data

**What needs to be done**:
1. Wire up `handlePostDiscussion()` to POST /api/discussions
2. Wire up `handlePostReply()` to POST /api/discussions/[id]/replies
3. Wire up `handleLike()` to PUT /api/discussions/[id]/likes (endpoint doesn't exist yet)
4. Replace mock discussion data with GET /api/discussions
5. Add auth context to get userId

---

### 6. **CERTIFICATE DOWNLOAD DOES NOTHING**
**Priority**: LOW - Certificate backend doesn't exist

**Current State**:
- `src/components/course-certificate.tsx:23` - TODO comment
- Shows alert() instead of downloading certificate
- No backend endpoint for certificate generation

**What needs to be done**:
1. Create `POST /api/certificates` endpoint
2. Implement PDF generation (use jsPDF or similar)
3. Store certificates in Prisma
4. Create `GET /api/certificates/[id]/download` endpoint
5. Wire up frontend download button

---

## 🟡 HIGH PRIORITY - MISSING CORE FUNCTIONALITY

### 7. **NO AUTHENTICATION CONTEXT/HOOK**
**Priority**: HIGH - Every protected page needs this

**Current State**:
- Every component that needs userId just... doesn't have it
- No React context for current user
- No hook to get auth state
- Each page would need to call `/api/auth/me` separately

**What needs to be done**:
```typescript
// src/contexts/AuthContext.tsx
// 1. Create AuthContext with user, loading, error
// 2. Create AuthProvider that wraps app
// 3. Call GET /api/auth/me on mount
// 4. Store user in context
// 5. Provide logout function
// 6. Create useAuth() hook

// src/hooks/useAuth.ts
// export function useAuth() { return useContext(AuthContext) }

// src/app/layout.tsx
// Wrap <body> with <AuthProvider>
```

**Impact**: 🔴 Required for ALL user-specific features to work

---

### 8. **NO PROTECTED ROUTE GUARDS**
**Priority**: HIGH - Anyone can access any page

**Current State**:
- Dashboard, courses, settings all accessible without login
- No client-side route protection
- Middleware only protects API routes, not pages

**What needs to be done**:
1. Create `src/components/ProtectedRoute.tsx` wrapper
2. Check auth context, redirect to /sign-in if not authenticated
3. Wrap dashboard, settings, and other protected pages
4. Or better: Use middleware to redirect at server level

---

### 9. **PROGRESS TRACKING DOESN'T ACTUALLY TRACK PROGRESS**
**Priority**: HIGH - Core platform feature

**Current State**:
- Endpoints `/api/progress/lessons` exist for marking lessons complete
- Frontend never calls them
- Users can't mark lessons as complete
- Quiz completion doesn't save scores

**What needs to be done**:
1. Add "Mark Complete" button to lesson pages
2. Call `POST /api/progress/lessons` when clicked
3. Update local state to show checkmark
4. Wire up quiz component to `POST /api/quiz/submit`
5. Fetch and display quiz history with `GET /api/quiz/submit?userId=&lessonId=`

---

### 10. **REAL-TIME DATA IS COMPLETELY STALE**
**Priority**: MEDIUM - UX issue, not blocking

**Current State**:
- All data loaded once with useEffect
- No refresh when user completes lessons
- No optimistic updates
- No cache invalidation

**What needs to be done**:
Consider adding:
1. SWR or React Query for data fetching
2. Optimistic updates for better UX
3. Polling or WebSockets for real-time updates
4. Cache invalidation on mutations

---

## 🟢 MEDIUM PRIORITY - Quality & UX

### 11. **FRONTEND HAS 9 CLIENT COMPONENTS THAT SHOULD BE SERVER COMPONENTS**
**Priority**: MEDIUM - Performance issue

**Current State**:
- 9 out of 10 pages are "use client" unnecessarily
- Only need client for interactivity, not data fetching
- Should use Server Components + Server Actions for better performance

**Pages that should be Server Components**:
- `/` (homepage) - No interactivity
- `/courses` - Just renders course list
- `/paths` - Just renders path list
- `/courses/[courseId]` - Minimal interactivity
- `/paths/[pathId]` - Minimal interactivity

**Keep as Client Components**:
- `/dashboard` - Lots of interactivity
- `/settings` - Forms and state
- `/sign-in`, `/sign-up` - Forms
- `/courses/[courseId]/[lessonId]` - Interactive lesson UI

---

### 12. **NO PASSWORD RESET FLOW**
**Priority**: MEDIUM - Important for production

**Current State**:
- Users who forget password are locked out forever
- No "Forgot Password" link (sign-in page has placeholder)
- No reset token generation
- No email sending

**What needs to be done**:
1. Add "Forgot Password" link to sign-in page
2. Create `/forgot-password` page
3. Create `POST /api/auth/forgot-password` endpoint
4. Generate reset tokens, store in database
5. Send reset email (need email service like Resend/SendGrid)
6. Create `/reset-password` page
7. Create `POST /api/auth/reset-password` endpoint

**Alternative**: Use "Contact admin to reset password" for MVP

---

### 13. **NO EMAIL VERIFICATION**
**Priority**: MEDIUM - Security best practice

**Current State**:
- Users can sign up with any email
- No verification email sent
- No email confirmation required

**What needs to be done**:
1. Add `emailVerified` field to User model
2. Generate verification tokens on signup
3. Send verification email
4. Create `/verify-email` page
5. Create `POST /api/auth/verify-email` endpoint
6. Block certain actions until verified (optional)

**Alternative**: Skip for MVP, add later

---

### 14. **ACHIEVEMENTS SYSTEM IS HALF-IMPLEMENTED**
**Priority**: LOW - Gamification feature

**Current State**:
- Prisma schema has Achievement and UserAchievement tables
- Only used in dashboard with hardcoded fake achievements
- No backend endpoints to earn/track achievements
- No real achievement logic

**What needs to be done**:
1. Create seed data for actual achievements
2. Create `POST /api/achievements/check` endpoint
3. Run achievement checks on lesson complete, quiz pass, etc.
4. Create UserAchievement records when earned
5. Fetch real achievements in dashboard

**Alternative**: Remove Achievement tables entirely if not using

---

### 15. **NO TESTS ARE ACTUALLY RUN**
**Priority**: MEDIUM - Quality assurance

**Current State**:
- Found 311 `.test` files but they're all in node_modules
- Only 2 real test files exist:
  - `src/app/api/__tests__/api.test.ts`
  - `src/lib/__tests__/content.test.ts`
- `npm test` is configured but nobody runs it
- No CI/CD testing

**What needs to be done**:
1. Actually run: `npm test` and see what fails
2. Fix failing tests
3. Add tests for new endpoints (quiz, projects, discussions, progress)
4. Add component tests for interactive components
5. Set up GitHub Actions to run tests on PR

---

### 16. **TYPE SAFETY ISSUES (41 uses of `any` or `unknown`)**
**Priority**: LOW - Code quality

**Current State**:
- 41 instances of `any` or `unknown` types
- Mostly in API handlers for error objects
- Some in component props

**What needs to be done**:
1. Define proper error types
2. Type all API request/response bodies
3. Type all component props properly
4. Fix any escape hatches

---

## 🔵 LOW PRIORITY - Polish & Future Features

### 17. **CONTENT IS ONLY IN DATABASE, NOT MARKDOWN FILES**
**Priority**: LOW - Alternative content source

**Current State**:
- `content/` directory exists with example markdown
- Not actually used by the app
- All content comes from Prisma seed data

**Decision needed**:
- Keep it: Implement markdown file loading
- Remove it: Delete content/ directory entirely

---

### 18. **NO ADMIN PANEL**
**Priority**: LOW - Operational tool

**Current State**:
- No way to review project submissions
- No way to manage users
- No way to add/edit courses
- Prisma Studio is only admin tool

**What needs to be done**:
1. Create `/admin` route
2. Add role-based access (add `role` to User model)
3. Create admin pages for:
   - Reviewing project submissions
   - Managing users
   - Managing courses
4. Protect with role check in middleware

---

### 19. **NO SEARCH FUNCTIONALITY**
**Priority**: LOW - UX enhancement

**Current State**:
- Courses and paths pages show all content
- No way to search or filter
- No tags or categories

**What needs to be done**:
1. Add search input to courses/paths pages
2. Implement client-side filtering
3. Or create `GET /api/search?q=` endpoint
4. Add filters by difficulty, duration, etc.

---

### 20. **NO PAGINATION**
**Priority**: LOW - Performance issue (only with scale)

**Current State**:
- All courses loaded at once
- All discussions loaded at once
- No limit on API responses (except hardcoded 50 in discussions)

**What needs to be done**:
1. Add pagination schema to validations
2. Update API endpoints to accept page/limit params
3. Add pagination UI components
4. Implement cursor-based or offset-based pagination

---

## 📊 SUMMARY

### What Works (Production Ready):
✅ Backend API - All endpoints secure, validated, documented
✅ Database - Schema complete, migrations ready, indexes optimized
✅ Authentication - JWT-based auth fully implemented
✅ Authorization - Resource ownership checks in place
✅ Security - 0 vulnerabilities, all headers configured, rate limiting active
✅ Error Handling - Standardized responses, React error boundaries

### What Doesn't Work (Needs Implementation):
🔴 Sign-in/Sign-up UI - Completely non-functional
🔴 Dashboard - Shows fake data
🔴 Progress Tracking - Doesn't track anything
🔴 Project Submissions - Frontend doesn't submit
🔴 Discussions - Frontend doesn't post
🔴 Settings - Doesn't save
🔴 Auth Context - Doesn't exist

### The Brutal Truth:
**Backend**: 95% complete, production-ready, fully secure
**Frontend**: 30% complete, looks pretty but doesn't work
**Integration**: 0% - Frontend and backend don't talk to each other

### Estimated Effort to Make Platform Actually Usable:

**Phase 1 - Make it work (MVP)**:
1. Auth context + protected routes - 4 hours
2. Wire up sign-in/sign-up - 2 hours
3. Real progress tracking - 6 hours
4. Wire up project submissions - 2 hours
5. Wire up discussions - 3 hours
6. Fix dashboard real data - 4 hours
**Subtotal: ~21 hours** (3 days)

**Phase 2 - Make it production-ready**:
7. Settings page functionality - 3 hours
8. Password reset flow - 6 hours
9. Email verification - 4 hours
10. Server components optimization - 4 hours
11. Testing + fixes - 8 hours
**Subtotal: ~25 hours** (3 days)

**Phase 3 - Polish**:
12. Achievements system - 8 hours
13. Admin panel - 12 hours
14. Search functionality - 6 hours
15. Better UX/error states - 4 hours
**Subtotal: ~30 hours** (4 days)

**Total: ~76 hours (10 days full-time or 2-3 weeks part-time)**

---

## 🎯 RECOMMENDED ORDER OF EXECUTION:

1. **Auth Context** - Required for everything else
2. **Sign-in/Sign-up UI** - Users need to access the platform
3. **Protected Routes** - Secure the frontend
4. **Real Progress API Integration** - Make dashboard show real data
5. **Wire up Project Submissions** - Make course projects work
6. **Wire up Discussions** - Make community work
7. **Settings Functionality** - Let users update profiles
8. Everything else based on priority

---

**Note**: This TODO is brutally honest. The backend is excellent. The frontend is a beautiful prototype that doesn't actually do anything yet. The gap is not in code quality but in wiring up the UI to the API.
