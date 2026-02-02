# Pull Request

## Description

<!-- Provide a clear and concise description of what this PR does. -->



### Related Issue

<!-- Link to the issue this PR addresses. Use "Fixes #xxx" to auto-close the issue when merged. -->

Fixes #

---

## Type of Change

<!-- Check all that apply. -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Content update (new or modified lesson, course, or path)
- [ ] Documentation (README, guides, or code comments)
- [ ] Refactoring (code improvement without changing functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Other (describe below)

<!-- If "Other", describe the type of change: -->

---

## Checklist

<!-- All items must be checked before requesting review. -->

### General Requirements

- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- [ ] My code follows the project's style guidelines (TypeScript strict mode, ESLint rules)
- [ ] I have run `npm run lint` with no errors
- [ ] I have run `npm test` and all tests pass
- [ ] I have added tests for new functionality (if applicable)
- [ ] I have updated documentation (if applicable)

### Security

- [ ] My changes do not introduce security vulnerabilities
- [ ] I have not committed sensitive data (API keys, secrets, credentials)
- [ ] User input is properly validated (using Zod schemas)
- [ ] Authorization checks are in place for protected endpoints

### Code Quality

- [ ] I have performed a self-review of my code
- [ ] I have commented code in hard-to-understand areas
- [ ] My changes generate no new warnings

---

## For Content Changes

<!-- Complete this section if you are adding or modifying lessons, courses, or learning paths. -->

- [ ] I have followed the Layout Style Guide for content formatting
- [ ] I have previewed the rendered content locally
- [ ] Knowledge Check questions are included (for lessons with quizzes)
- [ ] Learning outcomes are clearly defined
- [ ] Prerequisites are accurate and up-to-date
- [ ] Code examples are tested and functional
- [ ] Difficulty level is appropriate for the target audience

---

## Screenshots

<!-- Include screenshots for UI changes. Delete this section if not applicable. -->

### Before

<!-- Screenshot of the previous state -->

### After

<!-- Screenshot of the new state -->

---

## Additional Notes

<!-- Add any context, implementation details, or concerns that reviewers should know about. -->

### Testing Instructions

<!-- Optional: Provide specific steps to test this PR locally. -->

1.
2.
3.

### Performance Considerations

<!-- Optional: Note any performance implications of this change. -->

### Migration Notes

<!-- Optional: If this PR requires database migrations or environment changes, describe them here. -->

---

## Reviewer Notes

<!-- For maintainers: Add any notes during review here. -->

