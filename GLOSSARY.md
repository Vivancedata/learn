# VivanceData Learn

A learning platform for AI and data-science content: learners work through structured courses, earn XP and streaks, and are assessed, certified and ranked.

## Content

**Path**:
An ordered curriculum that groups related Courses (e.g. a track toward a skill area).
_Avoid_: Track, curriculum

**Course**:
A unit of study in one Path with a difficulty (`Beginner`, `Intermediate`, `Advanced`), made of Sections.
_Avoid_: Class, module

**Section**:
An ordered group of Lessons inside a Course (`CourseSection`).
_Avoid_: Chapter, unit

**Lesson**:
A single page of content in a Section. Its type is `lesson`, `project` or `quiz`.
_Avoid_: Page, topic

**Quiz Question**:
A multiple-option question attached to a Lesson, with one correct answer and an optional explanation.
_Avoid_: Quiz item

**Exercise**:
A hands-on coding task (Python or SQL) from the top-level `exercises/` directory, auto-graded in the browser against its tests.
_Avoid_: Challenge, kata

## Progress

**Course Progress**:
A learner's record for one Course: the Lessons they have completed and their Quiz Scores.
_Avoid_: Enrollment

**Path Progress**:
A learner's record for one Path.

**Quiz Score**:
The score and maximum recorded when a learner completes a quiz Lesson.

**Project Submission**:
A learner's GitHub (and optional live) URL for a project Lesson, reviewed as `pending`, `approved` or `rejected`, and optionally shown publicly.
_Avoid_: Assignment

**Certificate**:
Proof of completing a Course, identified by a unique verification code.
_Avoid_: Diploma, badge

## Gamification

**XP**:
Experience points awarded for an XP Source; their total determines the learner's Level.
_Avoid_: Score, points (Points means Community Points)

**XP Source**:
The kind of action that awards XP (`LESSON_COMPLETE`, `QUIZ_PASS`, `QUIZ_PERFECT`, `PROJECT_SUBMIT`, `PROJECT_APPROVED`, `DAILY_LOGIN`, `STREAK_BONUS`, `ACHIEVEMENT`, `HELPING_OTHERS`).

**XP Transaction**:
One ledger entry recording an amount of XP, its source and the user it went to.

**Level**:
A learner's rank derived from total XP, with a stored `xpToNextLevel` threshold.

**Streak**:
The count of consecutive days on which a learner recorded Daily Activity; the longest is kept alongside the current one.

**Streak Freeze**:
A stored allowance that protects a Streak across a missed day.

**Daily Activity**:
A per-user, per-day record of XP earned, Lessons completed, quizzes taken and minutes spent.

**Achievement**:
A named, iconed milestone that a learner can earn once (`UserAchievement`).
_Avoid_: Badge, trophy

**Leaderboard**:
A cached ranking of learners by a type (`XP`, `STREAKS`, `COURSES_COMPLETED`, `LESSONS_COMPLETED`, `HELPING_POINTS`) over a period (`DAILY`, `WEEKLY`, `MONTHLY`, `ALL_TIME`).
_Avoid_: Scoreboard

## Community

**Discussion**:
A learner post, optionally tied to a Course or Lesson, with Replies and likes.
_Avoid_: Thread, forum post

**Reply**:
A response to a Discussion.

**Community Point**:
A point one learner gives another for a helpful Discussion or Reply; one per giver per item.
_Avoid_: Upvote, kudos

**Solution**:
A public Project Submission for a Lesson, listed with like counts for other learners to browse.

## Assessment and guidance

**Skill Assessment**:
A timed test in a skill area (e.g. Python, SQL) with a passing percentage, drawn from Assessment Questions.
_Avoid_: Exam

**Assessment Question**:
A question belonging to a Skill Assessment, of a type such as single choice, multiple choice, true/false, code output or fill in the blank.

**Assessment Attempt**:
A learner's completed run of a Skill Assessment with its result.

**Assessment Session**:
A single-use, expiring token recording which questions were selected for one attempt.

**Recommendation**:
A suggested Course for a learner with a reason type (`CONTINUE_PATH`, `SIMILAR_TOPIC`, `SKILL_GAP`, `POPULAR`, `PREREQUISITE_MET`, `COMPLEMENT`).

**AI Tutor**:
The LLM-backed assistant (Claude or OpenAI) that answers a learner's questions in a Conversation, optionally scoped to a Lesson or Course.
_Avoid_: Chatbot

## Accounts and billing

**User Role**:
`student`, `instructor` or `admin`.

**Subscription**:
A learner's Stripe-backed paid plan and its status.
_Avoid_: Plan (the free and Pro offerings are tiers, not records)

**Pro Tier**:
The paid offering, sellable only while `NEXT_PUBLIC_PRO_TIER_ENABLED` is `"true"`.
