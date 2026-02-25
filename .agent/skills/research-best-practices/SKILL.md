---
name: research-best-practices
description: Research best practices and approaches before implementing any feature
---

# Research Best Practices

Before implementing any feature, research how others have solved similar problems.

## When to Use

Use this skill **before** writing any implementation code for a new feature or significant change.

## Workflow

### Step 1: Define the Problem

Clearly state what you're trying to build:

```
I need to implement [feature description].
Key requirements: [list requirements]
```

### Step 2: Web Search

Use web search to find:

- How other projects implement this
- Best practices and common patterns
- Potential pitfalls to avoid
- Libraries/frameworks that could help

Example searches:

- "[feature] implementation best practices"
- "[framework] [feature] pattern"
- "[feature] architecture comparison"

### Step 3: Compare Approaches

Create a comparison table in your implementation plan:

| Approach | Pros | Cons | Complexity   |
| -------- | ---- | ---- | ------------ |
| Option A | ...  | ...  | Low/Med/High |
| Option B | ...  | ...  | Low/Med/High |

### Step 4: Document Decision

In `docs/plans/[feature]-research.md`, document:

- Approaches considered
- Why you chose the selected approach
- Links to reference implementations
- Potential risks and mitigations

## Example: Undo/Redo System

**Initial thought:** Command pattern with undo/redo methods
**After research:** Event sourcing - record every action as an event, replay for undo/redo
**Decision:** Event sourcing is simpler for this use case

## Integration

This skill integrates with:

- `/feature-development` workflow (step 1)
- `prd-workflow` skill (feeds into PRD creation)
