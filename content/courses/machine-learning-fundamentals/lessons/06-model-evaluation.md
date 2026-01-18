---
id: ml-model-evaluation
title: Model Evaluation and Improvement
type: lesson
duration: 55 mins
order: 6
section: evaluation
prevLessonId: ml-decision-trees
nextLessonId: ml-project
---

# Model Evaluation and Improvement

Building a model is just the start. This lesson covers how to properly evaluate your model and improve its performance.

## The Train-Test Split Problem

Never evaluate on training data—you'll get misleading results:

```python
from sklearn.model_selection import train_test_split

# Basic split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,     # 20% for testing
    random_state=42,    # Reproducibility
    stratify=y          # Maintain class proportions
)

# Train ONLY on training data
model.fit(X_train, y_train)

# Evaluate ONLY on test data
score = model.score(X_test, y_test)
```

## Cross-Validation

More robust than a single train-test split:

```python
from sklearn.model_selection import cross_val_score

# 5-fold cross-validation
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

print(f"CV Scores: {scores}")
print(f"Mean: {scores.mean():.2%} (+/- {scores.std()*2:.2%})")
```

### How K-Fold CV Works

```
Fold 1: [Test] [Train] [Train] [Train] [Train]
Fold 2: [Train] [Test] [Train] [Train] [Train]
Fold 3: [Train] [Train] [Test] [Train] [Train]
Fold 4: [Train] [Train] [Train] [Test] [Train]
Fold 5: [Train] [Train] [Train] [Train] [Test]

Average all 5 test scores for final evaluation
```

## Overfitting vs Underfitting

```
Error
│
│ \                        Training Error
│  \                      /
│   \____________________/
│                  _______
│               /          Validation Error
│             /
│           /
│_________/____________________
  Low              High
     Model Complexity
```

| Condition | Training Score | Test Score | Fix |
|-----------|---------------|------------|-----|
| Underfitting | Low | Low | More complex model, more features |
| Good Fit | High | High (similar) | - |
| Overfitting | Very High | Low | Simpler model, regularization |

## Detecting Overfitting

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt

train_sizes, train_scores, val_scores = learning_curve(
    model, X, y, cv=5, n_jobs=-1,
    train_sizes=np.linspace(0.1, 1.0, 10)
)

plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_scores.mean(axis=1), label='Training Score')
plt.plot(train_sizes, val_scores.mean(axis=1), label='Validation Score')
plt.xlabel('Training Size')
plt.ylabel('Score')
plt.legend()
plt.title('Learning Curve')
plt.show()
```

## Fixing Overfitting

### 1. Regularization

```python
from sklearn.linear_model import Ridge, Lasso, LogisticRegression

# L2 Regularization (Ridge)
ridge = Ridge(alpha=1.0)  # Higher alpha = stronger regularization

# L1 Regularization (Lasso)
lasso = Lasso(alpha=0.1)  # Can zero out features

# For classification
lr = LogisticRegression(C=0.1)  # Lower C = stronger regularization
```

### 2. Reduce Model Complexity

```python
# Simpler decision tree
tree = DecisionTreeClassifier(max_depth=3, min_samples_leaf=10)

# Fewer trees in forest
forest = RandomForestClassifier(n_estimators=50, max_depth=5)
```

### 3. Get More Training Data

More data usually helps reduce overfitting.

### 4. Feature Selection

```python
from sklearn.feature_selection import SelectKBest, f_classif

# Select top 10 features
selector = SelectKBest(f_classif, k=10)
X_selected = selector.fit_transform(X, y)
```

## Hyperparameter Tuning

### Grid Search

Exhaustively try all combinations:

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'max_depth': [3, 5, 7, 10],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

grid = GridSearchCV(
    DecisionTreeClassifier(),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)

grid.fit(X_train, y_train)

print(f"Best params: {grid.best_params_}")
print(f"Best CV score: {grid.best_score_:.2%}")
```

### Random Search

Sample random combinations (faster for many parameters):

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

param_dist = {
    'n_estimators': randint(50, 500),
    'max_depth': randint(3, 20),
    'min_samples_split': randint(2, 20),
    'learning_rate': uniform(0.01, 0.3)
}

random_search = RandomizedSearchCV(
    GradientBoostingClassifier(),
    param_dist,
    n_iter=100,  # Number of random combinations
    cv=5,
    n_jobs=-1
)

random_search.fit(X_train, y_train)
```

## Class Imbalance

When one class dominates (e.g., 99% vs 1%):

### Option 1: Adjust Class Weights

```python
model = RandomForestClassifier(class_weight='balanced')
```

### Option 2: Oversample Minority Class

```python
from imblearn.over_sampling import SMOTE

smote = SMOTE(random_state=42)
X_balanced, y_balanced = smote.fit_resample(X_train, y_train)
```

### Option 3: Undersample Majority Class

```python
from imblearn.under_sampling import RandomUnderSampler

under = RandomUnderSampler(random_state=42)
X_balanced, y_balanced = under.fit_resample(X_train, y_train)
```

## Feature Engineering

Create new features from existing ones:

```python
# Mathematical combinations
data['income_per_age'] = data['income'] / data['age']
data['debt_to_income'] = data['debt'] / data['income']

# Binning
data['age_group'] = pd.cut(data['age'], bins=[0, 25, 40, 60, 100],
                           labels=['young', 'adult', 'middle', 'senior'])

# One-hot encoding
data = pd.get_dummies(data, columns=['age_group'])

# Polynomial features
from sklearn.preprocessing import PolynomialFeatures
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)
```

## Complete Pipeline

Combine preprocessing and modeling:

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier(n_estimators=100))
])

# Use in cross-validation
scores = cross_val_score(pipeline, X, y, cv=5)
print(f"CV Score: {scores.mean():.2%}")

# Use in grid search
param_grid = {
    'classifier__n_estimators': [50, 100, 200],
    'classifier__max_depth': [5, 10, None]
}

grid = GridSearchCV(pipeline, param_grid, cv=5)
grid.fit(X_train, y_train)
```

## Model Comparison

Compare multiple models:

```python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC

models = {
    'Logistic Regression': LogisticRegression(),
    'Decision Tree': DecisionTreeClassifier(),
    'Random Forest': RandomForestClassifier(),
    'SVM': SVC()
}

results = {}
for name, model in models.items():
    scores = cross_val_score(model, X, y, cv=5)
    results[name] = scores.mean()
    print(f"{name}: {scores.mean():.2%} (+/- {scores.std()*2:.2%})")

# Best model
best = max(results, key=results.get)
print(f"\nBest: {best} with {results[best]:.2%}")
```

## Knowledge Check

1. Why should you use cross-validation instead of a single train-test split?
   - It provides a more robust estimate by testing on multiple data subsets
   - It's faster
   - It uses less data
   - It prevents underfitting

2. What indicates overfitting?
   - High training score but low test/validation score
   - Low training score and low test score
   - High training score and high test score
   - Low training score but high test score

3. What does regularization do?
   - Penalizes complex models to reduce overfitting
   - Speeds up training
   - Adds more features
   - Increases model capacity

4. How does GridSearchCV find the best hyperparameters?
   - By trying all combinations and evaluating with cross-validation
   - By random sampling
   - By using the training score only
   - By gradient descent

5. What should you do with imbalanced classes?
   - Use class weights, oversampling, or undersampling
   - Ignore the imbalance
   - Remove the minority class
   - Only use accuracy as a metric
