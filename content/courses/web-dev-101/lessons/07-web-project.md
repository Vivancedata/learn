---
id: web-project
title: Build Your First Website - Portfolio Project
type: project
duration: 120 mins
order: 7
section: first-project
prevLessonId: responsive-design
---

# Build Your First Website - Portfolio Project

Time to put everything together! Build a complete personal portfolio website using HTML, CSS, and JavaScript. This project combines all the skills you've learned.

## Project Overview

**What you'll build:**
A responsive personal portfolio with:
- Hero section with your name and introduction
- About section with bio
- Projects showcase (3 sample projects)
- Contact form
- Responsive navigation
- Mobile-friendly design

**Technologies:**
- HTML5 for structure
- CSS3 for styling (Flexbox & Grid)
- JavaScript for interactivity
- Mobile-first responsive design

**Estimated time:** 2 hours

## Project Requirements

### Must Have:
✅ Responsive navigation (hamburger menu on mobile)
✅ Hero section with your name and tagline
✅ About section with bio and skills
✅ Projects section with at least 3 project cards
✅ Contact form with validation
✅ Mobile-responsive (works on phone, tablet, desktop)
✅ Clean, professional design

### Nice to Have:
- Smooth scrolling between sections
- Animations on scroll
- Dark mode toggle
- Social media links
- Download resume button

## Starter Template

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Name - Portfolio</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar" id="navbar">
    <div class="container">
      <div class="logo">YourName</div>
      <button class="hamburger" id="hamburger" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <ul class="nav-menu" id="navMenu">
        <li><a href="#home" class="nav-link">Home</a></li>
        <li><a href="#about" class="nav-link">About</a></li>
        <li><a href="#projects" class="nav-link">Projects</a></li>
        <li><a href="#contact" class="nav-link">Contact</a></li>
      </ul>
    </div>
  </nav>

  <!-- Hero Section -->
  <section id="home" class="hero">
    <div class="hero-content">
      <h1 class="hero-title">Hi, I'm <span class="highlight">Your Name</span></h1>
      <p class="hero-subtitle">Web Developer | Designer | Problem Solver</p>
      <a href="#projects" class="cta-button">View My Work</a>
    </div>
  </section>

  <!-- About Section -->
  <section id="about" class="about">
    <div class="container">
      <h2 class="section-title">About Me</h2>
      <div class="about-content">
        <div class="about-text">
          <p>I'm a passionate web developer with a love for creating beautiful, functional websites. I specialize in front-end development and enjoy bringing designs to life with clean, efficient code.</p>
          <p>When I'm not coding, you can find me exploring new technologies, contributing to open source, or enjoying a good cup of coffee.</p>
        </div>
        <div class="skills">
          <h3>Skills</h3>
          <div class="skill-tags">
            <span class="skill-tag">HTML5</span>
            <span class="skill-tag">CSS3</span>
            <span class="skill-tag">JavaScript</span>
            <span class="skill-tag">Responsive Design</span>
            <span class="skill-tag">Git</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Projects Section -->
  <section id="projects" class="projects">
    <div class="container">
      <h2 class="section-title">My Projects</h2>
      <div class="project-grid">

        <!-- Project 1 -->
        <div class="project-card">
          <div class="project-image">
            <img src="https://via.placeholder.com/400x300/667eea/ffffff?text=Project+1" alt="Project 1">
          </div>
          <div class="project-info">
            <h3>E-Commerce Website</h3>
            <p>A modern online store with shopping cart functionality and payment integration.</p>
            <div class="project-tech">
              <span>HTML</span>
              <span>CSS</span>
              <span>JavaScript</span>
            </div>
            <div class="project-links">
              <a href="#" class="btn-secondary">View Code</a>
              <a href="#" class="btn-primary">Live Demo</a>
            </div>
          </div>
        </div>

        <!-- Project 2 -->
        <div class="project-card">
          <div class="project-image">
            <img src="https://via.placeholder.com/400x300/f093fb/ffffff?text=Project+2" alt="Project 2">
          </div>
          <div class="project-info">
            <h3>Weather Dashboard</h3>
            <p>Real-time weather application using external API with beautiful UI.</p>
            <div class="project-tech">
              <span>API</span>
              <span>JavaScript</span>
              <span>CSS Grid</span>
            </div>
            <div class="project-links">
              <a href="#" class="btn-secondary">View Code</a>
              <a href="#" class="btn-primary">Live Demo</a>
            </div>
          </div>
        </div>

        <!-- Project 3 -->
        <div class="project-card">
          <div class="project-image">
            <img src="https://via.placeholder.com/400x300/4facfe/ffffff?text=Project+3" alt="Project 3">
          </div>
          <div class="project-info">
            <h3>Task Manager App</h3>
            <p>Productivity app with drag-and-drop functionality and local storage.</p>
            <div class="project-tech">
              <span>JavaScript</span>
              <span>LocalStorage</span>
              <span>Flexbox</span>
            </div>
            <div class="project-links">
              <a href="#" class="btn-secondary">View Code</a>
              <a href="#" class="btn-primary">Live Demo</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="contact" class="contact">
    <div class="container">
      <h2 class="section-title">Get In Touch</h2>
      <p class="section-subtitle">Have a project in mind? Let's work together!</p>

      <form class="contact-form" id="contactForm">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required>
          <span class="error-message" id="nameError"></span>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
          <span class="error-message" id="emailError"></span>
        </div>

        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="5" required></textarea>
          <span class="error-message" id="messageError"></span>
        </div>

        <button type="submit" class="submit-button">Send Message</button>
        <div class="success-message" id="successMessage">Message sent successfully!</div>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 Your Name. All rights reserved.</p>
      <div class="social-links">
        <a href="#" aria-label="GitHub">GitHub</a>
        <a href="#" aria-label="LinkedIn">LinkedIn</a>
        <a href="#" aria-label="Twitter">Twitter</a>
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
```

## Complete CSS - `styles.css`

```css
/* === RESET & GLOBAL STYLES === */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-dark: #2d3748;
  --text-light: #718096;
  --bg-light: #f7fafc;
  --white: #ffffff;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-dark);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* === NAVIGATION === */
.navbar {
  background-color: var(--white);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 15px 0;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background-color: var(--text-dark);
  transition: 0.3s;
}

.nav-menu {
  display: none;
  list-style: none;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: var(--white);
  box-shadow: var(--shadow);
  flex-direction: column;
}

.nav-menu.active {
  display: flex;
}

.nav-menu li {
  border-bottom: 1px solid #edf2f7;
}

.nav-link {
  display: block;
  padding: 15px 20px;
  text-decoration: none;
  color: var(--text-dark);
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: var(--bg-light);
  color: var(--primary-color);
}

/* Desktop Navigation */
@media (min-width: 768px) {
  .hamburger {
    display: none;
  }

  .nav-menu {
    display: flex;
    position: static;
    flex-direction: row;
    width: auto;
    box-shadow: none;
    gap: 10px;
  }

  .nav-menu li {
    border-bottom: none;
  }

  .nav-link {
    padding: 8px 16px;
    border-radius: 4px;
  }
}

/* === HERO SECTION === */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: var(--white);
  text-align: center;
  padding: 40px 20px;
}

.hero-title {
  font-size: clamp(32px, 6vw, 56px);
  margin-bottom: 20px;
  animation: fadeInUp 1s ease;
}

.highlight {
  color: #ffd700;
}

.hero-subtitle {
  font-size: clamp(18px, 3vw, 24px);
  margin-bottom: 30px;
  opacity: 0.9;
  animation: fadeInUp 1s ease 0.3s both;
}

.cta-button {
  display: inline-block;
  padding: 15px 40px;
  background-color: var(--white);
  color: var(--primary-color);
  text-decoration: none;
  border-radius: 50px;
  font-weight: bold;
  transition: transform 0.3s, box-shadow 0.3s;
  animation: fadeInUp 1s ease 0.6s both;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

/* === SECTIONS === */
section {
  padding: 80px 20px;
}

.section-title {
  font-size: clamp(32px, 5vw, 42px);
  text-align: center;
  margin-bottom: 20px;
  color: var(--text-dark);
}

.section-subtitle {
  text-align: center;
  color: var(--text-light);
  margin-bottom: 50px;
  font-size: 18px;
}

/* === ABOUT SECTION === */
.about {
  background-color: var(--bg-light);
}

.about-content {
  max-width: 900px;
  margin: 0 auto;
}

.about-text {
  margin-bottom: 40px;
  font-size: 18px;
  line-height: 1.8;
  color: var(--text-light);
}

.about-text p {
  margin-bottom: 15px;
}

.skills h3 {
  margin-bottom: 20px;
  color: var(--text-dark);
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-tag {
  background-color: var(--primary-color);
  color: var(--white);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

/* === PROJECTS SECTION === */
.project-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .project-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .project-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.project-card {
  background-color: var(--white);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: transform 0.3s, box-shadow 0.3s;
}

.project-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-lg);
}

.project-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.project-info {
  padding: 20px;
}

.project-info h3 {
  margin-bottom: 10px;
  color: var(--text-dark);
}

.project-info p {
  color: var(--text-light);
  margin-bottom: 15px;
  font-size: 14px;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.project-tech span {
  background-color: var(--bg-light);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--primary-color);
}

.project-links {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  transition: opacity 0.3s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--white);
}

.btn-secondary {
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-primary:hover,
.btn-secondary:hover {
  opacity: 0.8;
}

/* === CONTACT SECTION === */
.contact {
  background-color: var(--bg-light);
}

.contact-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-dark);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.error-message {
  display: block;
  color: #e53e3e;
  font-size: 14px;
  margin-top: 5px;
  min-height: 20px;
}

.submit-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: var(--white);
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s;
}

.submit-button:hover {
  transform: translateY(-2px);
}

.success-message {
  display: none;
  padding: 15px;
  background-color: #48bb78;
  color: var(--white);
  border-radius: 4px;
  text-align: center;
  margin-top: 20px;
}

.success-message.show {
  display: block;
}

/* === FOOTER === */
.footer {
  background-color: var(--text-dark);
  color: var(--white);
  padding: 30px 20px;
  text-align: center;
}

.footer .container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.social-links {
  display: flex;
  gap: 20px;
}

.social-links a {
  color: var(--white);
  text-decoration: none;
  transition: color 0.3s;
}

.social-links a:hover {
  color: var(--primary-color);
}

@media (min-width: 768px) {
  .footer .container {
    flex-direction: row;
    justify-content: space-between;
  }
}

/* === ANIMATIONS === */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## JavaScript - `script.js`

```javascript
// ===== MOBILE NAVIGATION =====
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle menu
hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Close menu when link is clicked
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
  });
});

// ===== FORM VALIDATION =====
const contactForm = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');
const successMessage = document.getElementById('successMessage');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(msg => msg.textContent = '');

  let isValid = true;

  // Validate name
  if (nameInput.value.trim().length < 2) {
    document.getElementById('nameError').textContent = 'Name must be at least 2 characters';
    isValid = false;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
    document.getElementById('emailError').textContent = 'Please enter a valid email';
    isValid = false;
  }

  // Validate message
  if (messageInput.value.trim().length < 10) {
    document.getElementById('messageError').textContent = 'Message must be at least 10 characters';
    isValid = false;
  }

  // If all valid, show success
  if (isValid) {
    successMessage.classList.add('show');
    contactForm.reset();

    // Hide success message after 5 seconds
    setTimeout(() => {
      successMessage.classList.remove('show');
    }, 5000);
  }
});

// ===== SMOOTH SCROLLING (for older browsers) =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ===== SCROLL ANIMATIONS (Optional Enhancement) =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fadeInUp 0.8s ease both';
    }
  });
}, observerOptions);

// Observe all project cards
document.querySelectorAll('.project-card').forEach(card => {
  observer.observe(card);
});
```

## Customization Checklist

Replace these placeholders with your own content:

- [ ] Change "Your Name" to your actual name
- [ ] Update tagline in hero section
- [ ] Write your own bio in About section
- [ ] Add your actual skills
- [ ] Replace project cards with your real projects
- [ ] Add actual project links (GitHub, live demos)
- [ ] Add your social media links
- [ ] Change color scheme (edit CSS `:root` variables)
- [ ] Add your own images (replace placeholder.com URLs)

## Deployment

**Option 1: GitHub Pages (Free)**
1. Create a GitHub repository
2. Push your code
3. Go to Settings → Pages
4. Select main branch
5. Your site will be live at `username.github.io/repo-name`

**Option 2: Netlify (Free)**
1. Create account at netlify.com
2. Drag and drop your project folder
3. Get instant live URL

**Option 3: Vercel (Free)**
1. Create account at vercel.com
2. Import your GitHub repository
3. Auto-deploys on every push

## Submission Requirements

Submit your project with:
1. ✅ All three files (index.html, styles.css, script.js)
2. ✅ Live deployment URL
3. ✅ GitHub repository link
4. ✅ Screenshot of mobile and desktop views
5. ✅ Brief description of customizations you made

## Knowledge Check

1. What does the viewport meta tag do?
   - Ensures the website renders correctly on mobile devices by setting width to device width
   - Changes the website colors
   - Adds animations
   - Improves load speed

2. Why use mobile-first CSS approach?
   - Start with mobile styles, then enhance for larger screens using min-width media queries
   - It's faster
   - It's easier to code
   - Mobile devices are more important

3. What JavaScript method prevents form default submission?
   - event.preventDefault() stops the default form submit behavior
   - event.stop()
   - form.prevent()
   - submit.cancel()

4. How do you make navigation sticky on scroll?
   - Use position: sticky with top: 0 in CSS
   - Use JavaScript scroll events
   - Use position: fixed
   - Navigation can't be sticky

5. What is the purpose of the IntersectionObserver API?
   - Detect when elements enter the viewport for animations and lazy loading
   - Validate forms
   - Handle click events
   - Style elements
