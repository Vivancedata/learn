---
id: sql-basics
title: SQL Fundamentals - SELECT and WHERE
type: lesson
duration: 50 mins
order: 1
section: fundamentals
nextLessonId: sql-aggregations
---

# SQL Fundamentals - SELECT and WHERE

SQL (Structured Query Language) lets you talk to databases. Every time you use an app, website, or service, SQL is working behind the scenes to retrieve your data.

## Your First SQL Query

```sql
SELECT * FROM customers;
```

That's it! This query retrieves all columns (`*`) from the `customers` table.

## The SELECT Statement

SELECT specifies which columns you want:

```sql
-- Get specific columns
SELECT first_name, last_name, email
FROM customers;

-- Get all columns
SELECT *
FROM customers;

-- Rename columns with aliases
SELECT
    first_name AS "First Name",
    last_name AS "Last Name",
    email AS "Email Address"
FROM customers;
```

## Filtering with WHERE

WHERE filters rows based on conditions:

```sql
-- Find customers from California
SELECT * FROM customers
WHERE state = 'CA';

-- Find orders over $100
SELECT * FROM orders
WHERE total_amount > 100;

-- Find products in stock
SELECT * FROM products
WHERE stock_quantity > 0;
```

## Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equal to | `state = 'CA'` |
| `<>` or `!=` | Not equal | `status <> 'cancelled'` |
| `>` | Greater than | `price > 50` |
| `<` | Less than | `age < 30` |
| `>=` | Greater or equal | `rating >= 4` |
| `<=` | Less or equal | `quantity <= 10` |

```sql
-- Multiple examples
SELECT * FROM products WHERE price >= 100;
SELECT * FROM employees WHERE hire_date < '2020-01-01';
SELECT * FROM reviews WHERE rating <> 5;
```

## Combining Conditions: AND, OR, NOT

```sql
-- AND: Both conditions must be true
SELECT * FROM customers
WHERE state = 'CA' AND status = 'active';

-- OR: At least one condition must be true
SELECT * FROM products
WHERE category = 'Electronics' OR category = 'Computers';

-- NOT: Reverses the condition
SELECT * FROM orders
WHERE NOT status = 'cancelled';

-- Combine them (use parentheses for clarity)
SELECT * FROM customers
WHERE (state = 'CA' OR state = 'NY')
  AND status = 'active';
```

## IN and BETWEEN

```sql
-- IN: Match any value in a list
SELECT * FROM customers
WHERE state IN ('CA', 'NY', 'TX', 'FL');

-- Same as multiple OR conditions, but cleaner
-- WHERE state = 'CA' OR state = 'NY' OR state = 'TX' OR state = 'FL'

-- BETWEEN: Range of values (inclusive)
SELECT * FROM products
WHERE price BETWEEN 50 AND 100;

-- Same as
-- WHERE price >= 50 AND price <= 100

-- BETWEEN works with dates too
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';
```

## Pattern Matching with LIKE

```sql
-- % matches any sequence of characters
SELECT * FROM customers
WHERE email LIKE '%@gmail.com';  -- Ends with @gmail.com

SELECT * FROM products
WHERE name LIKE 'iPhone%';  -- Starts with iPhone

SELECT * FROM customers
WHERE name LIKE '%Smith%';  -- Contains Smith

-- _ matches exactly one character
SELECT * FROM products
WHERE sku LIKE 'PRD-___';  -- PRD- followed by exactly 3 characters
```

## Handling NULL Values

NULL means "unknown" or "no value" - it's not zero or empty string.

```sql
-- Find rows with NULL
SELECT * FROM customers
WHERE phone IS NULL;

-- Find rows without NULL
SELECT * FROM customers
WHERE phone IS NOT NULL;

-- WRONG: This doesn't work!
-- SELECT * FROM customers WHERE phone = NULL;
```

## Sorting with ORDER BY

```sql
-- Sort ascending (default)
SELECT * FROM products
ORDER BY price;

-- Sort descending
SELECT * FROM products
ORDER BY price DESC;

-- Multiple columns
SELECT * FROM customers
ORDER BY state ASC, last_name ASC;

-- Sort by column position (not recommended)
SELECT first_name, last_name, email
FROM customers
ORDER BY 2;  -- Sort by second column (last_name)
```

## Limiting Results

```sql
-- Get first 10 rows
SELECT * FROM products
ORDER BY price DESC
LIMIT 10;

-- Skip first 20, get next 10 (pagination)
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 10 OFFSET 20;

-- Top 5 most expensive products
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 5;
```

## Removing Duplicates with DISTINCT

```sql
-- Get unique states
SELECT DISTINCT state
FROM customers;

-- Unique combinations
SELECT DISTINCT city, state
FROM customers;

-- Count unique values
SELECT COUNT(DISTINCT state)
FROM customers;
```

## Basic Calculations

```sql
-- Math in SELECT
SELECT
    name,
    price,
    price * 0.9 AS discounted_price,
    price * 1.08 AS price_with_tax
FROM products;

-- Concatenate strings
SELECT
    first_name || ' ' || last_name AS full_name
FROM customers;

-- Or use CONCAT function
SELECT
    CONCAT(first_name, ' ', last_name) AS full_name
FROM customers;
```

## Practical Example: E-commerce Analysis

```sql
-- Find high-value customers in California
SELECT
    customer_id,
    first_name,
    last_name,
    email,
    total_spent
FROM customers
WHERE state = 'CA'
  AND total_spent > 1000
  AND status = 'active'
ORDER BY total_spent DESC
LIMIT 20;

-- Find products that need restocking
SELECT
    product_id,
    name,
    stock_quantity,
    reorder_level
FROM products
WHERE stock_quantity <= reorder_level
  AND status = 'active'
ORDER BY stock_quantity ASC;

-- Search for products
SELECT name, category, price
FROM products
WHERE name LIKE '%wireless%'
   OR description LIKE '%bluetooth%'
ORDER BY price;
```

## Query Structure Summary

```sql
SELECT columns          -- What columns to show
FROM table              -- Which table to query
WHERE conditions        -- Filter rows
ORDER BY columns        -- Sort results
LIMIT n                 -- Limit number of rows
```

The order matters! SELECT → FROM → WHERE → ORDER BY → LIMIT

## Knowledge Check

1. Which clause is used to filter rows in a SQL query?
   - WHERE
   - SELECT
   - FROM
   - ORDER BY

2. How do you check if a value is NULL?
   - IS NULL
   - = NULL
   - == NULL
   - EQUALS NULL

3. What does `SELECT * FROM products WHERE price BETWEEN 10 AND 50` return?
   - Products with price from 10 to 50, inclusive
   - Products with price from 10 to 50, exclusive
   - Products with price exactly 10 or 50
   - An error

4. Which operator would you use to find all emails ending with "@company.com"?
   - LIKE '%@company.com'
   - LIKE '@company.com%'
   - = '%@company.com'
   - IN ('@company.com')

5. How do you get unique values from a column?
   - SELECT DISTINCT column_name
   - SELECT UNIQUE column_name
   - SELECT column_name UNIQUE
   - SELECT ONLY column_name
