"""
Pytest configuration for VivanceData exercises.

This file ensures that each exercise directory is treated as a separate
namespace, allowing the same test file names (test_exercise.py) to be used
across different exercises.
"""

import sys
from pathlib import Path

import pytest


def pytest_configure(config):
    """Configure pytest to handle the exercise directory structure."""
    # Add markers for exercise categories
    config.addinivalue_line("markers", "python: Python exercise tests")
    config.addinivalue_line("markers", "sql: SQL exercise tests")


def pytest_collection_modifyitems(config, items):
    """Add markers to tests based on their location."""
    for item in items:
        if "python-basics" in str(item.fspath):
            item.add_marker(pytest.mark.python)
        elif "sql-fundamentals" in str(item.fspath):
            item.add_marker(pytest.mark.sql)


@pytest.fixture(autouse=True)
def change_test_dir(request, monkeypatch):
    """
    Change to the test file's directory before running each test.
    This allows each exercise to import its own exercise.py/exercise module.
    """
    test_dir = Path(request.fspath).parent
    monkeypatch.chdir(test_dir)
    monkeypatch.syspath_prepend(str(test_dir))
