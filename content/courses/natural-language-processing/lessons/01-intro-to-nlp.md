---
id: nlp-intro-to-nlp
title: Introduction to NLP
type: lesson
duration: 45 mins
order: 1
section: fundamentals
nextLessonId: nlp-text-preprocessing
---

# Introduction to Natural Language Processing

Natural Language Processing (NLP) is the field of AI focused on enabling computers to understand, interpret, and generate human language. From search engines to virtual assistants, NLP powers many applications we use daily.

## What is NLP?

NLP sits at the intersection of computer science, linguistics, and artificial intelligence. It aims to bridge the gap between human communication and computer understanding.

```
Human Language → NLP → Machine Understanding → Actionable Output
```

### The Challenge of Language

Human language is incredibly complex:

- **Ambiguity**: "I saw her duck" (the animal or the action?)
- **Context**: "It's cold" (temperature? personality? food?)
- **Idioms**: "Break a leg" doesn't mean injury
- **Sarcasm**: "Oh great, another meeting"
- **World Knowledge**: "The trophy doesn't fit in the suitcase because it's too big"

## Core NLP Tasks

### Text Classification
Categorizing text into predefined classes:

```python
from transformers import pipeline

classifier = pipeline("sentiment-analysis")
result = classifier("I love this product! It's amazing!")
# Output: [{'label': 'POSITIVE', 'score': 0.9998}]
```

**Applications**: Spam detection, sentiment analysis, topic categorization

### Named Entity Recognition (NER)
Identifying and classifying named entities in text:

```python
import spacy
nlp = spacy.load("en_core_web_sm")

doc = nlp("Apple announced new products in Cupertino on Monday")
for ent in doc.ents:
    print(f"{ent.text}: {ent.label_}")
# Apple: ORG
# Cupertino: GPE
# Monday: DATE
```

### Machine Translation
Converting text from one language to another:

```python
from transformers import pipeline

translator = pipeline("translation_en_to_fr")
result = translator("Hello, how are you?")
# Output: "Bonjour, comment allez-vous?"
```

### Question Answering
Finding answers to questions from given context:

```python
from transformers import pipeline

qa_pipeline = pipeline("question-answering")
result = qa_pipeline(
    question="What is the capital of France?",
    context="France is a country in Europe. Paris is the capital of France."
)
# Output: {'answer': 'Paris', 'score': 0.99}
```

### Text Generation
Creating coherent text based on prompts:

```python
from transformers import pipeline

generator = pipeline("text-generation")
result = generator("The future of AI is", max_length=50)
```

### Text Summarization
Condensing long documents into shorter summaries:

```python
from transformers import pipeline

summarizer = pipeline("summarization")
summary = summarizer(long_article, max_length=150, min_length=50)
```

## The NLP Pipeline

Most NLP applications follow a standard pipeline:

```
Raw Text
    ↓
1. Text Preprocessing
   - Cleaning (remove HTML, special characters)
   - Normalization (lowercase, unicode)
   ↓
2. Tokenization
   - Split into words/subwords
   ↓
3. Feature Extraction
   - Word embeddings
   - TF-IDF vectors
   ↓
4. Model Processing
   - Classification
   - Sequence labeling
   - Generation
   ↓
5. Post-processing
   - Decode outputs
   - Format results
```

### Example Pipeline: Sentiment Analysis

```python
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Sample data
texts = [
    "This movie was fantastic! Loved every minute.",
    "Terrible film. Waste of time.",
    "An okay movie, nothing special.",
    "Absolutely brilliant performance!",
    "Boring and predictable plot."
]
labels = [1, 0, 0, 1, 0]  # 1 = positive, 0 = negative

# 1. Preprocessing
def preprocess(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

cleaned = [preprocess(t) for t in texts]

# 2-3. Tokenization + Feature Extraction
vectorizer = TfidfVectorizer()
features = vectorizer.fit_transform(cleaned)

# 4. Model
model = LogisticRegression()
model.fit(features, labels)

# 5. Predict new text
new_text = "What an amazing experience!"
new_features = vectorizer.transform([preprocess(new_text)])
prediction = model.predict(new_features)
print(f"Sentiment: {'Positive' if prediction[0] == 1 else 'Negative'}")
```

## Evolution of NLP

### Rule-Based Era (1950s-1980s)
- Hand-crafted grammar rules
- Pattern matching
- Limited flexibility

### Statistical Era (1990s-2000s)
- Machine learning on text
- Bag of words, TF-IDF
- Hidden Markov Models

### Neural Era (2010s)
- Word2Vec embeddings
- RNNs, LSTMs for sequences
- Seq2Seq with attention

### Transformer Era (2017-Present)
- Attention is All You Need (2017)
- BERT, GPT, and variants
- Large Language Models (LLMs)

## Modern NLP with Transformers

The transformer architecture revolutionized NLP:

```python
from transformers import pipeline

# Zero-shot classification - no training needed!
classifier = pipeline("zero-shot-classification")
result = classifier(
    "I need to schedule a doctor's appointment",
    candidate_labels=["healthcare", "travel", "finance", "entertainment"]
)
print(result)
# Output: {'labels': ['healthcare', 'travel', 'finance', 'entertainment'],
#          'scores': [0.92, 0.04, 0.02, 0.02]}
```

## NLP Libraries Ecosystem

### spaCy - Industrial Strength NLP
```python
import spacy
nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple is looking at buying U.K. startup for $1 billion")

# Tokenization, POS tagging, NER - all in one!
for token in doc:
    print(f"{token.text}: {token.pos_} {token.dep_}")
```

### Hugging Face Transformers
```python
from transformers import AutoTokenizer, AutoModel

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModel.from_pretrained("bert-base-uncased")

inputs = tokenizer("Hello world!", return_tensors="pt")
outputs = model(**inputs)
```

### NLTK - Educational & Research
```python
import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer

tokens = word_tokenize("The cats are running quickly")
stemmer = PorterStemmer()
stems = [stemmer.stem(t) for t in tokens]
# ['the', 'cat', 'are', 'run', 'quickli']
```

## Real-World NLP Applications

| Application | NLP Tasks Used |
|-------------|----------------|
| Search Engines | Query understanding, document ranking, entity extraction |
| Virtual Assistants | Intent detection, slot filling, response generation |
| Email Filters | Spam classification, priority detection |
| Social Media | Sentiment analysis, content moderation, trend detection |
| Healthcare | Clinical NER, medical coding, literature mining |
| Legal | Contract analysis, document review, compliance checking |
| Customer Service | Chatbots, ticket routing, response suggestions |

## Challenges in NLP

### Low-Resource Languages
Most NLP models focus on English. Languages with less data are harder.

### Domain Adaptation
Models trained on general text may fail on specialized domains (medical, legal).

### Bias and Fairness
Language models can learn and amplify societal biases present in training data.

### Evaluation
Measuring quality of generated text remains challenging.

## Knowledge Check

1. What is the primary goal of NLP?
   - Enable computers to understand and process human language
   - Translate programming languages
   - Create new programming languages
   - Analyze computer code

2. Which of these is NOT a core NLP task?
   - Image classification
   - Named entity recognition
   - Sentiment analysis
   - Machine translation

3. What made transformers revolutionary for NLP?
   - The attention mechanism allowing parallel processing of sequences
   - They used less training data
   - They were the first neural network approach
   - They only work for English

4. In the NLP pipeline, what typically comes after tokenization?
   - Feature extraction (embeddings, TF-IDF)
   - Raw text input
   - Model deployment
   - Data collection

5. Which library is best known for pre-trained transformer models?
   - Hugging Face Transformers
   - NumPy
   - Matplotlib
   - Requests
