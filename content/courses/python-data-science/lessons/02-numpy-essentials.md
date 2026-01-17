---
id: numpy-essentials
title: NumPy Essentials for Data Science
type: lesson
duration: 50 mins
order: 2
section: numpy-numerical-computing
prevLessonId: python-basics-data-science
nextLessonId: pandas-fundamentals
---

# NumPy Essentials for Data Science

NumPy (Numerical Python) is the foundation of data science in Python. It's fast, efficient, and essential for working with numerical data.

## Why NumPy?

**Speed**: 50-100x faster than Python lists for numerical operations
**Memory**: Uses less memory
**Functionality**: Built-in mathematical operations
**Foundation**: Pandas, scikit-learn, and other libraries build on NumPy

## Your First NumPy Array

```python
import numpy as np

# From list
numbers = [1, 2, 3, 4, 5]
arr = np.array(numbers)
print(arr)  # [1 2 3 4 5]

# Direct creation
arr = np.array([1, 2, 3, 4, 5])
```

## Creating Arrays

```python
# Zeros
zeros = np.zeros(5)  # [0. 0. 0. 0. 0.]

# Ones
ones = np.ones(5)    # [1. 1. 1. 1. 1.]

# Range
nums = np.arange(0, 10, 2)  # [0 2 4 6 8]

# Evenly spaced
linear = np.linspace(0, 1, 5)  # [0.   0.25 0.5  0.75 1.  ]

# Random
random = np.random.rand(5)  # 5 random numbers [0, 1)
```

## Array Operations

```python
arr = np.array([1, 2, 3, 4, 5])

# Math operations (element-wise)
arr * 2           # [2, 4, 6, 8, 10]
arr + 10          # [11, 12, 13, 14, 15]
arr ** 2          # [1, 4, 9, 16, 25]
np.sqrt(arr)      # [1. 1.41 1.73 2. 2.24]

# Statistics
np.mean(arr)      # 3.0
np.median(arr)    # 3.0
np.std(arr)       # 1.41 (standard deviation)
np.sum(arr)       # 15
np.min(arr)       # 1
np.max(arr)       # 5
```

## 2D Arrays (Matrices)

```python
# Create 2D array
matrix = np.array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
])

# Shape
matrix.shape      # (3, 3) - 3 rows, 3 columns

# Access elements
matrix[0, 0]      # 1
matrix[1, 2]      # 6
matrix[0]         # [1, 2, 3] (first row)
matrix[:, 0]      # [1, 4, 7] (first column)
```

## Practical Data Science Example

```python
# Sales data for 4 products over 5 days
sales = np.array([
    [100, 150, 120, 180, 200],  # Product A
    [80, 90, 100, 95, 110],     # Product B
    [200, 220, 210, 230, 250],  # Product C
    [50, 60, 55, 70, 65]        # Product D
])

# Total sales per product
product_totals = sales.sum(axis=1)
# [750, 475, 1110, 300]

# Average sales per day
daily_avg = sales.mean(axis=0)
# [107.5, 130., 121.25, 143.75, 156.25]

# Best selling product
best = np.argmax(product_totals)  # 2 (Product C)

# Percentage growth
growth = ((sales[:, -1] - sales[:, 0]) / sales[:, 0]) * 100
# [100%, 37.5%, 25%, 30%]
```

## Knowledge Check

1. What is the main advantage of NumPy over Python lists?
   - Speed (50-100x faster) and memory efficiency for numerical operations
   - Easier syntax
   - Can store strings
   - Smaller file size

2. How do you calculate the mean of a NumPy array called `data`?
   - np.mean(data) or data.mean()
   - mean(data)
   - data.average()
   - sum(data) / len(data)

3. What does `arr.shape` tell you?
   - The dimensions of the array (rows, columns)
   - The total number of elements
   - The data type
   - The memory usage

4. How do you select the first column of a 2D array?
   - array[:, 0]
   - array[0]
   - array[0, :]
   - array.column(0)

5. What does `axis=0` mean in NumPy operations?
   - Operation along rows (column-wise aggregation)
   - Operation along columns
   - First element
   - Last element
