---
id: python-basics-data-science
title: Python Fundamentals for Data Science
type: lesson
duration: 60 mins
order: 1
section: python-fundamentals
nextLessonId: python-data-structures
---

# Python Fundamentals for Data Science

Let's start your Python journey! This lesson covers the essential Python basics you need for data science. We'll focus on what matters for working with data.

## Your First Python Code

```python
print("Hello, Data Science!")
```

That's it! You just wrote Python. Let's build from here.

## Variables and Data Types

Variables store data. In Python, you don't need to declare types—Python figures it out.

```python
# Numbers
age = 28
price = 99.99
population = 8_000_000  # Underscores for readability

# Strings (text)
name = "Alice"
city = 'San Francisco'  # Single or double quotes work

# Booleans (True/False)
is_active = True
has_discount = False

# See what type something is
print(type(age))        # <class 'int'>
print(type(price))      # <class 'float'>
print(type(name))       # <class 'str'>
```

### Common Data Science Numbers

```python
# Integers
user_count = 1500
clicks = 342

# Floats (decimals)
conversion_rate = 0.0523
average_revenue = 47.35
```

## Basic Math Operations

```python
# Addition
total = 100 + 50        # 150

# Subtraction
difference = 100 - 30   # 70

# Multiplication
product = 20 * 3        # 60

# Division (always returns float)
ratio = 100 / 4         # 25.0

# Integer division (no decimal)
quotient = 100 // 4     # 25

# Modulus (remainder)
remainder = 17 % 5      # 2

# Exponentiation
squared = 5 ** 2        # 25
```

### Useful for Data Analysis

```python
# Calculate percentage
total_sales = 10000
todays_sales = 1200
percentage = (todays_sales / total_sales) * 100  # 12.0

# Average
num1, num2, num3 = 10, 20, 30
average = (num1 + num2 + num3) / 3  # 20.0
```

## Strings for Data

Strings are everywhere in data: names, categories, descriptions.

```python
# Creating strings
product = "Laptop"
category = 'Electronics'
description = """This is a long description
that spans multiple lines"""

# Combining strings
first_name = "John"
last_name = "Doe"
full_name = first_name + " " + last_name  # "John Doe"

# F-strings (modern and best way)
age = 30
message = f"{first_name} is {age} years old"
# "John is 30 years old"

# String methods
text = "  Python for Data Science  "
text.lower()          # "  python for data science  "
text.upper()          # "  PYTHON FOR DATA SCIENCE  "
text.strip()          # "Python for Data Science"
text.replace("Python", "R")  # "  R for Data Science  "

# Checking strings
email = "user@example.com"
email.endswith(".com")    # True
email.startswith("user")  # True
"@" in email              # True
```

### Data Cleaning with Strings

```python
# Clean messy data
raw_name = "  JOHN DOE  "
clean_name = raw_name.strip().title()  # "John Doe"

# Extract parts
email = "john.doe@company.com"
username = email.split("@")[0]  # "john.doe"
domain = email.split("@")[1]    # "company.com"
```

## Lists - Your First Data Structure

Lists store multiple values in order.

```python
# Create lists
numbers = [1, 2, 3, 4, 5]
names = ["Alice", "Bob", "Charlie"]
mixed = [1, "two", 3.0, True]  # Can mix types

# Access elements (0-indexed)
numbers[0]     # 1 (first element)
numbers[-1]    # 5 (last element)
numbers[1:3]   # [2, 3] (slice)

# Modify lists
numbers.append(6)          # Add to end: [1, 2, 3, 4, 5, 6]
numbers.insert(0, 0)       # Add at position: [0, 1, 2, 3, 4, 5, 6]
numbers.remove(3)          # Remove value 3
popped = numbers.pop()     # Remove and return last element

# List info
len(numbers)   # How many elements
sum(numbers)   # Add all numbers
max(numbers)   # Largest number
min(numbers)   # Smallest number
```

### Data Analysis with Lists

```python
# Sales data
daily_sales = [150, 200, 175, 300, 250]

# Calculate metrics
total = sum(daily_sales)              # 1075
average = total / len(daily_sales)    # 215.0
highest = max(daily_sales)            # 300
lowest = min(daily_sales)             # 150

# Find position
best_day = daily_sales.index(highest)  # 3 (4th day)
```

## Dictionaries - Key-Value Pairs

Dictionaries store data with labels (like a real dictionary).

```python
# Create dictionary
user = {
    "name": "Alice",
    "age": 28,
    "city": "NYC",
    "is_premium": True
}

# Access values
user["name"]      # "Alice"
user.get("age")   # 28
user.get("country", "USA")  # "USA" (default if key doesn't exist)

# Modify dictionary
user["age"] = 29              # Update
user["email"] = "a@ex.com"    # Add new key
del user["city"]              # Remove key

# Dictionary methods
user.keys()     # dict_keys(['name', 'age', 'is_premium', 'email'])
user.values()   # dict_values(['Alice', 29, True, 'a@ex.com'])
```

### Data Records

```python
# Product data
product = {
    "id": 101,
    "name": "Laptop",
    "price": 999.99,
    "in_stock": True,
    "tags": ["electronics", "computers"]
}

# Access nested data
product["tags"][0]  # "electronics"
```

## Control Flow - Making Decisions

### If Statements

```python
age = 25

if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")

# Data science example
conversion_rate = 0.034

if conversion_rate > 0.05:
    status = "Great"
elif conversion_rate > 0.02:
    status = "Good"
else:
    status = "Needs improvement"
```

### Comparison Operators

```python
x = 10
y = 20

x == y    # False (equal)
x != y    # True (not equal)
x < y     # True
x > y     # False
x <= 10   # True
x >= 10   # True
```

### Logical Operators

```python
# AND - both must be True
age = 25
has_license = True
if age >= 18 and has_license:
    print("Can drive")

# OR - at least one must be True
is_weekend = True
is_holiday = False
if is_weekend or is_holiday:
    print("Day off!")

# NOT - reverse
is_raining = False
if not is_raining:
    print("Go outside!")
```

## Loops - Repeating Actions

### For Loops

```python
# Loop through list
numbers = [1, 2, 3, 4, 5]
for num in numbers:
    print(num)

# Loop with range
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 7):     # 2, 3, 4, 5, 6
    print(i)

for i in range(0, 10, 2): # 0, 2, 4, 6, 8 (step by 2)
    print(i)
```

### Data Processing Loops

```python
# Calculate total
sales = [100, 150, 200, 175, 225]
total = 0
for sale in sales:
    total += sale
print(total)  # 850

# Filter data
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
even_numbers = []
for num in numbers:
    if num % 2 == 0:
        even_numbers.append(num)
# [2, 4, 6, 8, 10]
```

### While Loops

```python
# Use when you don't know how many iterations
count = 0
while count < 5:
    print(count)
    count += 1  # Don't forget to increment!
```

## Functions - Reusable Code

```python
# Define function
def greet(name):
    return f"Hello, {name}!"

# Call function
message = greet("Alice")  # "Hello, Alice!"

# Function with multiple parameters
def calculate_total(price, quantity, tax_rate=0.08):
    subtotal = price * quantity
    tax = subtotal * tax_rate
    total = subtotal + tax
    return total

# Use it
total = calculate_total(10, 5)        # Uses default tax rate
total = calculate_total(10, 5, 0.10)  # Custom tax rate
```

### Data Analysis Functions

```python
def calculate_average(numbers):
    """Calculate the average of a list of numbers"""
    return sum(numbers) / len(numbers)

def find_outliers(numbers, threshold=2):
    """Find numbers that differ from mean by threshold * std dev"""
    avg = calculate_average(numbers)
    outliers = []
    for num in numbers:
        if abs(num - avg) > threshold * 10:  # Simplified
            outliers.append(num)
    return outliers

# Use functions
data = [10, 12, 11, 50, 13, 12]  # 50 is outlier
avg = calculate_average(data)    # 18.0
outliers = find_outliers(data)   # [50]
```

## List Comprehensions - Pythonic Magic

A concise way to create lists.

```python
# Traditional way
squares = []
for x in range(10):
    squares.append(x**2)

# List comprehension (Pythonic!)
squares = [x**2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]
# [0, 4, 16, 36, 64]

# Transform data
names = ["alice", "bob", "charlie"]
capitalized = [name.title() for name in names]
# ["Alice", "Bob", "Charlie"]
```

### Data Cleaning with Comprehensions

```python
# Clean sales data
raw_sales = ["$100", "$200", "$150", "$N/A", "$175"]

# Extract numbers, skip N/A
clean_sales = [
    float(sale.replace("$", ""))
    for sale in raw_sales
    if sale != "$N/A"
]
# [100.0, 200.0, 150.0, 175.0]
```

## Working with Files

```python
# Read file
with open("data.txt", "r") as file:
    content = file.read()
    print(content)

# Read line by line
with open("data.txt", "r") as file:
    for line in file:
        print(line.strip())

# Write to file
data = ["Line 1", "Line 2", "Line 3"]
with open("output.txt", "w") as file:
    for line in data:
        file.write(line + "\n")
```

## Practical Example - Sales Analysis

Let's put it all together with a real example:

```python
# Sales data for the week
sales_data = [
    {"day": "Monday", "sales": 1500, "customers": 45},
    {"day": "Tuesday", "sales": 1800, "customers": 52},
    {"day": "Wednesday", "sales": 1200, "customers": 38},
    {"day": "Thursday", "sales": 2100, "customers": 61},
    {"day": "Friday", "sales": 2400, "customers": 68},
    {"day": "Saturday", "sales": 3000, "customers": 85},
    {"day": "Sunday", "sales": 2200, "customers": 71}
]

# Calculate total sales
total_sales = sum(day["sales"] for day in sales_data)
print(f"Total weekly sales: ${total_sales}")

# Calculate average
avg_sales = total_sales / len(sales_data)
print(f"Average daily sales: ${avg_sales:.2f}")

# Find best day
best_day = max(sales_data, key=lambda x: x["sales"])
print(f"Best day: {best_day['day']} with ${best_day['sales']}")

# Calculate average basket size
for day in sales_data:
    basket_size = day["sales"] / day["customers"]
    print(f"{day['day']}: ${basket_size:.2f} per customer")
```

## Knowledge Check

1. Which data type would you use to store a person's age?
   - Integer (int) for whole number years
   - String
   - Boolean
   - List

2. How do you access the third element in a list called `data`?
   - data[2] because Python uses 0-based indexing
   - data[3]
   - data.third()
   - data(2)

3. What does this code do: `numbers = [x * 2 for x in range(5)]`?
   - Creates a list [0, 2, 4, 6, 8] by doubling each number from 0 to 4
   - Creates a list [2, 4, 6, 8, 10]
   - Multiplies all numbers by 2
   - Creates a list with 5 twos

4. What is the purpose of a dictionary in Python?
   - Store key-value pairs to organize data with labels
   - Store only numbers
   - Sort data automatically
   - Create graphs

5. What does the `with open()` statement do?
   - Safely opens and automatically closes files after use
   - Opens files permanently
   - Deletes files
   - Creates new files only
