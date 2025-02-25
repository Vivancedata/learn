---
id: html-basics
title: HTML Basics
type: lesson
duration: 60 mins
order: 3
section: html-fundamentals
prevLessonId: dev-tools
---

# Introduction to HTML

HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page semantically.

## Basic Structure

Every HTML document has a required structure that includes the following declarations:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
</head>
<body>
    <!-- Content goes here -->
</body>
</html>
```

Let's break down what each part does:

- `<!DOCTYPE html>`: Declares the document type and version of HTML
- `<html>`: The root element that contains all other HTML elements
- `<head>`: Contains meta-information about the document, like its title
- `<title>`: Sets the title of the page (appears in the browser tab)
- `<body>`: Contains the visible content of the page

## HTML Elements

HTML elements are represented by tags. Tags are enclosed in angle brackets, like `<tagname>`. Most tags come in pairs with an opening and closing tag:

```html
<tagname>Content goes here</tagname>
```

The closing tag has a forward slash before the tag name: `</tagname>`.

### Common HTML Elements

Here are some common HTML elements you'll use frequently:

#### Headings

HTML provides six levels of headings, from `<h1>` (most important) to `<h6>` (least important):

```html
<h1>This is a Heading 1</h1>
<h2>This is a Heading 2</h2>
<h3>This is a Heading 3</h3>
```

#### Paragraphs

The `<p>` tag defines a paragraph:

```html
<p>This is a paragraph of text.</p>
```

#### Links

The `<a>` tag creates a hyperlink:

```html
<a href="https://www.example.com">Visit Example.com</a>
```

#### Images

The `<img>` tag embeds an image:

```html
<img src="image.jpg" alt="Description of the image">
```

The `alt` attribute provides alternative text for screen readers and if the image fails to load.

#### Lists

HTML supports ordered lists (`<ol>`) and unordered lists (`<ul>`):

```html
<ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
</ul>

<ol>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ol>
```

## Semantic HTML

Semantic HTML uses tags that convey meaning about the structure of your content, not just how it looks. Some examples include:

- `<header>`: Represents introductory content
- `<nav>`: Contains navigation links
- `<main>`: Contains the main content
- `<article>`: Represents a self-contained composition
- `<section>`: Represents a standalone section
- `<footer>`: Represents a footer for a section or page

Using semantic HTML improves accessibility, SEO, and makes your code more readable.

## Knowledge Check

Test your understanding of HTML basics with these questions:

1. What does HTML stand for?
   - HyperText Markup Language
   - HighTech Modern Language
   - HyperTransfer Markup Language
   - HyperText Modern Links

2. Which tag is used to create a hyperlink?
   - `<link>`
   - `<a>`
   - `<href>`
   - `<url>`

3. What is the purpose of the `alt` attribute in an image tag?
   - To specify the image source
   - To provide alternative text for screen readers and if the image fails to load
   - To set the image dimensions
   - To add a border around the image

4. Which of these is a semantic HTML element?
   - `<div>`
   - `<span>`
   - `<article>`
   - `<b>`

5. What is the correct HTML for creating an unordered list?
   - `<list><i>Item 1</i><i>Item 2</i></list>`
   - `<ul><li>Item 1</li><li>Item 2</li></ul>`
   - `<ol><li>Item 1</li><li>Item 2</li></ol>`
   - `<unordered><item>Item 1</item><item>Item 2</item></unordered>`
