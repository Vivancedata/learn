---
id: sql-window-functions
title: Window Functions
type: lesson
duration: 55 mins
order: 4
section: advanced
prevLessonId: sql-joins
nextLessonId: sql-project
---

# Window Functions

Window functions perform calculations across rows related to the current row—without collapsing them into groups. They're essential for rankings, running totals, and time-series analysis.

## Window Functions vs GROUP BY

```sql
-- GROUP BY: Collapses rows
SELECT category, AVG(price)
FROM products
GROUP BY category;
-- Returns one row per category

-- Window Function: Keeps all rows
SELECT
    name,
    category,
    price,
    AVG(price) OVER (PARTITION BY category) AS category_avg
FROM products;
-- Returns all products with their category average
```

## Basic Syntax

```sql
function_name() OVER (
    PARTITION BY column   -- Optional: divide into groups
    ORDER BY column       -- Optional: order within partition
    frame_clause          -- Optional: define row range
)
```

## Ranking Functions

### ROW_NUMBER()

Assigns unique sequential numbers:

```sql
SELECT
    name,
    category,
    price,
    ROW_NUMBER() OVER (ORDER BY price DESC) AS price_rank
FROM products;

-- With partitions: rank within each category
SELECT
    name,
    category,
    price,
    ROW_NUMBER() OVER (
        PARTITION BY category
        ORDER BY price DESC
    ) AS rank_in_category
FROM products;
```

### RANK() and DENSE_RANK()

Handle ties differently:

```sql
SELECT
    name,
    price,
    ROW_NUMBER() OVER (ORDER BY price DESC) AS row_num,
    RANK() OVER (ORDER BY price DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY price DESC) AS dense_rank
FROM products;

-- If two products tied at $100:
-- ROW_NUMBER: 1, 2, 3, 4...  (unique numbers)
-- RANK:       1, 1, 3, 4...  (skip after tie)
-- DENSE_RANK: 1, 1, 2, 3...  (no skip after tie)
```

### NTILE()

Divide into buckets:

```sql
-- Divide customers into quartiles by spending
SELECT
    name,
    total_spent,
    NTILE(4) OVER (ORDER BY total_spent DESC) AS spending_quartile
FROM customers;
-- 1 = top 25%, 2 = next 25%, etc.
```

## Aggregate Window Functions

Use standard aggregates as window functions:

```sql
SELECT
    order_date,
    total,
    SUM(total) OVER (ORDER BY order_date) AS running_total,
    AVG(total) OVER (ORDER BY order_date) AS running_avg,
    COUNT(*) OVER (ORDER BY order_date) AS cumulative_count
FROM orders;
```

### Running Totals

```sql
-- Daily revenue with running total
SELECT
    order_date,
    SUM(total) AS daily_revenue,
    SUM(SUM(total)) OVER (ORDER BY order_date) AS running_total
FROM orders
GROUP BY order_date
ORDER BY order_date;
```

### Moving Averages

```sql
-- 7-day moving average
SELECT
    order_date,
    daily_revenue,
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d
FROM daily_sales;
```

## LAG and LEAD

Access previous or next rows:

```sql
-- Compare to previous day
SELECT
    order_date,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY order_date) AS prev_day,
    revenue - LAG(revenue, 1) OVER (ORDER BY order_date) AS change,
    ROUND(100.0 * (revenue - LAG(revenue, 1) OVER (ORDER BY order_date))
          / LAG(revenue, 1) OVER (ORDER BY order_date), 1) AS pct_change
FROM daily_revenue;

-- Look ahead
SELECT
    order_date,
    revenue,
    LEAD(revenue, 1) OVER (ORDER BY order_date) AS next_day
FROM daily_revenue;

-- Compare to same day last week
SELECT
    order_date,
    revenue,
    LAG(revenue, 7) OVER (ORDER BY order_date) AS week_ago,
    revenue - LAG(revenue, 7) OVER (ORDER BY order_date) AS wow_change
FROM daily_revenue;
```

## FIRST_VALUE and LAST_VALUE

Get first or last value in the window:

```sql
SELECT
    name,
    category,
    price,
    FIRST_VALUE(name) OVER (
        PARTITION BY category
        ORDER BY price DESC
    ) AS most_expensive_in_category,
    FIRST_VALUE(price) OVER (
        PARTITION BY category
        ORDER BY price DESC
    ) AS highest_price_in_category
FROM products;
```

## Frame Clauses

Control which rows are included:

```sql
-- ROWS BETWEEN defines the frame
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- All rows up to current
ROWS BETWEEN 3 PRECEDING AND CURRENT ROW          -- Last 3 rows + current
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING          -- Previous, current, next
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING  -- Current and all after

-- Example: 3-row moving average
SELECT
    order_date,
    revenue,
    AVG(revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ) AS smoothed_revenue
FROM daily_revenue;
```

## Practical Examples

### Top N Per Category

```sql
-- Top 3 products by revenue in each category
WITH ranked_products AS (
    SELECT
        p.name,
        p.category,
        SUM(oi.quantity * oi.price) AS revenue,
        ROW_NUMBER() OVER (
            PARTITION BY p.category
            ORDER BY SUM(oi.quantity * oi.price) DESC
        ) AS rank
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.name, p.category
)
SELECT * FROM ranked_products WHERE rank <= 3;
```

### Year-over-Year Comparison

```sql
SELECT
    EXTRACT(YEAR FROM order_date) AS year,
    EXTRACT(MONTH FROM order_date) AS month,
    SUM(total) AS revenue,
    LAG(SUM(total), 12) OVER (ORDER BY EXTRACT(YEAR FROM order_date),
                                       EXTRACT(MONTH FROM order_date)) AS prev_year_revenue,
    ROUND(100.0 * (SUM(total) - LAG(SUM(total), 12) OVER (
        ORDER BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
    )) / NULLIF(LAG(SUM(total), 12) OVER (
        ORDER BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
    ), 0), 1) AS yoy_growth_pct
FROM orders
GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
ORDER BY year, month;
```

### Customer Lifetime Value Percentiles

```sql
SELECT
    customer_id,
    total_spent,
    NTILE(100) OVER (ORDER BY total_spent) AS percentile,
    CASE
        WHEN NTILE(100) OVER (ORDER BY total_spent) >= 90 THEN 'Top 10%'
        WHEN NTILE(100) OVER (ORDER BY total_spent) >= 75 THEN 'Top 25%'
        WHEN NTILE(100) OVER (ORDER BY total_spent) >= 50 THEN 'Top 50%'
        ELSE 'Bottom 50%'
    END AS segment
FROM (
    SELECT customer_id, SUM(total) AS total_spent
    FROM orders
    GROUP BY customer_id
) customer_totals;
```

### Session Analysis

```sql
-- Time between orders for each customer
SELECT
    customer_id,
    order_date,
    LAG(order_date) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
    ) AS prev_order_date,
    order_date - LAG(order_date) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
    ) AS days_since_last_order
FROM orders;
```

## Named Windows

Reuse window definitions:

```sql
SELECT
    order_date,
    revenue,
    SUM(revenue) OVER w AS running_total,
    AVG(revenue) OVER w AS running_avg,
    COUNT(*) OVER w AS running_count
FROM daily_revenue
WINDOW w AS (ORDER BY order_date)
ORDER BY order_date;
```

## Knowledge Check

1. What is the main difference between window functions and GROUP BY?
   - Window functions keep all rows while GROUP BY collapses them
   - Window functions are faster
   - GROUP BY can't do aggregations
   - There is no difference

2. What does PARTITION BY do in a window function?
   - Divides rows into groups for separate calculations
   - Filters rows
   - Sorts the results
   - Limits the output

3. What is the difference between RANK() and DENSE_RANK()?
   - RANK skips numbers after ties, DENSE_RANK doesn't
   - DENSE_RANK is faster
   - RANK only works with numbers
   - There is no difference

4. What does LAG(revenue, 7) return?
   - The revenue value from 7 rows before the current row
   - The sum of the last 7 revenue values
   - The average of 7 values
   - The next 7 rows

5. How would you calculate a running total of sales?
   - SUM(sales) OVER (ORDER BY date)
   - SUM(sales) GROUP BY date
   - RUNNING_TOTAL(sales)
   - SELECT SUM(sales)
