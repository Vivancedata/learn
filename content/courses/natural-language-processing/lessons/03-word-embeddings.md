---
id: nlp-word-embeddings
title: Word Embeddings
type: lesson
duration: 55 mins
order: 3
section: representations
prevLessonId: nlp-text-preprocessing
nextLessonId: nlp-text-classification
---

# Word Embeddings

Word embeddings are dense vector representations of words that capture semantic meaning. Words with similar meanings have similar vectors, enabling machines to understand relationships between words.

## From Sparse to Dense Representations

### One-Hot Encoding (Sparse)

Traditional approach: each word is a unique vector.

```python
vocabulary = ["king", "queen", "man", "woman", "apple"]

# One-hot vectors
king  = [1, 0, 0, 0, 0]
queen = [0, 1, 0, 0, 0]
man   = [0, 0, 1, 0, 0]
woman = [0, 0, 0, 1, 0]
apple = [0, 0, 0, 0, 1]
```

**Problems:**
- No similarity information (king and queen are as different as king and apple)
- Vocabulary size = vector size (huge for real vocabularies)
- Sparse (mostly zeros)

### Word Embeddings (Dense)

Dense vectors in continuous space:

```python
# Example 300-dimensional embeddings (showing first 5)
king  = [0.25, 0.73, -0.12, 0.89, 0.45, ...]
queen = [0.28, 0.71, -0.15, 0.91, 0.42, ...]
man   = [0.19, 0.68, -0.08, 0.45, 0.38, ...]
woman = [0.22, 0.66, -0.11, 0.47, 0.35, ...]
apple = [-0.32, 0.15, 0.78, -0.23, 0.12, ...]
```

**Advantages:**
- Similar words have similar vectors
- Fixed dimension (typically 50-300)
- Captures semantic relationships

## Word2Vec

Introduced by Google in 2013, Word2Vec learns embeddings from context.

### The Core Idea

"You shall know a word by the company it keeps" - J.R. Firth

```
The cat sat on the mat.
     ↑
  context words predict this word (CBOW)
  OR
  this word predicts context words (Skip-gram)
```

### Skip-gram Architecture

Given a word, predict surrounding context words:

```python
# Training pairs for window_size=2
# Sentence: "The quick brown fox jumps"

# Target → Context
# quick → [the, brown]
# brown → [quick, fox]
# fox   → [brown, jumps]
```

### Training Word2Vec with Gensim

```python
from gensim.models import Word2Vec

# Training corpus (list of tokenized sentences)
sentences = [
    ["the", "cat", "sat", "on", "the", "mat"],
    ["the", "dog", "ran", "in", "the", "park"],
    ["cats", "and", "dogs", "are", "pets"],
]

# Train model
model = Word2Vec(
    sentences=sentences,
    vector_size=100,   # Embedding dimension
    window=5,          # Context window size
    min_count=1,       # Minimum word frequency
    workers=4,         # Parallel training
    sg=1               # 1 = Skip-gram, 0 = CBOW
)

# Get embedding for a word
cat_vector = model.wv["cat"]
print(cat_vector.shape)  # (100,)

# Find similar words
similar = model.wv.most_similar("cat", topn=3)
# [('dog', 0.89), ('pets', 0.76), ('sat', 0.65)]
```

### Word Analogies

Word2Vec famously captures analogies:

```python
# king - man + woman = queen
result = model.wv.most_similar(
    positive=["king", "woman"],
    negative=["man"],
    topn=1
)
# [('queen', 0.93)]

# Other analogies:
# Paris - France + Italy = Rome
# bigger - big + small = smaller
```

## Pre-trained Word Vectors

Training from scratch requires massive corpora. Use pre-trained vectors:

### Loading GloVe Vectors

```python
import numpy as np

def load_glove(file_path):
    embeddings = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]
            vector = np.array(values[1:], dtype='float32')
            embeddings[word] = vector
    return embeddings

# Load GloVe 100d vectors
glove = load_glove('glove.6B.100d.txt')
print(glove['computer'].shape)  # (100,)
```

### Using Gensim's Pre-trained Models

```python
import gensim.downloader as api

# Download and load pre-trained Word2Vec (Google News)
model = api.load("word2vec-google-news-300")

# Find similar words
model.most_similar("programming")
# [('coding', 0.82), ('software', 0.78), ...]

# Word analogies
model.most_similar(positive=["woman", "king"], negative=["man"])
# [('queen', 0.71)]
```

## GloVe (Global Vectors)

GloVe combines global matrix factorization with local context windows.

```python
# Load pre-trained GloVe via Gensim
glove_model = api.load("glove-wiki-gigaword-100")

# Same interface as Word2Vec
glove_model.most_similar("python")
# [('programming', 0.78), ('language', 0.72), ...]
```

### Key Differences from Word2Vec

| Aspect | Word2Vec | GloVe |
|--------|----------|-------|
| Training | Predictive (neural net) | Count-based + factorization |
| Global info | No | Yes (co-occurrence matrix) |
| Speed | Slower | Faster |
| Performance | Often similar | Often similar |

## FastText

FastText (by Facebook) represents words as bag of character n-grams.

```python
from gensim.models import FastText

# Train FastText
model = FastText(
    sentences=sentences,
    vector_size=100,
    window=5,
    min_count=1
)

# Key advantage: handles out-of-vocabulary words
# Word "unforgettable" = "unf" + "nfo" + "for" + "org" + ...
vector = model.wv["unforgettable"]  # Works even if not in training data!
```

### Advantages of FastText

1. **OOV handling**: Can generate vectors for unseen words
2. **Morphology**: Captures word structure (prefixes, suffixes)
3. **Rare words**: Better representations for infrequent words

## Contextual Embeddings

Traditional embeddings give one vector per word. But words have different meanings in different contexts!

```
"bank" in "river bank" vs "bank account"
```

### The Solution: Contextual Embeddings

Models like ELMo, BERT, GPT generate context-dependent embeddings:

```python
from transformers import AutoTokenizer, AutoModel
import torch

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModel.from_pretrained("bert-base-uncased")

# Same word, different contexts
sentences = [
    "I deposited money in the bank",
    "I sat by the river bank"
]

for sentence in sentences:
    inputs = tokenizer(sentence, return_tensors="pt")
    outputs = model(**inputs)

    # Get embedding for "bank"
    tokens = tokenizer.tokenize(sentence)
    bank_idx = tokens.index("bank")
    bank_embedding = outputs.last_hidden_state[0, bank_idx + 1]

    print(f"'{sentence}' - bank embedding shape: {bank_embedding.shape}")
```

The "bank" embeddings will be different based on context!

## Using Embeddings in ML Models

### Embedding Layer in PyTorch

```python
import torch
import torch.nn as nn

# Create embedding layer
vocab_size = 10000
embedding_dim = 100

embedding = nn.Embedding(vocab_size, embedding_dim)

# Initialize with pre-trained vectors
pretrained_weights = torch.tensor(glove_vectors)
embedding = nn.Embedding.from_pretrained(pretrained_weights)

# Optionally freeze embeddings
embedding.weight.requires_grad = False

# Use in model
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.fc = nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        # x: (batch, seq_len)
        embedded = self.embedding(x)  # (batch, seq_len, embed_dim)
        pooled = embedded.mean(dim=1)  # (batch, embed_dim)
        return self.fc(pooled)
```

### Sentence Embeddings

Average word embeddings to get sentence representation:

```python
def get_sentence_embedding(sentence, word_vectors):
    tokens = sentence.lower().split()
    vectors = []

    for token in tokens:
        if token in word_vectors:
            vectors.append(word_vectors[token])

    if vectors:
        return np.mean(vectors, axis=0)
    return np.zeros(word_vectors.vector_size)

# More sophisticated: use Sentence-BERT
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode([
    "This is a sentence",
    "This is another sentence"
])
```

## Visualizing Embeddings

### Using t-SNE

```python
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt

# Get embeddings for some words
words = ["king", "queen", "man", "woman", "prince", "princess",
         "dog", "cat", "puppy", "kitten"]
vectors = [model.wv[w] for w in words]

# Reduce to 2D
tsne = TSNE(n_components=2, random_state=42)
vectors_2d = tsne.fit_transform(vectors)

# Plot
plt.figure(figsize=(10, 8))
for i, word in enumerate(words):
    plt.scatter(vectors_2d[i, 0], vectors_2d[i, 1])
    plt.annotate(word, (vectors_2d[i, 0], vectors_2d[i, 1]))
plt.title("Word Embeddings Visualization")
plt.show()
```

## Knowledge Check

1. What is the main advantage of word embeddings over one-hot encoding?
   - They capture semantic similarity between words in a dense, fixed-size vector
   - They use less memory
   - They are faster to compute
   - They work only for English

2. What does the Word2Vec Skip-gram model predict?
   - Context words given a target word
   - The target word given context words
   - The next word in a sequence
   - The part of speech of a word

3. What is the famous analogy that Word2Vec can solve?
   - king - man + woman = queen
   - cat + dog = pet
   - good + bad = neutral
   - fast + slow = medium

4. What is the key advantage of FastText over Word2Vec?
   - It can generate embeddings for out-of-vocabulary words using subword information
   - It trains faster
   - It uses less memory
   - It only works for English

5. What is the limitation of static word embeddings like Word2Vec?
   - They give the same vector for a word regardless of context
   - They are too slow
   - They can only handle 100 words
   - They require GPUs
