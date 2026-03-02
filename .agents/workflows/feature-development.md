---
description: Full feature development workflow for Chrome extension
---

# Feature Development Workflow

Complete workflow for developing a new feature with AI assistance.

## Available Skills

Before starting, familiarize yourself with these skills (read each SKILL.md):

1. **research-best-practices** — Research before implementing
2. **prd-workflow** — Create and review PRDs
3. **interface-design** — Design UIs (if feature involves popup UI)
4. **debugging** — Log-based debugging for stuck situations
5. **browser-testing** — Chrome extension testing

---

## Phase 1: Research & Planning

> **Skill**: `research-best-practices`

### 1. Research Best Practices

Research the feature:

```
Research best practices for implementing [feature].
- Search web for how other extensions solve this
- Check existing codebase for related patterns
- Identify Chrome APIs needed
- Document findings
```

### 2. Check Existing Codebase

Search for related code:

```bash
grep -r "[related-pattern]" --include="*.ts" --include="*.tsx" .
```

### 3. Create Implementation Plan

Document in `docs/plans/[feature]-plan.md`:

- Approaches considered
- Selected approach with rationale
- Chrome APIs needed
- Files to create/modify

---

## Phase 2: PRD Creation

> **Skill**: `prd-workflow`

### 4. Generate PRD

Create `docs/prds/[feature]-prd.md` including:

- Problem statement
- Proposed solution
- Success criteria
- Technical approach
- Chrome extension constraints
- Edge cases

---

## Phase 3: Interface Design (If Applicable)

> **Skill**: `interface-design`

### 5. Design UI Components

> Skip if the feature has no UI.

Follow the design workflow:

```
Design the UI for [feature].
1. Define component structure and props
2. Plan CSS styling approach
3. Consider popup size constraints (800x600 max)
4. Handle loading and error states
```

---

## Phase 4: Implementation

### 6. Create Feature Branch

```bash
git checkout -b feature/[feature-name]
```

### 7. Implement with Quality Checks

For each file/module:

- Keep files under 500 lines
- Keep functions under 60 lines
- Handle error cases

After each significant change:

```bash
biome check .
```

### 8. Update Manifest (If Needed)

If the feature requires new Chrome APIs:

- Update permissions in `wxt.config.ts`
- Document why each permission is needed

### 9. Write Tests

Create tests for business logic in `lib/`:

- Unit tests for new functions
- Mock Chrome APIs as needed

---

## Phase 5: Testing & Verification

> **Skill**: `browser-testing`, `debugging`

### 10. Run Quality Checks

```bash
vitest run       # Unit tests
biome check .    # Lint + format
tsc --noEmit     # Type check
```

### 11. Manual Extension Testing

1. Run `wxt` to start dev server
2. Extension auto-loads in Chrome
3. Test the feature manually:
   - Click extension icon to open popup
   - Test happy path flows
   - Test edge cases and error states
   - Check service worker console for errors (`chrome://extensions` → Inspect)

### 12. Debugging (If Issues Found)

> **Skill**: `debugging`

If tests fail or unexpected behavior occurs:

1. Add strategic console.logs
2. Check the correct console (popup vs service worker vs content script)
3. Analyze logs
4. Fix and repeat

### 13. AI Code Review

Review the implementation for:

- Code quality issues
- Missing edge cases
- Security concerns
- Performance problems

---

## Phase 6: Commit & Merge

### 14. Commit and Push

```bash
git add [specific files]
git commit -m "feat: [feature description]"
git push origin feature/[feature-name]
```

### 15. Create PR

Create pull request with:

- Summary of changes
- Test coverage notes
- Screenshots (if UI changes)

---

## Skill Usage Summary

| Phase              | Skills Used                   |
| ------------------ | ----------------------------- |
| Research & Planning| `research-best-practices`     |
| PRD Creation       | `prd-workflow`                |
| Interface Design   | `interface-design`            |
| Implementation     | (core coding)                 |
| Testing            | `browser-testing`, `debugging`|

---

## Quick Reference Commands

```bash
wxt                # Dev server
wxt build          # Production build
vitest run         # Tests
biome check .      # Lint + format
tsc --noEmit       # Type check
```
