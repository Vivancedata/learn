# Exercise 02: Filtering with WHERE

In this exercise, you'll master filtering data using the WHERE clause to retrieve exactly the data you need.

## Learning Objectives

By completing this exercise, you will:
- Use comparison operators (=, <, >, <=, >=, <>)
- Combine conditions with AND, OR, NOT
- Match patterns with LIKE
- Use IN for multiple values
- Filter ranges with BETWEEN
- Handle NULL values correctly

## Database Schema

The test database contains an `employees` table:

```sql
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    hire_date TEXT NOT NULL,  -- ISO format: YYYY-MM-DD
    manager_id INTEGER,       -- NULL for top-level employees
    is_remote INTEGER DEFAULT 0
);
```

**Sample Data:**

| id | name | department | salary | hire_date | manager_id | is_remote |
|----|------|------------|--------|-----------|------------|-----------|
| 1 | Alice Johnson | Engineering | 95000 | 2020-03-15 | NULL | 1 |
| 2 | Bob Smith | Engineering | 85000 | 2021-06-01 | 1 | 0 |
| 3 | Carol Davis | Marketing | 75000 | 2019-01-10 | NULL | 0 |
| 4 | David Wilson | Engineering | 90000 | 2020-09-20 | 1 | 1 |
| 5 | Emma Brown | Sales | 70000 | 2022-02-28 | 3 | 0 |
| 6 | Frank Miller | Marketing | 80000 | 2021-11-15 | 3 | 1 |
| 7 | Grace Lee | Engineering | 92000 | 2020-07-01 | 1 | 0 |
| 8 | Henry Taylor | Sales | 65000 | 2023-01-05 | 5 | 0 |

## Instructions

Open `exercise.sql` and complete each query. Each query has a comment explaining what it should return.

## Tasks

### Query 1: Basic Comparison
Select all employees with a salary greater than 80000.

### Query 2: Equality Check
Select all employees in the Engineering department.

### Query 3: AND Condition
Select employees who are in Engineering AND have a salary >= 90000.

### Query 4: OR Condition
Select employees who are in Marketing OR Sales.

### Query 5: NOT Condition
Select all employees who are NOT in Engineering.

### Query 6: LIKE Pattern Matching
Select employees whose name starts with 'E'.

### Query 7: IN Operator
Select employees whose department is in a list: Engineering, Marketing.

### Query 8: BETWEEN Range
Select employees with salary between 75000 and 90000 (inclusive).

### Query 9: NULL Handling
Select employees who have no manager (manager_id is NULL).

### Query 10: Complex Condition
Select remote employees in Engineering with salary > 85000.

## Running Tests

```bash
# From the exercises directory
pytest sql-fundamentals/exercises/02-filtering/test_queries.py -v
```

## Hints

<details>
<summary>Hint 1: Comparison Operators</summary>

Standard operators work in SQL:
```sql
SELECT * FROM employees WHERE salary > 80000;
SELECT * FROM employees WHERE department = 'Engineering';
SELECT * FROM employees WHERE salary <> 60000;  -- Not equal
```
</details>

<details>
<summary>Hint 2: AND / OR</summary>

Combine conditions logically:
```sql
SELECT * FROM employees
WHERE department = 'Engineering' AND salary > 80000;

SELECT * FROM employees
WHERE department = 'Engineering' OR department = 'Marketing';
```
</details>

<details>
<summary>Hint 3: LIKE Pattern Matching</summary>

`%` matches any sequence, `_` matches single character:
```sql
WHERE name LIKE 'A%'     -- Starts with A
WHERE name LIKE '%son'   -- Ends with son
WHERE name LIKE '%ar%'   -- Contains ar
WHERE name LIKE '_ob'    -- 3 letters ending in ob
```
</details>

<details>
<summary>Hint 4: IN Operator</summary>

Check if value is in a list:
```sql
WHERE department IN ('Engineering', 'Marketing', 'Sales')
```
</details>

<details>
<summary>Hint 5: BETWEEN</summary>

Range check (inclusive on both ends):
```sql
WHERE salary BETWEEN 70000 AND 90000
-- Same as: WHERE salary >= 70000 AND salary <= 90000
```
</details>

<details>
<summary>Hint 6: NULL Handling</summary>

Use IS NULL or IS NOT NULL (never = NULL):
```sql
WHERE manager_id IS NULL      -- Has no manager
WHERE manager_id IS NOT NULL  -- Has a manager
```
</details>

## Expected Output

When all tests pass:
```
test_queries.py::test_basic_comparison PASSED
test_queries.py::test_equality_check PASSED
test_queries.py::test_and_condition PASSED
... (all tests pass)
```

## Common Mistakes

1. **Using = for NULL** - Use `IS NULL`, not `= NULL`
2. **String quotes** - Use single quotes for strings: `'Engineering'`
3. **Case sensitivity** - LIKE is case-insensitive in SQLite, but be careful
4. **Operator precedence** - AND has higher precedence than OR; use parentheses

## Why Filtering Matters

In real data analysis:
- Databases often have millions of rows
- You rarely need ALL the data
- Filtering happens on the database (fast!)
- Better than filtering in Python (slow for large data)

## Next Exercise

Once all tests pass, move on to [03-joins](../03-joins/README.md).
