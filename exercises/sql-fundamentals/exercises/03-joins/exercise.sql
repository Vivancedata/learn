-- Exercise 03: JOINs
-- Complete each query below according to its description.
-- Keep the "-- Query:" comments exactly as they are - tests use them to find your queries.

-- Query: basic_inner_join
-- Join customers and orders to show customer name with their order details
-- Return columns: name, order_date, total_amount
-- TODO: Write your query below


-- Query: left_join
-- Show ALL customers with their orders (include customers with no orders)
-- Return columns: name, order_date (will be NULL for customers without orders)
-- Hint: Use LEFT JOIN
-- TODO: Write your query below


-- Query: join_with_filter
-- Find orders from customers who live in New York
-- Return columns: name, order_date, total_amount
-- TODO: Write your query below


-- Query: multiple_table_join
-- Join all three tables to show customer, order, and item details
-- Return columns: name, order_date, product_name, quantity
-- Hint: You'll need to join customers -> orders -> order_items
-- TODO: Write your query below


-- Query: aggregation_with_join
-- Count how many orders each customer has made
-- Return columns: name, order_count
-- Include customers with 0 orders (use LEFT JOIN)
-- Hint: Use COUNT(orders.id), not COUNT(*), to get 0 for no orders
-- TODO: Write your query below


-- Query: join_with_group_by
-- Calculate total spending per customer
-- Return columns: name, total_spent
-- Only include customers who have at least one order
-- Hint: Use SUM and GROUP BY
-- TODO: Write your query below


-- Query: table_aliases
-- Rewrite the basic inner join using short table aliases (c for customers, o for orders)
-- Return columns: name, order_date, total_amount (same as basic_inner_join)
-- This demonstrates cleaner, more readable SQL
-- TODO: Write your query below


-- Query: complex_join
-- Find customers who ordered "Widget A"
-- Return columns: name (just the customer name, no duplicates)
-- Hint: Use DISTINCT and join through to order_items
-- TODO: Write your query below
