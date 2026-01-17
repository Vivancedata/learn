---
id: pandas-fundamentals
title: Pandas Fundamentals - Data Manipulation Mastery
type: lesson
duration: 70 mins
order: 3
section: pandas-data-analysis
prevLessonId: numpy-essentials
---

# Pandas Fundamentals - Data Manipulation Mastery

Pandas is THE library for data analysis in Python. If you learn one tool for data science, make it Pandas.

## Why Pandas?

- Work with tabular data (like Excel, but programmatic)
- Clean messy real-world data
- Filter, group, aggregate data
- Handle time series
- Merge and join datasets
- Export to CSV, Excel, SQL, and more

## Series - 1D Data

```python
import pandas as pd

# Create a Series (like a column)
sales = pd.Series([100, 150, 200, 175, 225])
print(sales)

# With custom index
days = pd.Series(
    [100, 150, 200, 175, 225],
    index=['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
)

# Access data
days['Mon']      # 100
days[0]          # 100 (also works)
days.mean()      # 170.0
days.max()       # 225
```

## DataFrame - The Core of Pandas

Think of a DataFrame as a table or spreadsheet.

```python
# Create DataFrame from dictionary
data = {
    'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'age': [25, 30, 35, 28],
    'city': ['NYC', 'LA', 'Chicago', 'NYC'],
    'salary': [70000, 80000, 75000, 90000]
}

df = pd.DataFrame(data)
print(df)

#      name  age     city  salary
# 0   Alice   25      NYC   70000
# 1     Bob   30       LA   80000
# 2 Charlie   35  Chicago   75000
# 3   Diana   28      NYC   90000
```

## Reading Data

```python
# From CSV (most common)
df = pd.read_csv('data.csv')

# From Excel
df = pd.read_excel('data.xlsx', sheet_name='Sheet1')

# From JSON
df = pd.read_json('data.json')

# From SQL
import sqlite3
conn = sqlite3.connect('database.db')
df = pd.read_sql('SELECT * FROM customers', conn)

# From dictionary
data = {'col1': [1, 2], 'col2': [3, 4]}
df = pd.DataFrame(data)
```

## Exploring Data

```python
# First/last rows
df.head()        # First 5 rows
df.head(10)      # First 10 rows
df.tail()        # Last 5 rows

# Basic info
df.shape         # (rows, columns)
df.info()        # Column types, non-null counts
df.describe()    # Statistics for numeric columns
df.columns       # Column names
df.dtypes        # Data types

# Quick stats
df['salary'].mean()    # Average salary
df['salary'].median()  # Median salary
df['age'].min()        # Youngest person
df['age'].max()        # Oldest person
```

## Selecting Data

```python
# Select column
df['name']           # Returns Series
df[['name', 'age']]  # Returns DataFrame with 2 columns

# Select rows by index
df.iloc[0]           # First row
df.iloc[0:3]         # First 3 rows

# Select by condition
young = df[df['age'] < 30]
high_earners = df[df['salary'] > 75000]
nyc_people = df[df['city'] == 'NYC']

# Multiple conditions (use & for AND, | for OR)
young_high_earners = df[(df['age'] < 30) & (df['salary'] > 70000)]
```

## Adding/Modifying Columns

```python
# Add new column
df['bonus'] = df['salary'] * 0.1

# Based on condition
df['senior'] = df['age'] >= 30

# Apply function
df['name_upper'] = df['name'].str.upper()

# Calculate from other columns
df['age_salary_ratio'] = df['age'] / df['salary'] * 1000
```

## Filtering and Sorting

```python
# Filter
high_earners = df[df['salary'] > 75000]

# Sort
df_sorted = df.sort_values('salary', ascending=False)

# Sort by multiple columns
df_sorted = df.sort_values(['city', 'salary'], ascending=[True, False])
```

## Grouping and Aggregating

```python
# Group by city and get mean salary
city_avg = df.groupby('city')['salary'].mean()

# Multiple aggregations
city_stats = df.groupby('city').agg({
    'salary': ['mean', 'min', 'max'],
    'age': 'mean'
})

# Count by category
city_counts = df['city'].value_counts()
```

## Handling Missing Data

```python
# Check for missing values
df.isnull()          # Boolean DataFrame
df.isnull().sum()    # Count nulls per column

# Drop rows with any null
df_clean = df.dropna()

# Drop rows where specific column is null
df_clean = df.dropna(subset=['salary'])

# Fill missing values
df['age'].fillna(df['age'].mean(), inplace=True)  # Fill with mean
df['city'].fillna('Unknown', inplace=True)        # Fill with value
```

## Practical Example - Sales Analysis

```python
# Load sales data
sales_df = pd.read_csv('sales_data.csv')

# Explore
print(sales_df.head())
print(sales_df.info())

# Clean data
# Remove rows with missing values in critical columns
sales_df = sales_df.dropna(subset=['product', 'revenue'])

# Remove duplicates
sales_df = sales_df.drop_duplicates()

# Convert date column to datetime
sales_df['date'] = pd.to_datetime(sales_df['date'])

# Add calculated columns
sales_df['profit_margin'] = (sales_df['revenue'] - sales_df['cost']) / sales_df['revenue']

# Filter for high-revenue sales
big_sales = sales_df[sales_df['revenue'] > 1000]

# Group by product
product_summary = sales_df.groupby('product').agg({
    'revenue': 'sum',
    'quantity': 'sum',
    'profit_margin': 'mean'
})

# Sort by revenue
top_products = product_summary.sort_values('revenue', ascending=False)

# Export results
top_products.to_csv('top_products.csv')
```

## Merging DataFrames

```python
# Customer data
customers = pd.DataFrame({
    'customer_id': [1, 2, 3],
    'name': ['Alice', 'Bob', 'Charlie']
})

# Orders data
orders = pd.DataFrame({
    'order_id': [101, 102, 103],
    'customer_id': [1, 1, 2],
    'amount': [100, 150, 200]
})

# Join them
merged = pd.merge(customers, orders, on='customer_id')
```

## String Operations

```python
# Clean text data
df['name'] = df['name'].str.strip()        # Remove whitespace
df['name'] = df['name'].str.lower()        # Lowercase
df['name'] = df['name'].str.title()        # Title Case

# Extract parts
df['first_name'] = df['name'].str.split().str[0]

# Check if contains
df['has_gmail'] = df['email'].str.contains('gmail')
```

## Working with Dates

```python
# Convert to datetime
df['date'] = pd.to_datetime(df['date'])

# Extract parts
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['day_of_week'] = df['date'].dt.day_name()

# Filter by date
recent = df[df['date'] > '2024-01-01']
```

## Knowledge Check

1. What is the main data structure in Pandas?
   - DataFrame for 2D tabular data, Series for 1D data
   - List
   - Array
   - Dictionary

2. How do you select rows where salary is greater than 70000?
   - df[df['salary'] > 70000]
   - df.select(salary > 70000)
   - df.filter('salary > 70000')
   - df.query(salary > 70000)

3. What does `df.groupby('city')['salary'].mean()` do?
   - Calculates average salary for each city
   - Groups cities by salary
   - Sums all salaries
   - Counts rows per city

4. How do you handle missing values in a DataFrame?
   - Use dropna() to remove or fillna() to fill with values
   - Delete the entire DataFrame
   - Ignore them
   - Convert to zero

5. What does `pd.read_csv('file.csv')` do?
   - Reads a CSV file and returns a DataFrame
   - Writes data to CSV
   - Converts DataFrame to CSV
   - Deletes the CSV file
