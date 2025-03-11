# VivanceData Learning Platform

VivanceData Learning is a comprehensive educational platform focused on AI and data science skills, providing structured courses, interactive content, and community-driven learning experiences.

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

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI components
- **Database**: Prisma ORM with SQLite (expandable to PostgreSQL)
- **Authentication**: NextAuth.js with multiple provider options
- **Content Management**: Markdown-based course content with MDX for interactive elements
- **Testing**: Jest and React Testing Library

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

3. Set up the database:
```bash
npx prisma migrate dev
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

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
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run db:seed` - Seed the database with sample data
- `npm run prisma:studio` - Open Prisma Studio to manage the database

## Current Learning Paths

The platform currently offers the following learning paths:

1. **Web Development** - From basics to advanced frontend and backend development
2. **Data Science** - Statistical analysis, data visualization, and machine learning
3. **Mobile Development** - Cross-platform and native mobile application development

## API Endpoints

- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get a specific course
- `GET /api/paths` - Get all learning paths
- `GET /api/paths/:id` - Get a specific learning path
- `GET /api/lessons/:id` - Get a specific lesson

## Contributing

We welcome contributions to the VivanceData Learning Platform! Please review our contributing guidelines before submitting pull requests.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

© 2025 VivanceData, Inc. All Rights Reserved.
