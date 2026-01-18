---
id: nlp-transformers
title: Transformers and Attention
type: lesson
duration: 60 mins
order: 5
section: deep-learning
prevLessonId: nlp-text-classification
nextLessonId: nlp-bert-gpt
---

# Transformers and Attention

The Transformer architecture, introduced in "Attention Is All You Need" (2017), revolutionized NLP. It's the foundation of BERT, GPT, and all modern large language models.

## Why Transformers?

### Limitations of RNNs/LSTMs

RNNs process sequences sequentially:

```
Input:  [The] → [cat] → [sat] → [on] → [the] → [mat]
              ↓      ↓      ↓     ↓      ↓      ↓
Processing:   h1  →  h2  →  h3 →  h4  →  h5  →  h6
```

**Problems:**
1. **Sequential**: Can't parallelize, slow training
2. **Long-range dependencies**: Information degrades over distance
3. **Vanishing gradients**: Hard to learn from distant tokens

### Transformer Solution

Process all tokens simultaneously using attention:

```
Input:    [The]  [cat]  [sat]  [on]  [the]  [mat]
              ↓      ↓      ↓     ↓      ↓      ↓
Attention: Every token attends to every other token
              ↓      ↓      ↓     ↓      ↓      ↓
Output:   [h1]   [h2]   [h3]  [h4]  [h5]   [h6]
```

**Advantages:**
1. **Parallelizable**: All positions computed simultaneously
2. **Direct connections**: Any token can attend to any other
3. **Scalable**: Powers models with billions of parameters

## The Attention Mechanism

### Intuition

Attention answers: "Which other words should I focus on when processing this word?"

```
"The animal didn't cross the street because it was too tired"

When processing "it":
  - High attention to "animal" (what "it" refers to)
  - Lower attention to "street" (not what "it" refers to)
```

### Self-Attention Step by Step

Given input embeddings, compute three vectors for each token:
- **Query (Q)**: "What am I looking for?"
- **Key (K)**: "What do I contain?"
- **Value (V)**: "What information do I provide?"

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SelfAttention(nn.Module):
    def __init__(self, embed_dim):
        super().__init__()
        self.query = nn.Linear(embed_dim, embed_dim)
        self.key = nn.Linear(embed_dim, embed_dim)
        self.value = nn.Linear(embed_dim, embed_dim)
        self.scale = embed_dim ** 0.5

    def forward(self, x):
        # x: (batch, seq_len, embed_dim)
        Q = self.query(x)
        K = self.key(x)
        V = self.value(x)

        # Attention scores: (batch, seq_len, seq_len)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale

        # Softmax to get attention weights
        attention = F.softmax(scores, dim=-1)

        # Weighted sum of values
        output = torch.matmul(attention, V)

        return output, attention
```

### The Attention Formula

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

```python
def attention(Q, K, V, mask=None):
    d_k = K.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / (d_k ** 0.5)

    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)

    attention_weights = F.softmax(scores, dim=-1)
    return torch.matmul(attention_weights, V), attention_weights
```

## Multi-Head Attention

Single attention has limited expressiveness. Multi-head attention runs multiple attention operations in parallel:

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, embed_dim, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        self.q_linear = nn.Linear(embed_dim, embed_dim)
        self.k_linear = nn.Linear(embed_dim, embed_dim)
        self.v_linear = nn.Linear(embed_dim, embed_dim)
        self.out_linear = nn.Linear(embed_dim, embed_dim)

    def forward(self, x, mask=None):
        batch_size, seq_len, embed_dim = x.shape

        # Linear projections
        Q = self.q_linear(x)
        K = self.k_linear(x)
        V = self.v_linear(x)

        # Reshape to (batch, num_heads, seq_len, head_dim)
        Q = Q.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)

        # Attention for each head
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.head_dim ** 0.5)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attention = F.softmax(scores, dim=-1)
        context = torch.matmul(attention, V)

        # Concatenate heads
        context = context.transpose(1, 2).contiguous().view(
            batch_size, seq_len, embed_dim
        )

        return self.out_linear(context)
```

Each head can learn different types of relationships:
- Head 1: Subject-verb agreement
- Head 2: Coreference (pronouns)
- Head 3: Positional patterns
- etc.

## Positional Encoding

Attention is position-agnostic. We need to inject position information:

```python
class PositionalEncoding(nn.Module):
    def __init__(self, embed_dim, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, embed_dim)
        position = torch.arange(0, max_len).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, embed_dim, 2) * -(torch.log(torch.tensor(10000.0)) / embed_dim)
        )

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)

        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        # x: (batch, seq_len, embed_dim)
        return x + self.pe[:, :x.size(1)]
```

The sinusoidal pattern allows the model to learn relative positions.

## The Transformer Block

A complete transformer layer:

```python
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, num_heads, ff_dim, dropout=0.1):
        super().__init__()
        self.attention = MultiHeadAttention(embed_dim, num_heads)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.feed_forward = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Linear(ff_dim, embed_dim)
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # Multi-head attention + residual connection
        attended = self.attention(x, mask)
        x = self.norm1(x + self.dropout(attended))

        # Feed-forward + residual connection
        ff_output = self.feed_forward(x)
        x = self.norm2(x + self.dropout(ff_output))

        return x
```

## Full Transformer Architecture

```python
class Transformer(nn.Module):
    def __init__(
        self,
        vocab_size,
        embed_dim=512,
        num_heads=8,
        num_layers=6,
        ff_dim=2048,
        max_len=512,
        num_classes=2
    ):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.pos_encoding = PositionalEncoding(embed_dim, max_len)

        self.layers = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, ff_dim)
            for _ in range(num_layers)
        ])

        self.classifier = nn.Linear(embed_dim, num_classes)

    def forward(self, x, mask=None):
        # Embed and add positional encoding
        x = self.embedding(x)
        x = self.pos_encoding(x)

        # Pass through transformer layers
        for layer in self.layers:
            x = layer(x, mask)

        # Classification: use [CLS] token or mean pooling
        pooled = x.mean(dim=1)  # Simple mean pooling
        return self.classifier(pooled)
```

## Encoder vs Decoder

### Encoder (BERT-style)
- Bidirectional attention (sees all tokens)
- Used for understanding tasks (classification, NER)

### Decoder (GPT-style)
- Causal attention (only sees previous tokens)
- Used for generation tasks (text completion)

```python
# Causal mask for decoder
def create_causal_mask(seq_len):
    mask = torch.triu(torch.ones(seq_len, seq_len), diagonal=1)
    return mask == 0  # True where attention is allowed
```

## Using Pre-trained Transformers

```python
from transformers import AutoModel, AutoTokenizer

# Load pre-trained model
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModel.from_pretrained("bert-base-uncased")

# Encode text
inputs = tokenizer(
    "Transformers are amazing!",
    return_tensors="pt",
    padding=True,
    truncation=True
)

# Get embeddings
with torch.no_grad():
    outputs = model(**inputs)
    last_hidden = outputs.last_hidden_state  # (1, seq_len, 768)
    pooled = outputs.pooler_output  # (1, 768) [CLS] representation
```

## Attention Visualization

```python
from bertviz import head_view
from transformers import BertModel, BertTokenizer

model = BertModel.from_pretrained('bert-base-uncased', output_attentions=True)
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

inputs = tokenizer("The cat sat on the mat", return_tensors="pt")
outputs = model(**inputs)

attention = outputs.attentions  # Tuple of attention weights per layer
# attention[layer]: (batch, heads, seq_len, seq_len)
```

## Knowledge Check

1. What problem with RNNs does the Transformer solve?
   - Sequential processing that prevents parallelization and long-range dependencies
   - RNNs use too much memory
   - RNNs can only process text
   - RNNs require pre-trained embeddings

2. What are the three vectors computed in self-attention?
   - Query, Key, and Value
   - Input, Output, and Hidden
   - Encoder, Decoder, and Attention
   - Forward, Backward, and Bidirectional

3. Why do we use multi-head attention instead of single attention?
   - Each head can learn different types of relationships in the data
   - It's faster to compute
   - It uses less memory
   - It only works for long sequences

4. Why is positional encoding needed in Transformers?
   - Attention is position-agnostic; we need to inject position information
   - To make the model faster
   - To reduce memory usage
   - Positional encoding is optional

5. What is the difference between encoder and decoder attention?
   - Encoder uses bidirectional attention; decoder uses causal (unidirectional) attention
   - Encoder is for small models; decoder is for large models
   - They are exactly the same
   - Encoder generates text; decoder classifies text
