"""
Tests for Exercise 03: Data Structures

Run with: pytest test_data_structures.py -v
"""

import pytest
from data_structures import (
    count_occurrences,
    merge_dictionaries,
    find_common_elements,
    remove_duplicates,
    group_by_key,
    flatten_list,
    invert_dictionary,
)


class TestCountOccurrences:
    """Tests for count_occurrences function."""

    def test_basic_counting(self):
        """Should count occurrences correctly."""
        result = count_occurrences([1, 2, 1, 3, 1])
        assert result == {1: 3, 2: 1, 3: 1}

    def test_string_items(self):
        """Should work with string items."""
        result = count_occurrences(['a', 'b', 'a', 'c', 'a'])
        assert result == {'a': 3, 'b': 1, 'c': 1}

    def test_empty_list(self):
        """Should return empty dict for empty list."""
        result = count_occurrences([])
        assert result == {}

    def test_single_item(self):
        """Should handle single item."""
        result = count_occurrences([42])
        assert result == {42: 1}

    def test_all_unique(self):
        """Should handle all unique items."""
        result = count_occurrences([1, 2, 3, 4])
        assert result == {1: 1, 2: 1, 3: 1, 4: 1}

    def test_all_same(self):
        """Should handle all same items."""
        result = count_occurrences([5, 5, 5, 5])
        assert result == {5: 4}


class TestMergeDictionaries:
    """Tests for merge_dictionaries function."""

    def test_basic_merge(self):
        """Should merge dictionaries correctly."""
        result = merge_dictionaries({'a': 1, 'b': 2}, {'c': 3, 'd': 4})
        assert result == {'a': 1, 'b': 2, 'c': 3, 'd': 4}

    def test_overlapping_keys(self):
        """Dict2 values should override dict1."""
        result = merge_dictionaries({'a': 1, 'b': 2}, {'b': 3, 'c': 4})
        assert result == {'a': 1, 'b': 3, 'c': 4}

    def test_empty_first(self):
        """Should handle empty first dict."""
        result = merge_dictionaries({}, {'a': 1})
        assert result == {'a': 1}

    def test_empty_second(self):
        """Should handle empty second dict."""
        result = merge_dictionaries({'a': 1}, {})
        assert result == {'a': 1}

    def test_both_empty(self):
        """Should handle both empty."""
        result = merge_dictionaries({}, {})
        assert result == {}

    def test_does_not_modify_originals(self):
        """Should not modify original dictionaries."""
        dict1 = {'a': 1}
        dict2 = {'b': 2}
        merge_dictionaries(dict1, dict2)
        assert dict1 == {'a': 1}
        assert dict2 == {'b': 2}


class TestFindCommonElements:
    """Tests for find_common_elements function."""

    def test_basic_common(self):
        """Should find common elements."""
        result = find_common_elements([1, 2, 3], [2, 3, 4])
        assert sorted(result) == [2, 3]

    def test_no_common(self):
        """Should return empty list when no common elements."""
        result = find_common_elements([1, 2], [3, 4])
        assert result == []

    def test_all_common(self):
        """Should handle all elements common."""
        result = find_common_elements([1, 2, 3], [1, 2, 3])
        assert sorted(result) == [1, 2, 3]

    def test_with_duplicates(self):
        """Should handle duplicates in input."""
        result = find_common_elements([1, 1, 2, 2], [2, 2, 3, 3])
        assert sorted(result) == [2]

    def test_empty_lists(self):
        """Should handle empty lists."""
        assert find_common_elements([], [1, 2]) == []
        assert find_common_elements([1, 2], []) == []
        assert find_common_elements([], []) == []

    def test_string_elements(self):
        """Should work with strings."""
        result = find_common_elements(['a', 'b'], ['b', 'c'])
        assert result == ['b']


class TestRemoveDuplicates:
    """Tests for remove_duplicates function."""

    def test_basic_removal(self):
        """Should remove duplicates preserving order."""
        result = remove_duplicates([1, 2, 1, 3, 2, 4])
        assert result == [1, 2, 3, 4]

    def test_string_items(self):
        """Should work with strings."""
        result = remove_duplicates(['a', 'b', 'a', 'c'])
        assert result == ['a', 'b', 'c']

    def test_no_duplicates(self):
        """Should handle list without duplicates."""
        result = remove_duplicates([1, 2, 3])
        assert result == [1, 2, 3]

    def test_all_duplicates(self):
        """Should handle all same items."""
        result = remove_duplicates([5, 5, 5, 5])
        assert result == [5]

    def test_empty_list(self):
        """Should handle empty list."""
        result = remove_duplicates([])
        assert result == []

    def test_preserves_order(self):
        """Should keep first occurrence order."""
        result = remove_duplicates([3, 1, 2, 1, 3])
        assert result == [3, 1, 2]


class TestGroupByKey:
    """Tests for group_by_key function."""

    def test_group_by_modulo(self):
        """Should group numbers by even/odd."""
        result = group_by_key([1, 2, 3, 4, 5], lambda x: x % 2)
        assert result == {1: [1, 3, 5], 0: [2, 4]}

    def test_group_by_length(self):
        """Should group strings by length."""
        result = group_by_key(['a', 'bb', 'c', 'dd', 'eee'], len)
        assert result == {1: ['a', 'c'], 2: ['bb', 'dd'], 3: ['eee']}

    def test_empty_list(self):
        """Should handle empty list."""
        result = group_by_key([], lambda x: x)
        assert result == {}

    def test_single_group(self):
        """Should handle all items in one group."""
        result = group_by_key([2, 4, 6], lambda x: 'even')
        assert result == {'even': [2, 4, 6]}

    def test_preserves_order_within_groups(self):
        """Should preserve order within each group."""
        result = group_by_key([1, 3, 2, 5, 4], lambda x: x % 2)
        assert result[1] == [1, 3, 5]  # Odd numbers in order
        assert result[0] == [2, 4]  # Even numbers in order


class TestFlattenList:
    """Tests for flatten_list function."""

    def test_basic_flatten(self):
        """Should flatten nested list."""
        result = flatten_list([[1, 2], [3, 4], [5]])
        assert result == [1, 2, 3, 4, 5]

    def test_string_items(self):
        """Should work with strings."""
        result = flatten_list([['a', 'b'], ['c']])
        assert result == ['a', 'b', 'c']

    def test_empty_list(self):
        """Should handle empty list."""
        result = flatten_list([])
        assert result == []

    def test_empty_sublists(self):
        """Should handle empty sublists."""
        result = flatten_list([[], [1], [], [2, 3], []])
        assert result == [1, 2, 3]

    def test_single_sublist(self):
        """Should handle single sublist."""
        result = flatten_list([[1, 2, 3]])
        assert result == [1, 2, 3]

    def test_single_items(self):
        """Should handle sublists with single items."""
        result = flatten_list([[1], [2], [3]])
        assert result == [1, 2, 3]


class TestInvertDictionary:
    """Tests for invert_dictionary function."""

    def test_basic_invert(self):
        """Should swap keys and values."""
        result = invert_dictionary({'a': 1, 'b': 2, 'c': 3})
        assert result == {1: 'a', 2: 'b', 3: 'c'}

    def test_empty_dict(self):
        """Should handle empty dictionary."""
        result = invert_dictionary({})
        assert result == {}

    def test_string_values(self):
        """Should work with string values."""
        result = invert_dictionary({1: 'one', 2: 'two'})
        assert result == {'one': 1, 'two': 2}

    def test_single_item(self):
        """Should handle single item."""
        result = invert_dictionary({'key': 'value'})
        assert result == {'value': 'key'}

    def test_does_not_modify_original(self):
        """Should not modify original dictionary."""
        original = {'a': 1, 'b': 2}
        invert_dictionary(original)
        assert original == {'a': 1, 'b': 2}
