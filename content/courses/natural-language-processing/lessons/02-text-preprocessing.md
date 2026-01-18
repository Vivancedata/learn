---
id: nlp-text-preprocessing
title: Text Preprocessing
type: lesson
duration: 50 mins
order: 2
section: fundamentals
prevLessonId: nlp-intro-to-nlp
nextLessonId: nlp-word-embeddings
---

# Text Preprocessing

Raw text is messy. Before feeding text to any NLP model, you need to clean and normalize it. This lesson covers essential preprocessing techniques that form the foundation of any NLP pipeline.

## Why Preprocess Text?

Raw text contains noise that can hurt model performance:

```python
raw_texts = [
    "<html>Check out this AMAZING deal!!! 🔥🔥🔥</html>",
    "I looooove this product!!!",
    "Visit us at https://example.com for more info...",
    "Contact: john@email.com or call 555-1234",
]
```

Each text has issues: HTML tags, excessive punctuation, URLs, emails, phone numbers, emojis, repeated characters.

## The Preprocessing Pipeline

```
Raw Text
    ↓
1. Noise Removal (HTML, special chars)
    ↓
2. Case Normalization
    ↓
3. Tokenization
    ↓
4. Stop Word Removal
    ↓
5. Stemming / Lemmatization
    ↓
Clean Tokens
```

## Noise Removal

### Removing HTML Tags

```python
import re
from bs4 import BeautifulSoup

def remove_html(text):
    # Using BeautifulSoup
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text()

    # Or using regex
    # return re.sub(r'<[^>]+>', '', text)

text = "<p>Hello <b>World</b>!</p>"
clean = remove_html(text)
# Output: "Hello World!"
```

### Removing URLs

```python
def remove_urls(text):
    url_pattern = r'https?://\S+|www\.\S+'
    return re.sub(url_pattern, '', text)

text = "Check this out https://example.com it's great!"
clean = remove_urls(text)
# Output: "Check this out  it's great!"
```

### Removing Emails and Phone Numbers

```python
def remove_emails(text):
    email_pattern = r'\S+@\S+\.\S+'
    return re.sub(email_pattern, '', text)

def remove_phone_numbers(text):
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    return re.sub(phone_pattern, '', text)
```

### Removing Emojis

```python
def remove_emojis(text):
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    return emoji_pattern.sub('', text)
```

### Comprehensive Cleaning Function

```python
import unicodedata

def clean_text(text):
    # Convert to lowercase
    text = text.lower()

    # Remove HTML
    text = BeautifulSoup(text, "html.parser").get_text()

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)

    # Remove emails
    text = re.sub(r'\S+@\S+\.\S+', '', text)

    # Normalize unicode (é → e)
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('utf-8')

    # Remove extra whitespace
    text = ' '.join(text.split())

    return text

raw = "<p>Visit https://site.com for AMAZING deals! 🔥</p>"
print(clean_text(raw))
# Output: "visit  for amazing deals!"
```

## Tokenization

Tokenization splits text into individual units (tokens).

### Word Tokenization

```python
# Simple split (limited)
text = "Hello, how are you?"
tokens = text.split()
# ['Hello,', 'how', 'are', 'you?']  # punctuation attached!

# NLTK tokenization
from nltk.tokenize import word_tokenize
tokens = word_tokenize(text)
# ['Hello', ',', 'how', 'are', 'you', '?']

# spaCy tokenization
import spacy
nlp = spacy.load("en_core_web_sm")
doc = nlp(text)
tokens = [token.text for token in doc]
# ['Hello', ',', 'how', 'are', 'you', '?']
```

### Sentence Tokenization

```python
from nltk.tokenize import sent_tokenize

text = "Hello world. How are you? I'm fine, thanks!"
sentences = sent_tokenize(text)
# ['Hello world.', 'How are you?', "I'm fine, thanks!"]
```

### Subword Tokenization (Modern NLP)

Modern transformers use subword tokenization:

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
text = "unbelievable"
tokens = tokenizer.tokenize(text)
# ['un', '##believ', '##able']

# Handles out-of-vocabulary words
tokens = tokenizer.tokenize("transformerization")
# ['transform', '##eri', '##zation']
```

## Stop Word Removal

Stop words are common words (the, is, at) that often don't carry meaning.

```python
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

stop_words = set(stopwords.words('english'))

text = "This is a sample sentence showing stop word removal"
tokens = word_tokenize(text.lower())

filtered = [w for w in tokens if w not in stop_words]
# ['sample', 'sentence', 'showing', 'stop', 'word', 'removal']
```

### When NOT to Remove Stop Words

- **Sentiment Analysis**: "not good" vs "good"
- **Question Answering**: "What is..." needs "what"
- **Phrase Detection**: "The White House"
- **Language Models**: Need complete sentences

```python
# Custom stop word handling
def remove_stopwords(tokens, keep_negations=True):
    stop_words = set(stopwords.words('english'))

    if keep_negations:
        negations = {'not', 'no', 'never', "n't", 'neither', 'nor'}
        stop_words = stop_words - negations

    return [t for t in tokens if t not in stop_words]
```

## Stemming

Stemming reduces words to their root form by chopping off suffixes.

```python
from nltk.stem import PorterStemmer, SnowballStemmer

porter = PorterStemmer()
snowball = SnowballStemmer('english')

words = ['running', 'runs', 'runner', 'ran']

porter_stems = [porter.stem(w) for w in words]
# ['run', 'run', 'runner', 'ran']  # Not perfect!

snowball_stems = [snowball.stem(w) for w in words]
# ['run', 'run', 'runner', 'ran']
```

### Limitations of Stemming

- **Over-stemming**: "university" → "univers", "universe" → "univers"
- **Under-stemming**: "ran" doesn't become "run"
- **Non-words**: Results aren't always valid words

## Lemmatization

Lemmatization uses vocabulary and morphology to return dictionary form.

```python
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet

lemmatizer = WordNetLemmatizer()

# Need POS tag for best results
print(lemmatizer.lemmatize("running", pos=wordnet.VERB))  # "run"
print(lemmatizer.lemmatize("better", pos=wordnet.ADJ))    # "good"
print(lemmatizer.lemmatize("ran", pos=wordnet.VERB))      # "run"
```

### spaCy Lemmatization (Recommended)

```python
import spacy
nlp = spacy.load("en_core_web_sm")

doc = nlp("The cats were running quickly through the gardens")
lemmas = [token.lemma_ for token in doc]
# ['the', 'cat', 'be', 'run', 'quickly', 'through', 'the', 'garden']
```

## Stemming vs Lemmatization

| Aspect | Stemming | Lemmatization |
|--------|----------|---------------|
| Speed | Fast | Slower |
| Accuracy | Lower | Higher |
| Output | May not be real words | Always real words |
| Context | Ignores | Uses POS |
| Use Case | Search, simple tasks | NLP models, analysis |

## Putting It All Together

```python
import re
import spacy
from bs4 import BeautifulSoup

nlp = spacy.load("en_core_web_sm")

def preprocess_text(text,
                    remove_stopwords=True,
                    lemmatize=True,
                    lowercase=True):
    """Complete preprocessing pipeline."""

    # 1. Remove HTML
    text = BeautifulSoup(text, "html.parser").get_text()

    # 2. Remove URLs
    text = re.sub(r'https?://\S+', '', text)

    # 3. Remove special characters (keep letters and numbers)
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)

    # 4. Lowercase
    if lowercase:
        text = text.lower()

    # 5. Process with spaCy
    doc = nlp(text)

    # 6. Get tokens, optionally lemmatize and remove stopwords
    tokens = []
    for token in doc:
        if remove_stopwords and token.is_stop:
            continue
        if token.is_punct or token.is_space:
            continue

        if lemmatize:
            tokens.append(token.lemma_)
        else:
            tokens.append(token.text)

    return tokens

# Example usage
raw = """
<p>The cats were RUNNING through the gardens yesterday!
Check https://example.com for more info.</p>
"""

tokens = preprocess_text(raw)
print(tokens)
# ['cat', 'run', 'garden', 'yesterday', 'check', 'info']
```

## Best Practices

### 1. Preserve What Matters
```python
# For sentiment, keep negations
text = "This is not good at all"
# Don't remove "not"!

# For named entities, preserve case
text = "Apple announced new products"
# Lowercase might confuse Apple (company) with apple (fruit)
```

### 2. Handle Contractions
```python
import contractions

text = "I can't believe you're here"
expanded = contractions.fix(text)
# "I cannot believe you are here"
```

### 3. Normalize Numbers
```python
def normalize_numbers(text):
    # Replace numbers with placeholder
    return re.sub(r'\d+', '<NUM>', text)

# Or convert to words
from num2words import num2words
num2words(42)  # "forty-two"
```

### 4. Handle Repeated Characters
```python
def reduce_repeated_chars(text, max_repeat=2):
    return re.sub(r'(.)\1{2,}', r'\1' * max_repeat, text)

reduce_repeated_chars("sooooo gooood!!!")
# "soo good!!"
```

## Knowledge Check

1. Why is text preprocessing important?
   - Raw text contains noise that can hurt model performance
   - It makes text longer
   - It adds more information to the text
   - It's only needed for non-English text

2. What is the difference between stemming and lemmatization?
   - Lemmatization uses vocabulary to return valid dictionary words; stemming just chops suffixes
   - They are exactly the same
   - Stemming is more accurate
   - Lemmatization is faster

3. When should you NOT remove stop words?
   - When negations are important for sentiment analysis
   - When text is too long
   - When using neural networks
   - Stop words should always be removed

4. What is subword tokenization?
   - Breaking words into smaller meaningful units to handle unknown words
   - Tokenizing at the sentence level
   - Removing short words
   - Only keeping common words

5. Which preprocessing step would you use to convert "running" to "run"?
   - Lemmatization or stemming
   - Stop word removal
   - HTML removal
   - URL removal
