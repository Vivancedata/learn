# VivanceData Exercises

Welcome to the VivanceData hands-on coding exercises! This repository contains practical exercises designed to reinforce the concepts taught in our AI and Data Science curriculum.

## Purpose

These exercises provide:

- **Hands-on practice** with real coding challenges
- **Immediate feedback** through automated tests
- **Progressive difficulty** that builds on previous concepts
- **Self-paced learning** you can complete at your own speed

The exercises complement the main VivanceData curriculum by giving you opportunities to apply what you've learned in a structured, test-driven environment.

## How to Use These Exercises

### Step 1: Fork and Clone

1. **Fork this repository** to your own GitHub account (click the "Fork" button)
2. **Clone your fork** to your local machine:
   ```bash
   git clone https://github.com/YOUR-USERNAME/vivancedata-exercises.git
   cd vivancedata-exercises/exercises
   ```

### Step 2: Set Up Your Environment

Install the required dependencies:

```bash
# Install Python dependencies
pip install pytest pytest-cov

# For SQL exercises, you'll also need sqlite3 (usually pre-installed)
```

### Step 3: Work Through Exercises

Each exercise follows the same structure:

```
exercise-name/
  README.md        # Instructions and hints
  exercise.py      # Starter code with TODOs (your workspace)
  test_exercise.py # Tests to verify your solution
  solution.py      # Reference solution (try not to peek!)
```

**Workflow:**

1. Read the `README.md` to understand the exercise
2. Open `exercise.py` (or `exercise.sql` for SQL exercises)
3. Complete the TODOs in the starter code
4. Run the tests to check your work:
   ```bash
   # For a specific exercise
   pytest python-basics/exercises/01-variables/test_exercise.py -v

   # For all Python exercises
   pytest python-basics/ -v

   # For all SQL exercises
   pytest sql-fundamentals/ -v
   ```
5. Keep iterating until all tests pass
6. Compare with `solution.py` to see alternative approaches

### Step 4: Track Your Progress

Commit your solutions to your fork:

```bash
git add .
git commit -m "Complete exercise: 01-variables"
git push origin main
```

## Important: Never Submit Pull Requests

**Do NOT submit pull requests** with your solutions to the main repository.

Why?
- Keeps your solutions private to you
- Prevents spoilers for other learners
- Allows you to track your personal progress in your fork

If you find a bug or want to suggest improvements to the exercise itself (not solutions), please open an issue instead.

## Exercise Categories

### Python Basics
Foundation exercises covering Python fundamentals for data science:
- Variables and data types
- Functions and control flow
- Data structures (lists, dictionaries, sets)

[Start Python Basics](./python-basics/README.md)

### SQL Fundamentals
Essential SQL skills for data analysis:
- SELECT statements and basic queries
- Filtering with WHERE clauses
- JOIN operations for combining tables

[Start SQL Fundamentals](./sql-fundamentals/README.md)

## Running All Tests

```bash
# Run all exercises
pytest . -v

# Run with coverage report
pytest . --cov=. --cov-report=html

# Run specific category
pytest python-basics/ -v
pytest sql-fundamentals/ -v
```

## Curriculum Integration

These exercises correspond to lessons in the VivanceData Learning Platform:

| Exercise Set | Related Course |
|-------------|----------------|
| Python Basics | Introduction to Python for Data Science |
| SQL Fundamentals | SQL for Data Analysis |

Visit [VivanceData](http://localhost:3000) to access the full curriculum with video lessons, explanations, and projects.

## Getting Help

If you're stuck:

1. **Re-read the instructions** - hints are often in the README
2. **Check the test file** - tests show exactly what's expected
3. **Review the related lesson** - go back to the curriculum
4. **Use the community** - ask in the VivanceData discussions
5. **Check the solution** - as a last resort, learn from the reference

## Tips for Success

1. **Don't skip ahead** - exercises build on each other
2. **Type the code yourself** - don't copy/paste
3. **Read error messages carefully** - they tell you what's wrong
4. **Experiment** - try variations beyond the requirements
5. **Commit often** - track your progress with git

---

Happy coding! Remember, the goal is learning, not just passing tests.
