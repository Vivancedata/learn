"""
Exercise 01: Variables and Data Types

Complete each function below according to its docstring.
Run the tests to verify your solutions: pytest test_variables.py -v
"""

# TODO: Import the math module for pi
# import math


def calculate_circle_area(radius: float) -> float:
    """
    Calculate the area of a circle given its radius.

    Args:
        radius: The radius of the circle (positive number)

    Returns:
        The area of the circle (pi * radius^2)

    Example:
        >>> calculate_circle_area(1)
        3.141592653589793
        >>> calculate_circle_area(2)
        12.566370614359172
    """
    # TODO: Calculate and return the area of the circle
    # Use math.pi for the value of pi
    pass


def format_greeting(name: str, age: int) -> str:
    """
    Create a formatted greeting string.

    Args:
        name: The person's name
        age: The person's age

    Returns:
        A greeting in the format: "Hello, {name}! You are {age} years old."

    Example:
        >>> format_greeting("Alice", 25)
        'Hello, Alice! You are 25 years old.'
    """
    # TODO: Return a formatted greeting string
    # Hint: Use an f-string for easy formatting
    pass


def convert_temperature(celsius: float) -> float:
    """
    Convert a temperature from Celsius to Fahrenheit.

    Args:
        celsius: Temperature in Celsius

    Returns:
        Temperature in Fahrenheit

    Formula:
        F = (C * 9/5) + 32

    Example:
        >>> convert_temperature(0)
        32.0
        >>> convert_temperature(100)
        212.0
    """
    # TODO: Convert celsius to fahrenheit and return the result
    pass


def is_even(number: int) -> bool:
    """
    Check if a number is even.

    Args:
        number: An integer to check

    Returns:
        True if the number is even, False if odd

    Example:
        >>> is_even(4)
        True
        >>> is_even(7)
        False
        >>> is_even(0)
        True
    """
    # TODO: Return True if number is even, False otherwise
    # Hint: Use the modulo operator (%)
    pass


def swap_values(a, b) -> tuple:
    """
    Swap two values and return them as a tuple.

    Args:
        a: First value
        b: Second value

    Returns:
        A tuple containing (b, a)

    Example:
        >>> swap_values(1, 2)
        (2, 1)
        >>> swap_values("hello", "world")
        ('world', 'hello')
    """
    # TODO: Return a tuple with the values swapped
    # Hint: Python has a very elegant way to do this!
    pass


def combine_strings(str1: str, str2: str, separator: str = " ") -> str:
    """
    Combine two strings with a separator.

    Args:
        str1: First string
        str2: Second string
        separator: String to place between str1 and str2 (default: space)

    Returns:
        The combined string: str1 + separator + str2

    Example:
        >>> combine_strings("Hello", "World")
        'Hello World'
        >>> combine_strings("Hello", "World", "-")
        'Hello-World'
        >>> combine_strings("a", "b", "")
        'ab'
    """
    # TODO: Combine the strings with the separator and return
    pass


# Bonus: Uncomment and complete this if you want extra practice
# def calculate_bmi(weight_kg: float, height_m: float) -> float:
#     """
#     Calculate Body Mass Index (BMI).
#
#     Args:
#         weight_kg: Weight in kilograms
#         height_m: Height in meters
#
#     Returns:
#         BMI value (weight / height^2)
#     """
#     # TODO: Calculate and return BMI
#     pass
