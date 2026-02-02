# Exercise 02: Functions

In this exercise, you'll practice defining and using functions - the building blocks of reusable, organized code.

## Learning Objectives

By completing this exercise, you will:
- Define functions with parameters and return values
- Use default and keyword arguments
- Write functions that call other functions
- Handle edge cases and validation
- Write clear docstrings

## Prerequisites

Complete [Exercise 01: Variables](../01-variables/README.md) first.

## Instructions

Open `exercise.py` and complete all the TODO items. Each function has a docstring explaining what it should do.

## Tasks

### Task 1: `greet(name, greeting="Hello")`
Create a flexible greeting function.
- Accept a name and an optional greeting
- Default greeting should be "Hello"
- Return the formatted greeting

### Task 2: `calculate_average(numbers)`
Calculate the average of a list of numbers.
- Handle empty lists by returning 0
- Return a float

### Task 3: `find_maximum(numbers)`
Find the maximum value in a list.
- Handle empty lists by returning None
- Don't use the built-in `max()` function

### Task 4: `is_palindrome(text)`
Check if a string is a palindrome.
- Ignore case (treat "Racecar" as a palindrome)
- Ignore spaces ("A man a plan" style)
- Return True/False

### Task 5: `fizzbuzz(n)`
Implement the classic FizzBuzz.
- Return "Fizz" for multiples of 3
- Return "Buzz" for multiples of 5
- Return "FizzBuzz" for multiples of both
- Return the number as a string otherwise

### Task 6: `apply_operation(a, b, operation)`
Create a higher-order function.
- Accept two numbers and an operation function
- Apply the operation and return the result
- Support add, subtract, multiply, divide operations

## Running Tests

```bash
# From the exercises directory
pytest python-basics/exercises/02-functions/test_exercise.py -v

# With more details on failures
pytest python-basics/exercises/02-functions/test_exercise.py -v --tb=long
```

## Hints

<details>
<summary>Hint 1: Default Parameters</summary>

Default parameters are defined in the function signature:
```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"
```
</details>

<details>
<summary>Hint 2: Handling Empty Lists</summary>

Check if a list is empty before processing:
```python
if not numbers:  # Empty list is falsy
    return 0
```
</details>

<details>
<summary>Hint 3: String Cleaning for Palindrome</summary>

You can chain string methods:
```python
clean = text.lower().replace(" ", "")
```
</details>

<details>
<summary>Hint 4: FizzBuzz Logic</summary>

Check the "both" condition first:
```python
if n % 3 == 0 and n % 5 == 0:
    return "FizzBuzz"
elif n % 3 == 0:
    return "Fizz"
# ...
```
</details>

<details>
<summary>Hint 5: Higher-Order Functions</summary>

Functions can be passed as arguments:
```python
def add(a, b):
    return a + b

def apply(a, b, operation):
    return operation(a, b)

result = apply(5, 3, add)  # Returns 8
```
</details>

## Expected Output

When all tests pass, you should see:
```
test_exercise.py::TestGreet::test_default_greeting PASSED
test_exercise.py::TestGreet::test_custom_greeting PASSED
... (all tests pass)
```

## Common Mistakes

1. **Forgetting return statements** - Functions need to return values
2. **Not handling edge cases** - Empty lists, zero values
3. **Modifying parameters** - Be careful not to modify input lists
4. **Order of conditions** - In FizzBuzz, check "both" before individual

## Why Functions Matter

Functions are essential for:
- **Reusability** - Write once, use many times
- **Organization** - Break complex problems into manageable pieces
- **Testing** - Small functions are easy to test
- **Collaboration** - Others can use your functions without knowing the details

In data science, you'll use functions to:
- Clean and transform data
- Apply calculations to datasets
- Build reusable analysis pipelines

## Next Exercise

Once all tests pass, move on to [03-data-structures](../03-data-structures/README.md).
