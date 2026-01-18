---
id: sql-joins
title: Joining Tables
type: lesson
duration: 60 mins
order: 3
section: joins
prevLessonId: sql-aggregations
nextLessonId: sql-window-functions
---

# Joining Tables

Real data lives across multiple tables. JOINs combine them into meaningful results.

## Why JOIN?

Database tables are normalized (split up) to avoid duplication:

```
customers table          orders table
-------------           ------------------
id | name               id | customer_id | total
1  | Alice              1  | 1           | 100
2  | Bob                2  | 1           | 150
3  | Carol              3  | 2           | 200
```

To see "Alice's orders", we need to JOIN these tables.

## INNER JOIN

Returns only matching rows from both tables:

```sql
SELECT
    customers.name,
    orders.id AS order_id,
    orders.total
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id;

-- Result:
-- name  | order_id | total
-- Alice | 1        | 100
-- Alice | 2        | 150
-- Bob   | 3        | 200
-- (Carol has no orders, not shown)
```

## Using Table Aliases

Makes queries cleaner:

```sql
SELECT
    c.name,
    c.email,
    o.id AS order_id,
    o.total,
    o.order_date
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
WHERE o.order_date >= '2024-01-01';
```

## LEFT JOIN (LEFT OUTER JOIN)

Returns ALL rows from left table, plus matching rows from right:

```sql
SELECT
    c.name,
    COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.name;

-- Result:
-- name  | order_count
-- Alice | 2
-- Bob   | 1
-- Carol | 0  (included even with no orders!)
```

Use LEFT JOIN when you want to keep all records from the first table.

## RIGHT JOIN

Returns ALL rows from right table, plus matching rows from left:

```sql
SELECT
    c.name,
    o.id AS order_id
FROM customers c
RIGHT JOIN orders o ON c.id = o.customer_id;
```

Less common than LEFT JOIN—you can usually rewrite as LEFT JOIN by swapping table order.

## FULL OUTER JOIN

Returns ALL rows from both tables:

```sql
SELECT
    c.name,
    o.id AS order_id
FROM customers c
FULL OUTER JOIN orders o ON c.id = o.customer_id;

-- Shows customers without orders AND orders without customers
```

## Visual Summary

```
INNER JOIN:      LEFT JOIN:       RIGHT JOIN:     FULL OUTER:
   ┌───┐            ┌───┐            ┌───┐          ┌───┐
   │ ∩ │            │█∩ │            │ ∩█│          │█∩█│
   └───┘            └───┘            └───┘          └───┘
Only matching     All left +       All right +    All from
   rows           matching         matching         both
```

## Joining Multiple Tables

```sql
-- Orders with customer names and product details
SELECT
    c.name AS customer,
    o.id AS order_id,
    o.order_date,
    p.name AS product,
    oi.quantity,
    oi.price
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.order_date >= '2024-01-01'
ORDER BY o.order_date DESC;
```

## Self JOIN

Join a table to itself:

```sql
-- Find employees and their managers
SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Find products in the same category
SELECT
    p1.name AS product1,
    p2.name AS product2,
    p1.category
FROM products p1
INNER JOIN products p2 ON p1.category = p2.category
WHERE p1.id < p2.id;  -- Avoid duplicates
```

## CROSS JOIN

Every row from first table matched with every row from second:

```sql
-- All combinations of sizes and colors
SELECT
    s.size,
    c.color
FROM sizes s
CROSS JOIN colors c;

-- 3 sizes × 4 colors = 12 rows
```

## JOIN Conditions

Can use complex conditions:

```sql
-- Join on multiple columns
SELECT *
FROM orders o
JOIN order_history h
    ON o.id = h.order_id
    AND o.customer_id = h.customer_id;

-- Join with inequality
SELECT
    p.name,
    d.discount_percent
FROM products p
JOIN discounts d
    ON p.price >= d.min_price
    AND p.price < d.max_price;
```

## Common Patterns

### Find Records Without Matches

```sql
-- Customers who never ordered (LEFT JOIN + NULL check)
SELECT c.*
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- Products never sold
SELECT p.*
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.id IS NULL;
```

### Aggregate Across Joins

```sql
-- Total spent per customer
SELECT
    c.id,
    c.name,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(o.total), 0) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC;
```

### Latest Record Per Group

```sql
-- Each customer's most recent order
SELECT
    c.name,
    o.id AS order_id,
    o.order_date,
    o.total
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
INNER JOIN (
    SELECT customer_id, MAX(order_date) AS max_date
    FROM orders
    GROUP BY customer_id
) latest ON o.customer_id = latest.customer_id
        AND o.order_date = latest.max_date;
```

## Practical Examples

### Complete Order Report

```sql
SELECT
    o.id AS order_id,
    o.order_date,
    c.name AS customer,
    c.email,
    c.state,
    COUNT(oi.id) AS item_count,
    SUM(oi.quantity) AS total_units,
    SUM(oi.quantity * oi.price) AS subtotal,
    o.shipping_cost,
    o.total AS order_total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY o.id, o.order_date, c.name, c.email, c.state,
         o.shipping_cost, o.total
ORDER BY o.order_date DESC;
```

### Sales by Category and Region

```sql
SELECT
    p.category,
    c.state,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.price) AS revenue
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.order_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY p.category, c.state
ORDER BY revenue DESC;
```

## Performance Tips

1. **Index foreign keys** - Speeds up JOIN operations
2. **Filter early** - Use WHERE before JOIN when possible
3. **Select only needed columns** - Avoid SELECT *
4. **Be careful with CROSS JOIN** - Can create huge result sets

## Knowledge Check

1. What does INNER JOIN return?
   - Only rows that have matching values in both tables
   - All rows from the left table
   - All rows from both tables
   - Rows that don't match

2. Which JOIN would you use to find customers who have never placed an order?
   - LEFT JOIN with WHERE right_table.id IS NULL
   - INNER JOIN
   - RIGHT JOIN
   - CROSS JOIN

3. What is a self join?
   - Joining a table to itself
   - Joining two identical tables
   - An automatic join
   - A join without conditions

4. In `FROM orders o JOIN customers c ON o.customer_id = c.id`, what does 'o' represent?
   - An alias for the orders table
   - The output table
   - An operator
   - The ON clause

5. What happens if you forget the ON clause in an INNER JOIN?
   - Syntax error or unintended CROSS JOIN (every row matched with every row)
   - Returns no rows
   - Returns all rows from first table
   - Database crashes
