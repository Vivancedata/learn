"""
Exercise 03: Data Structures

Complete each function below according to its docstring.
Run the tests to verify your solutions: pytest test_data_structures.py -v
"""

from typing import Any, Callable


def count_occurrences(items: list) -> dict:
    """
    Count how many times each item appears in a list.

    Args:
        items: A list of items (can be empty)

    Returns:
        A dictionary where keys are unique items and values are counts

    Example:
        >>> count_occurrences([1, 2, 1, 3, 1])
        {1: 3, 2: 1, 3: 1}
        >>> count_occurrences(['a', 'b', 'a'])
        {'a': 2, 'b': 1}
        >>> count_occurrences([])
        {}
    """
    # TODO: Count occurrences of each item
    # Hint: Use dict.get(key, default) to handle missing keys
    pass


def merge_dictionaries(dict1: dict, dict2: dict) -> dict:
    """
    Merge two dictionaries, with dict2 values taking precedence.

    Args:
        dict1: First dictionary
        dict2: Second dictionary (values override dict1)

    Returns:
        A new dictionary with all keys from both, dict2 values win conflicts

    Example:
        >>> merge_dictionaries({'a': 1, 'b': 2}, {'b': 3, 'c': 4})
        {'a': 1, 'b': 3, 'c': 4}
    """
    # TODO: Merge the dictionaries
    # Hint: Python 3.9+ has the | operator, or use {**dict1, **dict2}
    pass


def find_common_elements(list1: list, list2: list) -> list:
    """
    Find elements that appear in both lists.

    Args:
        list1: First list
        list2: Second list

    Returns:
        A list of elements common to both (order not guaranteed)

    Example:
        >>> sorted(find_common_elements([1, 2, 3], [2, 3, 4]))
        [2, 3]
        >>> find_common_elements([1, 2], [3, 4])
        []
    """
    # TODO: Find common elements
    # Hint: Sets are great for this!
    pass


def remove_duplicates(items: list) -> list:
    """
    Remove duplicates from a list while preserving order.

    Args:
        items: A list with potential duplicates

    Returns:
        A new list with duplicates removed, keeping first occurrence

    Example:
        >>> remove_duplicates([1, 2, 1, 3, 2, 4])
        [1, 2, 3, 4]
        >>> remove_duplicates(['a', 'b', 'a', 'c'])
        ['a', 'b', 'c']
    """
    # TODO: Remove duplicates while preserving order
    # Hint: Track seen items with a set, build result list
    pass


def group_by_key(items: list, key_func: Callable[[Any], Any]) -> dict:
    """
    Group items by the result of applying a key function.

    Args:
        items: A list of items to group
        key_func: A function that returns the grouping key for each item

    Returns:
        A dictionary where keys are results of key_func,
        values are lists of items with that key

    Example:
        >>> group_by_key([1, 2, 3, 4, 5], lambda x: x % 2)
        {1: [1, 3, 5], 0: [2, 4]}

        >>> group_by_key(['apple', 'banana', 'cherry'], len)
        {5: ['apple'], 6: ['banana', 'cherry']}
    """
    # TODO: Group items by the key function result
    # Hint: Initialize each group as an empty list
    pass


def flatten_list(nested_list: list) -> list:
    """
    Flatten a nested list one level deep.

    Args:
        nested_list: A list of lists

    Returns:
        A single flat list with all elements

    Example:
        >>> flatten_list([[1, 2], [3, 4], [5]])
        [1, 2, 3, 4, 5]
        >>> flatten_list([['a', 'b'], ['c']])
        ['a', 'b', 'c']
        >>> flatten_list([])
        []
    """
    # TODO: Flatten the nested list
    # Hint: Use a list comprehension with nested loops
    pass


def invert_dictionary(d: dict) -> dict:
    """
    Swap keys and values in a dictionary.

    Args:
        d: A dictionary (assumes values are unique and hashable)

    Returns:
        A new dictionary with keys and values swapped

    Example:
        >>> invert_dictionary({'a': 1, 'b': 2, 'c': 3})
        {1: 'a', 2: 'b', 3: 'c'}
        >>> invert_dictionary({})
        {}
    """
    # TODO: Invert the dictionary (swap keys and values)
    # Hint: Dictionary comprehension works well here
    pass


# Bonus: More challenging data structure exercises
# Uncomment and complete if you want extra practice

# def deep_flatten(nested_list: list) -> list:
#     """
#     Recursively flatten a list of arbitrary nesting depth.
#
#     Example:
#         >>> deep_flatten([[1, [2, 3]], [4, [5, [6]]]])
#         [1, 2, 3, 4, 5, 6]
#     """
#     # TODO: Recursively flatten
#     pass

# def frequency_sort(items: list) -> list:
#     """
#     Sort items by frequency of occurrence (most common first).
#
#     Example:
#         >>> frequency_sort([1, 2, 1, 3, 1, 2])
#         [1, 1, 1, 2, 2, 3]
#     """
#     # TODO: Sort by frequency
#     pass
