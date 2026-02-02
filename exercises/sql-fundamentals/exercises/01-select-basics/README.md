# Exercise 01: SELECT Basics

In this exercise, you'll learn the fundamentals of retrieving data from database tables using SELECT statements.

## Learning Objectives

By completing this exercise, you will:
- Write basic SELECT statements
- Select specific columns
- Use column aliases
- Write simple expressions in SELECT
- Sort results with ORDER BY
- Limit results

## Database Schema

The test database contains a `products` table:

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1  -- 1 = active, 0 = inactive
);
```

**Sample Data:**

| id | name | category | price | quantity | is_active |
|----|------|----------|-------|----------|-----------|
| 1 | Laptop | Electronics | 999.99 | 50 | 1 |
| 2 | Mouse | Electronics | 29.99 | 200 | 1 |
| 3 | Keyboard | Electronics | 79.99 | 150 | 1 |
| 4 | Desk Chair | Furniture | 299.99 | 30 | 1 |
| 5 | Standing Desk | Furniture | 599.99 | 20 | 0 |
| 6 | Monitor | Electronics | 399.99 | 75 | 1 |
| 7 | Webcam | Electronics | 89.99 | 100 | 1 |
| 8 | Bookshelf | Furniture | 149.99 | 40 | 1 |

## Instructions

Open `exercise.sql` and complete each query. Each query has a comment explaining what it should return.

**Important:** Keep the query names (comments starting with `-- Query:`) exactly as shown - tests use these to identify your queries.

## Tasks

### Query 1: Select All Columns
Select all columns from the products table.
- Return all rows and all columns

### Query 2: Select Specific Columns
Select only the name and price of all products.
- Return exactly two columns: name, price

### Query 3: Column Alias
Select product name and price, but rename price to "cost".
- Use AS to create an alias

### Query 4: Calculated Column
Select product name and total value (price * quantity).
- Name the calculated column "total_value"

### Query 5: Order By Price
Select all products ordered by price from highest to lowest.
- Use ORDER BY with DESC

### Query 6: Order By Multiple Columns
Select all products ordered by category (A-Z), then by price (low to high).
- Use multiple columns in ORDER BY

### Query 7: Limit Results
Select the 3 most expensive products.
- Combine ORDER BY and LIMIT

### Query 8: Distinct Categories
Select all unique categories from the products table.
- Use DISTINCT keyword

## Running Tests

```bash
# From the exercises directory
pytest sql-fundamentals/exercises/01-select-basics/test_queries.py -v
```

## Hints

<details>
<summary>Hint 1: Select All</summary>

Use `*` to select all columns:
```sql
SELECT * FROM tablename;
```
</details>

<details>
<summary>Hint 2: Column Aliases</summary>

Use AS to rename columns in output:
```sql
SELECT price AS cost FROM products;
```
</details>

<details>
<summary>Hint 3: Calculated Columns</summary>

You can do math in SELECT:
```sql
SELECT name, price * quantity AS total FROM products;
```
</details>

<details>
<summary>Hint 4: ORDER BY</summary>

Sort results with ORDER BY:
```sql
SELECT * FROM products ORDER BY price;        -- Ascending (default)
SELECT * FROM products ORDER BY price DESC;   -- Descending
SELECT * FROM products ORDER BY cat, price;   -- Multiple columns
```
</details>

<details>
<summary>Hint 5: LIMIT</summary>

Restrict number of results:
```sql
SELECT * FROM products LIMIT 5;
```
</details>

## Expected Output

When all tests pass:
```
test_queries.py::test_select_all_columns PASSED
test_queries.py::test_select_specific_columns PASSED
test_queries.py::test_column_alias PASSED
test_queries.py::test_calculated_column PASSED
test_queries.py::test_order_by_price PASSED
test_queries.py::test_order_by_multiple PASSED
test_queries.py::test_limit_results PASSED
test_queries.py::test_distinct_categories PASSED
```

## Common Mistakes

1. **Missing semicolon** - End each query with `;`
2. **Wrong alias name** - Use exactly the alias names specified
3. **Case sensitivity** - SQL keywords aren't case-sensitive, but column names might be
4. **Wrong sort order** - ASC is ascending (default), DESC is descending

## Next Exercise

Once all tests pass, move on to [02-filtering](../02-filtering/README.md).
