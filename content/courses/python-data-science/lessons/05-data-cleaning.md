---
id: data-cleaning-techniques
title: Data Cleaning and Preparation
type: lesson
duration: 60 mins
order: 5
section: data-cleaning
prevLessonId: data-visualization-matplotlib
---

# Data Cleaning and Preparation

Real-world data is messy! Learn to clean, transform, and prepare data for analysis—the most important (and time-consuming) part of data science.

## Why Data Cleaning Matters

**Reality:** 80% of data science is cleaning data, 20% is analysis

**Common Issues:**
- Missing values
- Duplicates
- Inconsistent formatting
- Outliers
- Wrong data types
- Typos and errors

## Handling Missing Data

```python
import pandas as pd
import numpy as np

# Sample messy data
df = pd.DataFrame({
    'name': ['Alice', 'Bob', np.nan, 'Diana', 'Eve'],
    'age': [25, np.nan, 35, 28, np.nan],
    'salary': [70000, 80000, 75000, np.nan, 85000],
    'city': ['NYC', 'LA', None, 'NYC', 'Chicago']
})

# Check for missing values
print(df.isnull().sum())
# name      1
# age       2
# salary    1
# city      1

# Visualize missing data
print(df.isnull())
```

### Strategies for Missing Data

**1. Drop Rows/Columns**
```python
# Drop rows with ANY missing value
df_clean = df.dropna()

# Drop rows where specific column is missing
df_clean = df.dropna(subset=['salary'])

# Drop columns with too many missing values
df_clean = df.dropna(axis=1, thresh=len(df)*0.5)  # Keep if >50% non-null
```

**2. Fill Missing Values**
```python
# Fill with specific value
df['city'] = df['city'].fillna('Unknown')

# Fill with mean (for numeric columns)
df['age'] = df['age'].fillna(df['age'].mean())

# Fill with median (better for outliers)
df['salary'] = df['salary'].fillna(df['salary'].median())

# Forward fill (use previous value)
df['age'] = df['age'].fillna(method='ffill')

# Fill with mode (most common value)
df['city'] = df['city'].fillna(df['city'].mode()[0])
```

## Removing Duplicates

```python
# Sample data with duplicates
df = pd.DataFrame({
    'customer_id': [1, 2, 2, 3, 4, 4],
    'name': ['Alice', 'Bob', 'Bob', 'Charlie', 'Diana', 'Diana'],
    'purchase': [100, 200, 200, 150, 300, 300]
})

# Check for duplicates
print(df.duplicated().sum())  # 2

# View duplicates
print(df[df.duplicated()])

# Remove duplicates (keep first occurrence)
df_clean = df.drop_duplicates()

# Remove duplicates based on specific columns
df_clean = df.drop_duplicates(subset=['customer_id'])

# Keep last occurrence instead
df_clean = df.drop_duplicates(keep='last')
```

## Data Type Conversion

```python
df = pd.DataFrame({
    'date': ['2024-01-01', '2024-01-02', '2024-01-03'],
    'amount': ['100', '200', '150'],
    'quantity': ['5', '10', '7']
})

# Check types
print(df.dtypes)
# date       object
# amount     object  <- Should be numeric!
# quantity   object  <- Should be numeric!

# Convert to correct types
df['date'] = pd.to_datetime(df['date'])
df['amount'] = pd.to_numeric(df['amount'])
df['quantity'] = df['quantity'].astype(int)

# Handle conversion errors
df['amount'] = pd.to_numeric(df['amount'], errors='coerce')  # Invalid → NaN
```

## String Cleaning

```python
# Messy string data
df = pd.DataFrame({
    'name': ['  Alice  ', 'BOB', 'charlie', '  DIANA'],
    'email': ['alice@EXAMPLE.com', 'bob@example.COM', 'charlie@example.com', 'diana@EXAMPLE.COM']
})

# Clean strings
df['name'] = df['name'].str.strip()  # Remove whitespace
df['name'] = df['name'].str.title()  # Title Case

df['email'] = df['email'].str.lower()  # Lowercase
df['email'] = df['email'].str.strip()

print(df)
#      name                email
# 0   Alice    alice@example.com
# 1     Bob      bob@example.com
# 2 Charlie  charlie@example.com
# 3   Diana    diana@example.com
```

## Handling Outliers

```python
# Sample data with outliers
data = pd.DataFrame({
    'price': [100, 120, 110, 115, 105, 9999, 108, 112]  # 9999 is outlier
})

# Method 1: Z-score (statistical method)
from scipy import stats
z_scores = np.abs(stats.zscore(data['price']))
data_clean = data[(z_scores < 3)]  # Keep values within 3 std dev

# Method 2: IQR (Interquartile Range)
Q1 = data['price'].quantile(0.25)
Q3 = data['price'].quantile(0.75)
IQR = Q3 - Q1

lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

data_clean = data[(data['price'] >= lower_bound) & (data['price'] <= upper_bound)]

# Method 3: Manual threshold
data_clean = data[data['price'] < 1000]  # Domain knowledge
```

## Standardizing Categories

```python
# Inconsistent categories
df = pd.DataFrame({
    'status': ['active', 'Active', 'ACTIVE', 'inactive', 'Inactive', 'INACTIVE']
})

# Standardize
df['status'] = df['status'].str.lower()

# Map to standard values
status_map = {
    'active': 'Active',
    'inactive': 'Inactive'
}
df['status'] = df['status'].map(status_map)

# Or use replace
df['status'] = df['status'].replace(['active', 'ACTIVE'], 'Active')
```

## Real-World Example - Complete Data Cleaning Pipeline

```python
import pandas as pd
import numpy as np

# Load messy data
df = pd.read_csv('messy_sales_data.csv')

print(f"Original shape: {df.shape}")

# 1. Remove completely empty rows/columns
df = df.dropna(how='all')
df = df.dropna(axis=1, how='all')

# 2. Drop duplicates
df = df.drop_duplicates()

print(f"After removing empty and duplicates: {df.shape}")

# 3. Fix data types
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')

# 4. Handle missing values
# For numeric columns, fill with median
numeric_cols = df.select_dtypes(include=[np.number]).columns
for col in numeric_cols:
    df[col] = df[col].fillna(df[col].median())

# For categorical columns, fill with mode
categorical_cols = df.select_dtypes(include=['object']).columns
for col in categorical_cols:
    mode_value = df[col].mode()
    if len(mode_value) > 0:
        df[col] = df[col].fillna(mode_value[0])

# 5. Clean string columns
for col in categorical_cols:
    df[col] = df[col].str.strip()
    df[col] = df[col].str.lower()

# 6. Remove outliers from amount
Q1 = df['amount'].quantile(0.25)
Q3 = df['amount'].quantile(0.75)
IQR = Q3 - Q1
df = df[(df['amount'] >= Q1 - 1.5*IQR) & (df['amount'] <= Q3 + 1.5*IQR)]

# 7. Standardize categories
df['status'] = df['status'].replace(['active', 'act', 'a'], 'active')
df['status'] = df['status'].replace(['inactive', 'inact', 'i'], 'inactive')

# 8. Create derived columns
df['revenue'] = df['amount'] * df['quantity']
df['month'] = df['date'].dt.month
df['year'] = df['date'].dt.year

# 9. Sort and reset index
df = df.sort_values('date')
df = df.reset_index(drop=True)

print(f"Final clean shape: {df.shape}")

# 10. Save cleaned data
df.to_csv('cleaned_sales_data.csv', index=False)
```

## Data Validation

```python
# Verify data quality
def validate_data(df):
    issues = []

    # Check for nulls
    null_counts = df.isnull().sum()
    if null_counts.any():
        issues.append(f"Null values found: {null_counts[null_counts > 0].to_dict()}")

    # Check for duplicates
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        issues.append(f"{dup_count} duplicate rows found")

    # Check date ranges
    if 'date' in df.columns:
        if df['date'].min() < pd.to_datetime('2020-01-01'):
            issues.append("Dates before 2020 found")

    # Check negative values where they shouldn't exist
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if (df[col] < 0).any():
            issues.append(f"Negative values in {col}")

    if not issues:
        print("✓ Data validation passed!")
    else:
        print("⚠ Issues found:")
        for issue in issues:
            print(f"  - {issue}")

validate_data(df)
```

## Best Practices

1. **Always keep original data**
   ```python
   df_clean = df.copy()  # Work on copy
   ```

2. **Document your cleaning steps**
   ```python
   # Keep a log
   cleaning_log = []
   cleaning_log.append(f"Removed {duplicates} duplicates")
   cleaning_log.append(f"Filled {missing} missing values")
   ```

3. **Validate after cleaning**
   - Check data ranges make sense
   - Verify relationships hold
   - Sample and inspect manually

4. **Be consistent**
   - Same cleaning process for all data
   - Reproducible pipeline
   - Version control your cleaning code

## Knowledge Check

1. What percentage of data science work is typically data cleaning?
   - About 80% of the work is cleaning and preparing data
   - 20%
   - 50%
   - 10%

2. When should you drop rows with missing values vs filling them?
   - Drop when data is randomly missing and you have enough data; fill when missing is systematic or data is limited
   - Always drop
   - Always fill
   - Never drop or fill

3. How do you remove duplicate rows in Pandas?
   - df.drop_duplicates() removes duplicate rows
   - df.remove_duplicates()
   - df.unique()
   - df.deduplicate()

4. What is the IQR method used for?
   - Detecting and removing outliers based on statistical spread
   - Filling missing values
   - Converting data types
   - Sorting data

5. Why is it important to work on a copy of your original data?
   - To preserve original data in case cleaning introduces errors or you need to try different approaches
   - It's faster
   - It uses less memory
   - It's not important
