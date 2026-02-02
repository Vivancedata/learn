"""
Solution for Exercise 02: Functions

This file contains reference solutions. Try to solve the exercise yourself first!
Compare your solution to see different approaches.
"""


def greet(name: str, greeting: str = "Hello") -> str:
    """
    Create a greeting message.

    Args:
        name: The name of the person to greet
        greeting: The greeting word (default: "Hello")

    Returns:
        A formatted greeting: "{greeting}, {name}!"
    """
    return f"{greeting}, {name}!"


def calculate_average(numbers: list) -> float:
    """
    Calculate the average (mean) of a list of numbers.

    Args:
        numbers: A list of numbers (can be empty)

    Returns:
        The average of the numbers, or 0 if the list is empty
    """
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)


def find_maximum(numbers: list):
    """
    Find the maximum value in a list of numbers.

    Args:
        numbers: A list of numbers (can be empty)

    Returns:
        The maximum value, or None if the list is empty
    """
    if not numbers:
        return None

    maximum = numbers[0]
    for num in numbers[1:]:
        if num > maximum:
            maximum = num
    return maximum

    # Alternative approach using reduce:
    # from functools import reduce
    # return reduce(lambda a, b: a if a > b else b, numbers) if numbers else None


def is_palindrome(text: str) -> bool:
    """
    Check if a string is a palindrome.

    Args:
        text: The string to check

    Returns:
        True if palindrome, False otherwise
    """
    # Clean the text: remove spaces and convert to lowercase
    clean_text = text.lower().replace(" ", "")

    # Compare with reversed version
    return clean_text == clean_text[::-1]

    # Alternative approach without slicing:
    # left = 0
    # right = len(clean_text) - 1
    # while left < right:
    #     if clean_text[left] != clean_text[right]:
    #         return False
    #     left += 1
    #     right -= 1
    # return True


def fizzbuzz(n: int) -> str:
    """
    Implement the FizzBuzz algorithm.

    Args:
        n: A positive integer

    Returns:
        "Fizz", "Buzz", "FizzBuzz", or str(n)
    """
    # Check "both" condition first!
    if n % 3 == 0 and n % 5 == 0:
        return "FizzBuzz"
    elif n % 3 == 0:
        return "Fizz"
    elif n % 5 == 0:
        return "Buzz"
    else:
        return str(n)

    # Alternative "clever" approach (less readable):
    # result = ""
    # if n % 3 == 0:
    #     result += "Fizz"
    # if n % 5 == 0:
    #     result += "Buzz"
    # return result if result else str(n)


def apply_operation(a: float, b: float, operation) -> float:
    """
    Apply a mathematical operation to two numbers.

    Args:
        a: First number
        b: Second number
        operation: A function that takes two numbers and returns a number

    Returns:
        The result of operation(a, b)
    """
    return operation(a, b)


# Bonus: Helper functions
def add(a: float, b: float) -> float:
    """Add two numbers."""
    return a + b


def subtract(a: float, b: float) -> float:
    """Subtract b from a."""
    return a - b


def multiply(a: float, b: float) -> float:
    """Multiply two numbers."""
    return a * b


def divide(a: float, b: float) -> float:
    """Divide a by b."""
    return a / b
