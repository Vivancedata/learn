"""
Solution for Exercise 03: Data Structures

This file contains reference solutions. Try to solve the exercise yourself first!
Compare your solution to see different approaches.
"""

from typing import Any, Callable


def count_occurrences(items: list) -> dict:
    """
    Count how many times each item appears in a list.

    Args:
        items: A list of items (can be empty)

    Returns:
        A dictionary where keys are unique items and values are counts
    """
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts

    # Alternative using collections.Counter:
    # from collections import Counter
    # return dict(Counter(items))


def merge_dictionaries(dict1: dict, dict2: dict) -> dict:
    """
    Merge two dictionaries, with dict2 values taking precedence.

    Args:
        dict1: First dictionary
        dict2: Second dictionary (values override dict1)

    Returns:
        A new dictionary with all keys from both, dict2 values win conflicts
    """
    # Python 3.9+ syntax
    return dict1 | dict2

    # Alternative using unpacking (Python 3.5+):
    # return {**dict1, **dict2}

    # Alternative using loop:
    # result = dict1.copy()
    # result.update(dict2)
    # return result


def find_common_elements(list1: list, list2: list) -> list:
    """
    Find elements that appear in both lists.

    Args:
        list1: First list
        list2: Second list

    Returns:
        A list of elements common to both (order not guaranteed)
    """
    return list(set(list1) & set(list2))

    # Alternative using intersection method:
    # return list(set(list1).intersection(set(list2)))


def remove_duplicates(items: list) -> list:
    """
    Remove duplicates from a list while preserving order.

    Args:
        items: A list with potential duplicates

    Returns:
        A new list with duplicates removed, keeping first occurrence
    """
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result

    # Alternative using dict.fromkeys (Python 3.7+ preserves insertion order):
    # return list(dict.fromkeys(items))


def group_by_key(items: list, key_func: Callable[[Any], Any]) -> dict:
    """
    Group items by the result of applying a key function.

    Args:
        items: A list of items to group
        key_func: A function that returns the grouping key for each item

    Returns:
        A dictionary where keys are results of key_func,
        values are lists of items with that key
    """
    groups = {}
    for item in items:
        key = key_func(item)
        if key not in groups:
            groups[key] = []
        groups[key].append(item)
    return groups

    # Alternative using defaultdict:
    # from collections import defaultdict
    # groups = defaultdict(list)
    # for item in items:
    #     groups[key_func(item)].append(item)
    # return dict(groups)

    # Alternative using setdefault:
    # groups = {}
    # for item in items:
    #     groups.setdefault(key_func(item), []).append(item)
    # return groups


def flatten_list(nested_list: list) -> list:
    """
    Flatten a nested list one level deep.

    Args:
        nested_list: A list of lists

    Returns:
        A single flat list with all elements
    """
    return [item for sublist in nested_list for item in sublist]

    # Alternative using sum (not recommended for large lists):
    # return sum(nested_list, [])

    # Alternative using itertools:
    # import itertools
    # return list(itertools.chain.from_iterable(nested_list))


def invert_dictionary(d: dict) -> dict:
    """
    Swap keys and values in a dictionary.

    Args:
        d: A dictionary (assumes values are unique and hashable)

    Returns:
        A new dictionary with keys and values swapped
    """
    return {v: k for k, v in d.items()}

    # Alternative using loop:
    # inverted = {}
    # for k, v in d.items():
    #     inverted[v] = k
    # return inverted


# Bonus solutions
def deep_flatten(nested_list: list) -> list:
    """
    Recursively flatten a list of arbitrary nesting depth.

    Example:
        >>> deep_flatten([[1, [2, 3]], [4, [5, [6]]]])
        [1, 2, 3, 4, 5, 6]
    """
    result = []
    for item in nested_list:
        if isinstance(item, list):
            result.extend(deep_flatten(item))
        else:
            result.append(item)
    return result


def frequency_sort(items: list) -> list:
    """
    Sort items by frequency of occurrence (most common first).

    Example:
        >>> frequency_sort([1, 2, 1, 3, 1, 2])
        [1, 1, 1, 2, 2, 3]
    """
    counts = count_occurrences(items)
    return sorted(items, key=lambda x: (-counts[x], items.index(x)))
