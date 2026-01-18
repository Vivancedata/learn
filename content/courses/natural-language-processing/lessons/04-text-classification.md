---
id: nlp-text-classification
title: Text Classification
type: lesson
duration: 50 mins
order: 4
section: classification
prevLessonId: nlp-word-embeddings
nextLessonId: nlp-transformers
---

# Text Classification

Text classification assigns predefined categories to text documents. From spam detection to sentiment analysis, it's one of the most common NLP tasks in production.

## Types of Text Classification

### Binary Classification
Two classes: positive/negative, spam/not spam

```python
# Sentiment Analysis
texts = ["This movie is great!", "Terrible waste of time"]
labels = [1, 0]  # 1=positive, 0=negative
```

### Multi-class Classification
Multiple mutually exclusive classes

```python
# Topic Classification
texts = ["Stock market hits record high", "New AI model released"]
labels = ["finance", "technology"]
```

### Multi-label Classification
Multiple labels per document

```python
# Movie Genres
texts = ["A funny love story with action scenes"]
labels = [["comedy", "romance", "action"]]
```

## Traditional ML Approach

### Step 1: Feature Extraction

**Bag of Words (BoW)**
```python
from sklearn.feature_extraction.text import CountVectorizer

texts = [
    "I love this movie",
    "This movie is terrible",
    "Great film, loved it"
]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)
print(vectorizer.get_feature_names_out())
# ['film', 'great', 'is', 'it', 'love', 'loved', 'movie', 'terrible', 'this']
```

**TF-IDF (Term Frequency-Inverse Document Frequency)**
```python
from sklearn.feature_extraction.text import TfidfVectorizer

tfidf = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),  # unigrams and bigrams
    stop_words='english'
)
X = tfidf.fit_transform(texts)
```

### Step 2: Train Classifier

```python
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Sample dataset
texts = [
    "I love this product, it's amazing!",
    "Terrible experience, would not recommend",
    "Best purchase I've ever made",
    "Waste of money, very disappointed",
    "Exceeded my expectations, highly recommend",
    "Poor quality, broke after one day"
]
labels = [1, 0, 1, 0, 1, 0]

# Vectorize
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, labels, test_size=0.2, random_state=42
)

# Train multiple classifiers
classifiers = {
    "Logistic Regression": LogisticRegression(),
    "Naive Bayes": MultinomialNB(),
    "SVM": LinearSVC()
}

for name, clf in classifiers.items():
    clf.fit(X_train, y_train)
    accuracy = clf.score(X_test, y_test)
    print(f"{name}: {accuracy:.2f}")
```

## Deep Learning Approach

### Simple Neural Network

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

class TextDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            truncation=True,
            padding='max_length',
            max_length=self.max_len,
            return_tensors='pt'
        )
        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'label': torch.tensor(self.labels[idx])
        }

class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.fc1 = nn.Linear(embed_dim, 128)
        self.fc2 = nn.Linear(128, num_classes)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        embedded = self.embedding(x)  # (batch, seq, embed)
        pooled = embedded.mean(dim=1)  # (batch, embed)
        x = torch.relu(self.fc1(pooled))
        x = self.dropout(x)
        return self.fc2(x)
```

### LSTM Classifier

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim,
            batch_first=True,
            bidirectional=True
        )
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        embedded = self.embedding(x)
        lstm_out, (hidden, cell) = self.lstm(embedded)

        # Concatenate last hidden states from both directions
        hidden = torch.cat((hidden[-2,:,:], hidden[-1,:,:]), dim=1)
        hidden = self.dropout(hidden)
        return self.fc(hidden)
```

## Transfer Learning with Transformers

Modern approach: fine-tune pre-trained models.

### Using Hugging Face

```python
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)
from datasets import Dataset
import numpy as np
from sklearn.metrics import accuracy_score

# Prepare data
train_texts = ["I love this!", "This is terrible", ...]
train_labels = [1, 0, ...]

train_dataset = Dataset.from_dict({
    "text": train_texts,
    "label": train_labels
})

# Load model and tokenizer
model_name = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=2
)

# Tokenize
def tokenize(batch):
    return tokenizer(
        batch["text"],
        padding=True,
        truncation=True,
        max_length=128
    )

train_dataset = train_dataset.map(tokenize, batched=True)

# Training arguments
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    learning_rate=2e-5,
    weight_decay=0.01,
)

# Metrics
def compute_metrics(pred):
    labels = pred.label_ids
    preds = np.argmax(pred.predictions, axis=1)
    return {"accuracy": accuracy_score(labels, preds)}

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    compute_metrics=compute_metrics
)
trainer.train()
```

### Quick Classification with Pipeline

```python
from transformers import pipeline

# Zero-shot classification (no training needed!)
classifier = pipeline("zero-shot-classification")
result = classifier(
    "I just got a promotion at work!",
    candidate_labels=["career", "health", "entertainment", "sports"]
)
print(result)
# {'labels': ['career', 'entertainment', 'health', 'sports'],
#  'scores': [0.92, 0.04, 0.02, 0.02]}

# Sentiment analysis
sentiment = pipeline("sentiment-analysis")
result = sentiment("This product exceeded my expectations!")
# [{'label': 'POSITIVE', 'score': 0.9998}]
```

## Handling Imbalanced Data

Real datasets are often imbalanced (e.g., 95% non-spam, 5% spam).

### Techniques

```python
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import SMOTE

# 1. Class weights
weights = compute_class_weight(
    'balanced',
    classes=np.unique(y_train),
    y=y_train
)
class_weights = dict(enumerate(weights))

# Use in sklearn
model = LogisticRegression(class_weight='balanced')

# 2. SMOTE (Synthetic Minority Oversampling)
smote = SMOTE(random_state=42)
X_resampled, y_resampled = smote.fit_resample(X_train, y_train)

# 3. Weighted loss in PyTorch
weights = torch.tensor([1.0, 10.0])  # Higher weight for minority
criterion = nn.CrossEntropyLoss(weight=weights)
```

## Evaluation Metrics

```python
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

y_pred = model.predict(X_test)

# Accuracy (not ideal for imbalanced data)
accuracy = accuracy_score(y_test, y_pred)

# Precision, Recall, F1
precision = precision_score(y_test, y_pred, average='weighted')
recall = recall_score(y_test, y_pred, average='weighted')
f1 = f1_score(y_test, y_pred, average='weighted')

# Detailed report
print(classification_report(y_test, y_pred))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
```

## Practical Project: Spam Classifier

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

# Load data
df = pd.read_csv("spam.csv")
X = df["text"]
y = df["label"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Vectorize
vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Train
model = LogisticRegression(class_weight='balanced')
model.fit(X_train_vec, y_train)

# Evaluate
y_pred = model.predict(X_test_vec)
print(classification_report(y_test, y_pred))

# Predict new text
def predict_spam(text):
    vec = vectorizer.transform([text])
    pred = model.predict(vec)[0]
    prob = model.predict_proba(vec)[0]
    return {
        "prediction": "SPAM" if pred == 1 else "NOT SPAM",
        "confidence": max(prob)
    }

print(predict_spam("Congratulations! You won a free iPhone!"))
# {'prediction': 'SPAM', 'confidence': 0.97}
```

## Knowledge Check

1. What is the difference between multi-class and multi-label classification?
   - Multi-class has mutually exclusive labels; multi-label allows multiple labels per document
   - They are the same
   - Multi-label only works with neural networks
   - Multi-class requires more data

2. Why is TF-IDF often preferred over simple bag-of-words?
   - TF-IDF weights down common words and emphasizes distinctive terms
   - TF-IDF is faster to compute
   - Bag-of-words cannot handle large vocabularies
   - TF-IDF uses neural networks

3. What is zero-shot classification?
   - Classifying text into categories without training on labeled examples of those categories
   - Training with zero examples
   - A classification algorithm that uses no features
   - Classification without preprocessing

4. For imbalanced datasets, which metric is better than accuracy?
   - F1 score or balanced accuracy
   - Training time
   - Vocabulary size
   - Number of features

5. What is the advantage of fine-tuning a pre-trained transformer?
   - Leverages knowledge from massive datasets, requiring less task-specific data
   - It's faster than training from scratch
   - It uses less memory
   - It only works for sentiment analysis
