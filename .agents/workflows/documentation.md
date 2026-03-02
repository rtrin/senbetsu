---
description: Maintain thorough project documentation
---

# Documentation Workflow

Keep project documentation comprehensive and up-to-date.

## When to Use

- After completing a feature
- When onboarding new contributors
- When explaining complex systems

---

## Steps

### 1. Assess Current Documentation

Review existing docs:

```bash
ls -la docs/
```

### 2. Update Code Documentation

For each modified file, ensure:

**Functions/Methods:**

```typescript
/**
 * Brief description of what it does.
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws Description of potential errors
 *
 * @example
 * const result = functionName(param);
 */
```

**Complex Logic:**

```typescript
// Explain WHY, not WHAT
// The code shows what it does, comments explain reasoning
```

**Types/Interfaces:**

```typescript
/** Represents a saved tab session */
interface TabSession {
  /** Unique identifier */
  id: string;
  /** Display name shown in UI */
  name: string;
  /** Tabs saved in this session */
  tabs: SavedTab[];
}
```

### 3. Update README

Ensure README includes:

- [ ] Project description
- [ ] Quick start instructions
- [ ] How to load the extension
- [ ] Available commands
- [ ] Project structure overview

### 4. Document Architecture

Create or update `docs/architecture.md`:

```markdown
# Architecture Overview

## Extension Contexts

- **Popup**: React UI, user interactions
- **Background**: Service worker, Chrome API orchestration
- **Content Script**: Page interaction, data extraction

## Data Flow

Describe how data moves between contexts

## External Dependencies

List Chrome APIs and third-party integrations
```

### 5. Review Documentation

Check for broken links and stale content:

```bash
grep -rn "TODO\|FIXME\|TBD" docs/ README.md
```

---

## Documentation Types Checklist

- [ ] **README.md** — Project overview, quick start
- [ ] **docs/architecture.md** — System design
- [ ] **Inline comments** — Complex code explanation
- [ ] **JSDoc/TSDoc** — Function documentation
- [ ] **docs/plans/** — Feature plans and PRDs

---

## Best Practices

1. **Write for your future self** — Assume no context
2. **Keep it updated** — Stale docs are worse than no docs
3. **Use examples** — Show, don't just tell
4. **Link related docs** — Cross-reference appropriately
