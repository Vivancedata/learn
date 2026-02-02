"""
Tests for Exercise 02: Functions

Run with: pytest test_functions.py -v
"""

import pytest
from functions import (
    greet,
    calculate_average,
    find_maximum,
    is_palindrome,
    fizzbuzz,
    apply_operation,
)


class TestGreet:
    """Tests for greet function."""

    def test_default_greeting(self):
        """Should use 'Hello' as default greeting."""
        result = greet("Alice")
        assert result == "Hello, Alice!"

    def test_custom_greeting(self):
        """Should use custom greeting when provided."""
        result = greet("Bob", "Hi")
        assert result == "Hi, Bob!"

    def test_different_greetings(self):
        """Should work with various greetings."""
        assert greet("Charlie", "Welcome") == "Welcome, Charlie!"
        assert greet("Diana", "Good morning") == "Good morning, Diana!"

    def test_returns_string(self):
        """Result should be a string."""
        result = greet("Eve")
        assert isinstance(result, str)


class TestCalculateAverage:
    """Tests for calculate_average function."""

    def test_simple_average(self):
        """Should calculate average correctly."""
        result = calculate_average([1, 2, 3, 4, 5])
        assert result == pytest.approx(3.0)

    def test_single_element(self):
        """Should handle single element list."""
        result = calculate_average([42])
        assert result == pytest.approx(42.0)

    def test_empty_list(self):
        """Should return 0 for empty list."""
        result = calculate_average([])
        assert result == 0

    def test_decimal_average(self):
        """Should handle non-integer averages."""
        result = calculate_average([1, 2])
        assert result == pytest.approx(1.5)

    def test_negative_numbers(self):
        """Should handle negative numbers."""
        result = calculate_average([-5, 5])
        assert result == pytest.approx(0.0)

    def test_floats(self):
        """Should handle float inputs."""
        result = calculate_average([1.5, 2.5, 3.0])
        assert result == pytest.approx(7.0 / 3)


class TestFindMaximum:
    """Tests for find_maximum function."""

    def test_simple_list(self):
        """Should find maximum in simple list."""
        result = find_maximum([3, 1, 4, 1, 5, 9, 2, 6])
        assert result == 9

    def test_single_element(self):
        """Should handle single element list."""
        result = find_maximum([42])
        assert result == 42

    def test_empty_list(self):
        """Should return None for empty list."""
        result = find_maximum([])
        assert result is None

    def test_negative_numbers(self):
        """Should handle all negative numbers."""
        result = find_maximum([-5, -2, -10])
        assert result == -2

    def test_max_at_start(self):
        """Should find max at beginning of list."""
        result = find_maximum([100, 1, 2, 3])
        assert result == 100

    def test_max_at_end(self):
        """Should find max at end of list."""
        result = find_maximum([1, 2, 3, 100])
        assert result == 100

    def test_duplicates(self):
        """Should handle duplicate maximum values."""
        result = find_maximum([5, 3, 5, 2, 5])
        assert result == 5


class TestIsPalindrome:
    """Tests for is_palindrome function."""

    def test_simple_palindrome(self):
        """Should recognize simple palindromes."""
        assert is_palindrome("racecar") is True
        assert is_palindrome("level") is True
        assert is_palindrome("noon") is True

    def test_not_palindrome(self):
        """Should reject non-palindromes."""
        assert is_palindrome("hello") is False
        assert is_palindrome("world") is False

    def test_case_insensitive(self):
        """Should ignore case."""
        assert is_palindrome("Racecar") is True
        assert is_palindrome("RaCeCaR") is True

    def test_with_spaces(self):
        """Should ignore spaces."""
        assert is_palindrome("A man a plan a canal Panama") is True
        assert is_palindrome("was it a car or a cat i saw") is True

    def test_single_character(self):
        """Single character is a palindrome."""
        assert is_palindrome("a") is True

    def test_empty_string(self):
        """Empty string is a palindrome."""
        assert is_palindrome("") is True

    def test_two_characters(self):
        """Should handle two character strings."""
        assert is_palindrome("aa") is True
        assert is_palindrome("ab") is False


class TestFizzbuzz:
    """Tests for fizzbuzz function."""

    def test_fizz(self):
        """Multiples of 3 (not 5) should return 'Fizz'."""
        assert fizzbuzz(3) == "Fizz"
        assert fizzbuzz(6) == "Fizz"
        assert fizzbuzz(9) == "Fizz"

    def test_buzz(self):
        """Multiples of 5 (not 3) should return 'Buzz'."""
        assert fizzbuzz(5) == "Buzz"
        assert fizzbuzz(10) == "Buzz"
        assert fizzbuzz(20) == "Buzz"

    def test_fizzbuzz(self):
        """Multiples of both 3 and 5 should return 'FizzBuzz'."""
        assert fizzbuzz(15) == "FizzBuzz"
        assert fizzbuzz(30) == "FizzBuzz"
        assert fizzbuzz(45) == "FizzBuzz"

    def test_regular_numbers(self):
        """Non-multiples should return the number as string."""
        assert fizzbuzz(1) == "1"
        assert fizzbuzz(2) == "2"
        assert fizzbuzz(7) == "7"
        assert fizzbuzz(11) == "11"

    def test_returns_string(self):
        """Result should always be a string."""
        assert isinstance(fizzbuzz(1), str)
        assert isinstance(fizzbuzz(3), str)
        assert isinstance(fizzbuzz(5), str)
        assert isinstance(fizzbuzz(15), str)


class TestApplyOperation:
    """Tests for apply_operation function."""

    def test_addition(self):
        """Should apply addition operation."""
        result = apply_operation(5, 3, lambda x, y: x + y)
        assert result == 8

    def test_subtraction(self):
        """Should apply subtraction operation."""
        result = apply_operation(10, 4, lambda x, y: x - y)
        assert result == 6

    def test_multiplication(self):
        """Should apply multiplication operation."""
        result = apply_operation(6, 7, lambda x, y: x * y)
        assert result == 42

    def test_division(self):
        """Should apply division operation."""
        result = apply_operation(20, 4, lambda x, y: x / y)
        assert result == pytest.approx(5.0)

    def test_with_defined_function(self):
        """Should work with regular function definitions."""
        def power(a, b):
            return a ** b

        result = apply_operation(2, 3, power)
        assert result == 8

    def test_negative_numbers(self):
        """Should handle negative numbers."""
        result = apply_operation(-5, 3, lambda x, y: x + y)
        assert result == -2

    def test_floats(self):
        """Should handle float numbers."""
        result = apply_operation(2.5, 3.5, lambda x, y: x + y)
        assert result == pytest.approx(6.0)
