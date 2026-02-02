# Exercise 01: Variables and Data Types

In this exercise, you'll practice working with Python's fundamental data types and variable operations.

## Learning Objectives

By completing this exercise, you will:
- Create and assign variables of different types
- Perform arithmetic operations
- Manipulate strings
- Convert between data types
- Work with boolean values

## Instructions

Open `variables.py` and complete all the TODO items. Each function has a docstring explaining what it should do.

## Tasks

### Task 1: `calculate_circle_area(radius)`
Calculate the area of a circle given its radius.
- Formula: area = pi * radius^2
- Use `math.pi` for the value of pi
- Return the result as a float

### Task 2: `format_greeting(name, age)`
Create a formatted greeting string.
- Return: "Hello, {name}! You are {age} years old."
- Handle the string formatting properly

### Task 3: `convert_temperature(celsius)`
Convert Celsius to Fahrenheit.
- Formula: F = (C * 9/5) + 32
- Return the result as a float

### Task 4: `is_even(number)`
Check if a number is even.
- Return True if even, False if odd
- Use the modulo operator (%)

### Task 5: `swap_values(a, b)`
Swap two values and return them as a tuple.
- Return: (b, a)
- Python has an elegant way to do this!

### Task 6: `combine_strings(str1, str2, separator)`
Combine two strings with a separator.
- Default separator should be a space
- Return the combined string

## Running Tests

```bash
# From the exercises directory
pytest python-basics/exercises/01-variables/test_variables.py -v

# With more details on failures
pytest python-basics/exercises/01-variables/test_variables.py -v --tb=long
```

## Hints

<details>
<summary>Hint 1: Circle Area</summary>

Remember to import the `math` module at the top of your file:
```python
import math
# Then use math.pi
```
</details>

<details>
<summary>Hint 2: String Formatting</summary>

Python has multiple ways to format strings. f-strings are the most modern:
```python
name = "Alice"
f"Hello, {name}!"  # Returns "Hello, Alice!"
```
</details>

<details>
<summary>Hint 3: Swapping Values</summary>

Python allows tuple unpacking for elegant swaps:
```python
a, b = b, a  # Swaps a and b
```
</details>

<details>
<summary>Hint 4: Default Parameters</summary>

Functions can have default parameter values:
```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"
```
</details>

## Expected Output

When all tests pass, you should see:
```
test_variables.py::TestCalculateCircleArea::test_unit_circle PASSED
test_variables.py::TestFormatGreeting::test_basic_greeting PASSED
test_variables.py::TestConvertTemperature::test_freezing_point PASSED
test_variables.py::TestIsEven::test_even_number PASSED
test_variables.py::TestSwapValues::test_swap_integers PASSED
test_variables.py::TestCombineStrings::test_default_separator PASSED
```

## Common Mistakes

1. **Forgetting to import math** - You need `import math` for `math.pi`
2. **Integer division** - In Python 3, `/` gives float division, `//` gives integer
3. **Return vs Print** - Make sure to `return` the value, not `print` it
4. **String formatting errors** - Check that variable names match exactly

## Next Exercise

Once all tests pass, move on to [02-functions](../02-functions/README.md).
