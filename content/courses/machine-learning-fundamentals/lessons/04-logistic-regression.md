---
id: ml-logistic-regression
title: Logistic Regression
type: lesson
duration: 55 mins
order: 4
section: linear-models
prevLessonId: ml-linear-regression
nextLessonId: ml-decision-trees
---

# Logistic Regression

Despite its name, logistic regression is used for **classification**, not regression. It predicts the probability that an observation belongs to a particular class.

## The Problem with Linear Regression for Classification

Why can't we just use linear regression for binary classification?

```python
# Trying to predict Pass (1) vs Fail (0) with linear regression
# Problem: Predictions can be < 0 or > 1!

import numpy as np
hours = np.array([1, 2, 3, 4, 5, 6, 7, 8])
passed = np.array([0, 0, 0, 0, 1, 1, 1, 1])

# Linear regression might predict:
# -0.3 for 0 hours (impossible probability!)
# 1.5 for 10 hours (probability > 100%?)
```

## The Sigmoid Function

Logistic regression uses the sigmoid function to squash outputs between 0 and 1:

```
σ(z) = 1 / (1 + e^(-z))
```

```python
import numpy as np
import matplotlib.pyplot as plt

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# Visualize
z = np.linspace(-10, 10, 100)
plt.plot(z, sigmoid(z))
plt.xlabel('z (linear combination)')
plt.ylabel('Probability')
plt.title('Sigmoid Function')
plt.axhline(y=0.5, color='r', linestyle='--')
plt.grid(True)
plt.show()
```

Properties of sigmoid:
- Output always between 0 and 1 (valid probability)
- When z = 0, output = 0.5
- Large positive z → output approaches 1
- Large negative z → output approaches 0

## How Logistic Regression Works

```
Step 1: Calculate linear combination
z = w₁x₁ + w₂x₂ + ... + b

Step 2: Apply sigmoid to get probability
P(class=1) = σ(z) = 1 / (1 + e^(-z))

Step 3: Apply threshold (usually 0.5)
if P(class=1) >= 0.5: predict 1
else: predict 0
```

## Implementation with Scikit-Learn

```python
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import numpy as np

# Create sample dataset: Will customer churn?
np.random.seed(42)
n = 500

data = pd.DataFrame({
    'tenure_months': np.random.randint(1, 72, n),
    'monthly_charges': np.random.uniform(20, 100, n),
    'support_tickets': np.random.randint(0, 10, n),
    'contract_type': np.random.choice([0, 1, 2], n),  # month, year, 2-year
})

# Churn probability based on features
churn_prob = sigmoid(
    -0.05 * data['tenure_months'] +
    0.02 * data['monthly_charges'] +
    0.3 * data['support_tickets'] -
    0.5 * data['contract_type'] -
    1.5
)
data['churned'] = (np.random.random(n) < churn_prob).astype(int)

# Prepare data
X = data.drop('churned', axis=1)
y = data['churned']

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = LogisticRegression()
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]  # Probability of churn

# Evaluate
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2%}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
```

## Understanding Probabilities

```python
# Get probability predictions
probabilities = model.predict_proba(X_test)

# probabilities has shape (n_samples, 2)
# [:, 0] = P(not churn)
# [:, 1] = P(churn)

print("Sample predictions:")
for i in range(5):
    print(f"P(No Churn)={probabilities[i,0]:.2%}, "
          f"P(Churn)={probabilities[i,1]:.2%}, "
          f"Predicted: {'Churn' if y_pred[i] == 1 else 'Stay'}")
```

## Adjusting the Decision Threshold

Default threshold is 0.5, but you can change it:

```python
# Lower threshold = more sensitive to positive class
threshold = 0.3

y_pred_custom = (model.predict_proba(X_test)[:, 1] >= threshold).astype(int)

print(f"Default threshold (0.5): {sum(y_pred)} predicted churns")
print(f"Custom threshold ({threshold}): {sum(y_pred_custom)} predicted churns")
```

When to adjust threshold:
- **Lower threshold**: When false negatives are costly (disease detection)
- **Higher threshold**: When false positives are costly (spam to inbox)

## Evaluation Metrics for Classification

### Confusion Matrix

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(cm, display_labels=['Stay', 'Churn'])
disp.plot()
plt.title('Confusion Matrix')
plt.show()
```

```
                 Predicted
              Stay    Churn
Actual Stay    TN       FP
      Churn    FN       TP

TN = True Negative  (Correctly predicted Stay)
FP = False Positive (Incorrectly predicted Churn)
FN = False Negative (Missed a Churn)
TP = True Positive  (Correctly predicted Churn)
```

### Key Metrics

```python
from sklearn.metrics import precision_score, recall_score, f1_score

precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"Precision: {precision:.2%}")  # Of predicted churns, how many actually churned?
print(f"Recall: {recall:.2%}")        # Of actual churns, how many did we catch?
print(f"F1 Score: {f1:.2%}")          # Harmonic mean of precision and recall
```

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Accuracy | (TP + TN) / Total | Overall correctness |
| Precision | TP / (TP + FP) | Quality of positive predictions |
| Recall | TP / (TP + FN) | Coverage of actual positives |
| F1 | 2 × (P × R) / (P + R) | Balance of precision and recall |

## Multi-Class Classification

Logistic regression extends to multiple classes:

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris

# Load iris dataset (3 classes)
iris = load_iris()
X, y = iris.data, iris.target

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Multi-class logistic regression
model = LogisticRegression(multi_class='multinomial', max_iter=200)
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)

print(f"Accuracy: {accuracy_score(y_test, y_pred):.2%}")
print("\nProbabilities for first 3 samples:")
print(y_prob[:3])
```

## Feature Importance

```python
# Coefficients show feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'coefficient': model.coef_[0]
})
feature_importance['abs_coef'] = abs(feature_importance['coefficient'])
feature_importance = feature_importance.sort_values('abs_coef', ascending=False)

print("Feature Importance:")
print(feature_importance)

# Positive coefficient: increases probability of class 1
# Negative coefficient: decreases probability of class 1
```

## Regularization in Logistic Regression

```python
# L2 regularization (Ridge) - default
model_l2 = LogisticRegression(penalty='l2', C=1.0)

# L1 regularization (Lasso) - can zero out features
model_l1 = LogisticRegression(penalty='l1', solver='saga', C=1.0)

# No regularization
model_none = LogisticRegression(penalty=None)

# C parameter: inverse of regularization strength
# Lower C = stronger regularization
# Higher C = less regularization
```

## ROC Curve and AUC

```python
from sklearn.metrics import roc_curve, roc_auc_score

# Get probabilities
y_prob = model.predict_proba(X_test)[:, 1]

# Calculate ROC curve
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
auc = roc_auc_score(y_test, y_prob)

# Plot
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.3f})')
plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve')
plt.legend()
plt.grid(True)
plt.show()
```

AUC (Area Under Curve) interpretation:
- AUC = 1.0: Perfect classifier
- AUC = 0.5: Random guessing
- AUC > 0.8: Good model
- AUC > 0.9: Excellent model

## Complete Example: Spam Detection

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Sample email data
emails = [
    ("Win a FREE iPhone now!", 1),
    ("Meeting at 3pm tomorrow", 0),
    ("URGENT: Claim your prize", 1),
    ("Can you review this doc?", 0),
    ("Limited offer - 50% OFF!!!", 1),
    ("Project deadline reminder", 0),
    ("Click here for free money", 1),
    ("Lunch tomorrow?", 0),
    ("Congratulations! You won!", 1),
    ("Quarterly report attached", 0),
]

texts = [e[0] for e in emails]
labels = [e[1] for e in emails]

# Convert text to features
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)
y = labels

# Train model
model = LogisticRegression()
model.fit(X, y)

# Test on new emails
new_emails = [
    "FREE FREE FREE! Win now!",
    "Team sync at 2pm",
    "You've been selected for a prize!"
]
new_X = vectorizer.transform(new_emails)
predictions = model.predict(new_X)
probabilities = model.predict_proba(new_X)

for email, pred, prob in zip(new_emails, predictions, probabilities):
    status = "SPAM" if pred == 1 else "NOT SPAM"
    confidence = prob[pred]
    print(f"'{email[:30]}...' → {status} ({confidence:.0%} confident)")
```

## Knowledge Check

1. What does logistic regression predict?
   - The probability that an observation belongs to a class
   - A continuous numerical value
   - Multiple target variables simultaneously
   - Cluster assignments

2. What is the purpose of the sigmoid function?
   - To squash outputs between 0 and 1 (valid probabilities)
   - To increase model accuracy
   - To speed up training
   - To reduce features

3. What does precision measure?
   - Of all positive predictions, how many were actually positive
   - Of all actual positives, how many did we predict
   - Overall accuracy of the model
   - The speed of predictions

4. When should you lower the decision threshold below 0.5?
   - When false negatives are more costly than false positives
   - When you want fewer predictions
   - When the model is overfitting
   - When training data is limited

5. What does an AUC score of 0.75 indicate?
   - The model is better than random but not excellent
   - The model is perfect
   - The model is worse than random guessing
   - The model is overfit
