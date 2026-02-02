-- Solution for Exercise 01: SELECT Basics
-- These are reference solutions. Try to solve the exercise yourself first!

-- Query: select_all_columns
-- Select all columns from the products table
SELECT * FROM products;

-- Query: select_specific_columns
-- Select only the name and price columns from products
SELECT name, price FROM products;

-- Query: column_alias
-- Select product name and price, but rename price to "cost"
SELECT name, price AS cost FROM products;

-- Query: calculated_column
-- Select product name and total value (price * quantity)
SELECT name, price * quantity AS total_value FROM products;

-- Query: order_by_price
-- Select all products ordered by price from highest to lowest
SELECT * FROM products ORDER BY price DESC;

-- Query: order_by_multiple
-- Select all products ordered by category (A-Z), then by price (low to high)
SELECT * FROM products ORDER BY category ASC, price ASC;

-- Query: limit_results
-- Select the 3 most expensive products (all columns)
SELECT * FROM products ORDER BY price DESC LIMIT 3;

-- Query: distinct_categories
-- Select all unique categories from the products table
SELECT DISTINCT category FROM products;
