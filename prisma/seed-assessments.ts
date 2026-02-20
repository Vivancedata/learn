import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || 'file:./prisma/dev.db'
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: resolveDatabaseUrl(),
  }),
})

// Use string literals to avoid dependency on generated Prisma client enums
type CourseDifficultyType = 'Beginner' | 'Intermediate' | 'Advanced'
type QuestionTypeValue = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'CODE_OUTPUT' | 'FILL_BLANK'

interface QuestionData {
  question: string
  questionType: QuestionTypeValue
  options: string[]
  correctAnswer: number | number[]
  explanation: string
  difficulty: number
  points: number
  codeSnippet?: string
}

interface AssessmentData {
  name: string
  slug: string
  description: string
  difficulty: CourseDifficultyType
  timeLimit: number
  passingScore: number
  skillArea: string
  tags: string[]
  questions: QuestionData[]
}

// =============================================================================
// PYTHON FUNDAMENTALS ASSESSMENT (20 questions, 30 min, 70% to pass)
// =============================================================================
const pythonFundamentalsQuestions: QuestionData[] = [
  // Variables and Data Types (5 questions)
  {
    question: 'Which of the following is a valid Python variable name?',
    questionType: 'SINGLE_CHOICE',
    options: ['2_variable', 'my-variable', '_private_var', 'class'],
    correctAnswer: 2,
    explanation: 'In Python, variable names can start with a letter or underscore, but not with a number. Hyphens are not allowed, and "class" is a reserved keyword. "_private_var" is valid and commonly used to indicate private variables.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'What is the output of: print(type(3.14))',
    questionType: 'CODE_OUTPUT',
    options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'decimal'>"],
    correctAnswer: 1,
    explanation: 'In Python, decimal numbers like 3.14 are automatically typed as float. Python does not have a separate double type like some other languages.',
    difficulty: 1,
    points: 10,
    codeSnippet: 'print(type(3.14))'
  },
  {
    question: 'Which data types in Python are immutable? (Select all that apply)',
    questionType: 'MULTIPLE_CHOICE',
    options: ['list', 'tuple', 'string', 'dictionary', 'integer'],
    correctAnswer: [1, 2, 4],
    explanation: 'Tuples, strings, and integers are immutable in Python - their values cannot be changed after creation. Lists and dictionaries are mutable and can be modified.',
    difficulty: 2,
    points: 15
  },
  {
    question: 'What will be the output of: print("Hello" + str(123))',
    questionType: 'CODE_OUTPUT',
    options: ['Hello123', 'Hello 123', 'Error', 'Hello+123'],
    correctAnswer: 0,
    explanation: 'The str() function converts the integer 123 to the string "123". String concatenation with + joins "Hello" and "123" to produce "Hello123".',
    difficulty: 2,
    points: 10,
    codeSnippet: 'print("Hello" + str(123))'
  },
  {
    question: 'In Python, None is equivalent to False.',
    questionType: 'TRUE_FALSE',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'While None is "falsy" (evaluates to False in a boolean context), None is not equivalent to False. They are different objects: type(None) is NoneType, while type(False) is bool. Use "is None" for None checks, not "== False".',
    difficulty: 3,
    points: 10
  },

  // Control Flow (5 questions)
  {
    question: 'What is the output of this code?',
    questionType: 'CODE_OUTPUT',
    options: ['0 1 2 3 4', '1 2 3 4 5', '0 1 2 3 4 5', '1 2 3 4'],
    correctAnswer: 0,
    explanation: 'range(5) generates numbers from 0 to 4 (exclusive of 5). The for loop iterates through each value, and end=" " makes print output on the same line with spaces.',
    difficulty: 1,
    points: 10,
    codeSnippet: 'for i in range(5):\n    print(i, end=" ")'
  },
  {
    question: 'What is the output of this code?',
    questionType: 'CODE_OUTPUT',
    options: ['5', '10', '15', '20'],
    correctAnswer: 2,
    explanation: 'The while loop runs while x < 10. Starting at x=0, it adds 5 each iteration: 0+5=5, 5+5=10, 10+5=15. When x=15, the condition x<10 is false, so the loop exits and prints 15.',
    difficulty: 2,
    points: 10,
    codeSnippet: 'x = 0\nwhile x < 10:\n    x += 5\nprint(x)'
  },
  {
    question: 'Which statement is used to skip the current iteration and continue with the next?',
    questionType: 'SINGLE_CHOICE',
    options: ['break', 'continue', 'pass', 'return'],
    correctAnswer: 1,
    explanation: '"continue" skips the rest of the current iteration and moves to the next. "break" exits the loop entirely. "pass" is a null operation (does nothing). "return" exits the function.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'What is the output of this code?',
    questionType: 'CODE_OUTPUT',
    options: ['small', 'medium', 'large', 'Error'],
    correctAnswer: 1,
    explanation: 'With x=50, the first condition (x < 10) is False. The elif (x < 100) is True since 50 < 100, so "medium" is printed. The else block is not reached.',
    difficulty: 2,
    points: 10,
    codeSnippet: 'x = 50\nif x < 10:\n    print("small")\nelif x < 100:\n    print("medium")\nelse:\n    print("large")'
  },
  {
    question: 'What is the result of: "python"[::2]',
    questionType: 'CODE_OUTPUT',
    options: ['pyt', 'pto', 'yhn', 'nohtyp'],
    correctAnswer: 1,
    explanation: 'String slicing with [::2] takes every 2nd character starting from index 0. "python" has indices 0(p), 1(y), 2(t), 3(h), 4(o), 5(n). Taking 0, 2, 4 gives "pto".',
    difficulty: 3,
    points: 15
  },

  // Functions (5 questions)
  {
    question: 'What is the output of this code?',
    questionType: 'CODE_OUTPUT',
    options: ['3', '5', 'None', 'Error'],
    correctAnswer: 2,
    explanation: 'The function add() calculates a + b but does not have a return statement, so it implicitly returns None. When you print the result, it outputs None.',
    difficulty: 2,
    points: 10,
    codeSnippet: 'def add(a, b):\n    result = a + b\n\nprint(add(2, 3))'
  },
  {
    question: 'Which of the following are valid ways to define default parameter values?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'def func(x=10):',
      'def func(x, y=5):',
      'def func(x=10, y):',
      'def func(x=[], y={}):',
    ],
    correctAnswer: [0, 1, 3],
    explanation: 'Default parameters must come after non-default parameters. "def func(x=10, y):" is invalid because y has no default but comes after x which has a default. Note: Using mutable defaults like [] or {} is valid syntax but can cause bugs.',
    difficulty: 3,
    points: 15
  },
  {
    question: 'What does *args do in a function definition?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Allows passing a dictionary of keyword arguments',
      'Allows passing any number of positional arguments as a tuple',
      'Makes all arguments required',
      'Creates a pointer to the arguments',
    ],
    correctAnswer: 1,
    explanation: '*args allows a function to accept any number of positional arguments, which are collected into a tuple. **kwargs is used for keyword arguments (dictionary).',
    difficulty: 2,
    points: 10
  },
  {
    question: 'What is the output of this code?',
    questionType: 'CODE_OUTPUT',
    options: ['[1, 2, 3, 4]', '[1, 4, 9, 16]', '[(1,), (2,), (3,), (4,)]', 'Error'],
    correctAnswer: 1,
    explanation: 'Lambda functions are anonymous functions. "lambda x: x**2" squares its input. map() applies this function to each element in [1,2,3,4], producing [1, 4, 9, 16].',
    difficulty: 3,
    points: 15,
    codeSnippet: 'result = list(map(lambda x: x**2, [1, 2, 3, 4]))\nprint(result)'
  },
  {
    question: 'A function defined inside another function can access variables from the outer function.',
    questionType: 'TRUE_FALSE',
    options: ['True', 'False'],
    correctAnswer: 0,
    explanation: 'This is called "closure" in Python. Inner functions can access (read) variables from their enclosing scope. To modify them, you would need the "nonlocal" keyword.',
    difficulty: 2,
    points: 10
  },

  // Data Structures (5 questions)
  {
    question: 'What is the output of: print(len({1, 2, 2, 3, 3, 3}))',
    questionType: 'CODE_OUTPUT',
    options: ['6', '3', '1', 'Error'],
    correctAnswer: 1,
    explanation: 'Sets in Python contain only unique elements. {1, 2, 2, 3, 3, 3} becomes {1, 2, 3} after removing duplicates. The length is 3.',
    difficulty: 1,
    points: 10,
    codeSnippet: 'print(len({1, 2, 2, 3, 3, 3}))'
  },
  {
    question: 'How do you add a key-value pair to an existing dictionary?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'dict.add("key", "value")',
      'dict.append({"key": "value"})',
      'dict["key"] = "value"',
      'dict.insert("key", "value")',
    ],
    correctAnswer: 2,
    explanation: 'In Python, you add or update dictionary entries using square bracket notation: dict["key"] = "value". Dictionaries do not have add(), append(), or insert() methods for this purpose.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'What is the output of this code?',
    questionType: 'CODE_OUTPUT',
    options: ["['a', 'c']", "['b', 'c']", "['a', 'b', 'c']", "['b', 'c', 'd']"],
    correctAnswer: 1,
    explanation: 'List slicing with [1:3] extracts elements from index 1 up to (but not including) index 3. From ["a", "b", "c", "d"], indices 1 and 2 are "b" and "c", giving ["b", "c"].',
    difficulty: 2,
    points: 10,
    codeSnippet: 'my_list = ["a", "b", "c", "d"]\nprint(my_list[1:3])'
  },
  {
    question: 'Which method removes and returns the last element from a list?',
    questionType: 'SINGLE_CHOICE',
    options: ['remove()', 'pop()', 'del()', 'discard()'],
    correctAnswer: 1,
    explanation: 'pop() removes and returns the last element (or element at specified index). remove() removes by value (not index) and returns None. del is a statement, not a method. discard() is for sets.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'What is the output of this code?',
    questionType: 'CODE_OUTPUT',
    options: ["{'a': 1, 'b': 2}", "{'a': 1, 'b': 3}", "{'a': 1, 'b': 2, 'b': 3}", 'Error'],
    correctAnswer: 1,
    explanation: 'When you update a dictionary with another dictionary, existing keys get their values overwritten. The key "b" exists in both, so its value is updated from 2 to 3.',
    difficulty: 3,
    points: 15,
    codeSnippet: 'd = {"a": 1, "b": 2}\nd.update({"b": 3})\nprint(d)'
  },
]

// =============================================================================
// SQL BASICS ASSESSMENT (15 questions, 20 min, 70% to pass)
// =============================================================================
const sqlBasicsQuestions: QuestionData[] = [
  // SELECT Statements (5 questions)
  {
    question: 'Which SQL keyword is used to retrieve data from a database?',
    questionType: 'SINGLE_CHOICE',
    options: ['GET', 'FETCH', 'SELECT', 'RETRIEVE'],
    correctAnswer: 2,
    explanation: 'SELECT is the SQL keyword used to retrieve data from a database. It is the most commonly used SQL command.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'What does SELECT * FROM employees; return?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'The first row from the employees table',
      'All columns from all rows in the employees table',
      'Only the primary key column',
      'A count of all employees',
    ],
    correctAnswer: 1,
    explanation: 'The asterisk (*) is a wildcard that selects all columns. Without a WHERE clause, it returns all rows. So SELECT * FROM employees returns every column of every row.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'How do you select only unique values from a column?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'SELECT UNIQUE column_name FROM table;',
      'SELECT DISTINCT column_name FROM table;',
      'SELECT DIFFERENT column_name FROM table;',
      'SELECT SINGLE column_name FROM table;',
    ],
    correctAnswer: 1,
    explanation: 'DISTINCT is the SQL keyword that eliminates duplicate values from the result set. SELECT DISTINCT column_name returns only unique values.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'What is the correct syntax to give a column an alias?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'SELECT first_name RENAME fname FROM employees;',
      'SELECT first_name AS fname FROM employees;',
      'SELECT first_name = fname FROM employees;',
      'SELECT first_name ALIAS fname FROM employees;',
    ],
    correctAnswer: 1,
    explanation: 'The AS keyword is used to give a column (or table) a temporary alias in the result set. This makes output more readable and is useful for complex expressions.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'SELECT can only retrieve data from one table at a time.',
    questionType: 'TRUE_FALSE',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'False. SELECT can retrieve data from multiple tables using JOINs, subqueries, or by listing multiple tables in the FROM clause (though JOINs are the preferred method).',
    difficulty: 2,
    points: 10
  },

  // Filtering with WHERE, AND, OR (5 questions)
  {
    question: 'Which operator is used to search for a pattern in SQL?',
    questionType: 'SINGLE_CHOICE',
    options: ['MATCH', 'LIKE', 'PATTERN', 'REGEX'],
    correctAnswer: 1,
    explanation: 'The LIKE operator is used for pattern matching in SQL. It uses % as a wildcard for any sequence of characters and _ for a single character.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'What does this query return: SELECT * FROM products WHERE price BETWEEN 10 AND 20;',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Products with price greater than 10 and less than 20',
      'Products with price >= 10 and <= 20',
      'Products with price equal to 10 or 20 only',
      'Products with price less than 10 or greater than 20',
    ],
    correctAnswer: 1,
    explanation: 'BETWEEN is inclusive on both ends. It is equivalent to price >= 10 AND price <= 20. So a product with price 10 or 20 would be included.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'What is the output of: WHERE department = "Sales" AND salary > 50000 OR role = "Manager"',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Sales employees earning over 50000, or any Manager',
      'Sales Managers earning over 50000',
      'All Sales employees, or Managers earning over 50000',
      'Only Sales Managers',
    ],
    correctAnswer: 0,
    explanation: 'AND has higher precedence than OR. So this is evaluated as: (department="Sales" AND salary>50000) OR role="Manager". Use parentheses to make intent clear.',
    difficulty: 3,
    points: 15
  },
  {
    question: 'Which operator checks if a value is within a list of values?',
    questionType: 'SINGLE_CHOICE',
    options: ['CONTAINS', 'IN', 'EXISTS', 'WITHIN'],
    correctAnswer: 1,
    explanation: 'The IN operator checks if a value matches any value in a list. Example: WHERE country IN ("USA", "Canada", "Mexico") is equivalent to multiple OR conditions.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'How do you check for NULL values in SQL?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'WHERE column = NULL',
      'WHERE column == NULL',
      'WHERE column IS NULL',
      'WHERE column EQUALS NULL',
    ],
    correctAnswer: 2,
    explanation: 'NULL is a special value representing unknown or missing data. You cannot compare it with = or ==. You must use IS NULL or IS NOT NULL.',
    difficulty: 2,
    points: 10
  },

  // JOINs and Aggregations (5 questions)
  {
    question: 'Which JOIN returns all rows from the left table and matching rows from the right table?',
    questionType: 'SINGLE_CHOICE',
    options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'],
    correctAnswer: 1,
    explanation: 'LEFT JOIN (or LEFT OUTER JOIN) returns all rows from the left table, and the matched rows from the right table. If no match, NULL values are returned for right table columns.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'What does COUNT(*) return?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'The number of non-NULL values',
      'The total number of rows',
      'The number of distinct values',
      'The sum of all numeric values',
    ],
    correctAnswer: 1,
    explanation: 'COUNT(*) counts all rows in the result set, including rows with NULL values. COUNT(column_name) counts only non-NULL values in that specific column.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'Which clause is used to filter groups after GROUP BY?',
    questionType: 'SINGLE_CHOICE',
    options: ['WHERE', 'HAVING', 'FILTER', 'GROUP FILTER'],
    correctAnswer: 1,
    explanation: 'HAVING filters groups after aggregation (GROUP BY). WHERE filters rows before aggregation. Example: HAVING COUNT(*) > 5 keeps only groups with more than 5 rows.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'What is the correct order of SQL clauses?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'SELECT, WHERE, FROM, GROUP BY, ORDER BY',
      'SELECT, FROM, WHERE, ORDER BY, GROUP BY',
      'SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY',
      'FROM, SELECT, WHERE, GROUP BY, ORDER BY',
    ],
    correctAnswer: 2,
    explanation: 'The correct order is: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY. The database processes them in a different order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.',
    difficulty: 3,
    points: 15
  },
  {
    question: 'INNER JOIN returns rows only when there is a match in both tables.',
    questionType: 'TRUE_FALSE',
    options: ['True', 'False'],
    correctAnswer: 0,
    explanation: 'True. INNER JOIN returns only the rows where there is a match in both tables based on the join condition. Unmatched rows from either table are not included.',
    difficulty: 2,
    points: 10
  },
]

// =============================================================================
// DATA SCIENCE CONCEPTS ASSESSMENT (25 questions, 40 min, 65% to pass)
// =============================================================================
const dataScienceConceptsQuestions: QuestionData[] = [
  // Statistics Basics (5 questions)
  {
    question: 'What is the median of the dataset: [3, 7, 2, 9, 5]?',
    questionType: 'SINGLE_CHOICE',
    options: ['5', '5.2', '7', '3'],
    correctAnswer: 0,
    explanation: 'To find the median, sort the data: [2, 3, 5, 7, 9]. The median is the middle value. With 5 numbers, the middle (3rd) value is 5.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'Which measure of central tendency is most affected by outliers?',
    questionType: 'SINGLE_CHOICE',
    options: ['Mean', 'Median', 'Mode', 'All equally affected'],
    correctAnswer: 0,
    explanation: 'The mean (average) is heavily influenced by extreme values. For example, [1,2,3,4,100] has mean=22 but median=3. Median is more robust to outliers.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'Standard deviation measures what property of data?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Central tendency',
      'Spread/dispersion',
      'Skewness',
      'Correlation',
    ],
    correctAnswer: 1,
    explanation: 'Standard deviation measures how spread out the data is from the mean. A low standard deviation means data points cluster close to the mean; high means they are spread out.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'A correlation coefficient of -0.95 indicates:',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Weak positive relationship',
      'Strong positive relationship',
      'Weak negative relationship',
      'Strong negative relationship',
    ],
    correctAnswer: 3,
    explanation: 'Correlation ranges from -1 to 1. Values close to -1 indicate a strong negative relationship (as one variable increases, the other decreases). -0.95 is very strong and negative.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'In a normal distribution, approximately what percentage of data falls within 2 standard deviations of the mean?',
    questionType: 'SINGLE_CHOICE',
    options: ['68%', '95%', '99.7%', '50%'],
    correctAnswer: 1,
    explanation: 'The 68-95-99.7 rule: about 68% within 1 SD, 95% within 2 SDs, and 99.7% within 3 SDs of the mean in a normal distribution.',
    difficulty: 3,
    points: 15
  },

  // Machine Learning Concepts (10 questions)
  {
    question: 'Which type of machine learning uses labeled data for training?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Unsupervised learning',
      'Supervised learning',
      'Reinforcement learning',
      'Semi-supervised learning',
    ],
    correctAnswer: 1,
    explanation: 'Supervised learning uses labeled data (input-output pairs) to learn a mapping function. Unsupervised learning finds patterns in unlabeled data.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'Which algorithm is typically used for classification problems?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Linear Regression',
      'Logistic Regression',
      'Decision Trees',
      'K-Means',
    ],
    correctAnswer: [1, 2],
    explanation: 'Logistic Regression (despite its name) and Decision Trees are used for classification. Linear Regression is for predicting continuous values. K-Means is for clustering (unsupervised).',
    difficulty: 2,
    points: 15
  },
  {
    question: 'What is overfitting in machine learning?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Model performs poorly on training data',
      'Model performs well on training data but poorly on new data',
      'Model is too simple to capture patterns',
      'Model takes too long to train',
    ],
    correctAnswer: 1,
    explanation: 'Overfitting occurs when a model learns the training data too well, including noise and outliers, and fails to generalize to new, unseen data.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'Which technique helps prevent overfitting?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Cross-validation',
      'Regularization',
      'Using more training data',
      'Increasing model complexity',
    ],
    correctAnswer: [0, 1, 2],
    explanation: 'Cross-validation, regularization (L1/L2), and more training data all help prevent overfitting. Increasing model complexity typically increases overfitting risk.',
    difficulty: 3,
    points: 15
  },
  {
    question: 'What does the "K" in K-Nearest Neighbors represent?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Number of features',
      'Number of clusters',
      'Number of neighbors to consider',
      'Number of iterations',
    ],
    correctAnswer: 2,
    explanation: 'In KNN, K is the number of nearest neighbors used to make a prediction. A new point is classified based on the majority class of its K nearest neighbors.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'Which metric is best for imbalanced classification datasets?',
    questionType: 'SINGLE_CHOICE',
    options: ['Accuracy', 'F1 Score', 'R-squared', 'Mean Squared Error'],
    correctAnswer: 1,
    explanation: 'F1 Score balances precision and recall, making it better for imbalanced data. Accuracy can be misleading (99% accuracy with 99% majority class is not useful).',
    difficulty: 3,
    points: 15
  },
  {
    question: 'Train/test split is used to:',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Speed up training',
      'Evaluate model performance on unseen data',
      'Increase model accuracy',
      'Reduce data storage',
    ],
    correctAnswer: 1,
    explanation: 'Train/test split reserves a portion of data (test set) that the model never sees during training. This allows evaluation of how well the model generalizes.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'Random Forest is an ensemble of which type of model?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Linear regression models',
      'Neural networks',
      'Decision trees',
      'Support vector machines',
    ],
    correctAnswer: 2,
    explanation: 'Random Forest is an ensemble learning method that builds multiple decision trees and combines their predictions through voting (classification) or averaging (regression).',
    difficulty: 2,
    points: 10
  },
  {
    question: 'Gradient descent is an optimization algorithm used to find model parameters that minimize a loss function.',
    questionType: 'TRUE_FALSE',
    options: ['True', 'False'],
    correctAnswer: 0,
    explanation: 'True. Gradient descent iteratively adjusts parameters in the direction that reduces the loss function, eventually finding (local) minimum values.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'Which of these is a hyperparameter?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Weights in a neural network',
      'Learning rate',
      'Predicted output',
      'Training loss',
    ],
    correctAnswer: 1,
    explanation: 'Hyperparameters are set before training (like learning rate, number of layers). Model parameters (weights) are learned during training.',
    difficulty: 3,
    points: 15
  },

  // Data Visualization (5 questions)
  {
    question: 'Which chart type is best for showing the distribution of a continuous variable?',
    questionType: 'SINGLE_CHOICE',
    options: ['Pie chart', 'Bar chart', 'Histogram', 'Line chart'],
    correctAnswer: 2,
    explanation: 'Histograms show the distribution of continuous data by grouping values into bins and displaying frequency. They reveal shape, spread, and potential outliers.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'A scatter plot is used to show:',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Proportions of a whole',
      'Relationship between two continuous variables',
      'Changes over time',
      'Distribution of categories',
    ],
    correctAnswer: 1,
    explanation: 'Scatter plots display the relationship between two continuous variables, helping identify correlations, clusters, and outliers in the data.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'Which visualization would best show how a part relates to the whole?',
    questionType: 'SINGLE_CHOICE',
    options: ['Box plot', 'Pie chart', 'Scatter plot', 'Histogram'],
    correctAnswer: 1,
    explanation: 'Pie charts show proportions/percentages of a whole. However, bar charts are often preferred for accuracy. Use pie charts sparingly and only for few categories.',
    difficulty: 1,
    points: 10
  },
  {
    question: 'A box plot displays which statistics? (Select all that apply)',
    questionType: 'MULTIPLE_CHOICE',
    options: ['Median', 'Mean', 'Quartiles', 'Outliers'],
    correctAnswer: [0, 2, 3],
    explanation: 'Box plots show the median (center line), quartiles (box edges: Q1 and Q3), and outliers (points beyond whiskers). The mean is not typically shown.',
    difficulty: 2,
    points: 15
  },
  {
    question: 'Heat maps are useful for visualizing:',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Time series data',
      'Correlation matrices',
      'Single variable distributions',
      'Categorical proportions',
    ],
    correctAnswer: 1,
    explanation: 'Heat maps use color intensity to show values in a matrix format, making them ideal for visualizing correlation matrices, confusion matrices, or any 2D data.',
    difficulty: 2,
    points: 10
  },

  // Data Cleaning (5 questions)
  {
    question: 'Which is NOT a valid approach to handle missing values?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Delete rows with missing values',
      'Fill with mean/median',
      'Use machine learning to predict missing values',
      'Ignore them completely during analysis',
    ],
    correctAnswer: 3,
    explanation: 'Ignoring missing values without handling them can lead to errors or biased results. Valid approaches include deletion, imputation (mean/median/mode), or prediction-based methods.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'What is feature scaling?',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Removing unnecessary features',
      'Creating new features from existing ones',
      'Normalizing or standardizing feature values',
      'Selecting the most important features',
    ],
    correctAnswer: 2,
    explanation: 'Feature scaling transforms features to a similar range (e.g., 0-1 for normalization, mean=0/std=1 for standardization). This helps algorithms that are sensitive to scale.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'One-hot encoding is used for:',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Handling missing values',
      'Converting categorical variables to numerical',
      'Removing outliers',
      'Reducing dimensionality',
    ],
    correctAnswer: 1,
    explanation: 'One-hot encoding converts categorical variables into binary columns (one column per category with 0/1 values). This allows algorithms to process categorical data.',
    difficulty: 2,
    points: 10
  },
  {
    question: 'An outlier can be detected using which method?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Z-score (values beyond 3 standard deviations)',
      'IQR method (values beyond 1.5 * IQR)',
      'Visual inspection with box plots',
      'One-hot encoding',
    ],
    correctAnswer: [0, 1, 2],
    explanation: 'Z-scores, IQR method, and visual inspection are all valid outlier detection methods. One-hot encoding is for categorical conversion, not outlier detection.',
    difficulty: 3,
    points: 15
  },
  {
    question: 'Data leakage occurs when:',
    questionType: 'SINGLE_CHOICE',
    options: [
      'Data is lost during transfer',
      'Training data contains information from the test set',
      'Features have missing values',
      'The dataset is too small',
    ],
    correctAnswer: 1,
    explanation: 'Data leakage happens when information from outside the training dataset is used to create the model, leading to overly optimistic performance estimates.',
    difficulty: 3,
    points: 15
  },
]

// =============================================================================
// ASSESSMENT DATA
// =============================================================================
const assessments: AssessmentData[] = [
  {
    name: 'Python Fundamentals',
    slug: 'python-fundamentals',
    description: 'Test your knowledge of Python basics including variables, control flow, functions, and data structures. This assessment covers the essential building blocks of Python programming.',
    difficulty: 'Beginner',
    timeLimit: 30,
    passingScore: 70,
    skillArea: 'Python',
    tags: ['Python', 'Programming', 'Beginner'],
    questions: pythonFundamentalsQuestions
  },
  {
    name: 'SQL Basics',
    slug: 'sql-basics',
    description: 'Evaluate your SQL skills with questions on SELECT statements, filtering data, JOINs, and aggregation functions. Essential knowledge for working with relational databases.',
    difficulty: 'Beginner',
    timeLimit: 20,
    passingScore: 70,
    skillArea: 'SQL',
    tags: ['SQL', 'Database', 'Beginner'],
    questions: sqlBasicsQuestions
  },
  {
    name: 'Data Science Concepts',
    slug: 'data-science-concepts',
    description: 'Comprehensive assessment covering statistics, machine learning fundamentals, data visualization, and data cleaning techniques. Test your understanding of core data science principles.',
    difficulty: 'Intermediate',
    timeLimit: 40,
    passingScore: 65,
    skillArea: 'Data Science',
    tags: ['Data Science', 'Machine Learning', 'Statistics', 'Intermediate'],
    questions: dataScienceConceptsQuestions
  }
]

// =============================================================================
// SEEDING FUNCTION
// =============================================================================
export async function seedAssessments(): Promise<void> {
  console.log('\n📝 Seeding skill assessments...')

  for (const assessmentData of assessments) {
    // Note: tags can be used in future for filtering/search functionality
    const { questions, tags: _tags, ...assessmentFields } = assessmentData

    // Upsert the assessment
    const assessment = await prisma.skillAssessment.upsert({
      where: { slug: assessmentFields.slug },
      update: {
        name: assessmentFields.name,
        description: assessmentFields.description,
        difficulty: assessmentFields.difficulty,
        timeLimit: assessmentFields.timeLimit,
        passingScore: assessmentFields.passingScore,
        totalQuestions: questions.length,
        skillArea: assessmentFields.skillArea,
      },
      create: {
        name: assessmentFields.name,
        slug: assessmentFields.slug,
        description: assessmentFields.description,
        difficulty: assessmentFields.difficulty,
        timeLimit: assessmentFields.timeLimit,
        passingScore: assessmentFields.passingScore,
        totalQuestions: questions.length,
        skillArea: assessmentFields.skillArea,
      },
    })

    console.log(`  - Created assessment: ${assessment.name}`)

    // Delete existing questions for this assessment (to allow re-seeding)
    await prisma.assessmentQuestion.deleteMany({
      where: { assessmentId: assessment.id }
    })

    // Create questions
    for (const questionData of questions) {
      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: assessment.id,
          question: questionData.question,
          questionType: questionData.questionType,
          options: JSON.stringify(questionData.options),
          correctAnswer: JSON.stringify(questionData.correctAnswer),
          explanation: questionData.explanation,
          difficulty: questionData.difficulty,
          points: questionData.points,
          codeSnippet: questionData.codeSnippet || null,
        }
      })
    }

    console.log(`    - Created ${questions.length} questions`)
  }

  // Verify seeding
  const assessmentCount = await prisma.skillAssessment.count()
  const questionCount = await prisma.assessmentQuestion.count()

  console.log(`\n  ✅ Assessment seeding complete:`)
  console.log(`     - ${assessmentCount} assessments created`)
  console.log(`     - ${questionCount} questions created`)

  // Detailed breakdown
  for (const assessment of assessments) {
    const dbAssessment = await prisma.skillAssessment.findUnique({
      where: { slug: assessment.slug },
      include: { _count: { select: { questions: true } } }
    })
    if (dbAssessment) {
      // Calculate difficulty distribution
      const questions = await prisma.assessmentQuestion.findMany({
        where: { assessmentId: dbAssessment.id },
        select: { difficulty: true }
      })
      const easy = questions.filter(q => q.difficulty <= 2).length
      const medium = questions.filter(q => q.difficulty === 3).length
      const hard = questions.filter(q => q.difficulty >= 4).length

      console.log(`     - ${dbAssessment.name}: ${dbAssessment._count.questions} questions`)
      console.log(`       (Easy: ${easy}, Medium: ${medium}, Hard: ${hard})`)
    }
  }
}

// Allow running directly
if (require.main === module) {
  seedAssessments()
    .then(async () => {
      await prisma.$disconnect()
      console.log('\n✅ Assessment seeding completed successfully!')
    })
    .catch(async (e) => {
      console.error('Error seeding assessments:', e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
