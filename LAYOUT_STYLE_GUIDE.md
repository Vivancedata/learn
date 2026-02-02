# VivanceData Layout Style Guide

A comprehensive guide for content contributors creating lessons, projects, and quizzes for the VivanceData Learning Platform.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Lesson Structure](#lesson-structure)
3. [Markdown Standards](#markdown-standards)
4. [Writing Style](#writing-style)
5. [Code Examples](#code-examples)
6. [Images and Media](#images-and-media)
7. [Knowledge Check Guidelines](#knowledge-check-guidelines)
8. [Example Lesson Template](#example-lesson-template)

---

## Introduction

### Purpose

This guide establishes consistent standards for all educational content on the VivanceData Learning Platform. Following these guidelines ensures learners have a predictable, high-quality experience across every course and lesson.

### Who Should Read This

- **Course authors** creating new lessons
- **Content reviewers** evaluating submissions
- **Maintainers** updating existing content
- **Community contributors** proposing improvements

### Content Location

All lesson content lives in markdown files organized by course:

```
content/
  courses/
    [course-id]/
      lessons/
        01-lesson-slug.md
        02-lesson-slug.md
        ...
    [course-id].md           # Course overview
  paths/
    [path-id].md             # Learning path overview
```

**Naming conventions:**
- Use lowercase with hyphens for slugs: `pandas-fundamentals.md`
- Prefix lesson files with order number: `01-what-is-ai.md`, `02-ai-history.md`
- Match the `id` field in frontmatter to the filename (without the number prefix)

---

## Lesson Structure

Every lesson follows a consistent structure with required sections in a specific order. This predictability helps learners know what to expect and where to find information.

### 1. Frontmatter (Required)

YAML frontmatter defines lesson metadata. Place it at the very top of the file between triple dashes.

```yaml
---
id: lesson-slug
title: Lesson Title - Descriptive Subtitle
type: lesson
duration: 45 mins
order: 1
section: section-slug
prevLessonId: previous-lesson-slug
nextLessonId: next-lesson-slug
---
```

**Field definitions:**

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier matching filename (without number prefix) |
| `title` | Yes | Full lesson title, may include subtitle after hyphen |
| `type` | Yes | One of: `lesson`, `project`, `quiz` |
| `duration` | Yes | Estimated completion time (e.g., `30 mins`, `1 hour`) |
| `order` | Yes | Sequence number within the course |
| `section` | Yes | Section slug this lesson belongs to |
| `prevLessonId` | No | ID of the previous lesson for navigation |
| `nextLessonId` | No | ID of the next lesson for navigation |

**Duration guidelines:**
- Reading/concept lessons: 20-45 minutes
- Hands-on tutorials: 45-90 minutes
- Project lessons: 60-180 minutes
- Quiz reviews: 15-30 minutes

### 2. Title and Introduction (Required)

Begin with an H1 heading matching the frontmatter title, followed by 2-3 sentences explaining why this topic matters to the learner.

```markdown
# Lesson Title

Why does this matter? Connect the topic to real-world value or the learner's
goals. Set context for what they will accomplish.
```

**Guidelines:**
- The H1 must match the `title` field exactly
- Introduction should answer: "Why should I care about this?"
- Keep it concise: 2-3 sentences, no more than one paragraph
- Connect to practical applications or career relevance

### 3. Learning Outcomes (Recommended)

For concept-heavy lessons, include explicit learning outcomes after the introduction. Use action verbs from Bloom's Taxonomy.

```markdown
## What You Will Learn

By the end of this lesson, you will be able to:

- Define artificial intelligence and distinguish it from human intelligence
- Identify the three types of AI on the intelligence spectrum
- Explain how machine learning differs from traditional programming
- Recognize current AI applications across major industries
- Evaluate AI limitations and their implications
```

**Guidelines:**
- Include 3-7 outcomes
- Start each with an action verb: Define, Explain, Implement, Analyze, Create, Evaluate
- Be specific and measurable
- Order from simpler to more complex skills

**Action verb examples by complexity:**
| Level | Verbs |
|-------|-------|
| Remember | Define, List, Identify, Name, Recall |
| Understand | Explain, Describe, Summarize, Classify |
| Apply | Implement, Use, Execute, Demonstrate |
| Analyze | Compare, Contrast, Distinguish, Examine |
| Evaluate | Assess, Justify, Critique, Recommend |
| Create | Design, Build, Develop, Compose |

### 4. Main Content (Required)

The core lesson material organized with clear headings and subheadings.

```markdown
## Major Topic One

Introductory paragraph for this section.

### Subtopic A

Detailed content with examples.

### Subtopic B

Additional details with code samples.

## Major Topic Two

Continue building knowledge progressively.
```

**Guidelines:**
- Use H2 (`##`) for major sections
- Use H3 (`###`) for subsections
- Rarely use H4 (`####`) - if you need it, consider restructuring
- Each section should focus on one concept
- Build from foundational to advanced concepts
- Include transitions between major sections
- Aim for 5-15 minute reading chunks between headings

### 5. Practical Examples (Required)

Include working code samples, demonstrations, or real-world scenarios that reinforce concepts.

```markdown
## Practical Example - Building a Spam Filter

Let's apply what we've learned by building a simple spam classifier.

```python
# Load and prepare data
import pandas as pd
from sklearn.model_selection import train_test_split

# Load email dataset
emails = pd.read_csv('emails.csv')

# Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(
    emails['text'],
    emails['label'],
    test_size=0.2,
    random_state=42
)
```

This code demonstrates the train-test split pattern used in most ML projects.
```

**Guidelines:**
- Every lesson should have at least one practical example
- Examples should be complete and runnable
- Explain what the code does, not just show it
- Connect examples back to the concepts taught

### 6. Knowledge Check (Required)

A set of review questions that test understanding of the lesson material.

```markdown
## Knowledge Check

Test your understanding of the concepts covered:

1. What is the primary difference between Narrow AI and General AI?
   - Narrow AI is designed for specific tasks, while General AI can perform any intellectual task
   - Narrow AI is slower than General AI
   - Narrow AI uses neural networks, General AI uses traditional programming
   - Narrow AI requires more data than General AI

2. How does machine learning differ from traditional programming?
   - Machine learning creates rules from input-output examples, while traditional programming uses predefined rules
   - Machine learning is faster than traditional programming
   - Machine learning doesn't require any data
   - Machine learning can only work with numerical data
```

**Guidelines:**
- Include 3-7 questions
- Mix conceptual and practical questions
- All answers should be findable in the lesson content
- First option should be the correct answer
- See the [Knowledge Check Guidelines](#knowledge-check-guidelines) section for detailed formatting

### 7. Assignment (Required for Project Lessons)

For lessons with `type: project`, include clear project requirements.

```markdown
## Project Overview

**What you will build:**
A responsive personal portfolio website using HTML, CSS, and JavaScript.

**Technologies:**
- HTML5 for structure
- CSS3 for styling (Flexbox and Grid)
- JavaScript for interactivity

**Estimated time:** 2 hours

## Project Requirements

### Must Have

- Responsive navigation that works on mobile and desktop
- Hero section with name and tagline
- About section with bio and skills list
- Projects section with at least 3 project cards
- Contact form with client-side validation
- Mobile-responsive design (works on phone, tablet, desktop)

### Nice to Have

- Smooth scrolling between sections
- Animations on scroll
- Dark mode toggle
- Social media links

## Submission Requirements

Submit your project with:

1. GitHub repository link
2. Live deployment URL
3. Brief description of customizations made
```

**Guidelines:**
- Clearly state what learners will build
- List required technologies
- Separate "must have" from "nice to have" requirements
- Provide starter code when appropriate
- Include clear submission instructions

### 8. Additional Resources (Optional)

Supplementary materials for learners who want to go deeper.

```markdown
## Additional Resources

This section contains helpful links to related content. These are not required
for the lesson but provide additional depth.

- [Official Pandas Documentation](https://pandas.pydata.org/docs/) - The authoritative reference
- [Python Data Science Handbook](https://jakevdp.github.io/PythonDataScienceHandbook/) - Free online book
- [Kaggle Pandas Tutorial](https://www.kaggle.com/learn/pandas) - Interactive practice
```

**Guidelines:**
- Include 2-5 high-quality resources
- Prefer free, accessible resources
- Add a brief description for each link
- Check links periodically to ensure they work
- Place at the end of the lesson

---

## Markdown Standards

Consistent markdown formatting ensures content renders correctly and remains maintainable.

### Headings

Use ATX-style headings (hash symbols) with a single space after the hash:

```markdown
# Lesson Title (H1 - only one per document)

## Major Section (H2 - main content sections)

### Subsection (H3 - topics within sections)

#### Minor Subsection (H4 - use sparingly)
```

**Guidelines:**
- Only one H1 per document (the lesson title)
- Do not skip heading levels (H2 to H4)
- Use sentence case for headings: "What is machine learning" not "What Is Machine Learning"
- Add a blank line before and after headings

### Lists

Use hyphens for unordered lists and numbers for ordered lists:

```markdown
Unordered list:
- First item
- Second item
- Third item

Ordered list:
1. First step
2. Second step
3. Third step

Nested list:
- Parent item
  - Child item
  - Another child
- Second parent
```

**Guidelines:**
- Use hyphens (`-`) for unordered lists, not asterisks
- Use actual numbers (`1. 2. 3.`) for ordered lists
- Indent nested items with two spaces
- Add a blank line before and after lists
- Keep list items concise

### Emphasis

Use consistent emphasis formatting:

```markdown
**Bold text** for important terms and key concepts
*Italic text* for emphasis or introducing new terms
`Code text` for code, commands, file names, and technical terms
```

**Guidelines:**
- Use bold for key terms when first introduced
- Use code formatting for: variable names, function names, file paths, commands
- Avoid underscores for emphasis (use asterisks)
- Do not combine bold and italic

### Links

Format links with descriptive text:

```markdown
Inline link:
Learn more in the [official documentation](https://example.com).

Reference link (for repeated URLs):
Check the [Python docs][python-docs] for details.

[python-docs]: https://docs.python.org
```

**Guidelines:**
- Use descriptive link text, not "click here"
- External links should open in context (no target attribute needed in markdown)
- Use reference-style links for URLs used multiple times

### Tables

Use pipe tables for structured data:

```markdown
| Column A | Column B | Column C |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

**Guidelines:**
- Align pipes vertically for readability
- Use header row with separator
- Keep tables simple (3-5 columns maximum)
- Consider lists for simpler data

### Spacing

Maintain consistent spacing throughout:

- One blank line between paragraphs
- One blank line before and after headings
- One blank line before and after code blocks
- One blank line before and after lists
- No trailing whitespace on lines

---

## Writing Style

Clear, consistent writing helps learners focus on concepts rather than deciphering prose.

### Language

- Use **American English** spelling: color (not colour), organize (not organise)
- Write in **second person**: "You will learn" not "The reader will learn"
- Prefer **active voice**: "The function returns a value" not "A value is returned by the function"
- Use **present tense** for instructions: "Click the button" not "You should click the button"

### Tone

- Professional but approachable
- Encouraging without being patronizing
- Direct and confident
- Assume intelligence, not prior knowledge

**Good:**
> Machine learning enables computers to learn patterns from data. You will start by understanding how this differs from traditional programming.

**Avoid:**
> Machine learning is super cool and really easy! Anyone can do it!

### Clarity

- Keep sentences concise (aim for 15-20 words average)
- One idea per paragraph
- Define technical terms when first used
- Expand acronyms on first use: "Application Programming Interface (API)"

**Good:**
> A DataFrame is the primary data structure in pandas. Think of it as a spreadsheet with rows and columns that you can manipulate with code.

**Avoid:**
> A DataFrame is a two-dimensional, size-mutable, potentially heterogeneous tabular data structure with labeled axes (rows and columns).

### Technical Terms

When introducing technical terms:

1. Bold the term on first use
2. Provide a clear definition
3. Give an example if helpful

```markdown
**Machine learning** is a type of AI where computers learn patterns from data
rather than following explicit programming rules. For example, a spam filter
learns to recognize spam by analyzing thousands of labeled emails.
```

### Avoiding Jargon

- Do not assume knowledge of technical terms
- Define acronyms on first use
- Provide analogies for complex concepts
- Link to glossary entries when available

**Good:**
> An **API** (Application Programming Interface) is a way for programs to communicate. Think of it as a waiter in a restaurant - it takes your request to the kitchen and brings back what you ordered.

**Avoid:**
> Use the RESTful API to make CRUD operations on the DB via HTTP methods.

---

## Code Examples

Code examples are essential for technical learning. Follow these standards to ensure they are helpful and accessible.

### Language Identifier

Always specify the language for syntax highlighting:

````markdown
```python
def greet(name):
    return f"Hello, {name}!"
```

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

```sql
SELECT name, email
FROM users
WHERE active = true;
```

```bash
npm install pandas
python script.py
```
````

**Common language identifiers:**
| Language | Identifier |
|----------|------------|
| Python | `python` |
| JavaScript | `javascript` or `js` |
| TypeScript | `typescript` or `ts` |
| SQL | `sql` |
| Bash/Shell | `bash` or `shell` |
| HTML | `html` |
| CSS | `css` |
| JSON | `json` |
| YAML | `yaml` |
| Plain text | `text` or no identifier |

### Code Block Guidelines

**Keep examples focused:**
```python
# Good: Focused on one concept
def calculate_mean(numbers):
    return sum(numbers) / len(numbers)

average = calculate_mean([1, 2, 3, 4, 5])
print(average)  # Output: 3.0
```

**Add comments for complex logic:**
```python
def quicksort(arr):
    # Base case: arrays with 0-1 elements are already sorted
    if len(arr) <= 1:
        return arr

    # Choose pivot (middle element)
    pivot = arr[len(arr) // 2]

    # Partition into three lists
    left = [x for x in arr if x < pivot]    # Elements less than pivot
    middle = [x for x in arr if x == pivot]  # Elements equal to pivot
    right = [x for x in arr if x > pivot]    # Elements greater than pivot

    # Recursively sort and combine
    return quicksort(left) + middle + quicksort(right)
```

**Show expected output when helpful:**
```python
data = {'name': ['Alice', 'Bob'], 'age': [25, 30]}
df = pd.DataFrame(data)
print(df)
# Output:
#     name  age
# 0  Alice   25
# 1    Bob   30
```

### Showing Good and Bad Patterns

When teaching best practices, show both correct and incorrect approaches:

```markdown
**Avoid:** Using mutable default arguments

```python
# Bad: Mutable default argument
def add_item(item, items=[]):
    items.append(item)
    return items

# This causes unexpected behavior
print(add_item('a'))  # ['a']
print(add_item('b'))  # ['a', 'b'] - Unexpected!
```

**Instead:** Use None as the default

```python
# Good: Use None and create new list inside function
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

# Works correctly
print(add_item('a'))  # ['a']
print(add_item('b'))  # ['b'] - Correct!
```
```

### Inline Code

Use backticks for inline code references:

```markdown
Use the `print()` function to display output. The `pandas` library provides
the `DataFrame` class for tabular data. Save your file as `script.py`.
```

**Use inline code for:**
- Function and method names: `calculate_mean()`
- Variable names: `user_count`
- File names and paths: `config.json`, `/src/utils/`
- Command-line commands: `npm install`
- Package names: `pandas`, `numpy`
- Technical values: `True`, `None`, `undefined`

---

## Images and Media

Visual content enhances understanding but must be accessible and performant.

### Alt Text

Always include descriptive alt text for images:

```markdown
![Diagram showing the three layers of a neural network: input layer with 4 nodes, hidden layer with 3 nodes, and output layer with 2 nodes](images/neural-network-diagram.png)
```

**Alt text guidelines:**
- Describe what the image shows, not just what it is
- Be concise but complete (50-150 characters typical)
- Include relevant data from charts/graphs
- For decorative images, use empty alt: `![](decorative.png)`

### When to Use Images

**Prefer images for:**
- Architecture diagrams
- Flowcharts and process flows
- UI screenshots (when demonstrating interfaces)
- Data visualizations
- Conceptual illustrations

**Prefer diagrams over screenshots when:**
- The concept is abstract
- The UI might change
- You need to highlight specific elements
- You want to simplify complex interfaces

### Image Specifications

- **Format:** PNG for diagrams and screenshots, JPG for photographs
- **Width:** Maximum 800px for full-width images
- **File size:** Keep under 200KB when possible
- **Location:** Store in `images/` subfolder within the lesson directory

```
content/
  courses/
    machine-learning-fundamentals/
      lessons/
        01-what-is-ml.md
        images/
          ml-vs-traditional.png
          supervised-learning-diagram.png
```

### Diagrams

When creating diagrams:

- Use consistent colors and styling
- Include a legend if using color coding
- Keep text readable (minimum 12px equivalent)
- Use high contrast for accessibility
- Export at 2x resolution for retina displays

---

## Knowledge Check Guidelines

Knowledge checks reinforce learning and help learners assess their understanding.

### Question Format

Use a consistent format for all knowledge check questions:

```markdown
## Knowledge Check

Test your understanding of the concepts covered:

1. Question text here?
   - Correct answer (first option)
   - Incorrect option A
   - Incorrect option B
   - Incorrect option C

2. Another question?
   - Correct answer
   - Distractor A
   - Distractor B
   - Distractor C
```

**Formatting rules:**
- Number each question sequentially
- Indent answer options with three spaces
- Use hyphens for answer options
- Place the correct answer first
- Include 3-4 answer options per question

### Question Types

**Conceptual questions** test understanding of ideas:
```markdown
1. What is the primary purpose of data normalization?
   - To scale features to a common range, improving model training
   - To remove all missing values from a dataset
   - To increase the size of the training data
   - To convert categorical variables to numerical ones
```

**Practical questions** test application of skills:
```markdown
2. How do you select rows where the 'age' column is greater than 30?
   - df[df['age'] > 30]
   - df.select(age > 30)
   - df.filter('age > 30')
   - df.where(age, 30)
```

**Code output questions** test code comprehension:
```markdown
3. What does the following code output?
   ```python
   x = [1, 2, 3]
   print(x * 2)
   ```
   - [1, 2, 3, 1, 2, 3]
   - [2, 4, 6]
   - 6
   - Error
```

### Writing Good Questions

**Do:**
- Test understanding, not memorization
- Make questions clear and unambiguous
- Ensure all answers are plausible
- Keep distractors (wrong answers) reasonable
- Base questions directly on lesson content

**Avoid:**
- Trick questions or gotchas
- Questions with multiple correct answers
- Overly long answer options
- "All of the above" or "None of the above"
- Questions testing trivial details

### Question Distribution

For a typical lesson, include:
- 1-2 conceptual questions testing key definitions
- 2-3 practical questions testing application
- 1-2 questions connecting to broader concepts

---

## Example Lesson Template

Use this template as a starting point for new lessons. Copy and modify as needed.

````markdown
---
id: lesson-slug
title: Lesson Title - Clear Descriptive Subtitle
type: lesson
duration: 45 mins
order: 1
section: section-slug
prevLessonId: previous-lesson-id
nextLessonId: next-lesson-id
---

# Lesson Title - Clear Descriptive Subtitle

Why does this topic matter? Provide 2-3 sentences connecting this lesson to
real-world applications and the learner's goals. Set clear expectations for
what they will accomplish.

## What You Will Learn

By the end of this lesson, you will be able to:

- Define the core concept and explain its importance
- Implement the basic technique in Python
- Identify common use cases and applications
- Evaluate when to use this approach versus alternatives

## Core Concept

Introduce the main topic with a clear explanation. Use analogies to connect
new concepts to familiar ideas.

**Key term** refers to the specific definition that learners need to understand.
Always bold and define technical terms on first use.

### First Subtopic

Explain the first important aspect of the concept. Break complex ideas into
digestible chunks.

```python
# Example code demonstrating the concept
def example_function(parameter):
    """Docstring explaining what this function does."""
    result = parameter * 2
    return result

# Usage
output = example_function(5)
print(output)  # Output: 10
```

This code demonstrates how to apply the concept in practice.

### Second Subtopic

Build on the foundation with additional details. Each subsection should focus
on one clear idea.

| Approach A | Approach B |
|------------|------------|
| Benefit 1  | Benefit 1  |
| Tradeoff 1 | Tradeoff 2 |

Use tables to compare options when appropriate.

## Practical Example

Let's apply what you've learned with a real-world example.

**Scenario:** Describe the problem you're solving.

```python
# Complete, runnable code example
import pandas as pd

# Load data
data = pd.read_csv('example.csv')

# Apply the concept
processed = data.apply(example_function)

# Show results
print(processed.head())
```

Walk through what the code does and why each step matters.

## Common Pitfalls

Highlight mistakes learners commonly make:

**Avoid:** Brief description of the anti-pattern

```python
# Bad: Why this approach causes problems
wrong_approach = problematic_code()
```

**Instead:** Brief description of the correct approach

```python
# Good: Why this approach works better
right_approach = correct_code()
```

## Summary

Briefly recap the key points:

- First key takeaway
- Second key takeaway
- Third key takeaway

## Knowledge Check

Test your understanding of the concepts covered:

1. What is the primary purpose of [concept]?
   - Correct answer that demonstrates understanding
   - Plausible but incorrect distractor
   - Another reasonable but wrong option
   - Third distractor

2. Given the following code, what is the output?
   ```python
   x = example_function(3)
   print(x)
   ```
   - 6
   - 3
   - Error
   - None

3. When should you use [concept] instead of [alternative]?
   - Correct scenario where this concept is preferred
   - Scenario where the alternative would be better
   - Unrelated scenario
   - Another incorrect option

4. Which of the following best describes [key term]?
   - Accurate definition from the lesson
   - Definition that's close but missing a key aspect
   - Definition of a related but different concept
   - Completely incorrect definition

5. What is a common mistake when implementing [concept]?
   - The pitfall described in the lesson
   - Something that's actually fine to do
   - An unrelated error
   - A best practice (opposite of a mistake)

## Additional Resources

This section contains helpful links for further learning:

- [Official Documentation](https://example.com) - Authoritative reference
- [Tutorial: Deep Dive](https://example.com) - Extended walkthrough
- [Video Explanation](https://example.com) - Visual learners may prefer this
````

---

## Project Lesson Template

For lessons with `type: project`, use this extended template:

````markdown
---
id: project-slug
title: Build a [Project Name] - Hands-On Project
type: project
duration: 120 mins
order: 5
section: projects
prevLessonId: previous-lesson-id
nextLessonId: next-lesson-id
---

# Build a [Project Name] - Hands-On Project

Put your skills into practice by building a complete project. This hands-on
exercise will reinforce the concepts from previous lessons.

## Project Overview

**What you will build:**
A brief description of the finished project and its functionality.

**Technologies:**
- Technology 1 for purpose
- Technology 2 for purpose
- Technology 3 for purpose

**Estimated time:** 2 hours

## Project Requirements

### Must Have

- Requirement 1 (specific and testable)
- Requirement 2 (specific and testable)
- Requirement 3 (specific and testable)
- Requirement 4 (specific and testable)

### Nice to Have

- Optional enhancement 1
- Optional enhancement 2
- Optional enhancement 3

## Getting Started

### Step 1: Set Up Your Environment

Instructions for initial setup.

```bash
# Commands to run
mkdir project-name
cd project-name
npm init -y
```

### Step 2: Create the Basic Structure

Instructions for creating initial files.

```python
# Starter code with comments explaining each part
```

### Step 3: Implement Core Functionality

Guide learners through the main implementation.

## Starter Template

Provide complete starter code if applicable:

```python
# Complete starter file
# Comments explain what learners need to modify
```

## Hints and Tips

- Tip 1 for a common challenge
- Tip 2 for efficiency
- Tip 3 for best practices

## Submission Requirements

Submit your project with:

1. GitHub repository link with your code
2. Live deployment URL (if applicable)
3. README describing what you built and any customizations
4. Screenshots showing key features

## Knowledge Check

1. Question about a concept applied in the project?
   - Correct answer
   - Distractor A
   - Distractor B
   - Distractor C
````

---

## Quick Reference

### Frontmatter Fields

| Field | Required | Values |
|-------|----------|--------|
| `id` | Yes | `kebab-case-slug` |
| `title` | Yes | "Title - Subtitle" |
| `type` | Yes | `lesson`, `project`, `quiz` |
| `duration` | Yes | "X mins" or "X hour(s)" |
| `order` | Yes | Integer (1, 2, 3...) |
| `section` | Yes | `section-slug` |
| `prevLessonId` | No | Previous lesson ID |
| `nextLessonId` | No | Next lesson ID |

### Section Order

1. Frontmatter (YAML)
2. Title (H1) and Introduction
3. Learning Outcomes (recommended)
4. Main Content (H2 sections)
5. Practical Examples
6. Knowledge Check
7. Assignment (project lessons only)
8. Additional Resources (optional)

### Writing Checklist

- [ ] Frontmatter is complete and accurate
- [ ] H1 matches the title field
- [ ] Introduction explains why topic matters
- [ ] Learning outcomes use action verbs
- [ ] Main content uses proper heading hierarchy
- [ ] Code examples have language identifiers
- [ ] All technical terms are defined on first use
- [ ] Knowledge check has 3-7 questions
- [ ] Correct answers are listed first
- [ ] All links are working
- [ ] No spelling or grammar errors
- [ ] American English spelling used throughout

---

## Getting Help

If you have questions about content guidelines:

1. Check this style guide first
2. Review existing lessons for examples
3. Open an issue on the repository
4. Tag content reviewers for feedback

Thank you for contributing to VivanceData. Your content helps learners build real skills.
