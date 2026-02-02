"""
Tests for Exercise 03: JOINs

This test file:
1. Creates an in-memory SQLite database
2. Loads sample customer/order/item data
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
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date TEXT NOT NULL,
    total_amount REAL NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
"""

SAMPLE_DATA = """
-- Customers (David has no orders)
INSERT INTO customers (id, name, email, city) VALUES
    (1, 'Alice', 'alice@example.com', 'New York'),
    (2, 'Bob', 'bob@example.com', 'Los Angeles'),
    (3, 'Carol', 'carol@example.com', 'Chicago'),
    (4, 'David', 'david@example.com', 'Houston');

-- Orders
INSERT INTO orders (id, customer_id, order_date, total_amount) VALUES
    (101, 1, '2024-01-15', 150.00),
    (102, 1, '2024-02-20', 75.50),
    (103, 2, '2024-01-25', 200.00),
    (104, 3, '2024-03-01', 50.00);

-- Order items
INSERT INTO order_items (id, order_id, product_name, quantity, unit_price) VALUES
    (1, 101, 'Widget A', 2, 50.00),
    (2, 101, 'Widget B', 1, 50.00),
    (3, 102, 'Widget A', 1, 50.00),
    (4, 102, 'Gadget X', 1, 25.50),
    (5, 103, 'Gadget Y', 4, 50.00),
    (6, 104, 'Widget A', 1, 50.00);
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


class TestJoins:
    """Tests for JOIN queries."""

    def test_basic_inner_join(self, db, queries):
        """Query should join customers and orders."""
        query = queries.get('basic_inner_join')
        assert query, "Query 'basic_inner_join' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 4 rows (4 orders, all have customers)
        assert len(results) == 4, f"Expected 4 rows, got {len(results)}"

        # Check columns exist
        columns = list(results[0].keys())
        assert 'name' in columns, "Column 'name' not found"
        assert 'order_date' in columns, "Column 'order_date' not found"
        assert 'total_amount' in columns, "Column 'total_amount' not found"

        # Alice should have 2 orders
        alice_orders = [r for r in results if r['name'] == 'Alice']
        assert len(alice_orders) == 2

    def test_left_join(self, db, queries):
        """Query should include customers without orders."""
        query = queries.get('left_join')
        assert query, "Query 'left_join' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 5 rows (4 orders + David with NULL)
        assert len(results) == 5, f"Expected 5 rows, got {len(results)}"

        # David should appear with NULL order_date
        david_row = next((r for r in results if r['name'] == 'David'), None)
        assert david_row is not None, "David not found in results"
        assert david_row['order_date'] is None, "David should have NULL order_date"

    def test_join_with_filter(self, db, queries):
        """Query should filter by New York city."""
        query = queries.get('join_with_filter')
        assert query, "Query 'join_with_filter' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Only Alice is in New York, she has 2 orders
        assert len(results) == 2, f"Expected 2 rows, got {len(results)}"

        for r in results:
            assert r['name'] == 'Alice'

    def test_multiple_table_join(self, db, queries):
        """Query should join all three tables."""
        query = queries.get('multiple_table_join')
        assert query, "Query 'multiple_table_join' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 6 rows (6 order_items)
        assert len(results) == 6, f"Expected 6 rows, got {len(results)}"

        # Check columns
        columns = list(results[0].keys())
        assert 'name' in columns
        assert 'order_date' in columns
        assert 'product_name' in columns
        assert 'quantity' in columns

    def test_aggregation_with_join(self, db, queries):
        """Query should count orders per customer including 0."""
        query = queries.get('aggregation_with_join')
        assert query, "Query 'aggregation_with_join' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 4 rows (all 4 customers)
        assert len(results) == 4, f"Expected 4 rows, got {len(results)}"

        # Check column name
        columns = list(results[0].keys())
        assert 'order_count' in columns, "Column 'order_count' not found"

        # Convert to dict for easy lookup
        counts = {r['name']: r['order_count'] for r in results}

        assert counts['Alice'] == 2, f"Alice should have 2 orders, got {counts.get('Alice')}"
        assert counts['Bob'] == 1, f"Bob should have 1 order, got {counts.get('Bob')}"
        assert counts['Carol'] == 1, f"Carol should have 1 order, got {counts.get('Carol')}"
        assert counts['David'] == 0, f"David should have 0 orders, got {counts.get('David')}"

    def test_join_with_group_by(self, db, queries):
        """Query should calculate total spending per customer."""
        query = queries.get('join_with_group_by')
        assert query, "Query 'join_with_group_by' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 3 rows (customers with orders, not David)
        assert len(results) == 3, f"Expected 3 rows, got {len(results)}"

        # Check column name
        columns = list(results[0].keys())
        assert 'total_spent' in columns, "Column 'total_spent' not found"

        # Convert to dict for easy lookup
        totals = {r['name']: r['total_spent'] for r in results}

        assert abs(totals['Alice'] - 225.50) < 0.01, f"Alice total should be 225.50"
        assert abs(totals['Bob'] - 200.00) < 0.01, f"Bob total should be 200.00"
        assert abs(totals['Carol'] - 50.00) < 0.01, f"Carol total should be 50.00"
        assert 'David' not in totals, "David should not appear (no orders)"

    def test_table_aliases(self, db, queries):
        """Query should use table aliases and return same as basic_inner_join."""
        query = queries.get('table_aliases')
        assert query, "Query 'table_aliases' not found or empty"

        # Check that aliases are used
        query_lower = query.lower()
        assert ' c ' in query_lower or ' c.' in query_lower, "Should use alias 'c' for customers"
        assert ' o ' in query_lower or ' o.' in query_lower, "Should use alias 'o' for orders"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Same results as basic_inner_join
        assert len(results) == 4, f"Expected 4 rows, got {len(results)}"

        columns = list(results[0].keys())
        assert 'name' in columns
        assert 'order_date' in columns
        assert 'total_amount' in columns

    def test_complex_join(self, db, queries):
        """Query should find customers who ordered Widget A."""
        query = queries.get('complex_join')
        assert query, "Query 'complex_join' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Widget A ordered by: Alice (order 101, 102), Carol (order 104) = 2 unique customers
        # Note: We want distinct names
        names = [r['name'] for r in results]
        unique_names = set(names)

        assert len(unique_names) == 2, f"Expected 2 unique customers, got {len(unique_names)}"
        assert 'Alice' in unique_names
        assert 'Carol' in unique_names
