# Shaping `learn` as per-engagement client training

**Date:** 2026-09-01
**Status:** proposed. Plan only — no application code changes in this PR.
**Trigger:** `PRODUCT.md`, decided 2026-09-01 —

> `learn` and `crm` are **internal tools for the practice**, not public products.
> `learn` delivers per-engagement client training (one course per handover, no
> public catalogue, no leaderboard, no testimonials).

and the critique `2026-09-02T00-38-08Z__learn-src-app.md`, whose closing question is
the one this document answers:

> Biggest opportunity: decide whether this is a public catalogue or client-training
> delivery, then cut accordingly.

**Method note.** `impeccable/reference/shape.md` opens with a discovery interview.
No human was available to answer it, so per that document's own fallback the brief
below is written with **every assumption marked `[ASSUMPTION]`** and the questions
that only Lorenzo can settle are collected in the last section rather than guessed
at. Nothing here should be built until those are answered.

---

## 1. What the platform actually is today (measured, not recalled)

Read from the production database, read-only, on 2026-09-01:

| table | rows |
| --- | --- |
| `User` | **5** (all role `student`; 2 email-verified) |
| `Course` | 11 |
| `Path` | 3 |
| `Lesson` | 52 |
| `CourseProgress` | **0** |
| `Certificate` | **0** |
| `ProjectSubmission` | **0** |
| `AssessmentAttempt` | **0** |
| `Subscription` | **0** |
| `UserAchievement` | **0** |
| `XpTransaction` | **0** |
| `DailyActivity` | **0** |
| `LeaderboardCache` | **0** |
| `CommunityPoint` | **0** |
| `Conversation` (AI tutor) | **0** |
| `Discussion` / `DiscussionReply` | 1 / 1 |

**Nobody has ever completed a lesson on this platform.** Not one progress row, not
one certificate, not one quiz attempt, not one subscription. The gamification stack,
the billing stack and the assessment stack have zero usage between them.

That single fact changes the cost of this migration from "a risky removal with a
data-migration story" to "deleting code that has never had a user". It should be
re-checked immediately before any removal lands, but as of today there is no user
data to preserve.

Source size, by area (`.ts`/`.tsx`/`.js` under each area's paths):

| area | lines | files |
| --- | --- | --- |
| assessments | 4,243 | 17 |
| mobile / PWA / push | 4,178 | 17 |
| AI tutor | 2,660 | 11 |
| XP + streaks | 2,530 | 12 |
| leaderboard + community points | 2,246 | 12 |
| recommendations | 1,769 | 9 |
| exercises (Pyodide) | 1,704 | 10 |
| billing (Stripe) | 1,665 | 12 |
| discussions + solutions | 1,635 | 9 |
| certificates | 815 | 7 |
| achievements | 670 | 5 |

Total `src/` is 52,041 lines across 38 Prisma models.

The catalogue itself is a data-science bootcamp: Computer Vision, NLP, MLOps, Deep
Learning, Generative AI, Data Engineering, SQL, Python. `PRODUCT.md`'s primary user
is an HVAC or plumbing owner-operator. **There is no overlap.** No course teaches
the missed-call, paperwork or field-photo automation the marketing site sells, which
is precisely what the critique's fourth question asks.

---

## 2. The brief

### 2.1 Job and audience

**Who arrives.** One to five named people per engagement, at the client: the
operations lead who will own the automation day to day, plus whoever backs them up
when they are out. They arrive because Lorenzo sent them a link at handover, not
because they were browsing. `[ASSUMPTION: 1–5 people per engagement; see Q1.]`

**Their situation.** They are not learners. They are the people who will be blamed
when the after-hours call goes to voicemail again. They read on a phone, often in a
truck or on site with poor signal (`PRODUCT.md`, Operating Context). They have
between five and twenty minutes, usually because something has already gone wrong.

**Visitor mode.** Operate and reference, not explore. They will visit twice: once at
handover, and once months later at 7am when they need the one paragraph that says
what to do when the automation stops.

**Also arriving:** Lorenzo, to see whether the client's team has actually been
through the material before the retainer conversation.

### 2.2 Outcome and proof

**Primary task.** Follow the training for *their* automation, end to end, and know
what to do when it misbehaves.

**Success.** Six months after handover the client is still running the automation
without calling Lorenzo for something the training covers — which is the same
measure `PRODUCT.md` already uses for the practice ("a workflow in production that
the client still relies on six months later").

**Real evidence the product can carry.** Only what the engagement actually produced:
the client's own workflow, their own screenshots, the written handover document, the
runbook. Nothing else. `PRODUCT.md`'s absence list is binding — no testimonials, no
client logos, no outcome metrics, no completion statistics across clients.

**Product-specific truth a generic LMS cannot claim.** The person who wrote the
course built the automation it describes, and answers the phone about it. The
training is not *about* a subject; it is the documentation of one specific system
running in one specific business.

### 2.3 Structural thesis

Not a catalogue with an account attached. **An engagement is the unit**, and it has
exactly one course. A signed-in person sees their engagement's training and nothing
else; there is no route that lists other engagements, other clients, or other
courses.

The consequence: the home page for a signed-in client is the course. `/` should
redirect a client straight into their assigned course rather than into a marketing
hero. For a signed-out visitor, `/` is a short page that says what this is and where
to sign in — with a link back to vivancedata.com, which is where anyone who is not a
client belongs. `[ASSUMPTION: redirect rather than a chooser; see Q1.]`

**Focal moment.** The runbook: the section a client opens under pressure. It is the
one screen that must work on a phone with one bar, must be reachable in two taps
from anywhere, and must never be behind a quiz.

**Sequence.** Sign in → land in the assigned course → work through it → the runbook
stays permanently reachable.

### 2.4 Scope and boundaries

**In scope:** authentication, engagement assignment, the course/lesson reading
experience, per-lesson knowledge checks, the founder's progress view, and a footer.

**Untouched:** the lesson reading experience itself. Per the critique, "the learning
core (prose, quiz card, error copy) is solid". The markdown pipeline, the code-block
rendering, the knowledge check and the error/empty copy all stay. This shape removes
what surrounds them, not what they are.

**Anti-goals**, each one a thing that would make the result wrong even if it looked
finished:

- Any surface that ranks clients against each other. An HVAC owner-operator has no
  peers on this platform and no reason to be scored against them.
- Any streak, XP, level or badge. The client is not to be nudged into daily habits;
  they are to be able to run their automation.
- Self-serve sign-up. Right now anyone on the internet can create an account
  (`/api/auth/signup` sets `role: 'student'` with no gate). That is the single
  largest gap between what ships and what `PRODUCT.md` decided.
- A public catalogue. Eleven data-science courses discoverable by strangers is the
  opposite of "one course per handover".
- Any number the repo cannot derive from its own data. (PR #94 in this series
  removed the last of those.)

### 2.5 States and ranges

Realistic ranges the design must survive, and where each one breaks the current UI:

| dimension | min | typical | max | note |
| --- | --- | --- | --- | --- |
| clients | 1 | 3–8 | ~15 | `[ASSUMPTION; see Q2]` |
| people per engagement | 1 | 2 | 5 | `[ASSUMPTION; see Q1]` |
| courses per engagement | 1 | 1 | 1 | the defining constraint |
| lessons per course | 3 | 6–10 | ~15 | today's courses hold 2–10 |
| lesson length | 30 min | 50 min | 120 min | measured from `Lesson.duration` |

Material states, and which are currently unhandled:

- **First run, invited, never signed in.** No route today. An invite flow does not exist.
- **Signed in, no engagement assigned.** Would currently show the public catalogue.
- **Engagement complete.** No terminal state; the course simply ends.
- **Automation changed after handover.** Needs a visible "updated" marker on a
  lesson. Nothing like it exists.
- **Offline / poor signal.** The PWA service worker already covers this and is the
  one piece of the mobile stack that earns its place for this audience.
- **Founder view with zero clients.** Needs a real empty state, not a blank table.

### 2.6 Interaction and layout

- **Topology.** Two levels: course → lesson. The current three-level
  path → course → lesson hierarchy has nothing to hold once a client has one course.
- **Navigation.** The ten-target navbar collapses to: the course, the runbook, and
  account. The bottom nav on mobile collapses to the same three. Anything that is
  one client's single course does not need a "Courses" tab.
- **Hierarchy on the lesson page.** Lesson title, prose, code, knowledge check.
  Unchanged.
- **Responsiveness.** Phone-first, because the buyer reads on a phone outdoors.
  The runbook must be legible in sunlight: WCAG AA is the floor for anything a user
  must read (`PRODUCT.md`, Accessibility).
- **Feedback.** Progress is a plain "4 of 9 lessons" line, visible to the client and
  to the founder. Not a ring, not a percentage badge, not a level.
- **Footer.** Every page gets one: who built this, a link to vivancedata.com, and how
  to reach Lorenzo. There is no footer anywhere in the app today — the critique flagged
  it, and for an internal tool handed to a client it is the only durable pointer back
  to the practice.

### 2.7 Constraints

- Next.js 16 App Router, Prisma 7 + Postgres, custom JWT auth in `src/proxy.ts`,
  `@vivancedata/ui` for tokens and components. All stay.
- WCAG 2.1 AA for anything a client must read.
- The lesson content pipeline (markdown in `content/`, imported by
  `prisma/content-importer.ts`) stays; only which courses exist changes.
- **A builder must not invent:** client names, engagement names, completion figures,
  or any course content. Course content comes from a real engagement's handover
  document or it does not exist.

---

## 3. Migration plan

### 3.1 Route map

| today | after | why |
| --- | --- | --- |
| `/` marketing hero, 8 sections, 4 CTAs | `/` signed-out: what this is + sign in + link to vivancedata.com. Signed-in: redirect to the assigned course | no public product to market here |
| `/courses` catalogue | **removed** | one course per engagement |
| `/courses/[courseId]` | `/training` (the client's course) | the URL stops encoding a choice |
| `/courses/[courseId]/[lessonId]` | `/training/[lessonId]` | keep; this is the part that works |
| — | `/training/runbook` | **new.** The focal moment |
| `/paths`, `/paths/[pathId]` | **removed** | a path groups courses; there is one course |
| `/leaderboard` | **removed** | anti-goal |
| `/assessments/*` (4 routes) | **removed** | 0 attempts, wrong shape for a handover |
| `/exercises/*` | **removed** or kept behind a flag | see Q5 |
| `/pricing`, `/checkout/*` | **removed** | engagements are invoiced, not checked out |
| `/dashboard` | `/dashboard` for the founder only: clients, engagements, progress | the founder's view is the only dashboard that has a reader |
| `/sign-up` | **removed**; replaced by `/invite/[token]` | invite-only |
| `/sign-in`, `/forgot-password`, `/reset-password`, `/verify-email`, `/settings`, `/offline` | keep | |
| `/profile` (linked, never existed) | already fixed in PR #97 | |

### 3.2 Remove

Ordered by how much they cost to carry and how clearly `PRODUCT.md` rules them out.
Line counts are measured; all have zero rows in production.

1. **Leaderboard + community points** — 2,246 lines, 12 files. `/leaderboard`,
   `/api/leaderboards/*`, `/api/points/*`, four components, `leaderboardVisibility.ts`,
   `LeaderboardCache` and `CommunityPoint` models, `User.points` /
   `showOnLeaderboard`.
2. **XP, levels and streaks** — 2,530 lines, 12 files. `/api/xp/*`, `/api/streaks/*`,
   `xp-service.ts`, `xp-config.ts`, `streak-service.ts`, five components,
   `XpTransaction` and `DailyActivity` models, `User.totalXp` / `level` /
   `xpToNextLevel` / `currentStreak` / `longestStreak` / `streakFreezes` /
   `lastActivityDate`.
3. **Achievements** — 670 lines, 5 files, plus `Achievement` and `UserAchievement`.
   One of the two seeded achievements is "Join VivanceData during beta"; there is no
   beta.
4. **Billing** — 1,665 lines, 12 files. Stripe checkout, portal, webhook,
   subscription status, `SubscriptionContext`, `/pricing`, `/checkout/*`,
   `Subscription` and `WebhookEvent`. Pricing lives on vivancedata.com and engagements
   are invoiced directly.
5. **Skill assessments** — 4,243 lines, 17 files. The largest single area and the
   least used. A handover does not gate the client out of their own documentation.
6. **Recommendations** — 1,769 lines, 9 files. Recommending a second course when there
   is one course by definition.
7. **Certificates** — 815 lines, 7 files. A certificate is a credential for a job
   market; the client already owns the system.
8. **Self-serve sign-up** — `/sign-up`, `/api/auth/signup`. Replaced by invite
   redemption. **Do this first** (see sequencing): it is the only item on this list
   that is a live exposure rather than dead weight.

Removal candidates 1–7 total **13,938 lines, ~27% of `src/`**, and delete no user data.

### 3.3 Keep

- The lesson reading experience: markdown pipeline, `InteractiveCodeBlock`, the
  Python highlighter (rewritten in PR #95), the knowledge check (rewritten in PR #96).
- Auth, `src/proxy.ts`, rate limiting (fixed in PR #97), the error/empty copy the
  critique praised, `@vivancedata/ui`.
- `CourseProgress` — repurposed as the founder's visibility into whether the client's
  team has been through the material.
- The PWA service worker and offline route. This audience reads on site with poor
  signal; this is the one piece of the 4,178-line mobile stack that earns its keep.
  The Capacitor iOS/Android wrapper does not — see Q4.
- Discussions: **keep the model, hide the UI** until Q6 is answered.

### 3.4 Data-model deltas

**New:**

```
model Client {                     // the business, not the person
  id, name, slug, createdAt
  engagements  Engagement[]
}

model Engagement {                 // one delivered automation
  id, clientId, name               // e.g. "After-hours call capture"
  courseId                         // exactly one
  startedAt, handedOverAt
  members      EngagementMember[]
}

model EngagementMember {           // a person, scoped to one engagement
  id, engagementId, userId, role   // owner | operator
}

model Invite {
  id, email, engagementId, token, expiresAt, redeemedAt, invitedBy
}
```

**Changed:**

- `User` loses `points`, `totalXp`, `level`, `xpToNextLevel`, `showOnLeaderboard`,
  `currentStreak`, `longestStreak`, `streakFreezes`, `lastActivityDate` — nine
  gamification columns, all zero in production.
- `UserRole` becomes `client | founder`. Every one of the five existing users is
  `student` today; `instructor`/`admin` were never used.
- `Course` gains `engagementId` (or the join lives on `Engagement.courseId`; one
  direction, decided at build time). `Path` and `PathProgress` are dropped with the
  path routes.

**Dropped:** `LeaderboardCache`, `CommunityPoint`, `XpTransaction`, `DailyActivity`,
`Achievement`, `UserAchievement`, `Certificate`, `Subscription`, `WebhookEvent`,
`SkillAssessment`, `AssessmentQuestion`, `AssessmentAttempt`, `AssessmentSession`,
`CourseRecommendation`, `Path`, `PathProgress`. Sixteen of 38 models. **Every one has
zero rows** — re-verify immediately before the migration runs.

**Content:** the eleven data-science courses are not client training and do not
survive as a catalogue. Whether they are archived to the repo or deleted is Q3.

### 3.5 Sequencing

Each step is independently shippable and independently revertible.

1. **Close self-serve sign-up.** Remove `/sign-up` and `/api/auth/signup`; add
   `Invite` + `/invite/[token]`. Smallest diff, largest risk reduction, and it does
   not depend on any decision below.
2. **Add `Client` / `Engagement` / `EngagementMember`.** Additive migration; nothing
   is dropped yet. Backfill the two verified users by hand.
3. **Route the client into their engagement.** `/training` and `/training/[lessonId]`;
   `/` redirects a signed-in client. `/courses`, `/paths` still exist but stop being
   linked. Add the footer here — it is the smallest change with the clearest
   `PRODUCT.md` mandate.
4. **Remove the dead stacks**, one PR per numbered area in §3.2, each with its schema
   migration. Confirm zero rows per table in the same PR.
5. **Founder dashboard**, once there is something to show.
6. **Write the first real course** from an actual engagement's handover document.
   Everything above is scaffolding until this exists.

Steps 1–3 make the product honest. Step 4 makes it small. Step 6 makes it useful.

---

## 4. Open questions

These are the decisions a builder must not invent. Each one changes the shape above.

1. **One person per engagement, or a team?** Everything in §3.4 assumes a team
   (`EngagementMember`). If it is always one person, `Engagement` can carry `userId`
   directly and half the model disappears. It also decides whether `/` redirects
   straight into the course or offers a chooser.
2. **How many concurrent clients, realistically?** At three, the founder dashboard is
   a list. At fifteen it needs filtering and a per-client view. `PRODUCT.md` says the
   practice deliberately has no staff, which caps this — but not at a number this
   document can state.
3. **What happens to the eleven data-science courses?** They are real written content
   (52 lessons, ~2,850 minutes). Options: delete; archive in the repo unpublished; or
   keep a small number as optional background reading attached to an engagement. This
   is a content decision, not a technical one.
4. **Does the Capacitor mobile app survive?** 4,178 lines of mobile/PWA code, iOS and
   Android build pipelines, and a `docs/MOBILE_RELEASE.md`. A client's ops lead is not
   going to install an app store build for one course. The service worker is worth
   keeping; the native wrapper is probably not — but shipping it may already have
   commitments this document cannot see.
5. **Do the Pyodide coding exercises have a role?** 1,704 lines running Python in the
   browser. For an HVAC ops lead, almost certainly not. For the secondary "startups
   who need senior applied-AI help" audience in `PRODUCT.md`, possibly. This depends
   on whether that secondary audience is ever served by `learn` at all.
6. **Should clients be able to discuss lessons?** One discussion and one reply exist.
   For a single-client engagement a discussion thread is really a support channel, and
   Lorenzo already answers the phone. Keeping the model but hiding the UI defers this
   cheaply.
7. **Where does the AI tutor sit?** 2,660 lines, zero conversations. A tutor that
   answers questions about *the client's own automation* would be genuinely useful and
   is a different product from a general AI tutor. Repurpose, or remove?
8. **Does the client keep access after the retainer ends?** `PRODUCT.md` says the
   client owns everything on delivery, including documentation. If the training is
   part of the handover, then access is permanent and there is no offboarding flow to
   build. If it is a retainer benefit, there is. This changes the data model.
9. **Who writes the courses, and when in the engagement?** If the training is written
   at handover, `Engagement.handedOverAt` gates publication. If it is written during
   the build, the client needs access to a draft. This changes the route map.
