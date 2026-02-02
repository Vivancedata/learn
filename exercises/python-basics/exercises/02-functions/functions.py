"""
Exercise 02: Functions

Complete each function below according to its docstring.
Run the tests to verify your solutions: pytest test_functions.py -v
"""


def greet(name: str, greeting: str = "Hello") -> str:
    """
    Create a greeting message.

    Args:
        name: The name of the person to greet
        greeting: The greeting word (default: "Hello")

    Returns:
        A formatted greeting: "{greeting}, {name}!"

    Example:
        >>> greet("Alice")
        'Hello, Alice!'
        >>> greet("Bob", "Hi")
        'Hi, Bob!'
    """
    # TODO: Return the formatted greeting
    pass


def calculate_average(numbers: list) -> float:
    """
    Calculate the average (mean) of a list of numbers.

    Args:
        numbers: A list of numbers (can be empty)

    Returns:
        The average of the numbers, or 0 if the list is empty

    Example:
        >>> calculate_average([1, 2, 3, 4, 5])
        3.0
        >>> calculate_average([])
        0
    """
    # TODO: Calculate and return the average
    # Handle the empty list case!
    pass


def find_maximum(numbers: list):
    """
    Find the maximum value in a list of numbers.

    Args:
        numbers: A list of numbers (can be empty)

    Returns:
        The maximum value, or None if the list is empty

    Note:
        Do NOT use the built-in max() function!
        Implement the logic yourself.

    Example:
        >>> find_maximum([3, 1, 4, 1, 5, 9, 2, 6])
        9
        >>> find_maximum([])
        None
        >>> find_maximum([-5, -2, -10])
        -2
    """
    # TODO: Find and return the maximum value
    # Hint: Start by assuming the first element is the maximum
    pass


def is_palindrome(text: str) -> bool:
    """
    Check if a string is a palindrome.

    A palindrome reads the same forwards and backwards.
    This function should ignore case and spaces.

    Args:
        text: The string to check

    Returns:
        True if palindrome, False otherwise

    Example:
        >>> is_palindrome("racecar")
        True
        >>> is_palindrome("Racecar")
        True
        >>> is_palindrome("A man a plan a canal Panama")
        True
        >>> is_palindrome("hello")
        False
    """
    # TODO: Check if text is a palindrome
    # Remember to ignore case and spaces
    pass


def fizzbuzz(n: int) -> str:
    """
    Implement the FizzBuzz algorithm.

    Rules:
        - If n is divisible by 3, return "Fizz"
        - If n is divisible by 5, return "Buzz"
        - If n is divisible by both 3 and 5, return "FizzBuzz"
        - Otherwise, return the number as a string

    Args:
        n: A positive integer

    Returns:
        "Fizz", "Buzz", "FizzBuzz", or str(n)

    Example:
        >>> fizzbuzz(3)
        'Fizz'
        >>> fizzbuzz(5)
        'Buzz'
        >>> fizzbuzz(15)
        'FizzBuzz'
        >>> fizzbuzz(7)
        '7'
    """
    # TODO: Implement FizzBuzz
    # Hint: Check the "both" condition first!
    pass


def apply_operation(a: float, b: float, operation) -> float:
    """
    Apply a mathematical operation to two numbers.

    This is a higher-order function - it takes a function as an argument.

    Args:
        a: First number
        b: Second number
        operation: A function that takes two numbers and returns a number

    Returns:
        The result of operation(a, b)

    Example:
        >>> def add(x, y):
        ...     return x + y
        >>> apply_operation(5, 3, add)
        8

        >>> apply_operation(10, 2, lambda x, y: x / y)
        5.0
    """
    # TODO: Apply the operation to a and b and return the result
    pass


# Bonus: Helper functions for apply_operation
# Uncomment and complete if you want extra practice

# def add(a: float, b: float) -> float:
#     """Add two numbers."""
#     # TODO
#     pass

# def subtract(a: float, b: float) -> float:
#     """Subtract b from a."""
#     # TODO
#     pass

# def multiply(a: float, b: float) -> float:
#     """Multiply two numbers."""
#     # TODO
#     pass

# def divide(a: float, b: float) -> float:
#     """Divide a by b."""
#     # TODO
#     pass
