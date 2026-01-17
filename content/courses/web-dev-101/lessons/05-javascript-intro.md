---
id: javascript-intro
title: JavaScript Introduction - Making Pages Interactive
type: lesson
duration: 60 mins
order: 5
section: javascript-basics
prevLessonId: css-basics
---

# JavaScript Introduction - Making Pages Interactive

JavaScript brings websites to life! While HTML structures and CSS styles, JavaScript adds interactivity—animations, form validation, dynamic content, and user interactions.

## What is JavaScript?

JavaScript is the programming language of the web. Every interactive website uses it.

**Examples of JavaScript in action:**
- Dropdown menus
- Image carousels
- Form validation
- Real-time updates
- Interactive maps
- Games

## Your First JavaScript

```html
<script>
  console.log("Hello, JavaScript!");
</script>
```

**Check the browser console** (F12 → Console tab) to see output!

## Variables and Data Types

```javascript
// Variables
let name = "Alice";
let age = 25;
const pi = 3.14159;  // const = can't change

// Data types
let number = 42;              // Number
let text = "Hello";           // String
let isActive = true;          // Boolean
let nothing = null;           // Null
let notDefined = undefined;   // Undefined
let items = [1, 2, 3];       // Array
let person = {name: "Bob", age: 30};  // Object
```

## Functions

```javascript
// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

// Function call
let message = greet("Alice");  // "Hello, Alice!"

// Arrow function (modern way)
const add = (a, b) => a + b;
let sum = add(5, 3);  // 8
```

## DOM Manipulation

The DOM (Document Object Model) represents your HTML. JavaScript can change it!

```javascript
// Select elements
let heading = document.getElementById("title");
let buttons = document.getElementsByClassName("btn");
let para = document.querySelector("p");

// Change content
heading.textContent = "New Title";
heading.innerHTML = "<strong>Bold Title</strong>";

// Change styles
heading.style.color = "blue";
heading.style.fontSize = "32px";

// Add/remove classes
heading.classList.add("highlight");
heading.classList.remove("old-class");
heading.classList.toggle("active");
```

## Events - Responding to User Actions

```javascript
// Click event
document.getElementById("myButton").addEventListener("click", function() {
  alert("Button clicked!");
});

// Mouse hover
element.addEventListener("mouseenter", function() {
  this.style.backgroundColor = "yellow";
});

// Form submit
document.getElementById("myForm").addEventListener("submit", function(e) {
  e.preventDefault();  // Stop page reload
  console.log("Form submitted!");
});
```

## Practical Example - Interactive Button

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .button:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <button id="counter-btn" class="button">Clicks: 0</button>

  <script>
    let count = 0;
    let button = document.getElementById("counter-btn");

    button.addEventListener("click", function() {
      count++;
      button.textContent = "Clicks: " + count;
    });
  </script>
</body>
</html>
```

## Common JavaScript Patterns

**Show/Hide Elements**
```javascript
function toggle(id) {
  let element = document.getElementById(id);
  if (element.style.display === "none") {
    element.style.display = "block";
  } else {
    element.style.display = "none";
  }
}
```

**Form Validation**
```javascript
function validateEmail(email) {
  return email.includes("@");
}

document.getElementById("emailForm").addEventListener("submit", function(e) {
  e.preventDefault();
  let email = document.getElementById("email").value;

  if (validateEmail(email)) {
    alert("Email is valid!");
  } else {
    alert("Please enter a valid email");
  }
});
```

**Fetch Data from API**
```javascript
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    document.getElementById("result").textContent = data.value;
  });
```

## Knowledge Check

1. What does JavaScript add to websites?
   - Interactivity and dynamic behavior
   - Structure
   - Styling
   - Hosting

2. How do you select an element with id="header"?
   - document.getElementById("header")
   - document.getElement("header")
   - getElementById("header")
   - select("#header")

3. What does addEventListener() do?
   - Attaches a function to run when an event occurs
   - Adds elements to the page
   - Changes CSS styles
   - Deletes elements

4. What does e.preventDefault() do in form handling?
   - Stops the default form submission (page reload)
   - Submits the form
   - Deletes the form
   - Validates the form

5. What is the DOM?
   - Document Object Model - the HTML structure JavaScript can manipulate
   - A JavaScript framework
   - A CSS library
   - A web server
