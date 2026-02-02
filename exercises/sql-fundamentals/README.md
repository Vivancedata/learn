# SQL Fundamentals Exercises

This exercise set covers essential SQL skills for data analysis. You'll practice querying, filtering, and combining data using SQLite.

## Prerequisites

Before starting these exercises, you should:
- Have Python 3.9+ installed (tests use Python's sqlite3)
- Understand what databases and tables are conceptually
- Have completed the "SQL for Data Analysis" lesson in the VivanceData curriculum

## Why SQLite?

We use SQLite because:
- It's included with Python - no installation needed
- It runs entirely in your local environment
- SQL syntax transfers to other databases (PostgreSQL, MySQL, etc.)
- It's perfect for learning and small datasets

## Exercises

### 01 - SELECT Basics
Learn the fundamentals of retrieving data from tables.

**Concepts covered:**
- SELECT statements
- Column selection
- Aliasing columns
- Basic expressions
- ORDER BY

[Start Exercise](./exercises/01-select-basics/README.md)

### 02 - Filtering with WHERE
Master filtering data to get exactly what you need.

**Concepts covered:**
- WHERE clauses
- Comparison operators
- AND, OR, NOT
- LIKE pattern matching
- IN and BETWEEN
- NULL handling

[Start Exercise](./exercises/02-filtering/README.md)

### 03 - JOINs
Combine data from multiple tables.

**Concepts covered:**
- INNER JOIN
- LEFT JOIN
- RIGHT JOIN (concept)
- Multiple table joins
- Self joins
- Join conditions

[Start Exercise](./exercises/03-joins/README.md)

## Running Tests

Each exercise has a test file that creates a sample database, runs your queries, and validates the results.

```bash
# Run all SQL tests
pytest sql-fundamentals/ -v

# Run a specific exercise
pytest sql-fundamentals/exercises/01-select-basics/test_queries.py -v

# Run with detailed output
pytest sql-fundamentals/ -v --tb=long
```

## How SQL Tests Work

1. The test file creates an in-memory SQLite database
2. Sample data is loaded into tables
3. Your queries are read from `exercise.sql`
4. Queries are executed and results compared to expected output
5. Tests pass if your query returns the correct data

## File Structure

```
exercise-name/
  README.md       # Instructions and hints
  exercise.sql    # Your SQL queries (complete the TODOs)
  solution.sql    # Reference solutions
  test_queries.py # Python tests using sqlite3
```

## Estimated Time

- 01-select-basics: 30-45 minutes
- 02-filtering: 45-60 minutes
- 03-joins: 60-90 minutes

Total: approximately 2.5-3 hours

## Tips

1. **Use a SQL client** - Tools like DB Browser for SQLite help visualize data
2. **Check query names** - Tests look for specific query names in your SQL file
3. **Test incrementally** - Run tests after each query you complete
4. **Mind the semicolons** - End each query with `;`

## SQL in Data Science

SQL is essential for data scientists because:
- Most data lives in databases
- SQL is faster than Python for many operations
- Data extraction is the first step in any analysis
- Many tools (pandas, Spark) use SQL-like syntax

## Next Steps

After completing SQL Fundamentals, continue to:
- **Advanced SQL** - Subqueries, CTEs, window functions
- **Data Warehousing** - Star schemas, OLAP
- **Database with Python** - SQLAlchemy, pandas read_sql
