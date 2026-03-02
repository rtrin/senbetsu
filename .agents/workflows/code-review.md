---
description: AI-assisted code review workflow for PRs
---

# Code Review Workflow

Use AI to review pull requests before merging.

## When to Use

Before merging any feature branch to `main`.

---

## Steps

### 1. Run Quality Gates

```bash
biome check .
vitest run
tsc --noEmit
```

### 2. Get Changed Files

```bash
git diff --name-only main...HEAD
```

### 3. AI Review Request

Ask Claude Code to review:

```
Review these changes for:
1. **Logic errors**: Bugs, edge cases, race conditions
2. **Security**: Injection, auth issues, data exposure
3. **Performance**: Memory leaks, slow algorithms
4. **Code quality**: Naming, duplication, complexity
5. **Tests**: Coverage, edge cases, mocking
6. **Docs**: Missing or outdated documentation

Changes:
[paste diff or file list]
```

### 4. Address Feedback

Fix any issues found. Re-run quality checks:

```bash
biome check .
vitest run
```

### 5. Document Review

Create `docs/reviews/[date]-[feature].md`:

```markdown
# Review: [Feature Name]

Date: [date]
Reviewer: AI + [your name]

## Findings

- [List of issues found]

## Resolutions

- [How each was addressed]

## Approval

- [x] Quality gates pass
- [x] AI review complete
- [x] Critical issues addressed
```

### 6. Merge

```bash
git checkout main
git merge feature/[feature-name]
git push origin main
```

---

## Review Checklist

- [ ] Biome checks pass
- [ ] No linting errors
- [ ] Tests pass
- [ ] AI review completed
- [ ] Security-sensitive code double-checked
- [ ] Documentation updated
