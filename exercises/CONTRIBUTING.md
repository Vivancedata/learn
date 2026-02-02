# Contributing to VivanceData Exercises

Thank you for your interest in contributing to the VivanceData exercise repository! This guide explains how to add new exercises or improve existing ones.

## Important: Do Not Submit Solutions

This repository is for **exercise content only**. Please do NOT submit:
- Your completed exercise solutions
- Pull requests that fill in exercise.py/exercise.sql files
- "Answers" to the exercises

If you want to track your own progress, fork the repository and commit to your fork.

## Types of Contributions Welcome

1. **New exercises** - Add exercises for new topics
2. **Bug fixes** - Fix errors in tests or instructions
3. **Improvements** - Better hints, clearer instructions, more edge cases
4. **Documentation** - Improve README files or add clarifications
5. **Accessibility** - Make exercises more accessible to different learners

## Exercise Structure

### Python Exercise

Each Python exercise must have this structure:

```
exercises/category-name/exercises/NN-exercise-name/
  README.md          # Instructions with hints
  exercise.py        # Starter code with TODOs
  test_exercise.py   # pytest tests
  solution.py        # Reference solution
```

### SQL Exercise

Each SQL exercise must have this structure:

```
exercises/category-name/exercises/NN-exercise-name/
  README.md          # Instructions with hints
  exercise.sql       # Starter queries with TODOs
  test_queries.py    # pytest tests using sqlite3
  solution.sql       # Reference solution
```

## Adding a New Exercise

### Step 1: Plan the Exercise

Before coding, plan:
- **Learning objective** - What skill does this teach?
- **Prerequisites** - What should learners already know?
- **Difficulty** - How challenging is it?
- **Progression** - How does it build on previous exercises?

### Step 2: Create the Directory Structure

```bash
mkdir -p category-name/exercises/NN-topic-name
```

Use a number prefix (01, 02, etc.) to indicate order within the category.

### Step 3: Write the README.md

Include these sections:

```markdown
# Exercise NN: Topic Name

Brief introduction (1-2 sentences).

## Learning Objectives

- Objective 1
- Objective 2

## Prerequisites (if applicable)

Complete [Exercise XX](../XX-name/README.md) first.

## Instructions

Explain what the learner should do.

## Tasks

### Task 1: function_name()
Description of what this function should do.

### Task 2: another_function()
...

## Running Tests

\`\`\`bash
pytest path/to/test_file.py -v
\`\`\`

## Hints

<details>
<summary>Hint 1: Topic</summary>
Helpful hint without giving away the answer.
</details>

## Common Mistakes

1. Mistake description
2. Another common mistake

## Next Exercise

Link to the next exercise.
```

### Step 4: Write the exercise.py (or exercise.sql)

Guidelines:
- Include clear docstrings explaining each task
- Use `# TODO:` comments for what learners need to complete
- Use `pass` as placeholder in Python functions
- Include type hints for Python
- Provide helpful comments but not the solution

Example Python starter:

```python
"""
Exercise NN: Topic Name

Complete each function below according to its docstring.
Run the tests to verify: pytest test_exercise.py -v
"""

def my_function(param: str) -> int:
    """
    Description of what this function does.

    Args:
        param: Description of parameter

    Returns:
        Description of return value

    Example:
        >>> my_function("test")
        4
    """
    # TODO: Implement this function
    pass
```

### Step 5: Write the Tests

Test requirements:
- Test all specified functionality
- Include edge cases (empty inputs, boundary values)
- Use descriptive test names
- Group related tests in classes
- Provide helpful assertion messages

Example test structure:

```python
"""
Tests for Exercise NN: Topic Name

Run with: pytest test_exercise.py -v
"""

import pytest
from exercise import my_function


class TestMyFunction:
    """Tests for my_function."""

    def test_basic_case(self):
        """Should handle basic input."""
        result = my_function("test")
        assert result == 4

    def test_edge_case(self):
        """Should handle empty string."""
        result = my_function("")
        assert result == 0

    def test_returns_correct_type(self):
        """Should return an integer."""
        result = my_function("anything")
        assert isinstance(result, int)
```

### Step 6: Write the Solution

Solution guidelines:
- Must pass ALL tests
- Include comments explaining the approach
- Show alternative approaches when useful
- NO `TODO` markers in solutions
- Follow the same code style as the exercise

Example solution:

```python
"""
Solution for Exercise NN: Topic Name

This file contains reference solutions.
Compare your solution to see different approaches.
"""

def my_function(param: str) -> int:
    """
    Description of what this function does.
    """
    return len(param)

    # Alternative approach:
    # count = 0
    # for char in param:
    #     count += 1
    # return count
```

### Step 7: Test Your Exercise

Before submitting:

```bash
# Test that the starter code syntax is valid
python -c "import exercise"  # For Python

# Test that solutions pass
cp solution.py exercise.py  # Temporarily
pytest test_exercise.py -v
mv exercise.py.bak exercise.py  # Restore starter

# Check for common issues
grep -n "TODO" solution.py  # Should find nothing
```

### Step 8: Submit a Pull Request

1. Fork the repository (if you haven't)
2. Create a feature branch: `git checkout -b add-exercise-topic-name`
3. Commit your changes with clear messages
4. Push to your fork
5. Open a Pull Request with:
   - Description of the new exercise
   - Learning objectives
   - How it fits into the curriculum

## Quality Checklist

Before submitting, verify:

- [ ] README.md has all required sections
- [ ] Exercise file has clear TODOs and docstrings
- [ ] All tests pass with the solution
- [ ] Tests cover basic and edge cases
- [ ] Solution has no TODO markers
- [ ] Files follow naming conventions
- [ ] Code follows style guidelines
- [ ] Exercise builds on appropriate prerequisites

## Style Guidelines

### Python
- Use type hints
- Follow PEP 8
- Use descriptive variable names
- Maximum line length: 100 characters

### SQL
- Use uppercase for keywords (SELECT, WHERE, JOIN)
- Use lowercase for table/column names
- End each query with semicolon
- Format multi-line queries for readability

### Documentation
- Use clear, simple language
- Avoid jargon where possible
- Provide examples
- Include hints with collapsible sections

## Testing Your Contribution

Run the full test suite:

```bash
# From exercises directory
pytest . -v

# Check structure
./scripts/validate_structure.sh  # If available
```

## Getting Help

- Open an issue for questions
- Tag maintainers for review
- Join the VivanceData community discussions

## Code of Conduct

Be respectful and constructive. We're all here to learn and help others learn.

Thank you for contributing to education!
