---
trigger: always_on
description: Antigravity-specific rules for Senbetsu Chrome extension
---

# Antigravity Rules

Read CLAUDE.md and AGENTS.md. Read `.claude/rules/` for path-scoped rules.

## Project

WXT Chrome extension with React 19, TypeScript strict, Biome, Vitest.

## Verification

```bash
biome check .   # Lint + format
vitest run      # Tests
tsc --noEmit    # Type check
```

## Code Review

Perform code review for all new features using the `/code-review` workflow.
