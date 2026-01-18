---
id: nlp-bert-gpt
title: BERT, GPT, and Language Models
type: lesson
duration: 55 mins
order: 6
section: language-models
prevLessonId: nlp-transformers
---

# BERT, GPT, and Language Models

Pre-trained language models have transformed NLP. This lesson covers the major architectures (BERT, GPT) and how to use them for various tasks.

## The Pre-training Revolution

### Traditional ML Pipeline
```
Task-Specific Data → Train From Scratch → Model
```

### Transfer Learning Pipeline
```
Massive Unlabeled Data → Pre-train → Fine-tune on Task → Model
```

Pre-training on massive corpora captures language understanding, then fine-tuning adapts to specific tasks with minimal data.

## BERT: Bidirectional Encoder Representations

BERT (2018) uses the encoder part of transformers with bidirectional context.

### Pre-training Objectives

**1. Masked Language Modeling (MLM)**
```
Input:  "The cat [MASK] on the mat"
Predict: "sat"
```

```python
from transformers import pipeline

fill_mask = pipeline("fill-mask", model="bert-base-uncased")
result = fill_mask("The capital of France is [MASK].")
# [{'token_str': 'paris', 'score': 0.95}, ...]
```

**2. Next Sentence Prediction (NSP)**
```
Sentence A: "The cat sat on the mat."
Sentence B: "It was very comfortable."
Label: IsNext (1) or NotNext (0)
```

### BERT Architecture

```
[CLS] Token1 Token2 ... TokenN [SEP]
  ↓     ↓     ↓    ...   ↓     ↓
  ╔═══════════════════════════╗
  ║    Transformer Encoder    ║
  ║      (12 layers)          ║
  ╚═══════════════════════════╝
  ↓     ↓     ↓    ...   ↓     ↓
 h[CLS] h1    h2   ...  hN  h[SEP]
```

- **[CLS]**: Special token for classification tasks
- **[SEP]**: Separates sentences
- **Hidden size**: 768 (base) or 1024 (large)
- **Layers**: 12 (base) or 24 (large)

### Fine-tuning BERT

```python
from transformers import BertForSequenceClassification, BertTokenizer
from transformers import Trainer, TrainingArguments
import torch

# Load pre-trained model
model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=2
)
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

# Prepare data
texts = ["I love this!", "This is terrible"]
labels = [1, 0]

inputs = tokenizer(
    texts,
    padding=True,
    truncation=True,
    return_tensors="pt"
)
inputs["labels"] = torch.tensor(labels)

# Training
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=8,
    learning_rate=2e-5,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=inputs,
)
trainer.train()
```

### BERT Variants

| Model | Size | Use Case |
|-------|------|----------|
| BERT-base | 110M params | General purpose |
| BERT-large | 340M params | Higher accuracy |
| DistilBERT | 66M params | Faster, 97% of BERT accuracy |
| RoBERTa | 125M params | Better pre-training |
| ALBERT | 12M params | Parameter-efficient |

## GPT: Generative Pre-trained Transformer

GPT uses the decoder part of transformers for text generation.

### Pre-training Objective

**Causal Language Modeling**: Predict the next token.

```
Input:  "The cat sat on the"
Predict: "mat"
```

```python
from transformers import pipeline

generator = pipeline("text-generation", model="gpt2")
result = generator(
    "The future of artificial intelligence is",
    max_length=50,
    num_return_sequences=1
)
print(result[0]["generated_text"])
```

### GPT Architecture

```
Token1 Token2 ... TokenN
  ↓     ↓    ...   ↓
  ╔═══════════════════╗
  ║ Transformer Decoder║
  ║ (Causal Attention) ║
  ╚═══════════════════╝
  ↓     ↓    ...   ↓
Pred2 Pred3  ... PredN+1
```

Causal mask ensures each position only attends to previous positions.

### GPT Versions

| Model | Parameters | Training Data |
|-------|------------|---------------|
| GPT-1 | 117M | BookCorpus |
| GPT-2 | 1.5B | WebText (40GB) |
| GPT-3 | 175B | Common Crawl + books |
| GPT-4 | ~1T (est.) | Massive diverse data |

### Generating Text with GPT-2

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

model = GPT2LMHeadModel.from_pretrained("gpt2")
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

prompt = "Machine learning is"
inputs = tokenizer(prompt, return_tensors="pt")

# Generate
outputs = model.generate(
    inputs.input_ids,
    max_length=100,
    num_return_sequences=1,
    temperature=0.7,
    top_p=0.9,
    do_sample=True
)

generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated)
```

### Generation Parameters

```python
# Greedy (deterministic)
outputs = model.generate(max_length=50)

# Sampling with temperature
outputs = model.generate(
    max_length=50,
    do_sample=True,
    temperature=0.7  # Lower = more focused, Higher = more random
)

# Top-k sampling
outputs = model.generate(
    max_length=50,
    do_sample=True,
    top_k=50  # Only sample from top 50 tokens
)

# Top-p (nucleus) sampling
outputs = model.generate(
    max_length=50,
    do_sample=True,
    top_p=0.9  # Sample from smallest set with cumulative prob > 0.9
)
```

## T5: Text-to-Text Transfer Transformer

T5 frames all tasks as text-to-text:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer

model = T5ForConditionalGeneration.from_pretrained("t5-base")
tokenizer = T5Tokenizer.from_pretrained("t5-base")

# Translation
input_text = "translate English to French: Hello, how are you?"
inputs = tokenizer(input_text, return_tensors="pt")
outputs = model.generate(**inputs)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
# "Bonjour, comment allez-vous?"

# Summarization
input_text = "summarize: [Long article text here...]"

# Question Answering
input_text = "question: What is the capital? context: France is a country. Paris is its capital."
```

## Choosing the Right Model

| Task | Best Model Type |
|------|-----------------|
| Classification | BERT, RoBERTa, DistilBERT |
| Named Entity Recognition | BERT, SpanBERT |
| Question Answering | BERT, RoBERTa, ALBERT |
| Text Generation | GPT-2, GPT-3, LLaMA |
| Summarization | T5, BART, Pegasus |
| Translation | T5, mBART, MarianMT |
| General Understanding | BERT variants |
| Conversational AI | GPT, LLaMA, Mistral |

## Practical Example: Custom Classifier

```python
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    TrainingArguments,
    Trainer
)
from datasets import load_dataset
import numpy as np
from sklearn.metrics import accuracy_score

# Load dataset
dataset = load_dataset("imdb")

# Load model
model_name = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=2
)

# Tokenize
def tokenize(batch):
    return tokenizer(batch["text"], padding=True, truncation=True, max_length=256)

tokenized = dataset.map(tokenize, batched=True)

# Training
training_args = TrainingArguments(
    output_dir="./sentiment-model",
    evaluation_strategy="epoch",
    save_strategy="epoch",
    num_train_epochs=2,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    learning_rate=2e-5,
    weight_decay=0.01,
    load_best_model_at_end=True,
)

def compute_metrics(pred):
    labels = pred.label_ids
    preds = np.argmax(pred.predictions, axis=1)
    return {"accuracy": accuracy_score(labels, preds)}

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["test"],
    compute_metrics=compute_metrics,
)

trainer.train()

# Save model
trainer.save_model("./my-sentiment-model")
tokenizer.save_pretrained("./my-sentiment-model")
```

## Knowledge Check

1. What is the main pre-training objective of BERT?
   - Masked Language Modeling (predicting masked tokens)
   - Generating the next token
   - Translating between languages
   - Summarizing documents

2. How does GPT differ from BERT in terms of attention?
   - GPT uses causal (unidirectional) attention; BERT uses bidirectional attention
   - They use the same attention mechanism
   - GPT doesn't use attention
   - BERT uses causal attention

3. What is the purpose of the [CLS] token in BERT?
   - To provide a representation for classification tasks
   - To mark the end of a sentence
   - To separate two sentences
   - To mask tokens during training

4. Which parameter controls randomness in text generation?
   - Temperature
   - Learning rate
   - Batch size
   - Number of layers

5. When would you choose GPT over BERT?
   - For text generation tasks like completing prompts or writing content
   - For classification tasks
   - For named entity recognition
   - For extractive question answering
