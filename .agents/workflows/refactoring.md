---
description: Periodic codebase cleanup and reorganization
---

# Refactoring Workflow

Keep the codebase clean and AI-friendly through periodic refactoring.

## When to Use

- Every 5-10 features
- When files exceed 400 lines (approaching 500 limit)
- When functions exceed 50 lines (approaching 60 limit)
- When AI struggles to find relevant code

---

## Steps

### 1. Analyze Codebase Health

```bash
# Find long files
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

```bash
# Run quality checks
biome check .
```

### 2. Identify Refactoring Targets

Analyze the codebase for:

1. Files approaching 500 line limit
2. Functions approaching 60 line limit
3. Duplicate code that could be extracted
4. Unclear file organization
5. Missing or outdated documentation

### 3. Prioritize

Create refactoring plan in `docs/plans/refactoring-[date].md`:

- High priority (blocking new work)
- Medium priority (slowing development)
- Low priority (nice to have)

### 4. Execute Refactoring

For each target:

#### Split Large Files

```
Split [file] into smaller modules:
- Extract [functionality] to [new-file]
- Keep each file under 400 lines
- Update imports across the codebase
```

#### Split Large Functions

```
Refactor [function] in [file]:
- Extract helper functions
- Keep each function under 50 lines
- Maintain same external behavior
```

#### Remove Duplication

```
Extract common code between [file1] and [file2]:
- Create shared utility in [utils-file]
- Update both files to use shared code
```

### 5. Verify

```bash
vitest run
biome check .
tsc --noEmit
```

### 6. Update Documentation

- Update README if structure changed
- Update any architecture docs
- Add/update inline comments for complex code

---

## Refactoring Principles

1. **One change at a time**: Don't combine refactoring with features
2. **Tests first**: Ensure tests pass before and after
3. **Small commits**: Commit each refactoring separately
4. **Preserve behavior**: Refactoring shouldn't change functionality

---

## Metrics to Track

| Metric             | Target | Current |
| ------------------ | ------ | ------- |
| Max file lines     | < 500  | [check] |
| Max function lines | < 60   | [check] |
| Test coverage      | > 80%  | [check] |
| Linting errors     | 0      | [check] |
