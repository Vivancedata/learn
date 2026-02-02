# Exercise 03: Data Structures

In this exercise, you'll practice working with Python's built-in data structures: lists, dictionaries, and sets. These are fundamental tools for data manipulation.

## Learning Objectives

By completing this exercise, you will:
- Manipulate lists with common operations
- Use dictionaries for key-value data storage
- Apply sets for unique collections
- Write list comprehensions
- Combine data structures effectively

## Prerequisites

Complete [Exercise 01: Variables](../01-variables/README.md) and [Exercise 02: Functions](../02-functions/README.md) first.

## Instructions

Open `exercise.py` and complete all the TODO items. Each function has a docstring explaining what it should do.

## Tasks

### Task 1: `count_occurrences(items)`
Count how many times each item appears in a list.
- Return a dictionary with items as keys and counts as values
- Example: `[1, 2, 1, 3, 1]` returns `{1: 3, 2: 1, 3: 1}`

### Task 2: `merge_dictionaries(dict1, dict2)`
Merge two dictionaries, with dict2 values taking precedence.
- If a key exists in both, use the value from dict2
- Return a new dictionary (don't modify originals)

### Task 3: `find_common_elements(list1, list2)`
Find elements that appear in both lists.
- Return a list of common elements
- Order doesn't matter

### Task 4: `remove_duplicates(items)`
Remove duplicates from a list while preserving order.
- Return a new list with duplicates removed
- Keep the first occurrence of each item

### Task 5: `group_by_key(items, key_func)`
Group items by the result of applying a key function.
- Return a dictionary where keys are the result of key_func
- Values are lists of items with that key

### Task 6: `flatten_list(nested_list)`
Flatten a nested list one level deep.
- `[[1, 2], [3, 4]]` becomes `[1, 2, 3, 4]`
- Only flatten one level (not recursive)

### Task 7: `invert_dictionary(d)`
Swap keys and values in a dictionary.
- `{a: 1, b: 2}` becomes `{1: a, 2: b}`
- Assume values are unique

## Running Tests

```bash
# From the exercises directory
pytest python-basics/exercises/03-data-structures/test_exercise.py -v

# With more details on failures
pytest python-basics/exercises/03-data-structures/test_exercise.py -v --tb=long
```

## Hints

<details>
<summary>Hint 1: Counting Occurrences</summary>

You can iterate and count manually:
```python
counts = {}
for item in items:
    if item in counts:
        counts[item] += 1
    else:
        counts[item] = 1
```

Or use `dict.get()`:
```python
counts[item] = counts.get(item, 0) + 1
```

Or use `collections.Counter` (but try it manually first!).
</details>

<details>
<summary>Hint 2: Merging Dictionaries</summary>

Python 3.9+ has the `|` operator:
```python
merged = dict1 | dict2
```

Or use unpacking:
```python
merged = {**dict1, **dict2}
```

Or use a loop for older Python versions.
</details>

<details>
<summary>Hint 3: Finding Common Elements</summary>

Sets are great for this:
```python
common = set(list1) & set(list2)
return list(common)
```
</details>

<details>
<summary>Hint 4: Removing Duplicates with Order</summary>

A set tracks what you've seen:
```python
seen = set()
result = []
for item in items:
    if item not in seen:
        seen.add(item)
        result.append(item)
```
</details>

<details>
<summary>Hint 5: Grouping by Key</summary>

Initialize groups as empty lists:
```python
groups = {}
for item in items:
    key = key_func(item)
    if key not in groups:
        groups[key] = []
    groups[key].append(item)
```

Or use `collections.defaultdict(list)`.
</details>

<details>
<summary>Hint 6: Flattening Lists</summary>

List comprehension with nested loops:
```python
[item for sublist in nested_list for item in sublist]
```
</details>

<details>
<summary>Hint 7: Inverting Dictionary</summary>

Dictionary comprehension:
```python
{v: k for k, v in d.items()}
```
</details>

## Expected Output

When all tests pass, you should see:
```
test_exercise.py::TestCountOccurrences::test_basic_counting PASSED
test_exercise.py::TestCountOccurrences::test_empty_list PASSED
... (all tests pass)
```

## Common Mistakes

1. **Modifying input data** - Always create new data structures unless specified
2. **Wrong data type** - Make sure you return lists vs sets vs dicts as specified
3. **Not handling empty inputs** - Check your functions with empty lists/dicts
4. **Forgetting order matters** - Some operations should preserve order

## Why Data Structures Matter

In data science and AI, you constantly work with:
- **Lists** for sequences of data points
- **Dictionaries** for labeled data and configurations
- **Sets** for unique values and fast lookups

Understanding these fundamentals makes working with pandas DataFrames, NumPy arrays, and machine learning libraries much easier.

## Congratulations!

After completing this exercise, you've mastered Python basics! Continue with:
- **NumPy Fundamentals** - Array operations for numerical computing
- **Pandas Essentials** - Data manipulation for analysis
- **SQL Fundamentals** - Database querying skills
