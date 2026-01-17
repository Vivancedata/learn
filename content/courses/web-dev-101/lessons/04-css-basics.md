---
id: css-basics
title: CSS Basics - Styling Your Web Pages
type: lesson
duration: 60 mins
order: 4
section: html-css-fundamentals
prevLessonId: html-basics
nextLessonId: javascript-intro
---

# CSS Basics - Styling Your Web Pages

CSS (Cascading Style Sheets) makes websites beautiful. While HTML provides structure, CSS provides style—colors, layouts, fonts, and animations.

## What is CSS?

CSS controls how HTML elements look. Think of HTML as the skeleton and CSS as the clothing and makeup.

```html
<!-- Without CSS: Plain, boring -->
<h1>Welcome</h1>

<!-- With CSS: Styled, attractive -->
<h1 style="color: blue; font-size: 48px;">Welcome</h1>
```

## Three Ways to Add CSS

**1. Inline CSS** (directly in HTML element)
```html
<p style="color: red; font-size: 16px;">Red text</p>
```

**2. Internal CSS** (in `<style>` tag)
```html
<head>
  <style>
    p {
      color: blue;
      font-size: 16px;
    }
  </style>
</head>
```

**3. External CSS** (separate file - BEST PRACTICE)
```html
<head>
  <link rel="stylesheet" href="styles.css">
</head>
```

## CSS Syntax

```css
selector {
  property: value;
  property: value;
}
```

Example:
```css
h1 {
  color: navy;
  font-size: 36px;
  text-align: center;
}
```

## Selectors - Targeting Elements

**Element Selector** (all elements of that type)
```css
p {
  color: gray;
}
```

**Class Selector** (elements with specific class)
```html
<p class="highlight">This is highlighted</p>
```
```css
.highlight {
  background-color: yellow;
}
```

**ID Selector** (one unique element)
```html
<div id="header">Header content</div>
```
```css
#header {
  background-color: #333;
  color: white;
}
```

## Colors

```css
/* Color names */
color: red;
background-color: blue;

/* Hex codes */
color: #FF0000;  /* Red */
background-color: #0000FF;  /* Blue */

/* RGB */
color: rgb(255, 0, 0);  /* Red */

/* RGBA (with transparency) */
background-color: rgba(0, 0, 255, 0.5);  /* Semi-transparent blue */
```

## Text Styling

```css
p {
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: bold;
  font-style: italic;
  text-align: center;
  text-decoration: underline;
  line-height: 1.6;
  letter-spacing: 2px;
}
```

## Box Model

Every element is a box with:
- Content
- Padding (space inside border)
- Border
- Margin (space outside border)

```css
div {
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 2px solid black;
  margin: 10px;
}
```

## Layout Basics

```css
/* Display */
div {
  display: block;    /* Takes full width */
  display: inline;   /* Only takes needed width */
  display: none;     /* Hidden */
}

/* Flexbox (modern layout) */
.container {
  display: flex;
  justify-content: center;  /* Horizontal alignment */
  align-items: center;      /* Vertical alignment */
}

/* Grid (modern layout) */
.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;  /* 3 equal columns */
  gap: 20px;
}
```

## Practical Example

```css
/* Navigation bar */
nav {
  background-color: #333;
  padding: 15px;
}

nav a {
  color: white;
  text-decoration: none;
  margin: 0 15px;
}

/* Card component */
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Button */
.button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}
```

## Knowledge Check

1. What does CSS stand for?
   - Cascading Style Sheets
   - Computer Style Sheets
   - Creative Style Sheets
   - Colorful Style Sheets

2. Which is the best practice for adding CSS to a website?
   - External CSS file linked with <link> tag
   - Inline styles only
   - Internal <style> tags in every page
   - No CSS needed

3. How do you select all elements with class="highlight"?
   - .highlight
   - #highlight
   - highlight
   - <highlight>

4. What does the box model consist of?
   - Content, padding, border, and margin
   - Only content and margin
   - Only border and padding
   - Background and color

5. What property makes text bold?
   - font-weight: bold
   - font-style: bold
   - text-weight: bold
   - bold: true
