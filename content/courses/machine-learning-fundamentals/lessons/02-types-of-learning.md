---
id: ml-types-of-learning
title: Types of Machine Learning
type: lesson
duration: 50 mins
order: 2
section: introduction
prevLessonId: ml-what-is-ml
nextLessonId: ml-linear-regression
---

# Types of Machine Learning

Machine learning algorithms fall into three main categories based on how they learn from data. Understanding these types helps you choose the right approach for your problem.

## The Three Types of Machine Learning

```
Machine Learning
├── Supervised Learning (labeled data)
│   ├── Classification (categorical output)
│   └── Regression (numerical output)
├── Unsupervised Learning (no labels)
│   ├── Clustering (group similar items)
│   ├── Dimensionality Reduction (compress features)
│   └── Anomaly Detection (find outliers)
└── Reinforcement Learning (learn from rewards)
```

## 1. Supervised Learning

**Definition**: Learning from labeled examples where the correct answer is provided.

Think of it like a teacher showing flash cards with answers:
- Input: Picture of a cat → Label: "Cat"
- Input: House features → Label: Price ($450,000)

### The Key: Labeled Data

```python
# Labeled dataset for house prices
data = [
    {"sqft": 1500, "bedrooms": 3, "price": 350000},  # price = label
    {"sqft": 2000, "bedrooms": 4, "price": 450000},
    {"sqft": 1200, "bedrooms": 2, "price": 280000},
]
```

### Two Types of Supervised Learning

#### Classification (Categorical Output)
Predict a category or class.

| Problem | Classes |
|---------|---------|
| Email spam detection | Spam / Not Spam |
| Disease diagnosis | Disease A / B / C |
| Customer churn | Will Churn / Won't Churn |
| Image recognition | Cat / Dog / Bird |

```python
from sklearn.tree import DecisionTreeClassifier

# Features (X) and Labels (y)
X = [[age, income, years_customer] for customer in customers]
y = [1 if churned else 0 for customer in customers]

# Train classifier
model = DecisionTreeClassifier()
model.fit(X, y)

# Predict new customer
model.predict([[35, 75000, 2]])  # Output: [0] (Won't churn)
```

#### Regression (Numerical Output)
Predict a continuous number.

| Problem | Output |
|---------|--------|
| House prices | $350,000 |
| Sales forecast | 1,234 units |
| Temperature prediction | 72.5°F |
| Stock prices | $156.32 |

```python
from sklearn.linear_model import LinearRegression

# Features and target
X = [[sqft, bedrooms, bathrooms] for house in houses]
y = [price for house in houses]

# Train regressor
model = LinearRegression()
model.fit(X, y)

# Predict price
model.predict([[2000, 3, 2]])  # Output: [425000]
```

### Popular Supervised Learning Algorithms

| Algorithm | Type | Use Case |
|-----------|------|----------|
| Linear Regression | Regression | Price prediction |
| Logistic Regression | Classification | Binary outcomes |
| Decision Trees | Both | Interpretable models |
| Random Forest | Both | General purpose |
| XGBoost | Both | Competition winning |
| Neural Networks | Both | Complex patterns |

## 2. Unsupervised Learning

**Definition**: Finding patterns in data without labeled examples.

Think of it like sorting a mixed bag of coins without knowing the denominations—you group by size and color.

### No Labels Required

```python
# Unlabeled data - just features, no "answer"
customer_data = [
    {"age": 25, "income": 30000, "purchases": 5},
    {"age": 45, "income": 80000, "purchases": 20},
    {"age": 28, "income": 35000, "purchases": 8},
    # No "segment" label - algorithm finds groups
]
```

### Types of Unsupervised Learning

#### Clustering (Group Similar Items)

Find natural groupings in data.

```python
from sklearn.cluster import KMeans

# Customer features
X = [[age, income, purchases] for customer in customers]

# Find 3 natural segments
model = KMeans(n_clusters=3)
model.fit(X)

# Get cluster assignments
segments = model.labels_
# [0, 2, 0, 1, 2, ...]  # Which segment each customer belongs to
```

**Use Cases:**
- Customer segmentation
- Document grouping
- Image compression
- Anomaly detection

#### Dimensionality Reduction

Compress many features into fewer while preserving information.

```python
from sklearn.decomposition import PCA

# 100 features → 10 features
pca = PCA(n_components=10)
X_compressed = pca.fit_transform(X_original)
```

**Use Cases:**
- Data visualization (reduce to 2D for plotting)
- Feature compression before training
- Noise reduction
- Face recognition

#### Anomaly Detection

Find unusual data points.

```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(contamination=0.01)
model.fit(transactions)

# Predict: 1 = normal, -1 = anomaly
predictions = model.predict(new_transactions)
```

**Use Cases:**
- Fraud detection
- Network intrusion detection
- Manufacturing defects
- Medical anomalies

### Popular Unsupervised Algorithms

| Algorithm | Type | Use Case |
|-----------|------|----------|
| K-Means | Clustering | Customer segmentation |
| DBSCAN | Clustering | Arbitrary shaped clusters |
| PCA | Dimensionality Reduction | Feature compression |
| t-SNE | Dimensionality Reduction | Data visualization |
| Isolation Forest | Anomaly Detection | Fraud detection |

## 3. Reinforcement Learning

**Definition**: Learning through trial and error with rewards/penalties.

Think of training a dog: give treats for good behavior, corrections for bad behavior.

### Key Components

```
Agent → Action → Environment
              ↓
           Reward/Penalty
              ↓
          Update Policy
              ↓
           Next State
```

```python
# Simplified RL concept (pseudo-code)
for episode in range(1000):
    state = environment.reset()

    while not done:
        # Agent chooses action based on current policy
        action = agent.choose_action(state)

        # Environment responds
        next_state, reward, done = environment.step(action)

        # Agent learns from experience
        agent.learn(state, action, reward, next_state)

        state = next_state
```

### Real-World RL Applications

| Application | Agent | Actions | Rewards |
|-------------|-------|---------|---------|
| Game AI | Game player | Move, attack, defend | Score, win |
| Robotics | Robot arm | Move joints | Task completion |
| Self-driving | Vehicle | Steer, accelerate, brake | Safety, efficiency |
| Trading | Trading bot | Buy, sell, hold | Profit |
| Recommendations | System | Show content | Clicks, engagement |

### RL vs Other Types

| Aspect | Supervised | Unsupervised | Reinforcement |
|--------|------------|--------------|---------------|
| Data | Labeled examples | No labels | Environment feedback |
| Learning | From correct answers | Find patterns | From rewards |
| Goal | Predict accurately | Discover structure | Maximize rewards |
| Feedback | Immediate (labels) | None | Delayed (rewards) |

## Choosing the Right Approach

### Decision Flowchart

```
Do you have labeled data?
├── Yes → SUPERVISED LEARNING
│   └── Is the output categorical or numerical?
│       ├── Categorical → Classification
│       └── Numerical → Regression
├── No → Do you want to find patterns/groups?
│   └── Yes → UNSUPERVISED LEARNING
│       └── Want groups? → Clustering
│       └── Want simpler data? → Dimensionality Reduction
│       └── Want outliers? → Anomaly Detection
└── Learning through interaction?
    └── Yes → REINFORCEMENT LEARNING
```

### Quick Reference

| I want to... | Type | Example Algorithm |
|--------------|------|-------------------|
| Predict categories | Supervised (Classification) | Random Forest |
| Predict numbers | Supervised (Regression) | Linear Regression |
| Group similar items | Unsupervised (Clustering) | K-Means |
| Reduce features | Unsupervised (Dim. Reduction) | PCA |
| Find anomalies | Unsupervised (Anomaly) | Isolation Forest |
| Learn by doing | Reinforcement Learning | Q-Learning |

## Semi-Supervised & Self-Supervised Learning

### Semi-Supervised Learning

Combines small labeled dataset with large unlabeled dataset:

```python
# Small labeled set
labeled_X = [[...], [...]]  # 100 examples
labeled_y = [0, 1, ...]

# Large unlabeled set
unlabeled_X = [[...], [...], ...]  # 10,000 examples

# Use both to train better models
```

**Use Case**: Medical imaging where labeled data is expensive.

### Self-Supervised Learning

Creates labels from the data itself:

```python
# Example: Predict next word (language models)
"The cat sat on the ___"  # Model predicts "mat"

# Example: Predict masked portions of image
# Hide part of image, model predicts hidden content
```

**Use Case**: GPT, BERT, and other foundation models.

## Practical Example: Retail Analytics

Let's apply all three types to a retail business:

```python
# SUPERVISED: Predict customer lifetime value
from sklearn.ensemble import RandomForestRegressor

X = customer_features  # age, tenure, purchase_history
y = lifetime_value     # labeled from historical data

model = RandomForestRegressor()
model.fit(X, y)
predicted_ltv = model.predict(new_customers)

# UNSUPERVISED: Segment customers
from sklearn.cluster import KMeans

X = customer_behavior  # no labels
kmeans = KMeans(n_clusters=4)
segments = kmeans.fit_predict(X)
# Result: "Premium", "Occasional", "Bargain Hunter", "At-Risk"

# REINFORCEMENT: Dynamic pricing
# Agent learns to set prices that maximize revenue
# Tries different prices, observes sales, adjusts strategy
```

## Knowledge Check

1. What type of ML uses labeled data to make predictions?
   - Supervised Learning
   - Unsupervised Learning
   - Reinforcement Learning
   - Clustering

2. Which task is a classification problem?
   - Predicting if an email is spam or not
   - Predicting tomorrow's temperature
   - Grouping customers by behavior
   - Reducing 100 features to 10

3. What is the main goal of clustering?
   - Group similar data points together without predefined labels
   - Predict numerical values
   - Classify into known categories
   - Train through rewards

4. In reinforcement learning, what guides the agent's learning?
   - Rewards and penalties from the environment
   - Labeled training examples
   - Clustering assignments
   - Feature reduction

5. You have customer purchase data with no labels. You want to find natural customer segments. Which approach should you use?
   - Unsupervised Learning (Clustering)
   - Supervised Learning (Classification)
   - Supervised Learning (Regression)
   - Reinforcement Learning
