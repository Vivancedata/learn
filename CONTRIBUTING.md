# Contributing to VivanceData Learning Platform

Thank you for your interest in contributing to VivanceData Learning Platform. Our mission is to democratize AI and data science education by providing high-quality, accessible learning resources to everyone. Whether you are fixing a typo, improving a lesson, or building new features, your contribution helps learners around the world build valuable skills.

This guide explains how to contribute effectively and what to expect during the process.

## Table of Contents

- [Types of Contributions](#types-of-contributions)
- [Contribution Workflow](#contribution-workflow)
- [Where to Contribute](#where-to-contribute)
- [Code Standards](#code-standards)
- [Content Standards](#content-standards)
- [Testing Requirements](#testing-requirements)
- [Getting Help](#getting-help)
- [Recognition](#recognition)

---

## Types of Contributions

We use a tiered contribution system to streamline the review process. Understanding which tier your contribution falls into helps set expectations for both you and our maintainers.

### Simple Changes (No Assignment Needed)

These contributions can be submitted immediately without prior discussion or assignment. Simply fork the repository, make your changes, and submit a pull request.

**Examples include:**

- Fixing typos and grammatical errors
- Correcting broken links
- Improving unclear sentences or explanations
- Updating outdated code syntax in examples
- Fixing formatting issues in markdown files
- Adding missing punctuation or capitalization
- Correcting factual errors in existing content

**How to submit:**

1. Fork the repository
2. Create a branch with a descriptive name (e.g., `fix-typo-ml-lesson-01`)
3. Make your changes
4. Submit a pull request with a clear description

### Significant Changes (Requires Assignment)

These contributions require discussion and assignment before beginning work. This prevents duplicate efforts and ensures alignment with project direction.

**Examples include:**

- Writing new lessons or courses
- Rewriting existing lessons substantially
- Adding new features to the platform
- Making database schema changes
- Creating new learning paths
- Modifying authentication or authorization logic
- Adding new API endpoints
- Changing the project structure

**How to proceed:**

1. Open an issue describing your proposed contribution
2. Wait for a maintainer to review and approve the proposal
3. Request assignment to the issue
4. Once assigned, begin work following the contribution workflow
5. Reference the issue number in your pull request

**Why require assignment?**

- Prevents multiple contributors working on the same task
- Allows maintainers to provide guidance before work begins
- Ensures contributions align with the platform roadmap
- Saves your time by validating ideas early

---

## Contribution Workflow

### Prerequisites

Before contributing, ensure you have:

- Node.js 18.0 or later installed
- A GitHub account
- Basic familiarity with Git and GitHub
- For code contributions: understanding of TypeScript and React

### Step 1: Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/learn.git
cd learn

# Add the upstream repository
git remote add upstream https://github.com/vivancedata/learn.git
```

### Step 2: Set Up the Development Environment

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local settings

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run db:seed

# Verify the setup
npm run dev
```

Open http://localhost:3000 to confirm the platform runs correctly.

### Step 3: Create a Feature Branch

```bash
# Ensure your main branch is up to date
git checkout main
git pull upstream main

# Create a descriptive branch name
git checkout -b type/short-description

# Examples:
# fix/typo-python-lesson-03
# feature/add-quiz-timer
# content/new-docker-lesson
# docs/update-api-reference
```

### Step 4: Make Your Changes

- Follow the code standards and content standards outlined below
- Keep commits focused and atomic
- Write clear commit messages describing what changed and why

### Step 5: Test Your Changes

```bash
# Run the test suite
npm test

# Run linting
npm run lint

# For content changes, verify the seed process
npm run db:seed

# For UI changes, test in the browser
npm run dev
```

All tests must pass before submitting a pull request.

### Step 6: Submit a Pull Request

```bash
# Push your branch to your fork
git push origin your-branch-name
```

On GitHub:

1. Navigate to your fork
2. Click "Compare & pull request"
3. Write a descriptive title following conventional commit format
4. Fill out the pull request template completely
5. Link any related issues using "Closes #123" or "Fixes #123"
6. Request review from maintainers

### Step 7: Address Review Feedback

Maintainers may request changes. To address feedback:

```bash
# Make requested changes locally
# Commit and push to the same branch
git add .
git commit -m "address review feedback: clarify explanation"
git push origin your-branch-name
```

The pull request updates automatically. Reply to review comments to indicate changes are complete.

---

## Where to Contribute

### Course Content

**Location:** `content/courses/`

Course content is written in Markdown with YAML frontmatter. Each course has:

- A main course file: `content/courses/course-name.md`
- A lessons directory: `content/courses/course-name/lessons/`

**Course file structure:**

```markdown
---
id: course-slug
title: Course Title
description: Brief course description
difficulty: Beginner | Intermediate | Advanced
durationHours: 20
pathId: learning-path-id
---

# Course Title

## Learning Outcomes

- What learners will achieve
- Specific skills they will gain

## Prerequisites

- Required prior knowledge
- Recommended courses
```

**Lesson file structure:**

```markdown
---
id: lesson-unique-id
title: Lesson Title
type: lesson | project | quiz
duration: 45 mins
order: 1
section: section-name
nextLessonId: next-lesson-id
---

# Lesson Content

Your markdown content here...

## Knowledge Check

1. Question text?
   - Correct answer (first option)
   - Incorrect option
   - Incorrect option
   - Incorrect option
```

### Learning Paths

**Location:** `content/paths/`

Learning paths define the sequence of courses for a specialization.

### Website Features

**Location:** `src/`

The website is built with Next.js 16+ using the App Router. Key directories:

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Pages and API routes |
| `src/app/api/` | Backend API endpoints |
| `src/components/` | Reusable React components |
| `src/components/ui/` | UI primitives (shadcn/ui) |
| `src/lib/` | Utility functions and helpers |
| `src/types/` | TypeScript type definitions |
| `src/contexts/` | React context providers |
| `src/hooks/` | Custom React hooks |

### Documentation

**Location:** Root directory (`.md` files)

Documentation files at the repository root include:

- `README.md` - Project overview and setup
- `CONTRIBUTING.md` - This file
- `CLAUDE.md` - AI assistant guidance and architecture details
- `PRODUCTION_CHECKLIST.md` - Deployment guide

---

## Code Standards

### TypeScript Requirements

- **Strict mode enabled**: All TypeScript strict checks must pass
- **No implicit any**: All variables must have explicit or inferred types
- **Explicit return types**: Functions should have clear return type annotations

```typescript
// Good: Explicit types
function calculateScore(answers: number[], correct: number[]): number {
  return answers.filter((a, i) => a === correct[i]).length
}

// Avoid: Implicit any
function calculateScore(answers, correct) {
  return answers.filter((a, i) => a === correct[i]).length
}
```

### API Endpoint Pattern

All API routes must follow the established pattern using `src/lib/api-errors.ts`:

```typescript
import { apiSuccess, handleApiError, parseRequestBody, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { mySchema } from '@/lib/validations'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate with Zod
    const body = await parseRequestBody(request, mySchema)

    // 2. Authorization check (if userId in body)
    requireOwnership(request, body.userId, 'resource-name')

    // 3. Business logic
    const result = await prisma.model.create({ data: body })

    // 4. Standardized success response
    return apiSuccess(result, HTTP_STATUS.CREATED)
  } catch (error) {
    // 5. Centralized error handling
    return handleApiError(error)
  }
}
```

### Validation with Zod

All user input must be validated using Zod schemas defined in `src/lib/validations.ts`:

```typescript
import { z } from 'zod'

export const mySchema = z.object({
  userId: z.string().uuid(),
  content: z.string().min(10).max(5000),
  optional: z.string().optional(),
})
```

### Code Formatting

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** None (omit semicolons)
- **Trailing commas:** ES5 style (in arrays and objects)

Run `npm run lint` to verify formatting compliance.

### Component Guidelines

- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks in `src/hooks/`
- Use existing UI components from `src/components/ui/`

### Database Considerations

When working with database operations:

- Use type adapters from `src/lib/type-adapters.ts` for JSON fields
- SQLite stores JSON arrays as strings; always parse them safely
- Include proper error handling for database operations

Refer to `CLAUDE.md` for detailed architecture patterns.

---

## Content Standards

### Writing Style

**Use American English spelling and grammar.**

- "color" not "colour"
- "organize" not "organise"
- Use Oxford commas: "Python, R, and SQL"

**Write in second person addressing the learner directly.**

```markdown
<!-- Good -->
In this lesson, you will learn how to build a neural network.

<!-- Avoid -->
In this lesson, we will learn how to build a neural network.
```

**Keep sentences concise and direct.**

- Aim for sentences under 25 words
- Break complex ideas into multiple sentences
- Use active voice when possible

### Lesson Structure

Every lesson should include:

1. **Introduction**: Brief overview of what the lesson covers
2. **Main content**: Explanations with examples
3. **Code examples**: Working, tested code snippets
4. **Knowledge Check**: Quiz questions at the end

### Code Examples

**All code examples must be:**

- Complete and runnable (no pseudocode without context)
- Tested for correctness
- Well-commented for educational purposes
- Using current library versions

```python
# Good: Complete, runnable example
import pandas as pd

# Load data from CSV file
df = pd.read_csv('data.csv')

# Display first 5 rows
print(df.head())
```

```python
# Avoid: Incomplete snippet
df = pd.read_csv(...)  # load your data
# do stuff with df
```

### Knowledge Check Questions

Each lesson should end with 3-5 Knowledge Check questions:

```markdown
## Knowledge Check

1. Question text ending with a question mark?
   - Correct answer (always first)
   - Plausible incorrect option
   - Plausible incorrect option
   - Plausible incorrect option

2. Another question?
   - Correct answer
   - Incorrect option
   - Incorrect option
   - Incorrect option
```

**Question guidelines:**

- First option is always the correct answer
- Include 4 options per question
- Make incorrect options plausible to test understanding
- Focus on key concepts from the lesson
- Avoid trick questions or overly obscure details

### Learning Outcomes

Each course should have 4-6 measurable learning outcomes:

```markdown
## Learning Outcomes

After completing this course, you will be able to:

- Build and train neural networks using PyTorch
- Evaluate model performance using appropriate metrics
- Apply regularization techniques to prevent overfitting
- Deploy models to production environments
```

Use action verbs: build, create, analyze, implement, evaluate, design, explain.

### Accessibility

- Include alt text descriptions for images
- Use descriptive link text (not "click here")
- Structure content with proper heading hierarchy (h1, h2, h3)
- Ensure code examples have sufficient context

---

## Testing Requirements

### Before Submitting

Run all tests and linting before submitting a pull request:

```bash
# Run the full test suite
npm test

# Run linting checks
npm run lint

# Build the project to catch type errors
npm run build
```

### Test Coverage

The project maintains high test coverage. When adding new features:

- Write unit tests for new utility functions
- Test API endpoints for success and error cases
- Test component rendering and interactions

### Content Testing

For content contributions:

```bash
# Verify content imports correctly
npm run db:seed

# Start the dev server and verify
npm run dev
# Navigate to your new/updated content in the browser
```

---

## Getting Help

### Questions About Contributing

If you have questions about the contribution process:

1. Read this guide thoroughly
2. Check existing issues for similar questions
3. Open a new issue with the "question" label

### Technical Questions

For technical questions about the codebase:

1. Review `CLAUDE.md` for architecture details
2. Check the `README.md` for setup instructions
3. Open an issue with the "help wanted" label

### Content Questions

For questions about course content or educational approach:

1. Review existing lessons for style examples
2. Check the content standards section above
3. Open an issue describing your question or proposal

### Tagging Maintainers

When opening issues or pull requests, you can tag maintainers for guidance. Use `@vivancedata/maintainers` for general inquiries or tag specific maintainers if you know who handles the relevant area.

---

## Recognition

### Contributor Acknowledgment

All contributors are acknowledged for their work:

- **Release notes**: Contributors are credited in release notes for their contributions
- **Contributors list**: Active contributors are listed in project documentation
- **GitHub contributions**: All commits retain your authorship

### Significant Contributor Recognition

Contributors who make substantial, ongoing contributions may be recognized as:

- **Core Contributors**: Regular contributors who help shape the platform
- **Subject Matter Experts**: Contributors with deep expertise in specific topic areas
- **Maintainers**: Trusted contributors who help review and merge contributions

### What Counts as a Contribution

All contributions are valued:

- Code improvements and bug fixes
- Content creation and improvements
- Documentation updates
- Issue triage and discussion
- Code review feedback
- Answering community questions

---

## Code of Conduct

By participating in this project, you agree to maintain a welcoming, inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate in discussions
- Provide constructive feedback
- Focus on what is best for learners and the community
- Accept responsibility for mistakes and learn from them

---

## Summary

1. **Simple changes** (typos, grammar, broken links): Submit a PR directly
2. **Significant changes** (new features, content): Open an issue first, wait for assignment
3. **Always test** your changes before submitting
4. **Follow the standards** outlined in this guide
5. **Ask for help** when needed

Thank you for contributing to VivanceData Learning Platform. Together, we are building a better future for AI and data science education.

---

Questions about this guide? Open an issue with the "documentation" label.
