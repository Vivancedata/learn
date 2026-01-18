---
id: ml-what-is-ml
title: What is Machine Learning?
type: lesson
duration: 45 mins
order: 1
section: introduction
nextLessonId: ml-types-of-learning
---

# What is Machine Learning?

Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. Instead of writing rules, you provide examples and let the algorithm discover patterns.

## The Traditional Programming vs ML Approach

### Traditional Programming
```
Input Data + Rules → Program → Output
```

You write explicit rules to solve problems:
```python
# Traditional: Explicit rules
def is_spam_traditional(email):
    spam_words = ["free", "winner", "urgent", "click here"]
    for word in spam_words:
        if word in email.lower():
            return True
    return False
```

### Machine Learning Approach
```
Input Data + Outputs → ML Algorithm → Model (Rules)
```

You provide examples and let the algorithm learn the rules:
```python
# ML: Learn from examples
from sklearn.naive_bayes import MultinomialNB

# Training data: emails labeled as spam/not spam
emails = ["Free money!", "Meeting at 3pm", "Click here to win!"]
labels = [1, 0, 1]  # 1 = spam, 0 = not spam

# Model learns patterns from data
model = MultinomialNB()
model.fit(vectorize(emails), labels)

# Model applies learned patterns
model.predict(["Congratulations! You won!"])  # Predicts: spam
```

## Why Machine Learning?

### Problems Too Complex for Rules

Some problems have too many variables or edge cases:

- **Spam Detection**: Millions of variations, new spam types daily
- **Image Recognition**: Infinite ways to draw a "cat"
- **Speech Recognition**: Accents, noise, speaking styles
- **Medical Diagnosis**: Complex symptom combinations

### Patterns Hidden in Data

ML excels when patterns exist but aren't obvious:

- **Customer Churn**: Which behaviors predict cancellation?
- **Fraud Detection**: What transactions are suspicious?
- **Recommendation**: What products will this user like?
- **Predictive Maintenance**: When will this machine fail?

### Adapting Over Time

Unlike static rules, ML models can retrain on new data:

```python
# Model improves with more data
model.fit(new_emails, new_labels)
```

## Real-World ML Applications

### You Use ML Every Day

| Application | ML Task |
|-------------|---------|
| Netflix recommendations | Predict what you'll enjoy |
| Gmail spam filter | Classify spam vs. legitimate |
| Google Search | Rank relevant results |
| Face unlock on phone | Recognize your face |
| Autocomplete | Predict next words |
| Credit card alerts | Detect fraud |

### Industry Applications

**Healthcare**
- Disease diagnosis from medical images
- Drug discovery
- Patient risk prediction

**Finance**
- Credit scoring
- Algorithmic trading
- Fraud detection

**E-commerce**
- Product recommendations
- Dynamic pricing
- Demand forecasting

**Transportation**
- Route optimization
- Autonomous vehicles
- Traffic prediction

## The ML Workflow

Every ML project follows similar steps:

```
1. Define Problem
   ↓
2. Collect Data
   ↓
3. Prepare Data (Clean, Transform, Feature Engineering)
   ↓
4. Split Data (Training, Validation, Test)
   ↓
5. Train Model
   ↓
6. Evaluate Model
   ↓
7. Tune & Improve
   ↓
8. Deploy to Production
```

### Step-by-Step Example: Predicting House Prices

```python
# 1. Define Problem: Predict house prices
# 2. Collect Data: Historical sales data

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

# 3. Prepare Data
data = pd.read_csv("houses.csv")
X = data[["sqft", "bedrooms", "bathrooms"]]
y = data["price"]

# 4. Split Data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5. Train Model
model = LinearRegression()
model.fit(X_train, y_train)

# 6. Evaluate
predictions = model.predict(X_test)
rmse = mean_squared_error(y_test, predictions, squared=False)
print(f"RMSE: ${rmse:,.0f}")

# 7. Tune (we'll learn later)
# 8. Deploy (we'll learn later)
```

## Key ML Terminology

| Term | Definition | Example |
|------|------------|---------|
| **Feature** | Input variable | House size, bedrooms |
| **Target/Label** | What we predict | House price |
| **Training** | Learning from data | Fitting a model |
| **Inference** | Making predictions | Predicting a new house price |
| **Model** | Learned pattern | The trained algorithm |
| **Dataset** | Collection of examples | 10,000 house records |
| **Overfitting** | Too specific to training data | Memorizing instead of learning |
| **Underfitting** | Too simple to capture patterns | Too few features |

## When to Use ML (And When Not To)

### Good Fit for ML

- Pattern exists in data
- Pattern is complex (many rules needed)
- Enough labeled examples available
- Problem environment is stable (or you can retrain)

### Not Ideal for ML

- Simple rules suffice (`if age < 18: minor`)
- No data available
- Complete explainability required (some regulations)
- Deterministic logic needed (banking calculations)

## Practical Example: Email Classification

Let's see a simple ML example in action:

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB

# Training data
emails = [
    "Congratulations! You've won a free vacation!",
    "Meeting scheduled for Tuesday at 2pm",
    "URGENT: Claim your prize now!!!",
    "Can you review this document?",
    "Free iPhone! Click here immediately!",
    "Project update attached",
    "Limited time offer - act now!",
    "Team lunch this Friday?",
]

labels = [1, 0, 1, 0, 1, 0, 1, 0]  # 1 = spam, 0 = not spam

# Convert text to numbers
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(emails)

# Train model
model = MultinomialNB()
model.fit(X, labels)

# Predict new emails
new_emails = [
    "Win a free car today!",
    "Weekly team standup notes"
]
new_X = vectorizer.transform(new_emails)
predictions = model.predict(new_X)

for email, pred in zip(new_emails, predictions):
    result = "SPAM" if pred == 1 else "NOT SPAM"
    print(f"{email[:30]}... → {result}")
```

Output:
```
Win a free car today!... → SPAM
Weekly team standup notes... → NOT SPAM
```

## Knowledge Check

1. What is the main difference between traditional programming and machine learning?
   - In ML, the computer learns rules from data instead of being explicitly programmed
   - ML is faster than traditional programming
   - Traditional programming cannot solve complex problems
   - ML does not require any data

2. Which of these is a good use case for machine learning?
   - Predicting customer churn based on behavior patterns
   - Calculating the sum of two numbers
   - Checking if a number is even or odd
   - Displaying the current date

3. What is a "feature" in machine learning?
   - An input variable used to make predictions
   - The final output of the model
   - A type of algorithm
   - The training process

4. What is overfitting?
   - When a model performs well on training data but poorly on new data
   - When a model is too simple to capture patterns
   - When you have too much data
   - When training takes too long

5. In the ML workflow, what comes immediately after training the model?
   - Evaluate the model's performance
   - Collect more data
   - Deploy to production
   - Define the problem
