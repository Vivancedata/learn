# Python Basics Exercises

This exercise set covers Python fundamentals essential for data science and AI development. Complete these exercises in order, as each builds on concepts from previous ones.

## Prerequisites

Before starting these exercises, you should:
- Have Python 3.9+ installed
- Understand basic programming concepts (what variables are, basic logic)
- Have completed the "Introduction to Python" lesson in the VivanceData curriculum

## Exercises

### 01 - Variables and Data Types
Learn to work with Python's core data types: integers, floats, strings, and booleans.

**Concepts covered:**
- Variable assignment
- Numeric operations
- String manipulation
- Type conversion

[Start Exercise](./exercises/01-variables/README.md)

### 02 - Functions
Master defining and using functions, the building blocks of reusable code.

**Concepts covered:**
- Function definition with `def`
- Parameters and arguments
- Return values
- Default parameters
- Docstrings

[Start Exercise](./exercises/02-functions/README.md)

### 03 - Data Structures
Work with Python's built-in data structures: lists, dictionaries, and sets.

**Concepts covered:**
- Lists and list operations
- Dictionaries for key-value data
- Sets for unique collections
- List comprehensions
- Iterating over collections

[Start Exercise](./exercises/03-data-structures/README.md)

## Running Tests

```bash
# Run all Python basics tests
pytest python-basics/ -v

# Run a specific exercise
pytest python-basics/exercises/01-variables/test_exercise.py -v

# Run with detailed output
pytest python-basics/ -v --tb=short
```

## Estimated Time

- 01-variables: 30-45 minutes
- 02-functions: 45-60 minutes
- 03-data-structures: 60-90 minutes

Total: approximately 2.5-3 hours

## Tips

1. **Read the docstrings** - They describe exactly what each function should do
2. **Check the tests** - Tests show the expected inputs and outputs
3. **Start simple** - Get basic cases working before edge cases
4. **Use print statements** - Debug by printing intermediate values

## Next Steps

After completing Python Basics, continue to:
- **NumPy Fundamentals** - Array operations for data science
- **Pandas Essentials** - Data manipulation and analysis
- **Python for ML** - Machine learning with scikit-learn
