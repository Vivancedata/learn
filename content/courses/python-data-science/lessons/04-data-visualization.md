---
id: data-visualization-matplotlib
title: Data Visualization with Matplotlib and Seaborn
type: lesson
duration: 65 mins
order: 4
section: data-visualization
prevLessonId: pandas-fundamentals
nextLessonId: data-cleaning-techniques
---

# Data Visualization with Matplotlib and Seaborn

A picture is worth a thousand data points! Learn to create compelling visualizations that communicate insights effectively.

## Why Visualize Data?

- **Understand patterns** at a glance
- **Communicate insights** to stakeholders
- **Identify outliers** and anomalies
- **Explore relationships** between variables
- **Tell stories** with data

## Matplotlib - The Foundation

```python
import matplotlib.pyplot as plt
import numpy as np

# Simple line plot
x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

plt.plot(x, y)
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.title('Simple Line Plot')
plt.show()
```

## Essential Plot Types

### Line Plot - Trends Over Time
```python
# Sales over months
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
sales = [15000, 18000, 16000, 22000, 25000, 23000]

plt.plot(months, sales, marker='o', linewidth=2, color='blue')
plt.title('Monthly Sales Trend')
plt.xlabel('Month')
plt.ylabel('Sales ($)')
plt.grid(True, alpha=0.3)
plt.show()
```

### Bar Chart - Comparing Categories
```python
# Product sales comparison
products = ['Product A', 'Product B', 'Product C', 'Product D']
sales = [45000, 38000, 52000, 41000]

plt.bar(products, sales, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'])
plt.title('Sales by Product')
plt.ylabel('Sales ($)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
```

### Histogram - Distribution
```python
# Customer ages distribution
ages = np.random.normal(35, 10, 1000)  # Mean 35, std 10

plt.hist(ages, bins=30, edgecolor='black', alpha=0.7)
plt.title('Customer Age Distribution')
plt.xlabel('Age')
plt.ylabel('Frequency')
plt.show()
```

### Scatter Plot - Relationships
```python
# Advertising spend vs sales
ad_spend = [1000, 1500, 2000, 2500, 3000, 3500, 4000]
sales = [15000, 18000, 21000, 23000, 28000, 30000, 35000]

plt.scatter(ad_spend, sales, s=100, alpha=0.6, c='green')
plt.title('Ad Spend vs Sales')
plt.xlabel('Advertising Spend ($)')
plt.ylabel('Sales ($)')
plt.show()
```

### Pie Chart - Proportions
```python
# Market share
companies = ['Company A', 'Company B', 'Company C', 'Company D']
market_share = [35, 28, 22, 15]

plt.pie(market_share, labels=companies, autopct='%1.1f%%', startangle=90)
plt.title('Market Share')
plt.axis('equal')
plt.show()
```

## Seaborn - Statistical Visualization

```python
import seaborn as sns
import pandas as pd

# Set style
sns.set_style('whitegrid')

# Sample data
df = pd.DataFrame({
    'category': ['A', 'B', 'C'] * 100,
    'value': np.random.randn(300) + [1, 2, 3] * 100
})
```

### Box Plot - Distribution Comparison
```python
sns.boxplot(data=df, x='category', y='value')
plt.title('Value Distribution by Category')
plt.show()
```

### Heatmap - Correlation Matrix
```python
# Sales data
sales_df = pd.DataFrame({
    'TV_ads': np.random.rand(100) * 100,
    'Radio_ads': np.random.rand(100) * 50,
    'Social_ads': np.random.rand(100) * 30,
    'Sales': np.random.rand(100) * 1000
})

# Correlation heatmap
corr = sales_df.corr()
sns.heatmap(corr, annot=True, cmap='coolwarm', center=0)
plt.title('Correlation Between Marketing Channels and Sales')
plt.tight_layout()
plt.show()
```

### Pair Plot - Multiple Relationships
```python
sns.pairplot(sales_df)
plt.show()
```

## Customization

### Colors and Styles
```python
# Custom colors
plt.plot(x, y, color='#FF6B6B', linewidth=3, linestyle='--')

# Multiple lines
plt.plot(x, y1, label='Product A', color='blue')
plt.plot(x, y2, label='Product B', color='red')
plt.legend()
```

### Subplots - Multiple Charts
```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Top left
axes[0, 0].plot(months, sales)
axes[0, 0].set_title('Sales Trend')

# Top right
axes[0, 1].bar(products, sales)
axes[0, 1].set_title('Sales by Product')

# Bottom left
axes[1, 0].hist(ages, bins=30)
axes[1, 0].set_title('Age Distribution')

# Bottom right
axes[1, 1].scatter(ad_spend, sales)
axes[1, 1].set_title('Ad Spend vs Sales')

plt.tight_layout()
plt.show()
```

## Real-World Example - Sales Dashboard

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load data
sales_data = pd.DataFrame({
    'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    'revenue': [45000, 52000, 48000, 61000, 68000, 72000],
    'customers': [450, 520, 480, 610, 680, 720],
    'avg_order': [100, 100, 100, 100, 100, 100]
})

# Create dashboard
fig = plt.figure(figsize=(15, 10))

# Revenue trend
plt.subplot(2, 2, 1)
plt.plot(sales_data['month'], sales_data['revenue'],
         marker='o', linewidth=2, color='#2ecc71')
plt.fill_between(range(len(sales_data)), sales_data['revenue'],
                 alpha=0.3, color='#2ecc71')
plt.title('Revenue Trend', fontsize=14, fontweight='bold')
plt.ylabel('Revenue ($)')
plt.grid(True, alpha=0.3)

# Customer growth
plt.subplot(2, 2, 2)
plt.bar(sales_data['month'], sales_data['customers'], color='#3498db')
plt.title('Customer Growth', fontsize=14, fontweight='bold')
plt.ylabel('Customers')

# Revenue breakdown
plt.subplot(2, 2, 3)
categories = ['Product', 'Service', 'Other']
values = [60, 30, 10]
plt.pie(values, labels=categories, autopct='%1.1f%%',
        colors=['#e74c3c', '#f39c12', '#95a5a6'])
plt.title('Revenue by Category', fontsize=14, fontweight='bold')

# Growth rate
plt.subplot(2, 2, 4)
growth = sales_data['revenue'].pct_change() * 100
plt.bar(sales_data['month'][1:], growth[1:],
        color=['green' if x > 0 else 'red' for x in growth[1:]])
plt.title('Month-over-Month Growth %', fontsize=14, fontweight='bold')
plt.ylabel('Growth %')
plt.axhline(y=0, color='black', linestyle='-', linewidth=0.5)

plt.suptitle('Sales Dashboard - Q1 & Q2 2024',
             fontsize=16, fontweight='bold', y=1.00)
plt.tight_layout()
plt.show()
```

## Saving Figures

```python
# Save as PNG
plt.savefig('sales_chart.png', dpi=300, bbox_inches='tight')

# Save as PDF
plt.savefig('sales_chart.pdf', bbox_inches='tight')

# Save as SVG (scalable)
plt.savefig('sales_chart.svg', bbox_inches='tight')
```

## Best Practices

1. **Choose the right chart type**
   - Trends → Line chart
   - Comparisons → Bar chart
   - Distributions → Histogram/Box plot
   - Relationships → Scatter plot
   - Proportions → Pie chart

2. **Keep it simple**
   - Don't overcrowd with data
   - Use clear labels and titles
   - Choose readable fonts

3. **Use color effectively**
   - Consistent color scheme
   - Colorblind-friendly palettes
   - Highlight important data

4. **Tell a story**
   - Clear message
   - Logical flow
   - Context matters

## Knowledge Check

1. Which plot type is best for showing trends over time?
   - Line plot with markers showing temporal progression
   - Pie chart
   - Scatter plot
   - Bar chart

2. What does `plt.tight_layout()` do?
   - Automatically adjusts subplot spacing to prevent overlap
   - Saves the figure
   - Changes colors
   - Adds a title

3. How do you create multiple subplots in one figure?
   - plt.subplots(rows, cols) returns figure and axes array
   - plt.subplot() for each plot
   - Multiple plt.plot() calls
   - Can't be done

4. What does a heatmap visualize well?
   - Correlations and patterns in matrix data
   - Time series trends
   - Individual data points
   - Text data

5. Why is Seaborn useful compared to Matplotlib alone?
   - Better default styles and built-in statistical visualizations
   - Faster rendering
   - Can create 3D plots
   - Required for all visualizations
