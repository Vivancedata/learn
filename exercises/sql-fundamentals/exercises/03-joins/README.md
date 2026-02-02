# Exercise 03: JOINs

In this exercise, you'll learn to combine data from multiple tables using JOIN operations - one of the most powerful SQL features.

## Learning Objectives

By completing this exercise, you will:
- Understand why JOINs are necessary
- Use INNER JOIN to match rows
- Use LEFT JOIN to include unmatched rows
- Join multiple tables
- Use table aliases effectively
- Perform self-joins

## Database Schema

The test database contains three tables:

```sql
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
```

**Sample Data:**

**customers:**
| id | name | email | city |
|----|------|-------|------|
| 1 | Alice | alice@example.com | New York |
| 2 | Bob | bob@example.com | Los Angeles |
| 3 | Carol | carol@example.com | Chicago |
| 4 | David | david@example.com | Houston |

**orders:**
| id | customer_id | order_date | total_amount |
|----|-------------|------------|--------------|
| 101 | 1 | 2024-01-15 | 150.00 |
| 102 | 1 | 2024-02-20 | 75.50 |
| 103 | 2 | 2024-01-25 | 200.00 |
| 104 | 3 | 2024-03-01 | 50.00 |

**order_items:**
| id | order_id | product_name | quantity | unit_price |
|----|----------|--------------|----------|------------|
| 1 | 101 | Widget A | 2 | 50.00 |
| 2 | 101 | Widget B | 1 | 50.00 |
| 3 | 102 | Widget A | 1 | 50.00 |
| 4 | 102 | Gadget X | 1 | 25.50 |
| 5 | 103 | Gadget Y | 4 | 50.00 |
| 6 | 104 | Widget A | 1 | 50.00 |

Note: David (customer 4) has no orders!

## Instructions

Open `exercise.sql` and complete each query.

## Tasks

### Query 1: Basic Inner Join
Join customers and orders to show customer name with their order details.
- Return: customer name, order_date, total_amount

### Query 2: Left Join
Show ALL customers with their orders (include customers with no orders).
- Return: customer name, order_date (NULL if no orders)

### Query 3: Join with Filter
Find orders from customers in New York.
- Return: customer name, order_date, total_amount

### Query 4: Multiple Table Join
Join all three tables to show customer, order, and item details.
- Return: customer name, order_date, product_name, quantity

### Query 5: Aggregation with Join
Count how many orders each customer has made.
- Return: customer name, order_count
- Include customers with 0 orders

### Query 6: Join with Group By
Calculate total spending per customer.
- Return: customer name, total_spent
- Only include customers who have orders

### Query 7: Table Aliases
Rewrite the basic inner join using short table aliases (c, o).
- Same result as Query 1, but using aliases

### Query 8: Complex Join
Find customers who ordered "Widget A".
- Return: distinct customer names

## Running Tests

```bash
# From the exercises directory
pytest sql-fundamentals/exercises/03-joins/test_queries.py -v
```

## Hints

<details>
<summary>Hint 1: INNER JOIN Syntax</summary>

```sql
SELECT columns
FROM table1
INNER JOIN table2 ON table1.column = table2.column;

-- Example:
SELECT customers.name, orders.total_amount
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id;
```
</details>

<details>
<summary>Hint 2: LEFT JOIN</summary>

LEFT JOIN keeps all rows from the left table, even without matches:
```sql
SELECT customers.name, orders.order_date
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;
-- David will appear with NULL order_date
```
</details>

<details>
<summary>Hint 3: Table Aliases</summary>

Make queries shorter and clearer:
```sql
SELECT c.name, o.total_amount
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id;
```
</details>

<details>
<summary>Hint 4: Multiple Joins</summary>

Chain joins together:
```sql
SELECT c.name, o.order_date, i.product_name
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
INNER JOIN order_items i ON o.id = i.order_id;
```
</details>

<details>
<summary>Hint 5: Aggregation with JOIN</summary>

Use COUNT and GROUP BY:
```sql
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name;
```
</details>

<details>
<summary>Hint 6: Finding Specific Items</summary>

Filter in WHERE after joining:
```sql
SELECT DISTINCT c.name
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
INNER JOIN order_items i ON o.id = i.order_id
WHERE i.product_name = 'Widget A';
```
</details>

## Expected Output

When all tests pass:
```
test_queries.py::test_basic_inner_join PASSED
test_queries.py::test_left_join PASSED
test_queries.py::test_join_with_filter PASSED
... (all tests pass)
```

## Common Mistakes

1. **Forgetting ON clause** - Joins need a condition to match rows
2. **Wrong join type** - INNER excludes non-matches, LEFT keeps left table rows
3. **Ambiguous columns** - Use table.column when same column name exists in multiple tables
4. **Missing GROUP BY** - When using aggregates, group by non-aggregated columns

## Understanding JOINs Visually

```
INNER JOIN: Only matching rows
[Customers] ∩ [Orders] = Customers WITH orders

LEFT JOIN: All left + matching right
[Customers] ∪→ [Orders] = ALL customers, orders if they exist

RIGHT JOIN: All right + matching left (reverse of LEFT)
(Not commonly used - just swap table order with LEFT JOIN)
```

## Why JOINs Matter

In real databases:
- Data is split across tables (normalization)
- JOINs combine related data for analysis
- Understanding JOINs is essential for any data role
- Most analytical queries involve multiple tables

## Congratulations!

After completing this exercise, you've mastered SQL fundamentals! Continue with:
- **Advanced SQL** - Subqueries, CTEs, window functions
- **Database Design** - Normalization, indexes, optimization
- **SQL with Python** - pandas, SQLAlchemy integration
