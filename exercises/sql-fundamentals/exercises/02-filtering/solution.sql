-- Solution for Exercise 02: Filtering with WHERE
-- These are reference solutions. Try to solve the exercise yourself first!

-- Query: basic_comparison
-- Select all employees with a salary greater than 80000
SELECT * FROM employees WHERE salary > 80000;

-- Query: equality_check
-- Select all employees in the Engineering department
SELECT * FROM employees WHERE department = 'Engineering';

-- Query: and_condition
-- Select employees who are in Engineering AND have a salary >= 90000
SELECT * FROM employees
WHERE department = 'Engineering' AND salary >= 90000;

-- Query: or_condition
-- Select employees who are in Marketing OR Sales
SELECT * FROM employees
WHERE department = 'Marketing' OR department = 'Sales';

-- Query: not_condition
-- Select all employees who are NOT in Engineering
SELECT * FROM employees WHERE department <> 'Engineering';
-- Alternative: SELECT * FROM employees WHERE NOT department = 'Engineering';

-- Query: like_pattern
-- Select employees whose name starts with 'E'
SELECT * FROM employees WHERE name LIKE 'E%';

-- Query: in_operator
-- Select employees whose department is in: Engineering, Marketing
SELECT * FROM employees
WHERE department IN ('Engineering', 'Marketing');

-- Query: between_range
-- Select employees with salary between 75000 and 90000 (inclusive)
SELECT * FROM employees WHERE salary BETWEEN 75000 AND 90000;
-- Alternative: SELECT * FROM employees WHERE salary >= 75000 AND salary <= 90000;

-- Query: null_handling
-- Select employees who have no manager (manager_id is NULL)
SELECT * FROM employees WHERE manager_id IS NULL;

-- Query: complex_condition
-- Select remote employees in Engineering with salary > 85000
SELECT * FROM employees
WHERE is_remote = 1
  AND department = 'Engineering'
  AND salary > 85000;
