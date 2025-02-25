# Eureka Learning Platform

Eureka is a modern learning platform inspired by The Odin Project, designed to provide a comprehensive and interactive learning experience for web development and programming.

## Features

- **Learning Paths**: Structured learning paths for different technologies and skill levels
- **Interactive Courses**: Comprehensive courses with lessons, quizzes, and projects
- **Project Submissions**: Submit your projects for review and feedback
- **Community Discussions**: Engage with other learners through discussions
- **Knowledge Checks**: Test your understanding with interactive quizzes
- **Course Certificates**: Earn certificates upon course completion
- **Progress Tracking**: Track your learning progress across courses and paths

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with SQLite
- **Authentication**: Clerk
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/eureka.git
   cd eureka
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
eureka/
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── src/
    ├── app/             # Next.js app router
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

## API Endpoints

- `GET /api/courses` - Get all courses
- `GET /api/paths` - Get all learning paths
- `GET /api/lessons/:id` - Get a specific lesson by ID

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
