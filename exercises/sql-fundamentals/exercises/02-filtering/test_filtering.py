"""
Tests for Exercise 02: Filtering with WHERE

This test file:
1. Creates an in-memory SQLite database
2. Loads sample employee data
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
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    hire_date TEXT NOT NULL,
    manager_id INTEGER,
    is_remote INTEGER DEFAULT 0
);
"""

SAMPLE_DATA = """
INSERT INTO employees (id, name, department, salary, hire_date, manager_id, is_remote) VALUES
    (1, 'Alice Johnson', 'Engineering', 95000, '2020-03-15', NULL, 1),
    (2, 'Bob Smith', 'Engineering', 85000, '2021-06-01', 1, 0),
    (3, 'Carol Davis', 'Marketing', 75000, '2019-01-10', NULL, 0),
    (4, 'David Wilson', 'Engineering', 90000, '2020-09-20', 1, 1),
    (5, 'Emma Brown', 'Sales', 70000, '2022-02-28', 3, 0),
    (6, 'Frank Miller', 'Marketing', 80000, '2021-11-15', 3, 1),
    (7, 'Grace Lee', 'Engineering', 92000, '2020-07-01', 1, 0),
    (8, 'Henry Taylor', 'Sales', 65000, '2023-01-05', 5, 0);
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


class TestFiltering:
    """Tests for WHERE clause queries."""

    def test_basic_comparison(self, db, queries):
        """Query should return employees with salary > 80000."""
        query = queries.get('basic_comparison')
        assert query, "Query 'basic_comparison' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 5 employees (Alice, Bob, David, Grace with > 80k)
        # Actually: Alice=95k, Bob=85k, David=90k, Grace=92k = 4 people
        names = [r['name'] for r in results]
        assert len(results) == 4, f"Expected 4 employees, got {len(results)}: {names}"

        # All should have salary > 80000
        for r in results:
            assert r['salary'] > 80000, f"{r['name']} has salary {r['salary']}"

    def test_equality_check(self, db, queries):
        """Query should return Engineering employees."""
        query = queries.get('equality_check')
        assert query, "Query 'equality_check' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return 4 Engineering employees
        assert len(results) == 4, f"Expected 4 employees, got {len(results)}"

        # All should be in Engineering
        for r in results:
            assert r['department'] == 'Engineering'

    def test_and_condition(self, db, queries):
        """Query should return Engineering employees with salary >= 90000."""
        query = queries.get('and_condition')
        assert query, "Query 'and_condition' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Should return Alice (95k), David (90k), Grace (92k) = 3 people
        assert len(results) == 3, f"Expected 3 employees, got {len(results)}"

        for r in results:
            assert r['department'] == 'Engineering'
            assert r['salary'] >= 90000

    def test_or_condition(self, db, queries):
        """Query should return Marketing OR Sales employees."""
        query = queries.get('or_condition')
        assert query, "Query 'or_condition' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Marketing: Carol, Frank; Sales: Emma, Henry = 4 people
        assert len(results) == 4, f"Expected 4 employees, got {len(results)}"

        for r in results:
            assert r['department'] in ('Marketing', 'Sales')

    def test_not_condition(self, db, queries):
        """Query should return employees NOT in Engineering."""
        query = queries.get('not_condition')
        assert query, "Query 'not_condition' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Everyone except Engineering = 4 people
        assert len(results) == 4, f"Expected 4 employees, got {len(results)}"

        for r in results:
            assert r['department'] != 'Engineering'

    def test_like_pattern(self, db, queries):
        """Query should return employees whose name starts with 'E'."""
        query = queries.get('like_pattern')
        assert query, "Query 'like_pattern' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Only Emma Brown starts with E
        assert len(results) == 1, f"Expected 1 employee, got {len(results)}"
        assert results[0]['name'] == 'Emma Brown'

    def test_in_operator(self, db, queries):
        """Query should return Engineering or Marketing employees."""
        query = queries.get('in_operator')
        assert query, "Query 'in_operator' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Engineering: 4, Marketing: 2 = 6 people
        assert len(results) == 6, f"Expected 6 employees, got {len(results)}"

        for r in results:
            assert r['department'] in ('Engineering', 'Marketing')

    def test_between_range(self, db, queries):
        """Query should return employees with salary between 75000 and 90000."""
        query = queries.get('between_range')
        assert query, "Query 'between_range' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Carol=75k, Frank=80k, Bob=85k, David=90k = 4 people
        assert len(results) == 4, f"Expected 4 employees, got {len(results)}"

        for r in results:
            assert 75000 <= r['salary'] <= 90000

    def test_null_handling(self, db, queries):
        """Query should return employees with no manager."""
        query = queries.get('null_handling')
        assert query, "Query 'null_handling' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Alice and Carol have no manager (NULL)
        assert len(results) == 2, f"Expected 2 employees, got {len(results)}"

        names = [r['name'] for r in results]
        assert 'Alice Johnson' in names
        assert 'Carol Davis' in names

    def test_complex_condition(self, db, queries):
        """Query should return remote Engineering employees with salary > 85000."""
        query = queries.get('complex_condition')
        assert query, "Query 'complex_condition' not found or empty"

        cursor = db.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Remote + Engineering + >85k: Alice (95k, remote), David (90k, remote) = 2
        assert len(results) == 2, f"Expected 2 employees, got {len(results)}"

        for r in results:
            assert r['department'] == 'Engineering'
            assert r['is_remote'] == 1
            assert r['salary'] > 85000
