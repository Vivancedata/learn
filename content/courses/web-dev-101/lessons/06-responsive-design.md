---
id: responsive-design
title: Responsive Web Design - Mobile-First Development
type: lesson
duration: 70 mins
order: 6
section: responsive-design
prevLessonId: javascript-intro
---

# Responsive Web Design - Mobile-First Development

In 2024, over 60% of web traffic comes from mobile devices. Responsive design ensures your website looks great on phones, tablets, and desktops—all from a single codebase.

## What is Responsive Design?

Responsive web design means your website **adapts** to any screen size automatically.

**Same website, different experiences:**
- **Phone (375px):** Single column, stacked content, touch-friendly buttons
- **Tablet (768px):** Two columns, larger images
- **Desktop (1920px):** Multi-column layout, sidebars, hover effects

## The Mobile-First Approach

Start designing for mobile, then enhance for larger screens.

**Why mobile-first?**
- Easier to scale up than down
- Forces focus on essential content
- Better performance (load what's needed)
- Matches real-world usage patterns

## The Viewport Meta Tag

**Critical first step** - tells browsers how to handle mobile display:

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Responsive Site</title>
</head>
```

**Without this tag:** Mobile browsers will render at 980px width and zoom out (tiny text)
**With this tag:** Site renders at actual device width (readable)

## Media Queries - The Foundation

Media queries apply different CSS based on screen size.

```css
/* Mobile styles (default - no media query needed) */
.container {
  width: 100%;
  padding: 10px;
}

/* Tablet and up (768px+) */
@media (min-width: 768px) {
  .container {
    width: 750px;
    margin: 0 auto;
  }
}

/* Desktop and up (1024px+) */
@media (min-width: 1024px) {
  .container {
    width: 1000px;
  }
}
```

## Common Breakpoints

Industry-standard breakpoints for different devices:

```css
/* Extra small devices (phones, less than 576px) */
/* No media query needed - this is the default */

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) { ... }

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) { ... }

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) { ... }

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) { ... }
```

## Flexible Grids with Flexbox

Flexbox makes responsive layouts easy.

```css
/* Navigation that wraps on small screens */
.nav {
  display: flex;
  flex-wrap: wrap;  /* Wraps items on small screens */
  gap: 10px;
}

.nav-item {
  flex: 1 1 200px;  /* Grow, shrink, min-width 200px */
}
```

**Result:**
- **Mobile:** Items stack vertically (each 100% width)
- **Tablet:** 2-3 items per row
- **Desktop:** All items in one row

## CSS Grid for Complex Layouts

Grid is perfect for page-level layouts.

```css
.page {
  display: grid;
  grid-template-columns: 1fr;  /* Mobile: single column */
  gap: 20px;
}

@media (min-width: 768px) {
  .page {
    grid-template-columns: 1fr 3fr;  /* Tablet: sidebar + main */
  }
}

@media (min-width: 1024px) {
  .page {
    grid-template-columns: 1fr 3fr 1fr;  /* Desktop: sidebar + main + ads */
  }
}
```

## Responsive Images

**Problem:** Loading a 3000px image on a phone wastes bandwidth.

**Solution 1: CSS max-width**
```css
img {
  max-width: 100%;
  height: auto;  /* Maintains aspect ratio */
}
```

**Solution 2: Srcset (different images for different screens)**
```html
<img
  src="small.jpg"
  srcset="small.jpg 480w, medium.jpg 768w, large.jpg 1200w"
  sizes="(max-width: 600px) 480px, (max-width: 900px) 768px, 1200px"
  alt="Responsive image"
>
```

**Solution 3: Picture element (art direction)**
```html
<picture>
  <source media="(min-width: 1024px)" srcset="desktop.jpg">
  <source media="(min-width: 768px)" srcset="tablet.jpg">
  <img src="mobile.jpg" alt="Responsive image">
</picture>
```

## Responsive Typography

Text should scale with screen size.

```css
/* Mobile */
body {
  font-size: 16px;
}

h1 {
  font-size: 28px;
}

/* Tablet */
@media (min-width: 768px) {
  body {
    font-size: 18px;
  }

  h1 {
    font-size: 36px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  body {
    font-size: 20px;
  }

  h1 {
    font-size: 48px;
  }
}
```

**Modern approach: clamp()**
```css
h1 {
  font-size: clamp(28px, 5vw, 48px);
  /* min: 28px, preferred: 5% of viewport width, max: 48px */
}
```

## Complete Responsive Example - Product Card Grid

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: clamp(24px, 5vw, 40px);
      margin-bottom: 20px;
      color: #333;
    }

    .product-grid {
      display: grid;
      grid-template-columns: 1fr;  /* Mobile: 1 column */
      gap: 20px;
    }

    @media (min-width: 576px) {
      .product-grid {
        grid-template-columns: repeat(2, 1fr);  /* Small: 2 columns */
      }
    }

    @media (min-width: 992px) {
      .product-grid {
        grid-template-columns: repeat(3, 1fr);  /* Desktop: 3 columns */
      }
    }

    @media (min-width: 1200px) {
      .product-grid {
        grid-template-columns: repeat(4, 1fr);  /* Large: 4 columns */
      }
    }

    .product-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .product-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .product-info {
      padding: 15px;
    }

    .product-title {
      font-size: 18px;
      margin-bottom: 10px;
      color: #333;
    }

    .product-price {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
      margin-bottom: 15px;
    }

    .buy-button {
      width: 100%;
      padding: 12px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }

    .buy-button:hover {
      background-color: #0056b3;
    }

    /* Hide desktop-only content on mobile */
    .desktop-only {
      display: none;
    }

    @media (min-width: 992px) {
      .desktop-only {
        display: block;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Our Products</h1>

    <div class="product-grid">
      <div class="product-card">
        <img src="https://via.placeholder.com/400x200/FF6B6B/FFFFFF?text=Product+1" alt="Product 1">
        <div class="product-info">
          <h3 class="product-title">Wireless Headphones</h3>
          <p class="desktop-only">Premium sound quality with noise cancellation</p>
          <div class="product-price">$99.99</div>
          <button class="buy-button">Add to Cart</button>
        </div>
      </div>

      <div class="product-card">
        <img src="https://via.placeholder.com/400x200/4ECDC4/FFFFFF?text=Product+2" alt="Product 2">
        <div class="product-info">
          <h3 class="product-title">Smart Watch</h3>
          <p class="desktop-only">Track your fitness and stay connected</p>
          <div class="product-price">$299.99</div>
          <button class="buy-button">Add to Cart</button>
        </div>
      </div>

      <div class="product-card">
        <img src="https://via.placeholder.com/400x200/45B7D1/FFFFFF?text=Product+3" alt="Product 3">
        <div class="product-info">
          <h3 class="product-title">Laptop Stand</h3>
          <p class="desktop-only">Ergonomic aluminum design</p>
          <div class="product-price">$49.99</div>
          <button class="buy-button">Add to Cart</button>
        </div>
      </div>

      <div class="product-card">
        <img src="https://via.placeholder.com/400x200/FFA07A/FFFFFF?text=Product+4" alt="Product 4">
        <div class="product-info">
          <h3 class="product-title">USB-C Hub</h3>
          <p class="desktop-only">7-in-1 connectivity solution</p>
          <div class="product-price">$39.99</div>
          <button class="buy-button">Add to Cart</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

## Mobile Navigation Patterns

**Hamburger menu** for mobile, horizontal nav for desktop:

```html
<nav class="navbar">
  <div class="logo">MySite</div>
  <button class="hamburger" id="hamburger">☰</button>
  <ul class="nav-menu" id="navMenu">
    <li><a href="#home">Home</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="#services">Services</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>

<style>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #333;
  color: white;
}

.hamburger {
  display: block;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.nav-menu {
  display: none;  /* Hidden on mobile */
  flex-direction: column;
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  background-color: #333;
  list-style: none;
}

.nav-menu.active {
  display: flex;  /* Show when hamburger clicked */
}

.nav-menu a {
  color: white;
  text-decoration: none;
  padding: 15px;
  display: block;
}

/* Desktop */
@media (min-width: 768px) {
  .hamburger {
    display: none;  /* Hide hamburger */
  }

  .nav-menu {
    display: flex;  /* Always show */
    flex-direction: row;
    position: static;
    width: auto;
  }

  .nav-menu a {
    padding: 10px 15px;
  }
}
</style>

<script>
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});
</script>
```

## Testing Responsive Design

**Browser DevTools:**
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Test different devices: iPhone, iPad, Desktop
4. Check landscape and portrait orientations

**Real device testing:**
- Test on actual phones/tablets when possible
- Use services like BrowserStack or LambdaTest
- Check touch targets (buttons should be 44px+ for mobile)

## Best Practices

1. **Mobile-first CSS**
   - Write mobile styles first (no media query)
   - Add complexity with `@media (min-width: ...)` for larger screens

2. **Touch-friendly design**
   - Buttons minimum 44x44px
   - Adequate spacing between clickable elements
   - No hover-only interactions

3. **Performance**
   - Optimize images for mobile bandwidth
   - Load critical CSS inline
   - Lazy load images below the fold

4. **Accessibility**
   - Sufficient color contrast
   - Readable font sizes (16px minimum)
   - Keyboard navigation support

5. **Content priority**
   - Most important content first
   - Hide optional elements on mobile
   - Progressive disclosure (show more on larger screens)

## Knowledge Check

1. What is the mobile-first approach?
   - Start designing for mobile screens, then progressively enhance for larger screens
   - Design for desktop first
   - Only design for mobile devices
   - Use separate mobile and desktop sites

2. What does the viewport meta tag do?
   - Tells browsers to render the page at the device's actual width
   - Sets the page background color
   - Makes images responsive
   - Enables JavaScript

3. Which CSS property makes images responsive?
   - max-width: 100%; height: auto;
   - width: 100%;
   - responsive: true;
   - display: responsive;

4. What is the purpose of media queries?
   - Apply different CSS styles based on screen size or device characteristics
   - Query a database
   - Fetch data from APIs
   - Handle user input

5. What is a good minimum touch target size for mobile?
   - 44x44 pixels for comfortable touch interaction
   - 10x10 pixels
   - 100x100 pixels
   - 20x20 pixels
