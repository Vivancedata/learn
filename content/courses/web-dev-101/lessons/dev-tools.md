---
id: dev-tools
title: Setting Up Your Development Environment
type: lesson
duration: 45 mins
order: 2
section: getting-started
prevLessonId: web-intro
nextLessonId: html-basics
---

# Development Environment Setup

Before we start coding, we need to set up our development environment. This involves installing the necessary tools and software that we'll use throughout the course.

## Required Tools

1. **Text Editor**: Visual Studio Code
2. **Web Browser**: Google Chrome or Firefox
3. **Version Control**: Git
4. **Terminal**: Command line interface

## Installation Steps

Follow these steps to set up your environment:

### 1. Install Visual Studio Code

Visual Studio Code (VS Code) is a lightweight but powerful source code editor that runs on your desktop. It comes with built-in support for JavaScript, TypeScript, and Node.js and has a rich ecosystem of extensions for other languages.

1. Go to [code.visualstudio.com](https://code.visualstudio.com/)
2. Download the installer for your operating system
3. Run the installer and follow the prompts

### 2. Install a Web Browser

You probably already have a web browser installed, but we recommend using either Google Chrome or Firefox for web development.

- [Google Chrome](https://www.google.com/chrome/)
- [Firefox](https://www.mozilla.org/firefox/)

Both browsers come with excellent developer tools that will help you debug your code.

### 3. Install Git

Git is a version control system that helps you track changes to your code and collaborate with others.

#### Windows
1. Go to [git-scm.com](https://git-scm.com/)
2. Download the installer
3. Run the installer, using the default settings

#### macOS
1. Install Homebrew if you don't have it: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
2. Run `brew install git`

#### Linux
Run `sudo apt-get install git` (Ubuntu/Debian) or `sudo yum install git` (Fedora/CentOS)

### 4. Terminal Setup

#### Windows
Use the built-in Command Prompt or PowerShell, or install Windows Terminal from the Microsoft Store.

#### macOS
Use the built-in Terminal app.

#### Linux
Use the built-in terminal application for your distribution.

## Verifying Your Setup

To verify that everything is installed correctly, open your terminal and run the following commands:

```bash
code --version  # Should display VS Code version
git --version   # Should display Git version
```

## Next Steps

Now that you have your development environment set up, you're ready to start learning HTML in the next lesson!
