---
id: genai-understanding-llms
title: Understanding Large Language Models
type: lesson
duration: 50 mins
order: 1
section: fundamentals
nextLessonId: genai-prompt-engineering
---

# Understanding Large Language Models

Large Language Models (LLMs) are AI systems trained on vast amounts of text that can understand and generate human-like language. Understanding how they work helps you use them effectively.

## What is an LLM?

An LLM is a neural network trained to predict the next token (word/subword) in a sequence:

```
Input:  "The capital of France is"
Output: "Paris" (highest probability next token)
```

This simple objective, scaled massively, produces remarkable capabilities.

## Key LLM Concepts

### Tokens

LLMs don't see words—they see tokens (subword units):

```python
# "Hello world" might tokenize to:
["Hello", " world"]  # 2 tokens

# "Tokenization" might become:
["Token", "ization"]  # 2 tokens

# Rough rule: ~4 characters = 1 token
# "This is a test" ≈ 4 tokens
```

Tokens matter because:
- Context windows are measured in tokens
- Pricing is per token
- Some words use multiple tokens

### Context Window

The maximum tokens the model can process at once:

| Model | Context Window |
|-------|---------------|
| GPT-3.5 | 4K - 16K tokens |
| GPT-4 | 8K - 128K tokens |
| Claude 3 | 200K tokens |
| Llama 3 | 8K - 128K tokens |

### Temperature

Controls randomness in outputs:

```python
# Temperature = 0: Deterministic, always picks highest probability
# Temperature = 0.7: Balanced creativity
# Temperature = 1.0+: More random, creative

# Use low temperature for:
# - Factual questions
# - Code generation
# - Classification

# Use higher temperature for:
# - Creative writing
# - Brainstorming
# - Diverse outputs
```

## Major LLM Providers

### OpenAI (GPT)
```python
from openai import OpenAI

client = OpenAI(api_key="your-key")

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is machine learning?"}
    ],
    temperature=0.7
)

print(response.choices[0].message.content)
```

### Anthropic (Claude)
```python
from anthropic import Anthropic

client = Anthropic(api_key="your-key")

message = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "What is machine learning?"}
    ]
)

print(message.content[0].text)
```

### Open Source (Ollama/Local)
```python
import ollama

response = ollama.chat(
    model='llama3',
    messages=[
        {'role': 'user', 'content': 'What is machine learning?'}
    ]
)

print(response['message']['content'])
```

## LLM Capabilities

### What LLMs Do Well

1. **Text Generation**: Articles, emails, creative writing
2. **Summarization**: Condensing long documents
3. **Translation**: Between languages
4. **Code Generation**: Writing and explaining code
5. **Question Answering**: Based on provided context
6. **Classification**: Sentiment, categories, intent
7. **Extraction**: Pulling structured data from text
8. **Conversation**: Chat and dialogue

### What LLMs Struggle With

1. **Factual Accuracy**: Can hallucinate false information
2. **Math**: Complex calculations often wrong
3. **Real-time Information**: Knowledge cutoff dates
4. **Consistency**: May contradict itself
5. **Long-term Memory**: Only knows current conversation
6. **Logical Reasoning**: Complex multi-step logic

## Choosing the Right Model

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Simple tasks | GPT-3.5, Claude Haiku | Fast, cheap |
| Complex reasoning | GPT-4, Claude Opus | Higher capability |
| Code generation | GPT-4, Claude Sonnet | Strong coding |
| Long documents | Claude (200K context) | Largest context |
| Privacy-sensitive | Local models (Llama) | Data stays local |
| High volume | Fine-tuned smaller model | Cost efficient |

## Understanding Costs

LLM APIs charge per token:

```python
# GPT-4 pricing (example, check current rates)
# Input: $0.03 / 1K tokens
# Output: $0.06 / 1K tokens

# Example calculation:
input_tokens = 500
output_tokens = 200

cost = (input_tokens * 0.03 / 1000) + (output_tokens * 0.06 / 1000)
# cost = $0.015 + $0.012 = $0.027 per request

# At 10,000 requests/day = $270/day
```

### Cost Optimization Strategies

1. **Use smaller models** when possible
2. **Reduce prompt length** - be concise
3. **Cache common responses**
4. **Batch similar requests**
5. **Use fine-tuned smaller models** for specific tasks

## The LLM Application Stack

```
┌─────────────────────────────────────┐
│         Your Application            │
├─────────────────────────────────────┤
│    Prompt Templates & Logic         │
├─────────────────────────────────────┤
│   Framework (LangChain, etc.)       │
├─────────────────────────────────────┤
│    LLM API (OpenAI, Anthropic)      │
├─────────────────────────────────────┤
│         LLM Model                   │
└─────────────────────────────────────┘
```

## Practical Example: Simple Q&A

```python
from openai import OpenAI

client = OpenAI()

def ask_question(question: str, context: str = "") -> str:
    """Ask the LLM a question with optional context."""

    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Answer questions accurately and concisely."
        }
    ]

    if context:
        messages.append({
            "role": "user",
            "content": f"Context: {context}\n\nQuestion: {question}"
        })
    else:
        messages.append({
            "role": "user",
            "content": question
        })

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0.3,  # Lower for factual answers
        max_tokens=500
    )

    return response.choices[0].message.content

# Usage
answer = ask_question("What is Python?")
print(answer)

# With context
context = "Python was created by Guido van Rossum in 1991."
answer = ask_question("When was Python created?", context)
print(answer)
```

## Knowledge Check

1. What is a token in the context of LLMs?
   - A subword unit that LLMs process, roughly 4 characters
   - A security credential
   - A type of neural network layer
   - A programming variable

2. What does temperature control in LLM outputs?
   - The randomness/creativity of the response
   - The speed of generation
   - The accuracy of facts
   - The length of output

3. Why might an LLM "hallucinate" incorrect information?
   - LLMs predict likely text patterns, not verified facts
   - The temperature is too low
   - The model is too large
   - The API key is invalid

4. When should you use a smaller, cheaper model like GPT-3.5?
   - For simple tasks where quality difference is minimal
   - Never, always use the best model
   - Only for testing
   - When context is very long

5. What is a context window?
   - The maximum number of tokens the model can process at once
   - The user interface of the application
   - The training data size
   - The number of API calls allowed
