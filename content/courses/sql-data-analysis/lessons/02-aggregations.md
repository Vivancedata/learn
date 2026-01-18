---
id: sql-aggregations
title: Aggregations and GROUP BY
type: lesson
duration: 55 mins
order: 2
section: fundamentals
prevLessonId: sql-basics
nextLessonId: sql-joins
---

# Aggregations and GROUP BY

Aggregations summarize data—turning many rows into meaningful insights like totals, averages, and counts.

## Aggregate Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `COUNT()` | Count rows | Number of orders |
| `SUM()` | Add values | Total revenue |
| `AVG()` | Calculate average | Average order value |
| `MIN()` | Find minimum | Lowest price |
| `MAX()` | Find maximum | Highest sale |

## Basic Aggregations

```sql
-- Count all rows
SELECT COUNT(*) FROM orders;

-- Count non-NULL values
SELECT COUNT(phone) FROM customers;

-- Sum of a column
SELECT SUM(total_amount) FROM orders;

-- Average value
SELECT AVG(price) FROM products;

-- Min and Max
SELECT MIN(price), MAX(price) FROM products;

-- Multiple aggregations
SELECT
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS avg_order_value,
    MIN(total_amount) AS smallest_order,
    MAX(total_amount) AS largest_order
FROM orders;
```

## COUNT Variations

```sql
-- COUNT(*) counts all rows
SELECT COUNT(*) FROM customers;  -- 1000

-- COUNT(column) counts non-NULL values
SELECT COUNT(phone) FROM customers;  -- 850 (150 have NULL phone)

-- COUNT(DISTINCT column) counts unique values
SELECT COUNT(DISTINCT state) FROM customers;  -- 50 states

-- Count with condition
SELECT COUNT(*) FROM orders WHERE status = 'completed';
```

## GROUP BY: Summarize by Categories

GROUP BY splits data into groups and calculates aggregates for each:

```sql
-- Sales by state
SELECT
    state,
    COUNT(*) AS customer_count
FROM customers
GROUP BY state
ORDER BY customer_count DESC;

-- Revenue by product category
SELECT
    category,
    SUM(quantity * price) AS total_revenue,
    COUNT(*) AS order_count
FROM order_items
JOIN products ON order_items.product_id = products.id
GROUP BY category;

-- Orders by month
SELECT
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*) AS orders,
    SUM(total_amount) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
```

## Multiple GROUP BY Columns

```sql
-- Sales by category and year
SELECT
    category,
    EXTRACT(YEAR FROM order_date) AS year,
    SUM(total_amount) AS revenue
FROM orders
JOIN order_items ON orders.id = order_items.order_id
JOIN products ON order_items.product_id = products.id
GROUP BY category, EXTRACT(YEAR FROM order_date)
ORDER BY category, year;

-- Customer counts by city and state
SELECT
    state,
    city,
    COUNT(*) AS customers
FROM customers
GROUP BY state, city
ORDER BY state, customers DESC;
```

## HAVING: Filter Groups

WHERE filters rows before grouping. HAVING filters groups after aggregation.

```sql
-- States with more than 100 customers
SELECT
    state,
    COUNT(*) AS customer_count
FROM customers
GROUP BY state
HAVING COUNT(*) > 100
ORDER BY customer_count DESC;

-- Categories with revenue over $10,000
SELECT
    category,
    SUM(price * quantity) AS revenue
FROM order_items
JOIN products ON order_items.product_id = products.id
GROUP BY category
HAVING SUM(price * quantity) > 10000;

-- Products ordered more than 50 times with avg quantity > 2
SELECT
    product_id,
    COUNT(*) AS times_ordered,
    AVG(quantity) AS avg_quantity
FROM order_items
GROUP BY product_id
HAVING COUNT(*) > 50 AND AVG(quantity) > 2;
```

## WHERE vs HAVING

```sql
-- WHERE filters BEFORE grouping
SELECT
    category,
    AVG(price) AS avg_price
FROM products
WHERE status = 'active'  -- Filter individual rows
GROUP BY category;

-- HAVING filters AFTER grouping
SELECT
    category,
    AVG(price) AS avg_price
FROM products
WHERE status = 'active'
GROUP BY category
HAVING AVG(price) > 50;  -- Filter aggregated results

-- Use both together
SELECT
    state,
    SUM(total_amount) AS total_revenue
FROM orders
JOIN customers ON orders.customer_id = customers.id
WHERE order_date >= '2024-01-01'  -- Filter: only 2024 orders
GROUP BY state
HAVING SUM(total_amount) > 50000;  -- Filter: high-revenue states
```

## Conditional Aggregations

Use CASE inside aggregate functions:

```sql
-- Count by status
SELECT
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled
FROM orders;

-- Revenue by payment method
SELECT
    SUM(CASE WHEN payment_method = 'credit_card' THEN total_amount ELSE 0 END) AS credit_card_revenue,
    SUM(CASE WHEN payment_method = 'paypal' THEN total_amount ELSE 0 END) AS paypal_revenue,
    SUM(CASE WHEN payment_method = 'bank_transfer' THEN total_amount ELSE 0 END) AS bank_revenue
FROM orders;

-- Percentage calculations
SELECT
    category,
    COUNT(*) AS total_products,
    COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) AS in_stock,
    ROUND(100.0 * COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) / COUNT(*), 1) AS in_stock_pct
FROM products
GROUP BY category;
```

## Practical Examples

### Sales Dashboard Metrics

```sql
SELECT
    DATE_TRUNC('month', order_date) AS month,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS revenue,
    AVG(total_amount) AS avg_order_value,
    SUM(total_amount) / COUNT(DISTINCT customer_id) AS revenue_per_customer
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
```

### Product Performance Analysis

```sql
SELECT
    p.category,
    p.name,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.price) AS revenue,
    AVG(r.rating) AS avg_rating,
    COUNT(DISTINCT o.customer_id) AS unique_buyers
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.category, p.name
HAVING SUM(oi.quantity) > 10
ORDER BY revenue DESC
LIMIT 20;
```

### Customer Segmentation

```sql
SELECT
    CASE
        WHEN total_orders >= 10 THEN 'VIP'
        WHEN total_orders >= 5 THEN 'Regular'
        WHEN total_orders >= 1 THEN 'Occasional'
        ELSE 'Never Purchased'
    END AS customer_segment,
    COUNT(*) AS customer_count,
    AVG(total_spent) AS avg_lifetime_value
FROM (
    SELECT
        c.id,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    GROUP BY c.id
) customer_stats
GROUP BY customer_segment
ORDER BY avg_lifetime_value DESC;
```

## Query Execution Order

Understanding this helps write correct queries:

```
1. FROM      - Choose tables
2. WHERE    - Filter rows
3. GROUP BY - Create groups
4. HAVING   - Filter groups
5. SELECT   - Choose columns
6. ORDER BY - Sort results
7. LIMIT    - Limit output
```

This is why you can't use column aliases in WHERE but can in ORDER BY.

## Knowledge Check

1. What does COUNT(*) count?
   - All rows including those with NULL values
   - Only rows without NULL values
   - Only unique values
   - Only numeric values

2. What is the difference between WHERE and HAVING?
   - WHERE filters rows before grouping, HAVING filters after aggregation
   - They are identical
   - WHERE is for numbers, HAVING is for text
   - HAVING runs before WHERE

3. How do you find categories with more than 100 products?
   - GROUP BY category HAVING COUNT(*) > 100
   - WHERE COUNT(*) > 100 GROUP BY category
   - GROUP BY category WHERE COUNT(*) > 100
   - SELECT category WHERE products > 100

4. What does this return: `SELECT COUNT(DISTINCT customer_id) FROM orders`?
   - The number of unique customers who placed orders
   - The total number of orders
   - The number of products ordered
   - An error

5. Which aggregate function would you use to find the total revenue?
   - SUM()
   - COUNT()
   - AVG()
   - TOTAL()
