---
name: documentation-workflow
description: Maintain thorough project documentation
---

# Documentation Workflow

Workflow for maintaining comprehensive project documentation.

## When to Use

- When documenting new features
- When updating architectural decisions
- When creating context for AI assistants
- After completing a feature

## Documentation Structure

```
docs/
├── architecture/     # System design decisions
├── prds/            # Product requirement documents
├── plans/           # Implementation plans
├── api/             # API documentation
└── CONTEXT.md       # Project overview for AI context
```

## Workflow

### 1. Document as You Build

Simultaneously write documentation while coding:

- **Architecture Decisions**: `docs/architecture/[topic].md`
- **Feature Specs**: `docs/prds/[feature]-prd.md`
- **Implementation Plans**: `docs/plans/[feature]-plan.md`
- **Code Comments**: JSDoc for functions, inline for complex logic

### 2. Code Documentation Standards

**Functions/Methods:**

```typescript
/**
 * Brief description of what the function does.
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @example
 * const result = myFunction('input');
 */
```

**Complex Logic:**

```typescript
// Explain WHY, not what
// The algorithm uses X approach because Y constraint
```

**Types/Interfaces:**

```typescript
/** Description of what this type represents */
interface MyType {
  /** Field description */
  fieldName: string;
}
```

### 3. Project Context File

Maintain a `docs/CONTEXT.md` that summarizes:

- Project purpose and goals
- Tech stack and key dependencies
- Architecture overview
- Current state and recent changes
- Key patterns and conventions

Update this after every major feature.

### 4. Documentation Checklist

After completing a feature, verify:

- [ ] Functions have JSDoc comments
- [ ] Complex logic has inline comments
- [ ] Types/interfaces are documented
- [ ] README.md updated if needed
- [ ] `docs/` contains feature documentation
- [ ] API endpoints documented (if applicable)
- [ ] Environment variables documented
- [ ] Error messages are clear and actionable

## Integration with Feature Workflow

- **Phase 1 (Planning)**: Check existing docs for patterns
- **Phase 5 (Deploy)**: Update documentation before merging
