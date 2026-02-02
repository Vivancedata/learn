-- Solution for Exercise 03: JOINs
-- These are reference solutions. Try to solve the exercise yourself first!

-- Query: basic_inner_join
-- Join customers and orders to show customer name with their order details
SELECT customers.name, orders.order_date, orders.total_amount
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id;

-- Query: left_join
-- Show ALL customers with their orders (include customers with no orders)
SELECT customers.name, orders.order_date
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;

-- Query: join_with_filter
-- Find orders from customers who live in New York
SELECT customers.name, orders.order_date, orders.total_amount
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
WHERE customers.city = 'New York';

-- Query: multiple_table_join
-- Join all three tables to show customer, order, and item details
SELECT customers.name, orders.order_date, order_items.product_name, order_items.quantity
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
INNER JOIN order_items ON orders.id = order_items.order_id;

-- Query: aggregation_with_join
-- Count how many orders each customer has made (including 0)
SELECT customers.name, COUNT(orders.id) AS order_count
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id
GROUP BY customers.id, customers.name;

-- Query: join_with_group_by
-- Calculate total spending per customer (only customers with orders)
SELECT customers.name, SUM(orders.total_amount) AS total_spent
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
GROUP BY customers.id, customers.name;

-- Query: table_aliases
-- Rewrite using short table aliases
SELECT c.name, o.order_date, o.total_amount
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id;

-- Query: complex_join
-- Find customers who ordered "Widget A"
SELECT DISTINCT c.name
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
INNER JOIN order_items i ON o.id = i.order_id
WHERE i.product_name = 'Widget A';
