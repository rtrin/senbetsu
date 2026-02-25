---
description: Maintain thorough project documentation
---

# Documentation Workflow

Keep project documentation comprehensive and up-to-date.

## When to Use

- After completing a feature
- When onboarding new contributors
- During quarterly review
- When explaining complex systems

---

## Steps

### 1. Assess Current Documentation

// turbo

Review existing docs:

```bash
ls -la docs/
cat README.md
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
/** Represents a user's learning resource */
interface Resource {
  /** Unique identifier */
  id: string;
  /** Display name shown in UI */
  title: string;
  /** Resource type (youtube, pdf, note, link) */
  type: ResourceType;
}
```

### 3. Update README

Ensure README includes:

- [ ] Project description
- [ ] Quick start instructions
- [ ] Environment setup
- [ ] Available scripts
- [ ] Project structure overview
- [ ] Contributing guidelines

### 4. Document Architecture

Create or update `docs/architecture.md`:

```markdown
# Architecture Overview

## System Diagram

[Mermaid or ASCII diagram]

## Key Components

- **Component A**: Purpose and responsibility
- **Component B**: Purpose and responsibility

## Data Flow

Describe how data moves through the system

## External Dependencies

List and explain third-party integrations
```

### 5. Document APIs

For each API endpoint, document in `docs/api.md`:

````markdown
## POST /api/resource

Create a new resource.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Resource title |
| url | string | No | External URL |

**Response:**

- 201: Resource created successfully
- 400: Validation error
- 401: Unauthorized

**Example:**

```json
{
  "title": "Spanish Podcast",
  "type": "youtube",
  "url": "https://..."
}
```
````

````

### 6. Update Changelog

Add entry to `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description
````

### 7. Review Documentation

// turbo

Check for broken links and formatting:

```bash
# Find TODOs in documentation
grep -rn "TODO\|FIXME\|TBD" docs/ README.md
```

---

## Documentation Types Checklist

- [ ] **README.md** - Project overview, quick start
- [ ] **docs/architecture.md** - System design
- [ ] **docs/api.md** - API reference
- [ ] **docs/deployment.md** - Deployment instructions
- [ ] **CHANGELOG.md** - Version history
- [ ] **CONTRIBUTING.md** - Contribution guidelines
- [ ] **Inline comments** - Complex code explanation
- [ ] **JSDoc/TSDoc** - Function documentation

---

## Best Practices

1. **Write for your future self** - Assume no context
2. **Keep it updated** - Stale docs are worse than no docs
3. **Use examples** - Show, don't just tell
4. **Link related docs** - Cross-reference appropriately
5. **Version documentation** - Keep in sync with code
