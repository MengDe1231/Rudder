# Bootstrap: Fill Project Development Guidelines

## Purpose

Welcome to Rudder! This is your first task.

AI agents use `.rudder/structure/` to understand YOUR project's coding conventions.
**Empty templates = AI writes generic code that doesn't match your project style.**

Filling these guidelines is a one-time setup that pays off for every future AI session.

---

## Your Task

Fill in the guideline files based on your **existing codebase**.

### Backend Guidelines

| File | What to Document |
|------|------------------|
| `.rudder/structure/backend/directory-structure.md` | Where different file types go (routes, services, utils) |
| `.rudder/structure/backend/database-guidelines.md` | ORM, migrations, query patterns, naming conventions |
| `.rudder/structure/backend/error-handling.md` | How errors are caught, logged, and returned |
| `.rudder/structure/backend/logging-guidelines.md` | Log levels, format, what to log |
| `.rudder/structure/backend/quality-guidelines.md` | Code review standards, testing requirements |

### Frontend Guidelines

| File | What to Document |
|------|------------------|
| `.rudder/structure/frontend/directory-structure.md` | Component/page/hook organization |
| `.rudder/structure/frontend/component-guidelines.md` | Component patterns, props conventions |
| `.rudder/structure/frontend/hook-guidelines.md` | Custom hook naming, patterns |
| `.rudder/structure/frontend/state-management.md` | State library, patterns, what goes where |
| `.rudder/structure/frontend/type-safety.md` | TypeScript conventions, type organization |
| `.rudder/structure/frontend/quality-guidelines.md` | Linting, testing, accessibility |

### Thinking Guides (Optional)

The `.rudder/structure/guides/` directory contains thinking guides that are already
filled with general best practices. You can customize them for your project if needed.

---

## How to Fill Guidelines

### Principle: Document Reality, Not Ideals

Write what your codebase **actually does**, not what you wish it did.
AI needs to match existing patterns, not introduce new ones.

### Steps

1. **Look at existing code** - Find 2-3 examples of each pattern
2. **Document the pattern** - Describe what you see
3. **Include file paths** - Reference real files as examples
4. **List anti-patterns** - What does your team avoid?

---

## Tips for Using AI

Ask AI to help analyze your codebase:

- "Look at my codebase and document the patterns you see"
- "Analyze my code structure and summarize the conventions"
- "Find error handling patterns and document them"

The AI will read your code and help you document it.

---

## Completion Checklist

- [ ] Guidelines filled for your project type
- [ ] At least 2-3 real code examples in each guideline
- [ ] Anti-patterns documented

When done:

```bash
./.rudder/scripts/feature.sh finish
./.rudder/scripts/feature.sh archive 00-bootstrap-guidelines
```

---

## Why This Matters

After completing this task:

1. AI will write code that matches your project style
2. Relevant `/before-*-dev` commands will inject real context
3. `/check-*` commands will validate against your actual standards
4. Future developers (human or AI) will onboard faster
