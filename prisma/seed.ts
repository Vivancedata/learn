import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create users
  const adminPassword = await hash('admin123', 10)
  const userPassword = await hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      githubUsername: 'admin-github',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: userPassword,
      githubUsername: 'user-github',
    },
  })

  console.log({ admin, user })

  // Create paths
  const webPath = await prisma.path.upsert({
    where: { id: 'web-development' },
    update: {},
    create: {
      id: 'web-development',
      title: 'Web Development',
      description: 'Learn to build modern web applications',
      icon: 'globe',
      estimatedHours: 120,
      difficulty: 'Beginner to Intermediate',
    },
  })

  const jsPath = await prisma.path.upsert({
    where: { id: 'javascript' },
    update: {},
    create: {
      id: 'javascript',
      title: 'JavaScript',
      description: 'Master JavaScript programming',
      icon: 'file',
      estimatedHours: 80,
      difficulty: 'Beginner to Advanced',
    },
  })

  const reactPath = await prisma.path.upsert({
    where: { id: 'react' },
    update: {},
    create: {
      id: 'react',
      title: 'React',
      description: 'Build modern UIs with React',
      icon: 'window',
      estimatedHours: 60,
      difficulty: 'Intermediate',
    },
  })

  // AI & Automation Learning Path
  const aiAutomationPath = await prisma.path.upsert({
    where: { id: 'ai-automation' },
    update: {},
    create: {
      id: 'ai-automation',
      title: 'AI & Automation',
      description: 'Master AI-powered development and workflow automation',
      icon: 'cpu',
      estimatedHours: 100,
      difficulty: 'Intermediate to Advanced',
    },
  })

  // AI Development Learning Path
  const aiDevelopmentPath = await prisma.path.upsert({
    where: { id: 'ai-development' },
    update: {},
    create: {
      id: 'ai-development',
      title: 'AI Development',
      description: 'Build intelligent applications with modern AI technologies',
      icon: 'brain',
      estimatedHours: 120,
      difficulty: 'Advanced',
    },
  })

  console.log({ webPath, jsPath, reactPath, aiAutomationPath, aiDevelopmentPath })

  // Create courses
  const htmlCourse = await prisma.course.upsert({
    where: { id: 'html-css-basics' },
    update: {},
    create: {
      id: 'html-css-basics',
      title: 'HTML & CSS Basics',
      description: 'Learn the fundamentals of HTML and CSS',
      difficulty: 'Beginner',
      durationHours: 20,
      pathId: webPath.id,
      prerequisites: 'None',
      learningOutcomes: 'Build static websites with HTML and CSS',
    },
  })

  const jsCourse = await prisma.course.upsert({
    where: { id: 'javascript-fundamentals' },
    update: {},
    create: {
      id: 'javascript-fundamentals',
      title: 'JavaScript Fundamentals',
      description: 'Learn the core concepts of JavaScript',
      difficulty: 'Beginner',
      durationHours: 30,
      pathId: jsPath.id,
      prerequisites: 'Basic HTML and CSS knowledge',
      learningOutcomes: 'Write JavaScript code to add interactivity to websites',
    },
  })

  const reactCourse = await prisma.course.upsert({
    where: { id: 'react-basics' },
    update: {},
    create: {
      id: 'react-basics',
      title: 'React Basics',
      description: 'Learn the fundamentals of React',
      difficulty: 'Intermediate',
      durationHours: 25,
      pathId: reactPath.id,
      prerequisites: 'JavaScript fundamentals',
      learningOutcomes: 'Build interactive UIs with React',
    },
  })

  // ============================================
  // NEW COURSES: AI & Automation Path
  // ============================================

  // Course 1: n8n Automation
  const n8nCourse = await prisma.course.upsert({
    where: { id: 'n8n-automation' },
    update: {},
    create: {
      id: 'n8n-automation',
      title: 'n8n Workflow Automation',
      description: 'Master workflow automation with n8n - the open-source automation platform. Learn to connect apps, automate tasks, and build powerful integrations without extensive coding.',
      difficulty: 'Beginner',
      durationHours: 20,
      pathId: aiAutomationPath.id,
      prerequisites: 'Basic understanding of APIs and JSON',
      learningOutcomes: 'Build automated workflows, integrate multiple services, create custom nodes, and deploy production-ready automations',
    },
  })

  // Course 2: Claude Code Mastery
  const claudeCodeCourse = await prisma.course.upsert({
    where: { id: 'claude-code-mastery' },
    update: {},
    create: {
      id: 'claude-code-mastery',
      title: 'Claude Code Mastery',
      description: 'Learn to leverage Claude Code CLI for AI-assisted development. Master prompting techniques, code generation, debugging, and building complete applications with AI pair programming.',
      difficulty: 'Intermediate',
      durationHours: 25,
      pathId: aiAutomationPath.id,
      prerequisites: 'Programming experience in any language, familiarity with command line',
      learningOutcomes: 'Use Claude Code effectively for development tasks, write optimal prompts, generate and refactor code, and integrate AI into your development workflow',
    },
  })

  // Course 3: Vector Databases & RAG
  const ragCourse = await prisma.course.upsert({
    where: { id: 'vector-databases-rag' },
    update: {},
    create: {
      id: 'vector-databases-rag',
      title: 'Vector Databases & RAG',
      description: 'Build retrieval-augmented generation (RAG) systems using vector databases. Learn embeddings, semantic search, and how to give LLMs access to your own data.',
      difficulty: 'Intermediate',
      durationHours: 30,
      pathId: aiDevelopmentPath.id,
      prerequisites: 'Python programming, basic understanding of LLMs',
      learningOutcomes: 'Implement vector search, build RAG pipelines, optimize retrieval quality, and deploy production RAG applications',
    },
  })

  // Course 4: AI Agents Development
  const aiAgentsCourse = await prisma.course.upsert({
    where: { id: 'ai-agents-development' },
    update: {},
    create: {
      id: 'ai-agents-development',
      title: 'AI Agents Development',
      description: 'Create autonomous AI agents that can reason, plan, and execute complex tasks. Learn agent architectures, tool use, memory systems, and multi-agent coordination.',
      difficulty: 'Advanced',
      durationHours: 35,
      pathId: aiDevelopmentPath.id,
      prerequisites: 'Python programming, experience with LLM APIs, understanding of RAG systems',
      learningOutcomes: 'Design agent architectures, implement tool-using agents, build memory and planning systems, and create multi-agent applications',
    },
  })

  console.log({ htmlCourse, jsCourse, reactCourse, n8nCourse, claudeCodeCourse, ragCourse, aiAgentsCourse })

  // Create course sections
  const htmlSection1 = await prisma.courseSection.upsert({
    where: { id: 'html-section-1' },
    update: {},
    create: {
      id: 'html-section-1',
      title: 'HTML Basics',
      description: 'Learn the fundamentals of HTML',
      order: 1,
      courseId: htmlCourse.id,
    },
  })

  const htmlSection2 = await prisma.courseSection.upsert({
    where: { id: 'html-section-2' },
    update: {},
    create: {
      id: 'html-section-2',
      title: 'CSS Basics',
      description: 'Learn the fundamentals of CSS',
      order: 2,
      courseId: htmlCourse.id,
    },
  })

  const jsSection1 = await prisma.courseSection.upsert({
    where: { id: 'js-section-1' },
    update: {},
    create: {
      id: 'js-section-1',
      title: 'JavaScript Syntax',
      description: 'Learn the basic syntax of JavaScript',
      order: 1,
      courseId: jsCourse.id,
    },
  })

  // ============================================
  // NEW SECTIONS: n8n Automation Course
  // ============================================
  const n8nSection1 = await prisma.courseSection.upsert({
    where: { id: 'n8n-section-1' },
    update: {},
    create: {
      id: 'n8n-section-1',
      title: 'Getting Started with n8n',
      description: 'Introduction to n8n and setting up your first workflow',
      order: 1,
      courseId: n8nCourse.id,
    },
  })

  const n8nSection2 = await prisma.courseSection.upsert({
    where: { id: 'n8n-section-2' },
    update: {},
    create: {
      id: 'n8n-section-2',
      title: 'Building Workflows',
      description: 'Learn to create powerful automated workflows',
      order: 2,
      courseId: n8nCourse.id,
    },
  })

  const n8nSection3 = await prisma.courseSection.upsert({
    where: { id: 'n8n-section-3' },
    update: {},
    create: {
      id: 'n8n-section-3',
      title: 'Advanced Integrations',
      description: 'Connect multiple services and handle complex scenarios',
      order: 3,
      courseId: n8nCourse.id,
    },
  })

  // ============================================
  // NEW SECTIONS: Claude Code Mastery Course
  // ============================================
  const claudeSection1 = await prisma.courseSection.upsert({
    where: { id: 'claude-section-1' },
    update: {},
    create: {
      id: 'claude-section-1',
      title: 'Introduction to Claude Code',
      description: 'Get started with AI-assisted development using Claude Code CLI',
      order: 1,
      courseId: claudeCodeCourse.id,
    },
  })

  const claudeSection2 = await prisma.courseSection.upsert({
    where: { id: 'claude-section-2' },
    update: {},
    create: {
      id: 'claude-section-2',
      title: 'Effective Prompting',
      description: 'Master the art of writing prompts for code generation',
      order: 2,
      courseId: claudeCodeCourse.id,
    },
  })

  const claudeSection3 = await prisma.courseSection.upsert({
    where: { id: 'claude-section-3' },
    update: {},
    create: {
      id: 'claude-section-3',
      title: 'Building Complete Projects',
      description: 'Use Claude Code to build real-world applications',
      order: 3,
      courseId: claudeCodeCourse.id,
    },
  })

  const claudeSection4 = await prisma.courseSection.upsert({
    where: { id: 'claude-section-4' },
    update: {},
    create: {
      id: 'claude-section-4',
      title: 'Advanced Workflows',
      description: 'Integrate Claude Code into your development workflow',
      order: 4,
      courseId: claudeCodeCourse.id,
    },
  })

  // ============================================
  // NEW SECTIONS: Vector Databases & RAG Course
  // ============================================
  const ragSection1 = await prisma.courseSection.upsert({
    where: { id: 'rag-section-1' },
    update: {},
    create: {
      id: 'rag-section-1',
      title: 'Understanding Embeddings',
      description: 'Learn how text embeddings work and why they matter',
      order: 1,
      courseId: ragCourse.id,
    },
  })

  const ragSection2 = await prisma.courseSection.upsert({
    where: { id: 'rag-section-2' },
    update: {},
    create: {
      id: 'rag-section-2',
      title: 'Vector Databases',
      description: 'Work with vector databases for semantic search',
      order: 2,
      courseId: ragCourse.id,
    },
  })

  const ragSection3 = await prisma.courseSection.upsert({
    where: { id: 'rag-section-3' },
    update: {},
    create: {
      id: 'rag-section-3',
      title: 'Building RAG Systems',
      description: 'Create retrieval-augmented generation pipelines',
      order: 3,
      courseId: ragCourse.id,
    },
  })

  const ragSection4 = await prisma.courseSection.upsert({
    where: { id: 'rag-section-4' },
    update: {},
    create: {
      id: 'rag-section-4',
      title: 'Production RAG',
      description: 'Deploy and optimize RAG systems at scale',
      order: 4,
      courseId: ragCourse.id,
    },
  })

  // ============================================
  // NEW SECTIONS: AI Agents Development Course
  // ============================================
  const agentsSection1 = await prisma.courseSection.upsert({
    where: { id: 'agents-section-1' },
    update: {},
    create: {
      id: 'agents-section-1',
      title: 'Introduction to AI Agents',
      description: 'Understand what AI agents are and how they work',
      order: 1,
      courseId: aiAgentsCourse.id,
    },
  })

  const agentsSection2 = await prisma.courseSection.upsert({
    where: { id: 'agents-section-2' },
    update: {},
    create: {
      id: 'agents-section-2',
      title: 'Tool Use and Function Calling',
      description: 'Enable agents to interact with external tools and APIs',
      order: 2,
      courseId: aiAgentsCourse.id,
    },
  })

  const agentsSection3 = await prisma.courseSection.upsert({
    where: { id: 'agents-section-3' },
    update: {},
    create: {
      id: 'agents-section-3',
      title: 'Memory and Planning',
      description: 'Build agents with long-term memory and planning capabilities',
      order: 3,
      courseId: aiAgentsCourse.id,
    },
  })

  const agentsSection4 = await prisma.courseSection.upsert({
    where: { id: 'agents-section-4' },
    update: {},
    create: {
      id: 'agents-section-4',
      title: 'Multi-Agent Systems',
      description: 'Coordinate multiple agents to solve complex problems',
      order: 4,
      courseId: aiAgentsCourse.id,
    },
  })

  console.log({ htmlSection1, htmlSection2, jsSection1 })
  console.log({ n8nSection1, n8nSection2, n8nSection3 })
  console.log({ claudeSection1, claudeSection2, claudeSection3, claudeSection4 })
  console.log({ ragSection1, ragSection2, ragSection3, ragSection4 })
  console.log({ agentsSection1, agentsSection2, agentsSection3, agentsSection4 })

  // Create lessons
  const htmlLesson1 = await prisma.lesson.upsert({
    where: { id: 'html-lesson-1' },
    update: {},
    create: {
      id: 'html-lesson-1',
      title: 'Introduction to HTML',
      content: '# Introduction to HTML\n\nHTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.',
      type: 'lesson',
      duration: '30 minutes',
      sectionId: htmlSection1.id,
    },
  })

  const htmlLesson2 = await prisma.lesson.upsert({
    where: { id: 'html-lesson-2' },
    update: {},
    create: {
      id: 'html-lesson-2',
      title: 'HTML Elements',
      content: '# HTML Elements\n\nHTML elements are the building blocks of HTML pages.',
      type: 'lesson',
      duration: '45 minutes',
      sectionId: htmlSection1.id,
    },
  })

  const cssLesson1 = await prisma.lesson.upsert({
    where: { id: 'css-lesson-1' },
    update: {},
    create: {
      id: 'css-lesson-1',
      title: 'Introduction to CSS',
      content: '# Introduction to CSS\n\nCSS (Cascading Style Sheets) is used to style and layout web pages.',
      type: 'lesson',
      duration: '30 minutes',
      sectionId: htmlSection2.id,
    },
  })

  // ============================================
  // NEW LESSONS: n8n Automation Course
  // ============================================
  const n8nLesson1 = await prisma.lesson.upsert({
    where: { id: 'n8n-lesson-1' },
    update: {},
    create: {
      id: 'n8n-lesson-1',
      title: 'What is n8n?',
      content: `# What is n8n?

n8n (pronounced "n-eight-n") is a powerful, open-source workflow automation platform that allows you to connect different applications and services to automate repetitive tasks.

## Why n8n?

- **Open Source**: Self-host for free or use n8n Cloud
- **Visual Editor**: Build workflows with a drag-and-drop interface
- **400+ Integrations**: Connect to popular apps out of the box
- **Custom Code**: Add JavaScript or Python when needed
- **Fair-code License**: Source available with commercial options

## Key Concepts

### Workflows
A workflow is a collection of nodes connected together to perform automated tasks.

### Nodes
Nodes are the building blocks of workflows. Each node performs a specific action:
- **Trigger Nodes**: Start a workflow (webhooks, schedules, etc.)
- **Action Nodes**: Perform operations (send email, update database, etc.)

### Connections
Connections define how data flows between nodes.

\`\`\`
[Trigger] → [Process Data] → [Send Notification]
\`\`\`

## Installation Options

### Docker (Recommended)
\`\`\`bash
docker run -it --rm \\
  --name n8n \\
  -p 5678:5678 \\
  -v n8n_data:/home/node/.n8n \\
  n8nio/n8n
\`\`\`

### npm
\`\`\`bash
npm install n8n -g
n8n start
\`\`\`

After installation, access n8n at \`http://localhost:5678\``,
      type: 'lesson',
      duration: '20 minutes',
      sectionId: n8nSection1.id,
    },
  })

  const n8nLesson2 = await prisma.lesson.upsert({
    where: { id: 'n8n-lesson-2' },
    update: {},
    create: {
      id: 'n8n-lesson-2',
      title: 'Your First Workflow',
      content: `# Your First Workflow

Let's build a simple workflow that fetches data from an API and sends a notification.

## Step 1: Create a New Workflow

1. Click "New Workflow" in the n8n interface
2. You'll see an empty canvas with a "+" button

## Step 2: Add a Trigger

For this example, we'll use a Manual Trigger:

1. Click the "+" button
2. Search for "Manual Trigger"
3. Click to add it to your workflow

## Step 3: Add an HTTP Request Node

1. Click "+" next to the trigger
2. Search for "HTTP Request"
3. Configure it:

\`\`\`json
{
  "method": "GET",
  "url": "https://api.github.com/users/octocat"
}
\`\`\`

## Step 4: Test Your Workflow

1. Click "Execute Workflow"
2. View the output data in the node

## Step 5: Add Data Processing

Add a "Set" node to extract specific fields:

\`\`\`javascript
// In the Set node, map fields:
{
  "username": "{{ $json.login }}",
  "followers": "{{ $json.followers }}",
  "avatar": "{{ $json.avatar_url }}"
}
\`\`\`

## Complete Workflow Structure

\`\`\`
[Manual Trigger] → [HTTP Request] → [Set] → [Output]
\`\`\`

## Saving Your Workflow

1. Click "Save" in the top right
2. Give your workflow a descriptive name
3. Optionally add tags for organization`,
      type: 'lesson',
      duration: '30 minutes',
      sectionId: n8nSection1.id,
    },
  })

  const n8nLesson3 = await prisma.lesson.upsert({
    where: { id: 'n8n-lesson-3' },
    update: {},
    create: {
      id: 'n8n-lesson-3',
      title: 'Working with Triggers',
      content: `# Working with Triggers

Triggers determine when and how your workflows start. Understanding triggers is essential for building effective automations.

## Types of Triggers

### 1. Webhook Trigger
Starts workflow when an HTTP request is received.

\`\`\`javascript
// Webhook URL format:
// https://your-n8n.com/webhook/unique-id

// Example incoming data:
{
  "event": "user.created",
  "data": {
    "id": 123,
    "email": "user@example.com"
  }
}
\`\`\`

### 2. Schedule Trigger (Cron)
Run workflows on a schedule.

\`\`\`
// Every hour
0 * * * *

// Every day at 9 AM
0 9 * * *

// Every Monday at 10 AM
0 10 * * 1
\`\`\`

### 3. App-Specific Triggers
Many integrations have their own triggers:

- **Gmail**: New email received
- **Slack**: New message in channel
- **GitHub**: New issue, PR, or push
- **Stripe**: Payment received

## Webhook Best Practices

### Security
\`\`\`javascript
// Verify webhook signatures
const crypto = require('crypto');

const signature = $request.headers['x-signature'];
const payload = JSON.stringify($json);
const expected = crypto
  .createHmac('sha256', 'your-secret')
  .update(payload)
  .digest('hex');

if (signature !== expected) {
  throw new Error('Invalid signature');
}
\`\`\`

### Responding to Webhooks
\`\`\`javascript
// Use "Respond to Webhook" node
{
  "statusCode": 200,
  "body": {
    "success": true,
    "message": "Received"
  }
}
\`\`\`

## Combining Triggers

You can have multiple triggers for the same workflow using the "Execute Workflow" node to call shared logic.`,
      type: 'lesson',
      duration: '25 minutes',
      sectionId: n8nSection2.id,
    },
  })

  const n8nLesson4 = await prisma.lesson.upsert({
    where: { id: 'n8n-lesson-4' },
    update: {},
    create: {
      id: 'n8n-lesson-4',
      title: 'Data Transformation',
      content: `# Data Transformation in n8n

Learn to transform, filter, and manipulate data as it flows through your workflows.

## The Set Node

Transform data structure:

\`\`\`javascript
// Input
{ "first_name": "John", "last_name": "Doe", "age": 30 }

// Set node configuration
{
  "fullName": "{{ $json.first_name }} {{ $json.last_name }}",
  "isAdult": "{{ $json.age >= 18 }}"
}

// Output
{ "fullName": "John Doe", "isAdult": true }
\`\`\`

## The Code Node

For complex transformations, use JavaScript:

\`\`\`javascript
// Process all items
const results = [];

for (const item of $input.all()) {
  results.push({
    json: {
      ...item.json,
      processed: true,
      timestamp: new Date().toISOString()
    }
  });
}

return results;
\`\`\`

## Filtering Data

### IF Node
Branch based on conditions:

\`\`\`javascript
// Condition: $json.status === "active"
// True branch → Process active users
// False branch → Handle inactive users
\`\`\`

### Filter Node
Remove items that don't match:

\`\`\`javascript
// Keep only items where amount > 100
{{ $json.amount > 100 }}
\`\`\`

## Working with Arrays

### Split Out Node
Convert array to individual items:

\`\`\`javascript
// Input: { "users": [{ "name": "A" }, { "name": "B" }] }
// Field: users
// Output: Two separate items
\`\`\`

### Aggregate Node
Combine items back into array:

\`\`\`javascript
// Aggregate all items into single array
// Useful after parallel processing
\`\`\`

## Expression Examples

\`\`\`javascript
// String manipulation
{{ $json.email.toLowerCase() }}
{{ $json.name.split(' ')[0] }}

// Date formatting
{{ DateTime.now().toFormat('yyyy-MM-dd') }}
{{ DateTime.fromISO($json.date).plus({ days: 7 }) }}

// Conditional values
{{ $json.status === 'active' ? 'Yes' : 'No' }}
\`\`\``,
      type: 'lesson',
      duration: '35 minutes',
      sectionId: n8nSection2.id,
    },
  })

  const n8nLesson5 = await prisma.lesson.upsert({
    where: { id: 'n8n-lesson-5' },
    update: {},
    create: {
      id: 'n8n-lesson-5',
      title: 'Error Handling and Debugging',
      content: `# Error Handling and Debugging

Build robust workflows that gracefully handle failures.

## Error Workflow

Set up a dedicated error handling workflow:

1. Create a new workflow named "Error Handler"
2. Add an "Error Trigger" node
3. Process error information:

\`\`\`javascript
// Error data available:
{
  "execution": {
    "id": "abc123",
    "url": "https://n8n.example.com/execution/abc123"
  },
  "workflow": {
    "id": "1",
    "name": "My Workflow"
  },
  "error": {
    "message": "Connection refused",
    "node": "HTTP Request"
  }
}
\`\`\`

## Try/Catch Pattern

Use the "Error Trigger" output on nodes:

\`\`\`
[HTTP Request] → Success → [Process Data]
      ↓
    Error → [Send Alert]
\`\`\`

## Retry Logic

Configure automatic retries:

\`\`\`javascript
// In node settings:
{
  "retryOnFail": true,
  "maxRetries": 3,
  "waitBetweenRetries": 1000
}
\`\`\`

## Debugging Techniques

### 1. Execution History
- View past executions
- Inspect data at each node
- Re-run failed executions

### 2. Pin Data
- Pin node output for testing
- Modify pinned data to test edge cases

### 3. Console Logging
\`\`\`javascript
// In Code node
console.log('Debug:', JSON.stringify($json, null, 2));
\`\`\`

## Validation

Add validation before critical operations:

\`\`\`javascript
// Code node for validation
if (!$json.email || !$json.email.includes('@')) {
  throw new Error('Invalid email address');
}

if ($json.amount <= 0) {
  throw new Error('Amount must be positive');
}

return $input.all();
\`\`\``,
      type: 'lesson',
      duration: '25 minutes',
      sectionId: n8nSection3.id,
    },
  })

  const n8nLesson6 = await prisma.lesson.upsert({
    where: { id: 'n8n-lesson-6' },
    update: {},
    create: {
      id: 'n8n-lesson-6',
      title: 'Real-World Integration Project',
      content: `# Real-World Integration Project

Build a complete automation: Slack notifications for GitHub issues with AI classification.

## Project Overview

When a new GitHub issue is created:
1. Classify the issue using AI
2. Add appropriate labels
3. Notify the right Slack channel
4. Create a Notion task

## Workflow Structure

\`\`\`
[GitHub Trigger] → [AI Classification] → [Add Labels]
                         ↓
              [Route by Category]
             /        |        \\
      [#bugs]  [#features]  [#questions]
                         ↓
              [Create Notion Task]
\`\`\`

## Step 1: GitHub Trigger

Configure GitHub webhook:
\`\`\`json
{
  "events": ["issues"],
  "action": "opened"
}
\`\`\`

## Step 2: AI Classification

Use OpenAI to classify:
\`\`\`javascript
// System prompt
"Classify this GitHub issue into one category: bug, feature, question, documentation. Respond with only the category name."

// User message
"Title: {{ $json.issue.title }}\\nBody: {{ $json.issue.body }}"
\`\`\`

## Step 3: Add GitHub Labels

\`\`\`javascript
// HTTP Request to GitHub API
{
  "method": "POST",
  "url": "https://api.github.com/repos/owner/repo/issues/{{ $json.issue.number }}/labels",
  "body": {
    "labels": ["{{ $json.category }}"]
  }
}
\`\`\`

## Step 4: Route to Slack Channels

Use Switch node:
\`\`\`javascript
// Route based on category
bug → #engineering-bugs
feature → #product-requests
question → #support
\`\`\`

## Step 5: Slack Message

\`\`\`json
{
  "channel": "#bugs",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*New Issue*: {{ $json.issue.title }}"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Category: {{ $json.category }} | <{{ $json.issue.html_url }}|View Issue>"
        }
      ]
    }
  ]
}
\`\`\`

## Step 6: Create Notion Task

\`\`\`json
{
  "parent": { "database_id": "your-db-id" },
  "properties": {
    "Name": { "title": [{ "text": { "content": "{{ $json.issue.title }}" }}] },
    "Status": { "select": { "name": "To Do" } },
    "GitHub URL": { "url": "{{ $json.issue.html_url }}" }
  }
}
\`\`\``,
      type: 'project',
      duration: '60 minutes',
      hasProject: true,
      sectionId: n8nSection3.id,
    },
  })

  // ============================================
  // NEW LESSONS: Claude Code Mastery Course
  // ============================================
  const claudeLesson1 = await prisma.lesson.upsert({
    where: { id: 'claude-lesson-1' },
    update: {},
    create: {
      id: 'claude-lesson-1',
      title: 'Getting Started with Claude Code',
      content: `# Getting Started with Claude Code

Claude Code is Anthropic's official CLI tool for AI-assisted development. It brings Claude's capabilities directly into your terminal.

## Installation

\`\`\`bash
# Install via npm
npm install -g @anthropic-ai/claude-code

# Or via Homebrew (macOS)
brew install claude-code
\`\`\`

## Authentication

\`\`\`bash
# Login with your Anthropic account
claude login

# Or set API key directly
export ANTHROPIC_API_KEY=your-key-here
\`\`\`

## Basic Usage

\`\`\`bash
# Start an interactive session
claude

# Ask a one-off question
claude "How do I create a React component?"

# Work with files in context
claude "Explain this code" --file src/app.ts
\`\`\`

## Key Features

### 1. Context-Aware
Claude Code understands your project structure, reading relevant files automatically.

### 2. Tool Use
Claude can execute commands, read/write files, and search your codebase.

### 3. Memory
Sessions maintain context, allowing for iterative development.

## Your First Session

\`\`\`bash
$ claude
> What files are in this project?

Claude will analyze your directory and provide a summary.

> Create a simple Express server

Claude will generate code and can write it to files.
\`\`\`

## Configuration

Create \`.claude/config.json\` in your project:

\`\`\`json
{
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "temperature": 0.7
}
\`\`\``,
      type: 'lesson',
      duration: '20 minutes',
      sectionId: claudeSection1.id,
    },
  })

  const claudeLesson2 = await prisma.lesson.upsert({
    where: { id: 'claude-lesson-2' },
    update: {},
    create: {
      id: 'claude-lesson-2',
      title: 'Understanding the Interface',
      content: `# Understanding the Claude Code Interface

Master the CLI interface to maximize your productivity.

## Interactive Mode

\`\`\`bash
$ claude
Welcome to Claude Code!
Type your message or use /help for commands.

>
\`\`\`

## Slash Commands

| Command | Description |
|---------|-------------|
| /help | Show available commands |
| /clear | Clear conversation history |
| /compact | Summarize and compact context |
| /cost | Show token usage and costs |
| /quit | Exit the session |

## Working with Files

### Reading Files
\`\`\`bash
> Read the package.json file

# Or reference directly
> What dependencies are in @package.json?
\`\`\`

### Writing Files
\`\`\`bash
> Create a new file called utils.ts with a function to format dates

# Claude will show the file content and ask for confirmation
\`\`\`

### Editing Files
\`\`\`bash
> In src/app.ts, add error handling to the fetchData function
\`\`\`

## Running Commands

Claude can execute shell commands:

\`\`\`bash
> Run the tests
# Claude executes: npm test

> Install lodash and add it to the project
# Claude executes: npm install lodash
\`\`\`

## Multi-File Operations

\`\`\`bash
> Refactor the authentication logic from auth.ts into separate files for login, logout, and session management
\`\`\`

## Context Management

\`\`\`bash
# Add files to context explicitly
> @src/components/*.tsx explain the component structure

# Check current context
/context

# Clear and start fresh
/clear
\`\`\``,
      type: 'lesson',
      duration: '25 minutes',
      sectionId: claudeSection1.id,
    },
  })

  const claudeLesson3 = await prisma.lesson.upsert({
    where: { id: 'claude-lesson-3' },
    update: {},
    create: {
      id: 'claude-lesson-3',
      title: 'Writing Effective Prompts',
      content: `# Writing Effective Prompts

The quality of Claude's output depends heavily on how you ask. Learn to write prompts that get better results.

## The CRISPE Framework

**C**ontext - Provide background information
**R**ole - Define what role Claude should take
**I**nstructions - Clear, specific directions
**S**pecifics - Details about format, constraints
**P**rior - Examples of desired output
**E**valuation - How to verify the result

## Example: Bad vs Good Prompts

### Bad Prompt
\`\`\`
> Make a login form
\`\`\`

### Good Prompt
\`\`\`
> Create a React login form component with:
> - Email and password fields with validation
> - Show/hide password toggle
> - Form submission handling with loading state
> - Error message display
> - Use TypeScript and Tailwind CSS
> - Follow the existing component patterns in src/components
\`\`\`

## Prompt Patterns

### The Specification Pattern
\`\`\`
> Implement a user service with these requirements:
> 1. CRUD operations for users
> 2. Password hashing with bcrypt
> 3. Email validation
> 4. Rate limiting on create
>
> Use the existing database client in lib/db.ts
\`\`\`

### The Example Pattern
\`\`\`
> Create an API endpoint similar to /api/products but for orders.
> Follow the same error handling and response format.
\`\`\`

### The Constraint Pattern
\`\`\`
> Refactor this function but:
> - Keep the public API unchanged
> - Don't add new dependencies
> - Maintain backward compatibility
> - Add JSDoc comments
\`\`\`

### The Iterative Pattern
\`\`\`
> Let's build a shopping cart step by step:
> 1. First, create the data types
> 2. Then we'll add the state management
> 3. Finally, build the UI components
>
> Start with step 1.
\`\`\`

## Context Loading

\`\`\`bash
# Load relevant context before asking
> @src/types/user.ts @src/services/auth.ts

> Now create a password reset flow that integrates with the existing auth service
\`\`\``,
      type: 'lesson',
      duration: '30 minutes',
      sectionId: claudeSection2.id,
    },
  })

  const claudeLesson4 = await prisma.lesson.upsert({
    where: { id: 'claude-lesson-4' },
    update: {},
    create: {
      id: 'claude-lesson-4',
      title: 'Code Generation Patterns',
      content: `# Code Generation Patterns

Learn systematic approaches to generating high-quality code with Claude Code.

## Pattern 1: Test-First Development

\`\`\`bash
> Write tests for a calculateDiscount function that:
> - Takes price and discount percentage
> - Returns the discounted price
> - Handles edge cases (negative values, over 100%)

# After tests are written
> Now implement the function to pass these tests
\`\`\`

## Pattern 2: Interface-First Design

\`\`\`bash
> Define TypeScript interfaces for a blog system:
> - Post (title, content, author, tags, timestamps)
> - Author (name, email, bio)
> - Comment (content, author, post reference)

# Then implement
> Create a PostService class that implements CRUD for these interfaces
\`\`\`

## Pattern 3: Scaffold and Refine

\`\`\`bash
# Generate initial structure
> Create a basic Express router for user management with placeholder implementations

# Review and refine
> Add input validation to the create user endpoint

> Add proper error handling with custom error classes

> Add request logging middleware
\`\`\`

## Pattern 4: Migration from Existing Code

\`\`\`bash
> @src/legacy/users.js

> Convert this JavaScript file to TypeScript with:
> - Proper type definitions
> - Modern async/await syntax
> - Error handling improvements
\`\`\`

## Pattern 5: Documentation-Driven

\`\`\`bash
> Create a README section documenting how the authentication flow works

# Use docs to generate code
> Based on this documentation, implement the OAuth callback handler
\`\`\`

## Code Review with Claude

\`\`\`bash
> @src/services/payment.ts

> Review this code for:
> - Security vulnerabilities
> - Performance issues
> - Code style consistency
> - Missing error handling
\`\`\``,
      type: 'lesson',
      duration: '35 minutes',
      sectionId: claudeSection2.id,
    },
  })

  const claudeLesson5 = await prisma.lesson.upsert({
    where: { id: 'claude-lesson-5' },
    update: {},
    create: {
      id: 'claude-lesson-5',
      title: 'Building a Full-Stack App',
      content: `# Building a Full-Stack App with Claude Code

Walk through building a complete application using Claude Code.

## Project: Task Management API

### Step 1: Project Setup

\`\`\`bash
> Initialize a new Node.js project with TypeScript, Express, and Prisma for a task management API
\`\`\`

Claude will:
- Create package.json
- Set up TypeScript config
- Initialize Prisma
- Create folder structure

### Step 2: Database Schema

\`\`\`bash
> Create a Prisma schema with:
> - User (id, email, name, password)
> - Task (id, title, description, status, priority, dueDate)
> - User has many Tasks
> - Add appropriate indexes
\`\`\`

### Step 3: API Routes

\`\`\`bash
> Create RESTful API routes for tasks:
> - GET /tasks - list with filtering and pagination
> - GET /tasks/:id - get single task
> - POST /tasks - create task
> - PATCH /tasks/:id - update task
> - DELETE /tasks/:id - delete task
>
> Include authentication middleware and input validation
\`\`\`

### Step 4: Authentication

\`\`\`bash
> Add JWT authentication with:
> - POST /auth/register
> - POST /auth/login
> - POST /auth/refresh
> - Middleware to protect task routes
\`\`\`

### Step 5: Testing

\`\`\`bash
> Create integration tests for the task API using Jest and Supertest
\`\`\`

### Step 6: Documentation

\`\`\`bash
> Generate OpenAPI/Swagger documentation for all endpoints
\`\`\`

## Debugging with Claude

\`\`\`bash
> Run npm test

# If tests fail
> The createTask test is failing with "Invalid date format". Help me debug this.
\`\`\`

## Deployment Prep

\`\`\`bash
> Create a Dockerfile for this application with multi-stage builds

> Add GitHub Actions workflow for CI/CD
\`\`\``,
      type: 'project',
      duration: '90 minutes',
      hasProject: true,
      sectionId: claudeSection3.id,
    },
  })

  const claudeLesson6 = await prisma.lesson.upsert({
    where: { id: 'claude-lesson-6' },
    update: {},
    create: {
      id: 'claude-lesson-6',
      title: 'Advanced Workflows',
      content: `# Advanced Claude Code Workflows

Integrate Claude Code into sophisticated development workflows.

## Git Integration

\`\`\`bash
# Commit message generation
> Review the staged changes and write a conventional commit message

# PR description
> Generate a pull request description for the changes in this branch compared to main

# Code review
> Review the diff between main and this branch, focusing on potential issues
\`\`\`

## Debugging Workflows

\`\`\`bash
# Error analysis
> Here's the error stack trace: [paste error]
> Help me understand and fix this issue

# Performance investigation
> Profile this function and suggest optimizations
> @src/services/search.ts

# Log analysis
> Analyze these logs and identify the root cause of the 500 errors:
> [paste logs]
\`\`\`

## Refactoring Patterns

\`\`\`bash
# Large-scale refactoring
> Refactor the codebase to use a repository pattern:
> 1. First, show me the plan
> 2. Wait for my approval before making changes

# Dependency updates
> Update all dependencies to their latest versions and fix any breaking changes
\`\`\`

## Custom Commands with CLAUDE.md

Create a CLAUDE.md file in your project root:

\`\`\`markdown
# Project Instructions

## Code Style
- Use functional components with hooks
- Prefer named exports
- Use absolute imports with @/ prefix

## Testing
- Every new feature needs tests
- Use React Testing Library patterns

## Common Tasks
When asked to "add a feature":
1. Create types first
2. Write tests
3. Implement the feature
4. Update documentation
\`\`\`

## Session Management

\`\`\`bash
# Save session for later
/save my-feature-session

# Resume later
claude --resume my-feature-session

# Export conversation
/export conversation.md
\`\`\``,
      type: 'lesson',
      duration: '40 minutes',
      sectionId: claudeSection4.id,
    },
  })

  // ============================================
  // NEW LESSONS: Vector Databases & RAG Course
  // ============================================
  const ragLesson1 = await prisma.lesson.upsert({
    where: { id: 'rag-lesson-1' },
    update: {},
    create: {
      id: 'rag-lesson-1',
      title: 'Introduction to Embeddings',
      content: `# Introduction to Embeddings

Embeddings are the foundation of modern semantic search and RAG systems. They convert text into numerical representations that capture meaning.

## What Are Embeddings?

Embeddings are dense vector representations of text where similar meanings are close together in vector space.

\`\`\`python
# Example: Text to embedding
text = "The cat sat on the mat"
embedding = model.encode(text)
# Result: [0.023, -0.156, 0.089, ...] (typically 384-1536 dimensions)
\`\`\`

## Why Embeddings Matter

### Traditional Search (Keyword-based)
\`\`\`
Query: "automobile"
Matches: "automobile"
Misses: "car", "vehicle", "sedan"
\`\`\`

### Semantic Search (Embedding-based)
\`\`\`
Query: "automobile"
Matches: "car", "vehicle", "sedan", "automobile"
(All similar in meaning)
\`\`\`

## Creating Embeddings

### Using OpenAI
\`\`\`python
from openai import OpenAI

client = OpenAI()

response = client.embeddings.create(
    model="text-embedding-3-small",
    input="Hello, world!"
)

embedding = response.data[0].embedding
print(f"Dimensions: {len(embedding)}")  # 1536
\`\`\`

### Using Sentence Transformers (Local)
\`\`\`python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
embedding = model.encode("Hello, world!")
print(f"Dimensions: {len(embedding)}")  # 384
\`\`\`

## Measuring Similarity

### Cosine Similarity
\`\`\`python
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Example
text1 = "I love programming"
text2 = "Coding is my passion"
text3 = "The weather is nice"

emb1 = model.encode(text1)
emb2 = model.encode(text2)
emb3 = model.encode(text3)

print(cosine_similarity(emb1, emb2))  # ~0.75 (similar)
print(cosine_similarity(emb1, emb3))  # ~0.15 (different)
\`\`\`

## Choosing an Embedding Model

| Model | Dimensions | Speed | Quality |
|-------|------------|-------|---------|
| text-embedding-3-small | 1536 | Fast | Good |
| text-embedding-3-large | 3072 | Medium | Best |
| all-MiniLM-L6-v2 | 384 | Fastest | Good |
| bge-large-en | 1024 | Medium | Excellent |`,
      type: 'lesson',
      duration: '30 minutes',
      sectionId: ragSection1.id,
    },
  })

  const ragLesson2 = await prisma.lesson.upsert({
    where: { id: 'rag-lesson-2' },
    update: {},
    create: {
      id: 'rag-lesson-2',
      title: 'Chunking Strategies',
      content: `# Chunking Strategies

How you split your documents into chunks significantly impacts RAG quality.

## Why Chunking Matters

- Embeddings have token limits
- Smaller chunks = more precise retrieval
- Larger chunks = more context
- Finding the right balance is key

## Basic Chunking Methods

### 1. Fixed-Size Chunking
\`\`\`python
def fixed_size_chunks(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks
\`\`\`

### 2. Sentence-Based Chunking
\`\`\`python
import nltk
nltk.download('punkt')

def sentence_chunks(text, max_sentences=5):
    sentences = nltk.sent_tokenize(text)
    chunks = []
    current_chunk = []

    for sentence in sentences:
        current_chunk.append(sentence)
        if len(current_chunk) >= max_sentences:
            chunks.append(' '.join(current_chunk))
            current_chunk = []

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks
\`\`\`

### 3. Semantic Chunking
\`\`\`python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\\n\\n", "\\n", ". ", " ", ""]
)

chunks = splitter.split_text(document)
\`\`\`

## Advanced: Hierarchical Chunking

\`\`\`python
# Create parent and child chunks
def hierarchical_chunks(text):
    # Large chunks for context
    parent_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=0
    )

    # Small chunks for precise retrieval
    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50
    )

    parents = parent_splitter.split_text(text)

    hierarchy = []
    for i, parent in enumerate(parents):
        children = child_splitter.split_text(parent)
        hierarchy.append({
            'parent': parent,
            'children': children,
            'parent_id': i
        })

    return hierarchy
\`\`\`

## Chunking Best Practices

1. **Preserve context**: Don't split mid-sentence
2. **Use overlap**: 10-20% overlap prevents information loss
3. **Consider structure**: Respect document sections
4. **Add metadata**: Include source, page, section info`,
      type: 'lesson',
      duration: '35 minutes',
      sectionId: ragSection1.id,
    },
  })

  const ragLesson3 = await prisma.lesson.upsert({
    where: { id: 'rag-lesson-3' },
    update: {},
    create: {
      id: 'rag-lesson-3',
      title: 'Vector Database Fundamentals',
      content: `# Vector Database Fundamentals

Vector databases are optimized for storing and querying high-dimensional vectors.

## Popular Vector Databases

| Database | Type | Best For |
|----------|------|----------|
| Pinecone | Managed | Production, scale |
| Chroma | Local/Embedded | Development, prototypes |
| Weaviate | Self-hosted/Cloud | Full-featured needs |
| Qdrant | Self-hosted/Cloud | Performance |
| pgvector | Postgres extension | Existing Postgres users |

## Using Chroma (Local Development)

\`\`\`python
import chromadb
from chromadb.utils import embedding_functions

# Create client
client = chromadb.Client()

# Use OpenAI embeddings
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="your-key",
    model_name="text-embedding-3-small"
)

# Create collection
collection = client.create_collection(
    name="documents",
    embedding_function=openai_ef
)

# Add documents
collection.add(
    documents=["Doc 1 content", "Doc 2 content"],
    metadatas=[{"source": "file1"}, {"source": "file2"}],
    ids=["doc1", "doc2"]
)

# Query
results = collection.query(
    query_texts=["What is machine learning?"],
    n_results=5
)
\`\`\`

## Using Pinecone (Production)

\`\`\`python
from pinecone import Pinecone

pc = Pinecone(api_key="your-key")

# Create index
pc.create_index(
    name="documents",
    dimension=1536,
    metric="cosine"
)

index = pc.Index("documents")

# Upsert vectors
index.upsert(vectors=[
    {
        "id": "doc1",
        "values": embedding,
        "metadata": {"text": "...", "source": "..."}
    }
])

# Query
results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True
)
\`\`\`

## Indexing Strategies

### HNSW (Hierarchical Navigable Small World)
- Fast approximate search
- Good for high-dimensional data
- Most vector DBs use this

### IVF (Inverted File Index)
- Clusters vectors
- Good for very large datasets
- Trade-off: speed vs accuracy

## Metadata Filtering

\`\`\`python
# Query with filters
results = collection.query(
    query_texts=["machine learning"],
    n_results=5,
    where={
        "source": {"$eq": "textbook"},
        "year": {"$gte": 2020}
    }
)
\`\`\``,
      type: 'lesson',
      duration: '40 minutes',
      sectionId: ragSection2.id,
    },
  })

  const ragLesson4 = await prisma.lesson.upsert({
    where: { id: 'rag-lesson-4' },
    update: {},
    create: {
      id: 'rag-lesson-4',
      title: 'Building a RAG Pipeline',
      content: `# Building a RAG Pipeline

Combine all components into a complete RAG system.

## RAG Architecture

\`\`\`
User Query
    ↓
[Embed Query]
    ↓
[Vector Search] ← Vector DB
    ↓
[Retrieved Chunks]
    ↓
[Build Prompt with Context]
    ↓
[LLM Generation]
    ↓
Response
\`\`\`

## Complete Implementation

\`\`\`python
from openai import OpenAI
import chromadb

class RAGPipeline:
    def __init__(self):
        self.openai = OpenAI()
        self.chroma = chromadb.Client()
        self.collection = self.chroma.get_or_create_collection("docs")

    def embed(self, text):
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    def add_documents(self, documents):
        for i, doc in enumerate(documents):
            self.collection.add(
                documents=[doc['text']],
                metadatas=[doc.get('metadata', {})],
                ids=[f"doc_{i}"]
            )

    def retrieve(self, query, n_results=5):
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results['documents'][0]

    def generate(self, query, context):
        prompt = f"""Answer the question based on the context.

Context:
{chr(10).join(context)}

Question: {query}

Answer:"""

        response = self.openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    def query(self, question):
        # Retrieve relevant chunks
        context = self.retrieve(question)
        # Generate answer
        answer = self.generate(question, context)
        return {
            "answer": answer,
            "sources": context
        }

# Usage
rag = RAGPipeline()
rag.add_documents([
    {"text": "Python was created by Guido van Rossum..."},
    {"text": "Machine learning is a subset of AI..."}
])

result = rag.query("Who created Python?")
print(result["answer"])
\`\`\`

## Prompt Engineering for RAG

\`\`\`python
SYSTEM_PROMPT = """You are a helpful assistant that answers questions
based on the provided context.

Rules:
1. Only use information from the context
2. If the answer isn't in the context, say "I don't have that information"
3. Cite which part of the context you used
4. Be concise but complete"""

def build_prompt(query, context):
    context_str = "\\n---\\n".join([
        f"[Source {i+1}]: {c}"
        for i, c in enumerate(context)
    ])

    return f"""Context:
{context_str}

Question: {query}"""
\`\`\``,
      type: 'lesson',
      duration: '45 minutes',
      sectionId: ragSection3.id,
    },
  })

  const ragLesson5 = await prisma.lesson.upsert({
    where: { id: 'rag-lesson-5' },
    update: {},
    create: {
      id: 'rag-lesson-5',
      title: 'Advanced RAG Techniques',
      content: `# Advanced RAG Techniques

Improve retrieval quality with advanced strategies.

## Hybrid Search

Combine semantic search with keyword search:

\`\`\`python
from rank_bm25 import BM25Okapi

class HybridSearch:
    def __init__(self, documents):
        self.documents = documents
        # BM25 for keyword search
        tokenized = [doc.split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized)
        # Vector store for semantic search
        self.embeddings = [embed(doc) for doc in documents]

    def search(self, query, alpha=0.5):
        # Keyword scores
        keyword_scores = self.bm25.get_scores(query.split())

        # Semantic scores
        query_emb = embed(query)
        semantic_scores = [
            cosine_similarity(query_emb, emb)
            for emb in self.embeddings
        ]

        # Combine scores
        combined = [
            alpha * sem + (1 - alpha) * key
            for sem, key in zip(semantic_scores, keyword_scores)
        ]

        # Return top results
        ranked = sorted(
            enumerate(combined),
            key=lambda x: x[1],
            reverse=True
        )
        return [self.documents[i] for i, _ in ranked[:5]]
\`\`\`

## Query Expansion

Improve retrieval by expanding the query:

\`\`\`python
def expand_query(query):
    prompt = f"""Generate 3 alternative phrasings of this question:

Question: {query}

Alternatives:"""

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    alternatives = response.choices[0].message.content.split("\\n")
    return [query] + alternatives

# Search with all queries, deduplicate results
\`\`\`

## Re-ranking

Use a cross-encoder to re-rank initial results:

\`\`\`python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank(query, documents, top_k=3):
    pairs = [[query, doc] for doc in documents]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(documents, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return [doc for doc, _ in ranked[:top_k]]
\`\`\`

## Self-Query Retrieval

Let the LLM generate the filter:

\`\`\`python
def self_query(question):
    prompt = f"""Extract search parameters from this question:

Question: {question}

Return JSON with:
- query: the main search query
- filters: any filters (year, author, category, etc.)
"""

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)

# Example: "Find papers about transformers from 2023"
# Returns: {"query": "transformers", "filters": {"year": 2023}}
\`\`\``,
      type: 'lesson',
      duration: '50 minutes',
      sectionId: ragSection3.id,
    },
  })

  const ragLesson6 = await prisma.lesson.upsert({
    where: { id: 'rag-lesson-6' },
    update: {},
    create: {
      id: 'rag-lesson-6',
      title: 'Production RAG Systems',
      content: `# Production RAG Systems

Deploy and scale RAG systems for real-world use.

## Architecture for Scale

\`\`\`
                    Load Balancer
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   [API Server]    [API Server]    [API Server]
        ↓                ↓                ↓
        └────────────────┼────────────────┘
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
       [Vector DB]            [Cache Layer]
       (Pinecone)              (Redis)
\`\`\`

## Caching Strategy

\`\`\`python
import redis
import hashlib

class CachedRAG:
    def __init__(self):
        self.redis = redis.Redis()
        self.rag = RAGPipeline()
        self.ttl = 3600  # 1 hour

    def _cache_key(self, query):
        return f"rag:{hashlib.md5(query.encode()).hexdigest()}"

    def query(self, question):
        key = self._cache_key(question)

        # Check cache
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)

        # Generate response
        result = self.rag.query(question)

        # Cache result
        self.redis.setex(key, self.ttl, json.dumps(result))

        return result
\`\`\`

## Evaluation Metrics

\`\`\`python
from ragas import evaluate
from ragas.metrics import (
    context_precision,
    context_recall,
    faithfulness,
    answer_relevancy
)

# Evaluate your RAG system
results = evaluate(
    dataset,
    metrics=[
        context_precision,
        context_recall,
        faithfulness,
        answer_relevancy
    ]
)

print(results)
# {'context_precision': 0.85, 'faithfulness': 0.92, ...}
\`\`\`

## Monitoring

\`\`\`python
import logging
from datetime import datetime

class RAGMonitor:
    def __init__(self):
        self.logger = logging.getLogger("rag")

    def log_query(self, query, results, latency):
        self.logger.info({
            "timestamp": datetime.utcnow().isoformat(),
            "query": query,
            "num_results": len(results),
            "latency_ms": latency,
            "sources": [r.get("source") for r in results]
        })

    def log_feedback(self, query_id, helpful):
        self.logger.info({
            "type": "feedback",
            "query_id": query_id,
            "helpful": helpful
        })
\`\`\`

## Cost Optimization

1. **Batch embeddings**: Process multiple texts at once
2. **Cache embeddings**: Don't re-embed unchanged documents
3. **Use smaller models**: text-embedding-3-small vs large
4. **Optimize chunk size**: Balance quality vs token usage
5. **Implement rate limiting**: Prevent abuse`,
      type: 'project',
      duration: '60 minutes',
      hasProject: true,
      sectionId: ragSection4.id,
    },
  })

  // ============================================
  // NEW LESSONS: AI Agents Development Course
  // ============================================
  const agentsLesson1 = await prisma.lesson.upsert({
    where: { id: 'agents-lesson-1' },
    update: {},
    create: {
      id: 'agents-lesson-1',
      title: 'What Are AI Agents?',
      content: `# What Are AI Agents?

AI agents are autonomous systems that perceive their environment, make decisions, and take actions to achieve goals.

## Agent vs Chatbot

| Chatbot | Agent |
|---------|-------|
| Responds to queries | Takes initiative |
| Single turn | Multi-step reasoning |
| No tools | Uses external tools |
| Stateless | Maintains memory |

## The Agent Loop

\`\`\`
while not goal_achieved:
    1. Observe environment
    2. Think (reason about observations)
    3. Plan (decide on actions)
    4. Act (execute actions)
    5. Update memory
\`\`\`

## Core Components

### 1. LLM (The Brain)
\`\`\`python
from anthropic import Anthropic

client = Anthropic()

def think(observation):
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": observation}]
    )
    return response.content[0].text
\`\`\`

### 2. Tools (The Hands)
\`\`\`python
tools = {
    "search": lambda q: search_web(q),
    "calculate": lambda expr: safe_calculate(expr),
    "read_file": lambda path: open(path).read(),
}
\`\`\`

### 3. Memory (The Context)
\`\`\`python
class Memory:
    def __init__(self):
        self.short_term = []  # Recent interactions
        self.long_term = {}   # Persistent knowledge

    def add(self, item):
        self.short_term.append(item)

    def recall(self, query):
        # Retrieve relevant memories
        pass
\`\`\`

### 4. Planning (The Strategy)
\`\`\`python
def plan(goal, context):
    prompt = f"""
    Goal: {goal}
    Context: {context}

    Create a step-by-step plan to achieve this goal.
    """
    return think(prompt)
\`\`\`

## Simple Agent Example

\`\`\`python
class SimpleAgent:
    def __init__(self):
        self.memory = []

    def run(self, task):
        self.memory.append(f"Task: {task}")

        while True:
            thought = self.think()
            if "DONE" in thought:
                break

            action = self.decide_action(thought)
            result = self.execute(action)
            self.memory.append(f"Result: {result}")

        return self.summarize()
\`\`\``,
      type: 'lesson',
      duration: '30 minutes',
      sectionId: agentsSection1.id,
    },
  })

  const agentsLesson2 = await prisma.lesson.upsert({
    where: { id: 'agents-lesson-2' },
    update: {},
    create: {
      id: 'agents-lesson-2',
      title: 'Agent Architectures',
      content: `# Agent Architectures

Different patterns for building AI agents, each with trade-offs.

## 1. ReAct (Reasoning + Acting)

Interleave thinking and acting:

\`\`\`python
def react_agent(task):
    context = f"Task: {task}\\n"

    for _ in range(max_steps):
        # Thought
        thought = llm(f"{context}Thought:")
        context += f"Thought: {thought}\\n"

        # Action
        action = llm(f"{context}Action:")
        context += f"Action: {action}\\n"

        # Observation
        result = execute_action(action)
        context += f"Observation: {result}\\n"

        if "Final Answer" in action:
            return extract_answer(action)

# Example trace:
# Task: What's the weather in Paris?
# Thought: I need to check the weather API for Paris
# Action: weather_api("Paris")
# Observation: {"temp": 22, "condition": "sunny"}
# Thought: I have the weather information
# Action: Final Answer: It's 22C and sunny in Paris
\`\`\`

## 2. Plan-and-Execute

Create plan first, then execute:

\`\`\`python
def plan_execute_agent(task):
    # Planning phase
    plan = llm(f"""
    Task: {task}
    Create a numbered plan with specific steps.
    """)

    steps = parse_plan(plan)
    results = []

    # Execution phase
    for step in steps:
        result = execute_step(step, results)
        results.append(result)

        # Optional: replan if needed
        if should_replan(result):
            remaining = replan(task, results, steps)
            steps = steps[:current] + remaining

    return synthesize(results)
\`\`\`

## 3. LATS (Language Agent Tree Search)

Explore multiple paths:

\`\`\`python
def lats_agent(task, breadth=3, depth=5):
    root = Node(state=task)

    for _ in range(depth):
        # Expand: generate multiple next actions
        candidates = []
        for node in root.leaves():
            actions = llm(f"Generate {breadth} possible next actions for: {node.state}")
            for action in actions:
                child = Node(
                    state=execute(action),
                    parent=node,
                    score=evaluate(action)
                )
                candidates.append(child)

        # Select best branches
        best = sorted(candidates, key=lambda n: n.score)[:breadth]
        for node in best:
            node.parent.children.append(node)

    return best_path(root)
\`\`\`

## 4. Reflexion

Learn from mistakes:

\`\`\`python
def reflexion_agent(task, max_trials=3):
    reflections = []

    for trial in range(max_trials):
        # Attempt task
        trajectory = react_agent(task)
        result = evaluate_trajectory(trajectory)

        if result.success:
            return result

        # Reflect on failure
        reflection = llm(f"""
        Task: {task}
        Attempt: {trajectory}
        Outcome: {result}

        What went wrong? How can I do better?
        """)

        reflections.append(reflection)

    return best_attempt
\`\`\`

## Choosing an Architecture

| Use Case | Architecture |
|----------|--------------|
| Simple tasks | ReAct |
| Complex multi-step | Plan-and-Execute |
| Uncertain environments | LATS |
| Learning from errors | Reflexion |`,
      type: 'lesson',
      duration: '40 minutes',
      sectionId: agentsSection1.id,
    },
  })

  const agentsLesson3 = await prisma.lesson.upsert({
    where: { id: 'agents-lesson-3' },
    update: {},
    create: {
      id: 'agents-lesson-3',
      title: 'Implementing Tool Use',
      content: `# Implementing Tool Use

Enable agents to interact with external systems.

## Defining Tools

\`\`\`python
from anthropic import Anthropic

client = Anthropic()

# Define tool schema
tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name"
                }
            },
            "required": ["location"]
        }
    },
    {
        "name": "search_web",
        "description": "Search the web for information",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }
    }
]
\`\`\`

## Tool Execution

\`\`\`python
def execute_tool(name, inputs):
    if name == "get_weather":
        return fetch_weather(inputs["location"])
    elif name == "search_web":
        return search_api(inputs["query"])
    else:
        return f"Unknown tool: {name}"

def agent_with_tools(task):
    messages = [{"role": "user", "content": task}]

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            tools=tools,
            messages=messages
        )

        # Check if Claude wants to use a tool
        if response.stop_reason == "tool_use":
            tool_use = next(
                block for block in response.content
                if block.type == "tool_use"
            )

            # Execute the tool
            result = execute_tool(tool_use.name, tool_use.input)

            # Add tool result to messages
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": result
                }]
            })
        else:
            # Claude is done
            return response.content[0].text
\`\`\`

## Building Custom Tools

\`\`\`python
class Tool:
    def __init__(self, name, description, func, schema):
        self.name = name
        self.description = description
        self.func = func
        self.schema = schema

    def to_dict(self):
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.schema
        }

    def execute(self, inputs):
        return self.func(**inputs)

# Example: Database query tool
db_tool = Tool(
    name="query_database",
    description="Execute SQL query on the database",
    func=lambda sql: db.execute(sql).fetchall(),
    schema={
        "type": "object",
        "properties": {
            "sql": {"type": "string", "description": "SQL query"}
        },
        "required": ["sql"]
    }
)
\`\`\`

## Tool Safety

\`\`\`python
DANGEROUS_PATTERNS = ["DROP", "DELETE", "TRUNCATE"]

def safe_execute(tool, inputs):
    # Validate inputs
    if tool.name == "query_database":
        sql = inputs.get("sql", "").upper()
        if any(p in sql for p in DANGEROUS_PATTERNS):
            return "Error: Destructive queries not allowed"

    # Rate limiting
    if rate_limiter.is_exceeded(tool.name):
        return "Error: Rate limit exceeded"

    return tool.execute(inputs)
\`\`\``,
      type: 'lesson',
      duration: '45 minutes',
      sectionId: agentsSection2.id,
    },
  })

  const agentsLesson4 = await prisma.lesson.upsert({
    where: { id: 'agents-lesson-4' },
    update: {},
    create: {
      id: 'agents-lesson-4',
      title: 'Memory Systems for Agents',
      content: `# Memory Systems for Agents

Give agents the ability to remember and learn.

## Types of Memory

### 1. Short-Term Memory (Conversation)
\`\`\`python
class ConversationMemory:
    def __init__(self, max_messages=20):
        self.messages = []
        self.max_messages = max_messages

    def add(self, role, content):
        self.messages.append({"role": role, "content": content})
        # Trim if too long
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def get_context(self):
        return self.messages
\`\`\`

### 2. Long-Term Memory (Vector Store)
\`\`\`python
class LongTermMemory:
    def __init__(self):
        self.vectorstore = Chroma()
        self.embedding_model = OpenAIEmbeddings()

    def store(self, content, metadata=None):
        embedding = self.embedding_model.embed(content)
        self.vectorstore.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata or {}]
        )

    def recall(self, query, k=5):
        results = self.vectorstore.query(
            query_texts=[query],
            n_results=k
        )
        return results['documents'][0]
\`\`\`

### 3. Working Memory (Scratchpad)
\`\`\`python
class WorkingMemory:
    def __init__(self):
        self.scratchpad = {}
        self.current_plan = []
        self.completed_steps = []

    def note(self, key, value):
        self.scratchpad[key] = value

    def get_note(self, key):
        return self.scratchpad.get(key)

    def set_plan(self, steps):
        self.current_plan = steps
        self.completed_steps = []

    def complete_step(self, step):
        self.completed_steps.append(step)
        self.current_plan.remove(step)
\`\`\`

## Unified Memory System

\`\`\`python
class AgentMemory:
    def __init__(self):
        self.short_term = ConversationMemory()
        self.long_term = LongTermMemory()
        self.working = WorkingMemory()

    def build_context(self, current_query):
        # Get conversation history
        recent = self.short_term.get_context()

        # Retrieve relevant long-term memories
        relevant = self.long_term.recall(current_query)

        # Get working memory state
        notes = self.working.scratchpad
        plan = self.working.current_plan

        return {
            "conversation": recent,
            "relevant_knowledge": relevant,
            "working_notes": notes,
            "current_plan": plan
        }

    def update_from_interaction(self, query, response, important=False):
        self.short_term.add("user", query)
        self.short_term.add("assistant", response)

        if important:
            self.long_term.store(
                f"Q: {query}\\nA: {response}",
                metadata={"type": "interaction"}
            )
\`\`\`

## Memory-Augmented Prompting

\`\`\`python
def create_prompt_with_memory(task, memory):
    context = memory.build_context(task)

    return f"""You are an AI assistant with access to memory.

## Recent Conversation
{format_messages(context['conversation'])}

## Relevant Knowledge
{format_list(context['relevant_knowledge'])}

## Current Working Notes
{format_dict(context['working_notes'])}

## Current Plan
{format_plan(context['current_plan'])}

## Task
{task}
"""
\`\`\``,
      type: 'lesson',
      duration: '45 minutes',
      sectionId: agentsSection3.id,
    },
  })

  const agentsLesson5 = await prisma.lesson.upsert({
    where: { id: 'agents-lesson-5' },
    update: {},
    create: {
      id: 'agents-lesson-5',
      title: 'Multi-Agent Systems',
      content: `# Multi-Agent Systems

Coordinate multiple specialized agents.

## Why Multi-Agent?

- **Specialization**: Each agent excels at specific tasks
- **Parallelization**: Multiple agents work simultaneously
- **Modularity**: Easier to develop and maintain
- **Robustness**: System continues if one agent fails

## Agent Roles

\`\`\`python
class Agent:
    def __init__(self, name, role, tools):
        self.name = name
        self.role = role
        self.tools = tools

    def process(self, task):
        prompt = f"""You are {self.name}, a {self.role}.
        Your tools: {[t.name for t in self.tools]}
        Task: {task}
        """
        return llm_with_tools(prompt, self.tools)

# Specialized agents
researcher = Agent(
    name="Researcher",
    role="expert at finding and analyzing information",
    tools=[search_tool, read_url_tool]
)

coder = Agent(
    name="Coder",
    role="expert programmer who writes clean, tested code",
    tools=[write_file_tool, run_code_tool]
)

critic = Agent(
    name="Critic",
    role="reviewer who finds issues and suggests improvements",
    tools=[read_file_tool]
)
\`\`\`

## Coordination Patterns

### 1. Sequential Pipeline
\`\`\`python
def pipeline(task, agents):
    result = task
    for agent in agents:
        result = agent.process(result)
    return result

# Research -> Code -> Review
result = pipeline(
    "Build a weather CLI tool",
    [researcher, coder, critic]
)
\`\`\`

### 2. Hierarchical (Manager-Worker)
\`\`\`python
class ManagerAgent:
    def __init__(self, workers):
        self.workers = {w.name: w for w in workers}

    def process(self, task):
        # Decompose task
        subtasks = self.decompose(task)

        results = {}
        for subtask in subtasks:
            worker = self.assign(subtask)
            results[subtask] = worker.process(subtask)

        # Synthesize results
        return self.synthesize(results)

    def assign(self, subtask):
        prompt = f"Which worker should handle: {subtask}\\nWorkers: {list(self.workers.keys())}"
        choice = llm(prompt)
        return self.workers[choice]
\`\`\`

### 3. Debate/Discussion
\`\`\`python
def debate(question, agents, rounds=3):
    responses = {a.name: "" for a in agents}

    for round in range(rounds):
        for agent in agents:
            context = f"""
            Question: {question}
            Previous responses: {responses}
            Round {round + 1}: What's your position?
            """
            responses[agent.name] = agent.process(context)

    # Final synthesis
    return synthesize_debate(responses)
\`\`\`

## Communication Protocol

\`\`\`python
from dataclasses import dataclass
from typing import Any

@dataclass
class Message:
    sender: str
    receiver: str
    content: Any
    msg_type: str  # "task", "result", "question", "answer"

class MessageBus:
    def __init__(self):
        self.queues = {}

    def register(self, agent_name):
        self.queues[agent_name] = []

    def send(self, message):
        self.queues[message.receiver].append(message)

    def receive(self, agent_name):
        if self.queues[agent_name]:
            return self.queues[agent_name].pop(0)
        return None
\`\`\``,
      type: 'lesson',
      duration: '50 minutes',
      sectionId: agentsSection4.id,
    },
  })

  const agentsLesson6 = await prisma.lesson.upsert({
    where: { id: 'agents-lesson-6' },
    update: {},
    create: {
      id: 'agents-lesson-6',
      title: 'Building a Complete Agent System',
      content: `# Building a Complete Agent System

Put it all together: a production-ready agent framework.

## Project: Research Assistant Agent

An agent that researches topics, writes summaries, and answers questions.

### Architecture

\`\`\`
                    User
                      |
               [Orchestrator]
              /      |       \\
    [Researcher] [Writer] [QA Agent]
         |          |          |
    [Web Search] [Files]  [Verify Facts]
\`\`\`

### Implementation

\`\`\`python
from anthropic import Anthropic
from dataclasses import dataclass
import chromadb

@dataclass
class ResearchResult:
    topic: str
    sources: list
    summary: str
    confidence: float

class ResearchAssistant:
    def __init__(self):
        self.client = Anthropic()
        self.memory = chromadb.Client().create_collection("research")
        self.tools = self._setup_tools()

    def _setup_tools(self):
        return [
            {
                "name": "web_search",
                "description": "Search the web for information",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "save_finding",
                "description": "Save an important finding to memory",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "content": {"type": "string"},
                        "source": {"type": "string"}
                    },
                    "required": ["content", "source"]
                }
            },
            {
                "name": "recall",
                "description": "Recall relevant information from memory",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"}
                    },
                    "required": ["query"]
                }
            }
        ]

    def research(self, topic: str) -> ResearchResult:
        messages = [{
            "role": "user",
            "content": f"""Research this topic thoroughly: {topic}

            Steps:
            1. Search for relevant information
            2. Save key findings to memory
            3. Synthesize into a comprehensive summary

            Be thorough and cite your sources."""
        }]

        sources = []

        while True:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                tools=self.tools,
                messages=messages
            )

            if response.stop_reason == "tool_use":
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = self._execute_tool(block.name, block.input)
                        if block.name == "web_search":
                            sources.extend(result.get("sources", []))
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result)
                        })

                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})
            else:
                summary = response.content[0].text
                break

        return ResearchResult(
            topic=topic,
            sources=sources,
            summary=summary,
            confidence=self._assess_confidence(summary, sources)
        )

    def _execute_tool(self, name, inputs):
        if name == "web_search":
            return self._search_web(inputs["query"])
        elif name == "save_finding":
            self.memory.add(
                documents=[inputs["content"]],
                metadatas=[{"source": inputs["source"]}],
                ids=[f"finding_{len(self.memory.get()['ids'])}"]
            )
            return {"status": "saved"}
        elif name == "recall":
            results = self.memory.query(
                query_texts=[inputs["query"]],
                n_results=5
            )
            return {"findings": results["documents"][0]}

    def _search_web(self, query):
        # Implement web search
        pass

    def _assess_confidence(self, summary, sources):
        # Assess based on source count and agreement
        return min(len(sources) / 5, 1.0)

# Usage
assistant = ResearchAssistant()
result = assistant.research("Latest developments in quantum computing")
print(result.summary)
print(f"Confidence: {result.confidence}")
print(f"Sources: {result.sources}")
\`\`\``,
      type: 'project',
      duration: '90 minutes',
      hasProject: true,
      sectionId: agentsSection4.id,
    },
  })

  console.log({ htmlLesson1, htmlLesson2, cssLesson1 })
  console.log({ n8nLesson1, n8nLesson2, n8nLesson3, n8nLesson4, n8nLesson5, n8nLesson6 })
  console.log({ claudeLesson1, claudeLesson2, claudeLesson3, claudeLesson4, claudeLesson5, claudeLesson6 })
  console.log({ ragLesson1, ragLesson2, ragLesson3, ragLesson4, ragLesson5, ragLesson6 })
  console.log({ agentsLesson1, agentsLesson2, agentsLesson3, agentsLesson4, agentsLesson5, agentsLesson6 })

  // Create quiz questions
  const htmlQuiz1 = await prisma.quizQuestion.upsert({
    where: { id: 'html-quiz-1' },
    update: {},
    create: {
      id: 'html-quiz-1',
      question: 'What does HTML stand for?',
      options: JSON.stringify([
        'Hyper Text Markup Language',
        'High Tech Modern Language',
        'Hyper Transfer Markup Language',
        'Home Tool Markup Language',
      ]),
      correctAnswer: 0,
      explanation: 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
      lessonId: htmlLesson1.id,
    },
  })

  const htmlQuiz2 = await prisma.quizQuestion.upsert({
    where: { id: 'html-quiz-2' },
    update: {},
    create: {
      id: 'html-quiz-2',
      question: 'Which tag is used to define an HTML document?',
      options: JSON.stringify(['<body>', '<html>', '<head>', '<document>']),
      correctAnswer: 1,
      explanation: 'The <html> tag is used to define an HTML document.',
      lessonId: htmlLesson1.id,
    },
  })

  // ============================================
  // NEW QUIZ QUESTIONS: n8n Automation Course
  // ============================================
  const n8nQuiz1 = await prisma.quizQuestion.upsert({
    where: { id: 'n8n-quiz-1' },
    update: {},
    create: {
      id: 'n8n-quiz-1',
      question: 'What is a "trigger" in n8n?',
      options: JSON.stringify([
        'A node that starts a workflow when an event occurs',
        'A debugging tool',
        'A data transformation function',
        'A way to connect two workflows',
      ]),
      correctAnswer: 0,
      explanation: 'A trigger is a special type of node that starts a workflow when a specific event occurs, such as receiving a webhook, on a schedule, or when a new email arrives.',
      lessonId: n8nLesson1.id,
    },
  })

  const n8nQuiz2 = await prisma.quizQuestion.upsert({
    where: { id: 'n8n-quiz-2' },
    update: {},
    create: {
      id: 'n8n-quiz-2',
      question: 'Which n8n node would you use to transform data by extracting specific fields?',
      options: JSON.stringify([
        'HTTP Request',
        'Set',
        'Webhook',
        'IF',
      ]),
      correctAnswer: 1,
      explanation: 'The Set node is used to transform data by mapping, renaming, or extracting specific fields from the input data.',
      lessonId: n8nLesson4.id,
    },
  })

  // ============================================
  // NEW QUIZ QUESTIONS: Claude Code Course
  // ============================================
  const claudeQuiz1 = await prisma.quizQuestion.upsert({
    where: { id: 'claude-quiz-1' },
    update: {},
    create: {
      id: 'claude-quiz-1',
      question: 'What is the purpose of the CLAUDE.md file?',
      options: JSON.stringify([
        'To store API keys',
        'To provide project-specific instructions to Claude Code',
        'To configure the terminal color scheme',
        'To define test cases',
      ]),
      correctAnswer: 1,
      explanation: 'The CLAUDE.md file provides project-specific instructions and context to Claude Code, helping it understand your project conventions, patterns, and preferences.',
      lessonId: claudeLesson6.id,
    },
  })

  const claudeQuiz2 = await prisma.quizQuestion.upsert({
    where: { id: 'claude-quiz-2' },
    update: {},
    create: {
      id: 'claude-quiz-2',
      question: 'What is the recommended approach when asking Claude Code to implement a complex feature?',
      options: JSON.stringify([
        'Write a single vague prompt',
        'Break it down into specific, step-by-step instructions',
        'Only provide the function name',
        'Let Claude guess the requirements',
      ]),
      correctAnswer: 1,
      explanation: 'Breaking complex features into specific, step-by-step instructions (the Iterative Pattern) helps Claude understand exactly what you need and produces better results.',
      lessonId: claudeLesson3.id,
    },
  })

  // ============================================
  // NEW QUIZ QUESTIONS: RAG Course
  // ============================================
  const ragQuiz1 = await prisma.quizQuestion.upsert({
    where: { id: 'rag-quiz-1' },
    update: {},
    create: {
      id: 'rag-quiz-1',
      question: 'What is the primary purpose of text embeddings in RAG systems?',
      options: JSON.stringify([
        'To compress text for storage',
        'To convert text into numerical vectors that capture semantic meaning',
        'To encrypt sensitive data',
        'To format text for display',
      ]),
      correctAnswer: 1,
      explanation: 'Embeddings convert text into dense vectors where semantically similar texts are close together in vector space, enabling semantic search rather than keyword matching.',
      lessonId: ragLesson1.id,
    },
  })

  const ragQuiz2 = await prisma.quizQuestion.upsert({
    where: { id: 'rag-quiz-2' },
    update: {},
    create: {
      id: 'rag-quiz-2',
      question: 'Why is chunk overlap important when splitting documents?',
      options: JSON.stringify([
        'To increase storage requirements',
        'To prevent information loss at chunk boundaries',
        'To slow down retrieval',
        'To confuse the embedding model',
      ]),
      correctAnswer: 1,
      explanation: 'Chunk overlap ensures that context is not lost at the boundaries between chunks, preserving information that might span two consecutive chunks.',
      lessonId: ragLesson2.id,
    },
  })

  // ============================================
  // NEW QUIZ QUESTIONS: AI Agents Course
  // ============================================
  const agentsQuiz1 = await prisma.quizQuestion.upsert({
    where: { id: 'agents-quiz-1' },
    update: {},
    create: {
      id: 'agents-quiz-1',
      question: 'What distinguishes an AI agent from a simple chatbot?',
      options: JSON.stringify([
        'Agents can only respond to questions',
        'Agents can use tools, maintain memory, and take autonomous actions',
        'Chatbots are more advanced',
        'There is no difference',
      ]),
      correctAnswer: 1,
      explanation: 'AI agents differ from chatbots by their ability to use external tools, maintain memory across interactions, plan and execute multi-step tasks, and take autonomous actions to achieve goals.',
      lessonId: agentsLesson1.id,
    },
  })

  const agentsQuiz2 = await prisma.quizQuestion.upsert({
    where: { id: 'agents-quiz-2' },
    update: {},
    create: {
      id: 'agents-quiz-2',
      question: 'What is the ReAct pattern in agent architecture?',
      options: JSON.stringify([
        'A React.js framework for agents',
        'Interleaving reasoning (thinking) and acting in a loop',
        'A way to make agents react faster',
        'A database pattern',
      ]),
      correctAnswer: 1,
      explanation: 'ReAct (Reasoning + Acting) is an agent architecture pattern where the agent alternates between thinking about the current situation and taking actions, with observations feeding back into the reasoning process.',
      lessonId: agentsLesson2.id,
    },
  })

  console.log({ htmlQuiz1, htmlQuiz2 })
  console.log({ n8nQuiz1, n8nQuiz2 })
  console.log({ claudeQuiz1, claudeQuiz2 })
  console.log({ ragQuiz1, ragQuiz2 })
  console.log({ agentsQuiz1, agentsQuiz2 })

  // Create achievements
  const firstLessonAchievement = await prisma.achievement.upsert({
    where: { id: 'first-lesson' },
    update: {},
    create: {
      id: 'first-lesson',
      name: 'First Steps',
      description: 'Completed your first lesson',
      icon: 'book-open',
    },
  })

  const firstCourseAchievement = await prisma.achievement.upsert({
    where: { id: 'first-course' },
    update: {},
    create: {
      id: 'first-course',
      name: 'Course Graduate',
      description: 'Completed your first course',
      icon: 'award',
    },
  })

  console.log({ firstLessonAchievement, firstCourseAchievement })

  // Create discussions
  const discussion1 = await prisma.discussion.upsert({
    where: { id: 'discussion-1' },
    update: {},
    create: {
      id: 'discussion-1',
      userId: user.id,
      content: 'I found this lesson really helpful! Can someone explain more about semantic HTML?',
      lessonId: htmlLesson1.id,
      likes: 5,
    },
  })

  const reply1 = await prisma.discussionReply.upsert({
    where: { id: 'reply-1' },
    update: {},
    create: {
      id: 'reply-1',
      userId: admin.id,
      discussionId: discussion1.id,
      content: 'Semantic HTML refers to using HTML elements that clearly describe their meaning to both the browser and the developer. Examples include <header>, <footer>, <article>, etc.',
      likes: 3,
    },
  })

  console.log({ discussion1, reply1 })

  // Create course progress
  const userProgress = await prisma.courseProgress.upsert({
    where: { id: 'user-html-progress' },
    update: {},
    create: {
      id: 'user-html-progress',
      userId: user.id,
      courseId: htmlCourse.id,
      lastAccessed: new Date(),
      completedLessons: {
        connect: [{ id: htmlLesson1.id }],
      },
    },
  })

  console.log({ userProgress })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
