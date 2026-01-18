---
id: ml-linear-regression
title: Linear Regression
type: lesson
duration: 60 mins
order: 3
section: linear-models
prevLessonId: ml-types-of-learning
nextLessonId: ml-logistic-regression
---

# Linear Regression

Linear regression is the foundation of machine learning. It predicts a continuous numerical value by finding the best-fitting straight line through your data.

## The Intuition

Imagine plotting house prices against square footage:

```
Price ($)
│
│                    *
│                 *
│              *
│           *      <- Best fit line
│        *
│     *
└──────────────────── Square Feet
```

Linear regression finds the line that minimizes the distance between all points and the line.

## The Math (Simplified)

### Single Variable (Simple Linear Regression)

```
y = mx + b

Where:
- y = predicted value (house price)
- m = slope (how much price increases per sqft)
- x = input feature (square footage)
- b = intercept (base price when sqft = 0)
```

### Multiple Variables (Multiple Linear Regression)

```
y = w₁x₁ + w₂x₂ + w₃x₃ + ... + b

Where:
- y = predicted value
- w₁, w₂, ... = weights (importance of each feature)
- x₁, x₂, ... = input features
- b = bias/intercept
```

## Implementation from Scratch

Let's understand how it works before using scikit-learn:

```python
import numpy as np

# Simple dataset: hours studied vs exam score
hours = np.array([1, 2, 3, 4, 5, 6, 7, 8])
scores = np.array([55, 60, 65, 70, 75, 80, 82, 88])

# Calculate the best line
n = len(hours)
sum_x = np.sum(hours)
sum_y = np.sum(scores)
sum_xy = np.sum(hours * scores)
sum_x2 = np.sum(hours ** 2)

# Slope and intercept formulas
slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
intercept = (sum_y - slope * sum_x) / n

print(f"Equation: score = {slope:.2f} * hours + {intercept:.2f}")
# Equation: score = 4.64 * hours + 51.07

# Predict for 10 hours of study
predicted = slope * 10 + intercept
print(f"10 hours → predicted score: {predicted:.1f}")
# 10 hours → predicted score: 97.5
```

## Using Scikit-Learn

The standard way to implement linear regression:

```python
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np
import pandas as pd

# Create sample dataset
np.random.seed(42)
data = pd.DataFrame({
    'sqft': np.random.randint(1000, 3000, 100),
    'bedrooms': np.random.randint(1, 5, 100),
    'bathrooms': np.random.randint(1, 4, 100),
    'age': np.random.randint(1, 50, 100),
})
# Create target with some noise
data['price'] = (
    data['sqft'] * 100 +
    data['bedrooms'] * 10000 +
    data['bathrooms'] * 8000 -
    data['age'] * 500 +
    np.random.randn(100) * 10000
)

# Split features and target
X = data[['sqft', 'bedrooms', 'bathrooms', 'age']]
y = data['price']

# Split into train/test sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create and train model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate
print(f"R² Score: {r2_score(y_test, y_pred):.4f}")
print(f"RMSE: ${mean_squared_error(y_test, y_pred, squared=False):,.0f}")
```

## Understanding the Model

### Coefficients (Weights)

```python
# See what the model learned
for feature, coef in zip(X.columns, model.coef_):
    print(f"{feature}: ${coef:,.2f}")

# sqft: $100.23       → Each sqft adds ~$100
# bedrooms: $9,987.45 → Each bedroom adds ~$10k
# bathrooms: $7,923.12 → Each bathroom adds ~$8k
# age: $-498.76       → Each year old subtracts ~$500
```

### Intercept

```python
print(f"Intercept: ${model.intercept_:,.0f}")
# Base price when all features are 0
```

### Making Predictions

```python
# Predict a specific house
new_house = [[2000, 3, 2, 10]]  # 2000 sqft, 3 bed, 2 bath, 10 years old
predicted_price = model.predict(new_house)
print(f"Predicted price: ${predicted_price[0]:,.0f}")
```

## Model Evaluation Metrics

### R² Score (Coefficient of Determination)

How much variance in the target is explained by the model.

```python
from sklearn.metrics import r2_score

r2 = r2_score(y_test, y_pred)
print(f"R² Score: {r2:.4f}")

# R² = 1.0  → Perfect predictions
# R² = 0.8  → Explains 80% of variance (good)
# R² = 0.5  → Explains 50% (moderate)
# R² < 0    → Worse than predicting mean
```

### Mean Squared Error (MSE) & RMSE

Average squared difference between predictions and actual values.

```python
from sklearn.metrics import mean_squared_error

mse = mean_squared_error(y_test, y_pred)
rmse = mean_squared_error(y_test, y_pred, squared=False)

print(f"MSE: {mse:,.0f}")
print(f"RMSE: ${rmse:,.0f}")  # In original units
```

### Mean Absolute Error (MAE)

Average absolute difference—easier to interpret.

```python
from sklearn.metrics import mean_absolute_error

mae = mean_absolute_error(y_test, y_pred)
print(f"MAE: ${mae:,.0f}")  # Average prediction is off by this much
```

## Common Issues and Solutions

### 1. Outliers

Outliers can significantly skew the line.

```python
# Before: with outliers
# After: remove outliers
from scipy import stats

# Remove points beyond 3 standard deviations
z_scores = np.abs(stats.zscore(data))
data_clean = data[(z_scores < 3).all(axis=1)]
```

### 2. Feature Scaling

Features with different scales can cause issues.

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Now all features have mean=0, std=1
```

### 3. Non-Linear Relationships

Linear regression assumes linear relationships.

```python
# If relationship is curved, try polynomial features
from sklearn.preprocessing import PolynomialFeatures

poly = PolynomialFeatures(degree=2)
X_poly = poly.fit_transform(X)

# Now includes x², x³, x*y, etc.
model = LinearRegression()
model.fit(X_poly, y)
```

## Assumptions of Linear Regression

Linear regression works best when these hold:

1. **Linearity**: Relationship is approximately linear
2. **Independence**: Observations are independent
3. **Homoscedasticity**: Constant variance in errors
4. **Normality**: Errors are normally distributed
5. **No Multicollinearity**: Features aren't highly correlated

```python
# Check multicollinearity with correlation matrix
import seaborn as sns
import matplotlib.pyplot as plt

correlation = data.corr()
sns.heatmap(correlation, annot=True, cmap='coolwarm')
plt.title("Feature Correlation Matrix")
plt.show()
```

## Regularization Preview

When models become too complex, we use regularization:

```python
from sklearn.linear_model import Ridge, Lasso

# Ridge (L2): Shrinks coefficients
ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)

# Lasso (L1): Can zero out coefficients (feature selection)
lasso = Lasso(alpha=1.0)
lasso.fit(X_train, y_train)
```

We'll cover these in detail in later lessons.

## Complete Example: Boston Housing (Simplified)

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import matplotlib.pyplot as plt

# Create synthetic housing data
np.random.seed(42)
n = 200

data = pd.DataFrame({
    'sqft': np.random.randint(800, 3500, n),
    'bedrooms': np.random.randint(1, 6, n),
    'bathrooms': np.random.randint(1, 4, n),
    'lot_size': np.random.randint(2000, 20000, n),
    'year_built': np.random.randint(1960, 2024, n),
    'garage': np.random.randint(0, 3, n),
})

# Generate realistic prices
data['price'] = (
    data['sqft'] * 150 +
    data['bedrooms'] * 15000 +
    data['bathrooms'] * 12000 +
    data['lot_size'] * 5 +
    (data['year_built'] - 1960) * 200 +
    data['garage'] * 8000 +
    50000 +  # base
    np.random.randn(n) * 25000  # noise
).astype(int)

# Prepare data
X = data.drop('price', axis=1)
y = data['price']

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train
model = LinearRegression()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)

print("Model Performance:")
print(f"R² Score: {r2_score(y_test, y_pred):.4f}")
print(f"RMSE: ${mean_squared_error(y_test, y_pred, squared=False):,.0f}")

print("\nFeature Importance (Coefficients):")
for feature, coef in sorted(zip(X.columns, model.coef_),
                            key=lambda x: abs(x[1]), reverse=True):
    print(f"  {feature}: ${coef:,.2f}")

# Visualize predictions vs actual
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred, alpha=0.5)
plt.plot([y_test.min(), y_test.max()],
         [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual Price')
plt.ylabel('Predicted Price')
plt.title('Linear Regression: Predicted vs Actual')
plt.show()
```

## Knowledge Check

1. What does linear regression predict?
   - A continuous numerical value
   - A category or class
   - Clusters in data
   - The next action to take

2. In the equation y = mx + b, what does 'm' represent?
   - The slope - how much y changes per unit change in x
   - The y-intercept
   - The predicted value
   - The error term

3. What does an R² score of 0.85 mean?
   - The model explains 85% of the variance in the target variable
   - The model is 85% accurate
   - The predictions are off by 85%
   - 85% of data points are on the line

4. What is RMSE useful for?
   - Understanding prediction error in the same units as the target
   - Measuring how many features to use
   - Determining which algorithm to use
   - Counting correct predictions

5. What should you do if features have very different scales?
   - Apply feature scaling (standardization or normalization)
   - Remove the smaller features
   - Use more training data
   - Increase the learning rate
