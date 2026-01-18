---
id: genai-prompt-engineering
title: Prompt Engineering Fundamentals
type: lesson
duration: 60 mins
order: 2
section: fundamentals
prevLessonId: genai-understanding-llms
nextLessonId: genai-rag-basics
---

# Prompt Engineering Fundamentals

Prompt engineering is the art and science of crafting inputs that get reliable, high-quality outputs from LLMs. Good prompts can dramatically improve results.

## Why Prompt Engineering Matters

The same question asked differently gets very different results:

```
❌ Bad: "Write about dogs"
→ Generic, unfocused content

✅ Good: "Write a 200-word blog post explaining why golden retrievers
         make excellent family pets, focusing on their temperament
         and trainability. Use a friendly, conversational tone."
→ Specific, useful content
```

## Core Prompting Principles

### 1. Be Specific and Clear

```python
# ❌ Vague
prompt = "Summarize this"

# ✅ Specific
prompt = """Summarize the following article in 3 bullet points.
Focus on the main argument, key evidence, and conclusion.

Article:
{article_text}
"""
```

### 2. Provide Context

```python
# ❌ No context
prompt = "Is this good code?"

# ✅ With context
prompt = """You are a senior Python developer reviewing code.
Evaluate the following function for:
1. Correctness
2. Performance
3. Readability
4. Error handling

Code:
```python
{code}
```

Provide specific suggestions for improvement.
"""
```

### 3. Specify the Output Format

```python
# ❌ Unstructured output
prompt = "Extract the entities from this text"

# ✅ Structured output
prompt = """Extract entities from the following text.
Return as JSON with this exact structure:
{
    "people": ["name1", "name2"],
    "organizations": ["org1", "org2"],
    "locations": ["loc1", "loc2"],
    "dates": ["date1", "date2"]
}

Text: {text}
"""
```

## Advanced Prompting Techniques

### Few-Shot Prompting

Provide examples to guide the model:

```python
prompt = """Classify the sentiment of customer reviews.

Examples:
Review: "This product exceeded my expectations! Amazing quality."
Sentiment: Positive

Review: "Terrible experience. Broke after one day."
Sentiment: Negative

Review: "It's okay, nothing special but does the job."
Sentiment: Neutral

Now classify this review:
Review: "{new_review}"
Sentiment:"""
```

### Chain of Thought (CoT)

Ask the model to reason step by step:

```python
# ❌ Direct answer (often wrong for complex problems)
prompt = "What is 23 * 47 + 156?"

# ✅ Chain of Thought
prompt = """Solve this step by step:
What is 23 * 47 + 156?

Think through each step:
1. First, calculate 23 * 47
2. Then add 156 to the result
3. State the final answer

Show your work:"""
```

### Role Prompting

Assign a persona to guide response style:

```python
prompt = """You are an experienced technical writer who specializes
in making complex topics accessible to beginners.

Explain how HTTPS encryption works to someone with no technical
background. Use analogies and avoid jargon.
"""
```

### System Prompts

Set persistent instructions for the conversation:

```python
messages = [
    {
        "role": "system",
        "content": """You are a helpful coding assistant.
        - Always include code examples
        - Explain your reasoning
        - Point out potential edge cases
        - Use Python unless another language is specified
        - Follow PEP 8 style guidelines"""
    },
    {
        "role": "user",
        "content": "How do I read a CSV file?"
    }
]
```

## Prompting Patterns

### The CREATE Framework

- **C**haracter: Who should the AI be?
- **R**equest: What do you want?
- **E**xamples: Show what you mean
- **A**djustments: Specify constraints
- **T**ype: What format?
- **E**xtras: Additional requirements

```python
prompt = """
CHARACTER: You are a senior data analyst at a tech company.

REQUEST: Analyze the following sales data and provide insights.

EXAMPLES:
Good insight: "Q3 revenue increased 23% YoY, driven primarily by
              the new enterprise tier which contributed $2.3M."
Bad insight: "Sales went up."

ADJUSTMENTS:
- Focus on trends and anomalies
- Compare to previous periods
- Be specific with numbers

TYPE: Return as a bulleted list of 5-7 key insights.

EXTRAS: Include one recommendation for each insight.

DATA:
{sales_data}
"""
```

### Prompt Chaining

Break complex tasks into steps:

```python
def analyze_document(document: str) -> dict:
    # Step 1: Extract key topics
    topics_prompt = f"""Extract the 5 main topics from this document.
    Return as a JSON array of strings.

    Document: {document}"""

    topics = call_llm(topics_prompt)

    # Step 2: Summarize each topic
    summaries = {}
    for topic in topics:
        summary_prompt = f"""Summarize what the document says about
        "{topic}" in 2-3 sentences.

        Document: {document}"""
        summaries[topic] = call_llm(summary_prompt)

    # Step 3: Generate overall summary
    final_prompt = f"""Based on these topic summaries, write a
    comprehensive executive summary in one paragraph.

    Topics and summaries: {summaries}"""

    executive_summary = call_llm(final_prompt)

    return {
        "topics": topics,
        "topic_summaries": summaries,
        "executive_summary": executive_summary
    }
```

## Handling Edge Cases

### Constraining Output

```python
prompt = """Classify this text into exactly ONE of these categories:
- Technology
- Business
- Health
- Entertainment
- Sports

Respond with ONLY the category name, nothing else.

Text: {text}

Category:"""
```

### Preventing Hallucinations

```python
prompt = """Answer the question based ONLY on the provided context.
If the context doesn't contain the answer, say "I don't have
information about that in the provided context."

Do NOT use any external knowledge.

Context:
{context}

Question: {question}

Answer:"""
```

### Handling Long Inputs

```python
def process_long_document(document: str, max_chunk_size: int = 3000):
    chunks = split_into_chunks(document, max_chunk_size)

    summaries = []
    for i, chunk in enumerate(chunks):
        prompt = f"""Summarize this section (part {i+1} of {len(chunks)}):

        {chunk}

        Summary:"""
        summaries.append(call_llm(prompt))

    # Combine summaries
    final_prompt = f"""Combine these section summaries into one
    coherent summary:

    {' '.join(summaries)}"""

    return call_llm(final_prompt)
```

## Prompt Templates

Create reusable templates:

```python
from string import Template

CLASSIFICATION_TEMPLATE = Template("""
Classify the following $item_type into one of these categories:
$categories

$item_type: $item

Return only the category name.
Category:""")

# Usage
prompt = CLASSIFICATION_TEMPLATE.substitute(
    item_type="email",
    categories="- Urgent\n- Normal\n- Spam",
    item="WINNER! Claim your prize now!"
)
```

## Testing and Iteration

```python
def test_prompt(prompt_template, test_cases):
    """Test a prompt against expected outputs."""
    results = []

    for test in test_cases:
        prompt = prompt_template.format(**test['input'])
        response = call_llm(prompt)

        results.append({
            'input': test['input'],
            'expected': test['expected'],
            'actual': response,
            'passed': test['expected'].lower() in response.lower()
        })

    accuracy = sum(r['passed'] for r in results) / len(results)
    print(f"Accuracy: {accuracy:.1%}")
    return results

# Example test cases
test_cases = [
    {'input': {'text': 'I love this!'}, 'expected': 'Positive'},
    {'input': {'text': 'Terrible product'}, 'expected': 'Negative'},
    {'input': {'text': 'It works fine'}, 'expected': 'Neutral'},
]
```

## Knowledge Check

1. What is few-shot prompting?
   - Providing examples in the prompt to guide the model's response
   - Using a small model
   - Making few API calls
   - Short prompts

2. Why is Chain of Thought prompting effective?
   - It helps the model reason through complex problems step by step
   - It makes responses shorter
   - It reduces API costs
   - It's faster

3. What is the purpose of a system prompt?
   - To set persistent instructions that apply to the entire conversation
   - To authenticate with the API
   - To limit token usage
   - To choose the model

4. How can you prevent LLM hallucinations?
   - Instruct to only use provided context and admit when info is missing
   - Use higher temperature
   - Make prompts shorter
   - Use older models

5. What is prompt chaining?
   - Breaking complex tasks into multiple sequential LLM calls
   - Connecting multiple prompts with commas
   - Using the same prompt repeatedly
   - Combining multiple models
