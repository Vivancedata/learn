---
id: genai-rag-basics
title: Retrieval Augmented Generation (RAG)
type: lesson
duration: 60 mins
order: 3
section: rag
prevLessonId: genai-prompt-engineering
nextLessonId: genai-project
---

# Retrieval Augmented Generation (RAG)

RAG combines LLMs with external knowledge bases, allowing you to build AI systems that answer questions about your own data—without fine-tuning.

## Why RAG?

LLMs have limitations:
- **Knowledge cutoff**: Don't know recent information
- **No access to private data**: Can't query your documents
- **Hallucinations**: May invent plausible-sounding answers

RAG solves these by retrieving relevant context before generating answers.

## How RAG Works

```
┌─────────────────────────────────────────────────────────────┐
│                         RAG Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. INDEXING (One-time setup)                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐        │
│  │Documents │ → │  Chunk   │ → │ Generate         │        │
│  │          │   │  Text    │   │ Embeddings       │        │
│  └──────────┘   └──────────┘   └────────┬─────────┘        │
│                                          ↓                   │
│                                 ┌──────────────────┐        │
│                                 │ Vector Database  │        │
│                                 └──────────────────┘        │
│                                          ↑                   │
│  2. QUERY (Every question)              │                   │
│  ┌──────────┐   ┌──────────┐   ┌────────┴─────────┐        │
│  │  User    │ → │ Embed    │ → │ Semantic         │        │
│  │ Question │   │ Question │   │ Search           │        │
│  └──────────┘   └──────────┘   └────────┬─────────┘        │
│                                          ↓                   │
│                                 ┌──────────────────┐        │
│                                 │ Retrieved Chunks │        │
│                                 └────────┬─────────┘        │
│                                          ↓                   │
│  3. GENERATE                    ┌──────────────────┐        │
│  ┌──────────────────────────────┤ LLM with Context │        │
│  │ Question + Retrieved Context │                  │        │
│  └──────────────────────────────┴────────┬─────────┘        │
│                                          ↓                   │
│                                 ┌──────────────────┐        │
│                                 │     Answer       │        │
│                                 └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Embeddings

Embeddings convert text into numerical vectors that capture semantic meaning:

```python
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# Similar texts have similar embeddings
embed1 = get_embedding("How do I reset my password?")
embed2 = get_embedding("I forgot my login credentials")
embed3 = get_embedding("What's the weather today?")

# embed1 and embed2 will be more similar than embed1 and embed3
```

### Vector Similarity

```python
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Find most similar documents
similarities = [cosine_similarity(query_embedding, doc_embedding)
                for doc_embedding in document_embeddings]
top_indices = np.argsort(similarities)[-5:][::-1]  # Top 5
```

### Chunking

Split documents into smaller pieces:

```python
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    """Split text into overlapping chunks."""
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap  # Overlap for context

    return chunks
```

## Building a Simple RAG System

### Step 1: Index Documents

```python
from openai import OpenAI
import chromadb

client = OpenAI()
chroma = chromadb.Client()
collection = chroma.create_collection("my_documents")

def index_documents(documents: list[dict]):
    """Index documents into vector database."""
    for doc in documents:
        # Chunk the document
        chunks = chunk_text(doc['content'])

        for i, chunk in enumerate(chunks):
            # Generate embedding
            embedding = get_embedding(chunk)

            # Store in vector DB
            collection.add(
                ids=[f"{doc['id']}_chunk_{i}"],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[{"source": doc['source'], "chunk": i}]
            )

# Index your documents
documents = [
    {"id": "1", "source": "manual.pdf", "content": "..."},
    {"id": "2", "source": "faq.md", "content": "..."},
]
index_documents(documents)
```

### Step 2: Retrieve Relevant Context

```python
def retrieve(query: str, n_results: int = 5) -> list[str]:
    """Retrieve relevant chunks for a query."""
    query_embedding = get_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results['documents'][0]
```

### Step 3: Generate Answer

```python
def rag_query(question: str) -> str:
    """Answer a question using RAG."""
    # Retrieve relevant context
    contexts = retrieve(question, n_results=5)
    context_text = "\n\n".join(contexts)

    # Generate answer with context
    prompt = f"""Answer the question based on the provided context.
If the context doesn't contain relevant information, say so.

Context:
{context_text}

Question: {question}

Answer:"""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    return response.choices[0].message.content

# Usage
answer = rag_query("How do I reset my password?")
print(answer)
```

## Using LangChain for RAG

LangChain simplifies RAG implementation:

```python
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

# Load documents
loader = PyPDFLoader("manual.pdf")
documents = loader.load()

# Split into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = splitter.split_documents(documents)

# Create vector store
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(chunks, embeddings)

# Create QA chain
llm = ChatOpenAI(model="gpt-4", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    return_source_documents=True
)

# Query
result = qa_chain({"query": "How do I reset my password?"})
print(result["result"])
print("Sources:", result["source_documents"])
```

## RAG Best Practices

### 1. Optimal Chunk Size

```python
# Too small: loses context
# Too large: dilutes relevance

# Good defaults:
# - 500-1000 characters for precise retrieval
# - 1000-2000 for more context
# - Overlap of 10-20%
```

### 2. Hybrid Search

Combine semantic and keyword search:

```python
def hybrid_search(query: str, documents: list):
    # Semantic search (embeddings)
    semantic_results = semantic_search(query)

    # Keyword search (BM25)
    keyword_results = bm25_search(query, documents)

    # Combine with reciprocal rank fusion
    combined = reciprocal_rank_fusion(semantic_results, keyword_results)
    return combined
```

### 3. Reranking

Rerank retrieved results for better relevance:

```python
def rerank_results(query: str, documents: list) -> list:
    """Use a cross-encoder to rerank results."""
    from sentence_transformers import CrossEncoder

    model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

    # Score each document
    pairs = [[query, doc] for doc in documents]
    scores = model.predict(pairs)

    # Sort by score
    ranked = sorted(zip(documents, scores),
                   key=lambda x: x[1], reverse=True)
    return [doc for doc, score in ranked]
```

### 4. Query Transformation

Improve retrieval with query expansion:

```python
def expand_query(original_query: str) -> list[str]:
    """Generate alternative phrasings of the query."""
    prompt = f"""Generate 3 alternative ways to ask this question:
    "{original_query}"

    Return as a JSON array of strings."""

    response = call_llm(prompt)
    alternatives = json.loads(response)

    return [original_query] + alternatives
```

## Evaluation

Measure RAG system quality:

```python
def evaluate_rag(test_cases: list[dict]) -> dict:
    """Evaluate RAG system on test cases."""
    results = {
        "retrieval_precision": [],
        "answer_relevance": [],
        "faithfulness": []
    }

    for case in test_cases:
        question = case["question"]
        expected_sources = case["relevant_sources"]
        expected_answer = case["expected_answer"]

        # Get RAG response
        retrieved = retrieve(question)
        answer = rag_query(question)

        # Evaluate retrieval
        retrieved_sources = [r["source"] for r in retrieved]
        precision = len(set(retrieved_sources) & set(expected_sources)) \
                   / len(retrieved_sources)
        results["retrieval_precision"].append(precision)

        # Evaluate answer (using LLM as judge)
        relevance = evaluate_relevance(question, answer)
        results["answer_relevance"].append(relevance)

    return {k: np.mean(v) for k, v in results.items()}
```

## Knowledge Check

1. What is the main purpose of RAG?
   - To allow LLMs to answer questions using external/private data
   - To make LLMs faster
   - To reduce API costs
   - To train new models

2. What are embeddings in the context of RAG?
   - Numerical vectors that capture semantic meaning of text
   - Database tables
   - API keys
   - Model weights

3. Why do we chunk documents in RAG?
   - To fit within context limits and improve retrieval precision
   - To make storage cheaper
   - To speed up the LLM
   - To encrypt the data

4. What is the role of the vector database in RAG?
   - To store embeddings and enable fast similarity search
   - To train the LLM
   - To generate text
   - To translate languages

5. How does hybrid search improve RAG?
   - By combining semantic (embedding) search with keyword search
   - By using multiple LLMs
   - By increasing chunk size
   - By reducing the number of documents
