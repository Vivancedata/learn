"""
Solution for Exercise 01: Variables and Data Types

This file contains reference solutions. Try to solve the exercise yourself first!
Compare your solution to see different approaches.
"""

import math


def calculate_circle_area(radius: float) -> float:
    """
    Calculate the area of a circle given its radius.

    Args:
        radius: The radius of the circle (positive number)

    Returns:
        The area of the circle (pi * radius^2)
    """
    return math.pi * radius ** 2


def format_greeting(name: str, age: int) -> str:
    """
    Create a formatted greeting string.

    Args:
        name: The person's name
        age: The person's age

    Returns:
        A greeting in the format: "Hello, {name}! You are {age} years old."
    """
    return f"Hello, {name}! You are {age} years old."


def convert_temperature(celsius: float) -> float:
    """
    Convert a temperature from Celsius to Fahrenheit.

    Args:
        celsius: Temperature in Celsius

    Returns:
        Temperature in Fahrenheit
    """
    return (celsius * 9 / 5) + 32


def is_even(number: int) -> bool:
    """
    Check if a number is even.

    Args:
        number: An integer to check

    Returns:
        True if the number is even, False if odd
    """
    return number % 2 == 0


def swap_values(a, b) -> tuple:
    """
    Swap two values and return them as a tuple.

    Args:
        a: First value
        b: Second value

    Returns:
        A tuple containing (b, a)
    """
    return (b, a)
    # Alternative using tuple unpacking:
    # a, b = b, a
    # return (a, b)


def combine_strings(str1: str, str2: str, separator: str = " ") -> str:
    """
    Combine two strings with a separator.

    Args:
        str1: First string
        str2: Second string
        separator: String to place between str1 and str2 (default: space)

    Returns:
        The combined string: str1 + separator + str2
    """
    return str1 + separator + str2
    # Alternative using f-string:
    # return f"{str1}{separator}{str2}"
    # Alternative using join:
    # return separator.join([str1, str2])


# Bonus solution
def calculate_bmi(weight_kg: float, height_m: float) -> float:
    """
    Calculate Body Mass Index (BMI).

    Args:
        weight_kg: Weight in kilograms
        height_m: Height in meters

    Returns:
        BMI value (weight / height^2)
    """
    return weight_kg / (height_m ** 2)
