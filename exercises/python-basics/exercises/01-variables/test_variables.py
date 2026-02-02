"""
Tests for Exercise 01: Variables and Data Types

Run with: pytest test_variables.py -v
"""

import math
import pytest
from variables import (
    calculate_circle_area,
    format_greeting,
    convert_temperature,
    is_even,
    swap_values,
    combine_strings,
)


class TestCalculateCircleArea:
    """Tests for calculate_circle_area function."""

    def test_unit_circle(self):
        """Area of circle with radius 1 should be pi."""
        result = calculate_circle_area(1)
        assert result == pytest.approx(math.pi)

    def test_radius_two(self):
        """Area of circle with radius 2 should be 4*pi."""
        result = calculate_circle_area(2)
        assert result == pytest.approx(4 * math.pi)

    def test_radius_zero(self):
        """Area of circle with radius 0 should be 0."""
        result = calculate_circle_area(0)
        assert result == pytest.approx(0)

    def test_decimal_radius(self):
        """Should handle decimal radius values."""
        result = calculate_circle_area(2.5)
        assert result == pytest.approx(math.pi * 2.5 ** 2)

    def test_returns_float(self):
        """Result should be a float."""
        result = calculate_circle_area(3)
        assert isinstance(result, float)


class TestFormatGreeting:
    """Tests for format_greeting function."""

    def test_basic_greeting(self):
        """Should format greeting correctly."""
        result = format_greeting("Alice", 25)
        assert result == "Hello, Alice! You are 25 years old."

    def test_different_name(self):
        """Should work with different names."""
        result = format_greeting("Bob", 30)
        assert result == "Hello, Bob! You are 30 years old."

    def test_single_digit_age(self):
        """Should work with single digit ages."""
        result = format_greeting("Charlie", 5)
        assert result == "Hello, Charlie! You are 5 years old."

    def test_large_age(self):
        """Should work with large ages."""
        result = format_greeting("Diana", 100)
        assert result == "Hello, Diana! You are 100 years old."

    def test_returns_string(self):
        """Result should be a string."""
        result = format_greeting("Eve", 20)
        assert isinstance(result, str)


class TestConvertTemperature:
    """Tests for convert_temperature function."""

    def test_freezing_point(self):
        """0 Celsius should be 32 Fahrenheit."""
        result = convert_temperature(0)
        assert result == pytest.approx(32.0)

    def test_boiling_point(self):
        """100 Celsius should be 212 Fahrenheit."""
        result = convert_temperature(100)
        assert result == pytest.approx(212.0)

    def test_negative_temperature(self):
        """Should handle negative temperatures."""
        result = convert_temperature(-40)
        assert result == pytest.approx(-40.0)  # -40 is same in both scales!

    def test_body_temperature(self):
        """37 Celsius (body temp) should be 98.6 Fahrenheit."""
        result = convert_temperature(37)
        assert result == pytest.approx(98.6)

    def test_returns_float(self):
        """Result should be a float."""
        result = convert_temperature(25)
        assert isinstance(result, (int, float))


class TestIsEven:
    """Tests for is_even function."""

    def test_even_number(self):
        """Even numbers should return True."""
        assert is_even(4) is True
        assert is_even(100) is True
        assert is_even(2) is True

    def test_odd_number(self):
        """Odd numbers should return False."""
        assert is_even(7) is False
        assert is_even(1) is False
        assert is_even(99) is False

    def test_zero(self):
        """Zero is even."""
        assert is_even(0) is True

    def test_negative_even(self):
        """Negative even numbers should return True."""
        assert is_even(-4) is True
        assert is_even(-100) is True

    def test_negative_odd(self):
        """Negative odd numbers should return False."""
        assert is_even(-7) is False
        assert is_even(-1) is False

    def test_returns_bool(self):
        """Result should be a boolean."""
        assert isinstance(is_even(5), bool)


class TestSwapValues:
    """Tests for swap_values function."""

    def test_swap_integers(self):
        """Should swap integer values."""
        result = swap_values(1, 2)
        assert result == (2, 1)

    def test_swap_strings(self):
        """Should swap string values."""
        result = swap_values("hello", "world")
        assert result == ("world", "hello")

    def test_swap_mixed_types(self):
        """Should swap mixed types."""
        result = swap_values(42, "answer")
        assert result == ("answer", 42)

    def test_swap_same_values(self):
        """Should handle swapping same values."""
        result = swap_values(5, 5)
        assert result == (5, 5)

    def test_returns_tuple(self):
        """Result should be a tuple."""
        result = swap_values("a", "b")
        assert isinstance(result, tuple)
        assert len(result) == 2


class TestCombineStrings:
    """Tests for combine_strings function."""

    def test_default_separator(self):
        """Default separator should be space."""
        result = combine_strings("Hello", "World")
        assert result == "Hello World"

    def test_custom_separator(self):
        """Should use custom separator."""
        result = combine_strings("Hello", "World", "-")
        assert result == "Hello-World"

    def test_empty_separator(self):
        """Empty separator should concatenate directly."""
        result = combine_strings("a", "b", "")
        assert result == "ab"

    def test_multi_char_separator(self):
        """Should handle multi-character separator."""
        result = combine_strings("one", "two", " and ")
        assert result == "one and two"

    def test_empty_strings(self):
        """Should handle empty input strings."""
        result = combine_strings("", "", "-")
        assert result == "-"

    def test_returns_string(self):
        """Result should be a string."""
        result = combine_strings("a", "b")
        assert isinstance(result, str)
