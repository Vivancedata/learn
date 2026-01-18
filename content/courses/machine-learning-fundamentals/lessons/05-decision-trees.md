---
id: ml-decision-trees
title: Decision Trees and Random Forests
type: lesson
duration: 60 mins
order: 5
section: tree-models
prevLessonId: ml-logistic-regression
nextLessonId: ml-model-evaluation
---

# Decision Trees and Random Forests

Decision trees are intuitive, interpretable models that make predictions by asking a series of questions. Random forests combine many trees for better accuracy.

## Decision Tree Intuition

A decision tree works like a flowchart:

```
            [Is Income > $50k?]
            /                \
          Yes                 No
          /                    \
   [Age > 30?]            [Credit Score > 700?]
    /      \                  /          \
  Yes       No              Yes           No
   |         |               |             |
Approve   Review          Approve        Deny
```

Each node asks a question, branches represent answers, and leaves give predictions.

## How Trees Make Splits

The algorithm finds the best feature and threshold to split on:

```python
# At each node, find split that best separates classes
# Metrics: Gini Impurity or Entropy

# Gini Impurity: Probability of misclassification
# Gini = 1 - Σ(pᵢ²)
# Gini = 0: Pure node (all same class)
# Gini = 0.5: Maximum impurity (50/50 split)

import numpy as np

def gini_impurity(labels):
    _, counts = np.unique(labels, return_counts=True)
    probabilities = counts / len(labels)
    return 1 - np.sum(probabilities ** 2)

# Example
pure = [1, 1, 1, 1]       # Gini = 0
mixed = [1, 1, 0, 0]      # Gini = 0.5
mostly_one = [1, 1, 1, 0] # Gini = 0.375
```

## Building a Decision Tree

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np

# Create dataset: Loan approval
np.random.seed(42)
n = 500

data = pd.DataFrame({
    'income': np.random.randint(30000, 150000, n),
    'credit_score': np.random.randint(300, 850, n),
    'debt_ratio': np.random.uniform(0, 0.6, n),
    'employment_years': np.random.randint(0, 30, n),
})

# Create labels based on rules
data['approved'] = (
    (data['income'] > 50000) &
    (data['credit_score'] > 650) &
    (data['debt_ratio'] < 0.4)
).astype(int)

# Add some noise
noise_idx = np.random.choice(n, int(n * 0.1), replace=False)
data.loc[noise_idx, 'approved'] = 1 - data.loc[noise_idx, 'approved']

# Split data
X = data.drop('approved', axis=1)
y = data['approved']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train decision tree
tree = DecisionTreeClassifier(max_depth=4, random_state=42)
tree.fit(X_train, y_train)

# Evaluate
print(f"Training Accuracy: {tree.score(X_train, y_train):.2%}")
print(f"Test Accuracy: {tree.score(X_test, y_test):.2%}")
```

## Visualizing Decision Trees

```python
from sklearn.tree import plot_tree
import matplotlib.pyplot as plt

plt.figure(figsize=(20, 10))
plot_tree(
    tree,
    feature_names=X.columns,
    class_names=['Denied', 'Approved'],
    filled=True,
    rounded=True,
    fontsize=10
)
plt.title("Loan Approval Decision Tree")
plt.tight_layout()
plt.show()
```

## Controlling Tree Complexity

Trees can overfit easily. Control complexity with hyperparameters:

```python
# Hyperparameters to prevent overfitting
tree = DecisionTreeClassifier(
    max_depth=5,           # Maximum tree depth
    min_samples_split=10,  # Minimum samples to split a node
    min_samples_leaf=5,    # Minimum samples in a leaf
    max_features='sqrt',   # Number of features to consider per split
    random_state=42
)
```

| Parameter | Effect | Lower Value | Higher Value |
|-----------|--------|-------------|--------------|
| max_depth | Tree depth limit | Less overfitting | More complex |
| min_samples_split | Samples needed to split | Less overfitting | More splits |
| min_samples_leaf | Minimum leaf size | Less overfitting | Larger leaves |

## Feature Importance

Trees tell you which features matter most:

```python
importance = pd.DataFrame({
    'feature': X.columns,
    'importance': tree.feature_importances_
}).sort_values('importance', ascending=False)

print("Feature Importance:")
print(importance)

# Visualize
importance.plot(kind='barh', x='feature', y='importance')
plt.title('Feature Importance')
plt.xlabel('Importance')
plt.show()
```

## Random Forest: Ensemble of Trees

A Random Forest builds many trees and averages their predictions:

```
Tree 1 → Prediction 1
Tree 2 → Prediction 2     → Majority Vote → Final Prediction
Tree 3 → Prediction 3
...
Tree n → Prediction n
```

### Why Random Forests Work Better

1. **Bagging**: Each tree trains on a random sample of data
2. **Feature Randomness**: Each split considers random feature subset
3. **Aggregation**: Averaging reduces variance and overfitting

```python
from sklearn.ensemble import RandomForestClassifier

# Create Random Forest
forest = RandomForestClassifier(
    n_estimators=100,      # Number of trees
    max_depth=10,          # Depth of each tree
    min_samples_split=5,
    random_state=42,
    n_jobs=-1              # Use all CPU cores
)

forest.fit(X_train, y_train)

print(f"Training Accuracy: {forest.score(X_train, y_train):.2%}")
print(f"Test Accuracy: {forest.score(X_test, y_test):.2%}")
```

## Comparing Single Tree vs Random Forest

```python
from sklearn.model_selection import cross_val_score

# Single decision tree
tree = DecisionTreeClassifier(max_depth=10, random_state=42)
tree_scores = cross_val_score(tree, X, y, cv=5)

# Random forest
forest = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
forest_scores = cross_val_score(forest, X, y, cv=5)

print(f"Decision Tree: {tree_scores.mean():.2%} (+/- {tree_scores.std()*2:.2%})")
print(f"Random Forest: {forest_scores.mean():.2%} (+/- {forest_scores.std()*2:.2%})")
```

## Gradient Boosting: Sequential Trees

Unlike Random Forest (parallel trees), boosting builds trees sequentially:

```python
from sklearn.ensemble import GradientBoostingClassifier

gb = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42
)
gb.fit(X_train, y_train)
print(f"Gradient Boosting Accuracy: {gb.score(X_test, y_test):.2%}")
```

### XGBoost: Industry Standard

```python
# Install: pip install xgboost
from xgboost import XGBClassifier

xgb = XGBClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=4,
    random_state=42
)
xgb.fit(X_train, y_train)
print(f"XGBoost Accuracy: {xgb.score(X_test, y_test):.2%}")
```

## When to Use Each

| Algorithm | Pros | Cons | Best For |
|-----------|------|------|----------|
| Decision Tree | Interpretable, fast | Overfits easily | Simple problems, explanations |
| Random Forest | Robust, handles noise | Slower, less interpretable | General purpose |
| Gradient Boosting | Often best accuracy | Can overfit, slower | Competitions, structured data |
| XGBoost | Fast, regularized | Complex to tune | Production ML |

## Regression with Trees

Trees also work for regression:

```python
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

# For predicting house prices
tree_reg = DecisionTreeRegressor(max_depth=5)
forest_reg = RandomForestRegressor(n_estimators=100, max_depth=10)

tree_reg.fit(X_train, y_train)
forest_reg.fit(X_train, y_train)
```

## Hyperparameter Tuning

Find the best parameters with cross-validation:

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, 15, None],
    'min_samples_split': [2, 5, 10],
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)

grid_search.fit(X_train, y_train)

print(f"Best Parameters: {grid_search.best_params_}")
print(f"Best CV Score: {grid_search.best_score_:.2%}")
```

## Knowledge Check

1. How does a decision tree make predictions?
   - By following a series of if-then rules from root to leaf
   - By calculating distances to training points
   - By finding the best-fit line
   - By clustering similar data points

2. What is Gini impurity used for?
   - Measuring how mixed the classes are at a node to find optimal splits
   - Calculating model accuracy
   - Determining the number of trees needed
   - Measuring feature importance

3. Why do Random Forests usually outperform single decision trees?
   - They combine predictions from many diverse trees, reducing overfitting
   - They use more features
   - They train faster
   - They use simpler rules

4. What does max_depth control in a decision tree?
   - How many levels of splits the tree can have
   - The number of features used
   - The training time
   - The number of samples

5. When would you prefer a single decision tree over a random forest?
   - When you need a simple, interpretable model that humans can understand
   - When you have millions of samples
   - When accuracy is the only priority
   - When you have unlimited computational resources
