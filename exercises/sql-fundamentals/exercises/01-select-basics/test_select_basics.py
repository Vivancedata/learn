"""
Tests for Exercise 01: SELECT Basics

This test file:
1. Creates an in-memory SQLite database
2. Loads sample data
3. Reads your queries from exercise.sql
4. Executes and validates each query

Run with: pytest test_queries.py -v
"""

import sqlite3
import re
from pathlib import Path

import pytest


# Sample data for testing
SCHEMA = """
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1
);
"""

SAMPLE_DATA = """
INSERT INTO products (id, name, category, price, quantity, is_active) VALUES
    (1, 'Laptop', 'Electronics', 999.99, 50, 1),
    (2, 'Mouse', 'Electronics', 29.99, 200, 1),
    (3, 'Keyboard', 'Electronics', 79.99, 150, 1),
    (4, 'Desk Chair', 'Furniture', 299.99, 30, 1),
    (5, 'Standing Desk', 'Furniture', 599.99, 20, 0),
    (6, 'Monitor', 'Electronics', 399.99, 75, 1),
    (7, 'Webcam', 'Electronics', 89.99, 100, 1),
    (8, 'Bookshelf', 'Furniture', 149.99, 40, 1);
"""


@pytest.fixture
def db():
    """Create an in-memory database with test data."""
    conn = sqlite3.connect(':memory:')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.executescript(SCHEMA)
    cursor.executescript(SAMPLE_DATA)
    conn.commit()
    yield conn
    conn.close()


def load_queries():
    """Load and parse queries from exercise.sql."""
    sql_file = Path(__file__).parent / 'exercise.sql'
    content = sql_file.read_text()

    # Parse queries by "-- Query: name" comments
    queries = {}
    pattern = r'-- Query: (\w+)\s*\n(.*?)(?=-- Query:|$)'
    matches = re.findall(pattern, content, re.DOTALL)

    for name, query_block in matches:
        # Extract the actual SQL query (skip comments and empty lines)
        lines = []
        for line in query_block.strip().split('\n'):
            stripped = line.strip()
            if stripped and not stripped.startswith('--'):
                lines.append(line)
        query = '\n'.join(lines).strip()
        if query and query != 'pass':
            queries[name] = query

    return queries


@pytest.fixture
def queries():
    """Load queries from exercise.sql."""
    return load_queries()


class TestSelectBasics:
    """Tests for SELECT basics queries."""

    def test_select_all_columns(self, db, queries):
        """Query should select all columns from products."""
        query = queries.get('select_all_columns')
        assert query, "Query 'select_all_columns' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 8 rows
        assert len(results) == 8, f"Expected 8 rows, got {len(results)}"

        # Should have all 6 columns
        assert len(results[0].keys()) == 6, "Should have 6 columns"

        # Check column names
        columns = results[0].keys()
        assert 'id' in columns
        assert 'name' in columns
        assert 'category' in columns
        assert 'price' in columns
        assert 'quantity' in columns
        assert 'is_active' in columns

    def test_select_specific_columns(self, db, queries):
        """Query should select only name and price."""
        query = queries.get('select_specific_columns')
        assert query, "Query 'select_specific_columns' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 8 rows
        assert len(results) == 8, f"Expected 8 rows, got {len(results)}"

        # Should have exactly 2 columns
        columns = list(results[0].keys())
        assert len(columns) == 2, f"Expected 2 columns, got {len(columns)}"

        # Check values from first row
        assert results[0]['name'] == 'Laptop'
        assert results[0]['price'] == 999.99

    def test_column_alias(self, db, queries):
        """Query should rename price to cost."""
        query = queries.get('column_alias')
        assert query, "Query 'column_alias' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should have 'cost' column (alias for price)
        columns = list(results[0].keys())
        assert 'cost' in columns, "Column 'cost' not found - did you use AS?"

        # Verify data is correct
        assert results[0]['cost'] == 999.99

    def test_calculated_column(self, db, queries):
        """Query should calculate total_value = price * quantity."""
        query = queries.get('calculated_column')
        assert query, "Query 'calculated_column' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should have total_value column
        columns = list(results[0].keys())
        assert 'total_value' in columns, "Column 'total_value' not found"

        # Check calculation for Laptop: 999.99 * 50 = 49999.5
        laptop_row = next(r for r in results if r['name'] == 'Laptop')
        expected = 999.99 * 50
        assert abs(laptop_row['total_value'] - expected) < 0.01

    def test_order_by_price(self, db, queries):
        """Query should order by price descending."""
        query = queries.get('order_by_price')
        assert query, "Query 'order_by_price' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Check order (highest price first)
        prices = [r['price'] for r in results]
        assert prices == sorted(prices, reverse=True), "Not ordered by price DESC"

        # First should be Laptop (999.99)
        assert results[0]['name'] == 'Laptop'
        # Last should be Mouse (29.99)
        assert results[-1]['name'] == 'Mouse'

    def test_order_by_multiple(self, db, queries):
        """Query should order by category, then price."""
        query = queries.get('order_by_multiple')
        assert query, "Query 'order_by_multiple' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Electronics should come first (alphabetically before Furniture)
        categories = [r['category'] for r in results]

        # Find where Electronics ends and Furniture begins
        electronics_end = categories.index('Furniture')

        # Within Electronics, should be ordered by price ascending
        electronics_prices = [r['price'] for r in results[:electronics_end]]
        assert electronics_prices == sorted(electronics_prices), \
            "Electronics not ordered by price ASC"

        # Within Furniture, should be ordered by price ascending
        furniture_prices = [r['price'] for r in results[electronics_end:]]
        assert furniture_prices == sorted(furniture_prices), \
            "Furniture not ordered by price ASC"

    def test_limit_results(self, db, queries):
        """Query should return only 3 most expensive products."""
        query = queries.get('limit_results')
        assert query, "Query 'limit_results' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return exactly 3 rows
        assert len(results) == 3, f"Expected 3 rows, got {len(results)}"

        # Should be the 3 most expensive
        names = [r['name'] for r in results]
        assert 'Laptop' in names  # 999.99
        assert 'Standing Desk' in names  # 599.99
        assert 'Monitor' in names  # 399.99

    def test_distinct_categories(self, db, queries):
        """Query should return unique categories."""
        query = queries.get('distinct_categories')
        assert query, "Query 'distinct_categories' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return exactly 2 unique categories
        assert len(results) == 2, f"Expected 2 categories, got {len(results)}"

        # Should have Electronics and Furniture
        categories = [r[0] for r in results]
        assert 'Electronics' in categories
        assert 'Furniture' in categories
