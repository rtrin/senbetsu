---
description: Systematic debugging using log-based feedback
---

# Debugging Workflow

Break out of debugging loops using structured log-based feedback.

## When to Use

- When stuck on a bug for more than 2 attempts
- When error messages are unclear
- When behavior doesn't match expectations
- After failed test runs

---

## Steps

### 1. Define the Problem

Clearly state:

- What should happen (expected behavior)
- What actually happens (actual behavior)
- What you've already tried

### 2. Add Strategic Logs

// turbo

Add console.log statements at key points:

```bash
# Find the relevant file
grep -rn "function_name" --include="*.ts" --include="*.tsx" .
```

Log placement guidelines:

- **Entry points**: Log function inputs
- **Decision points**: Log condition values before if/switch
- **Exit points**: Log return values
- **API calls**: Log request/response
- **State changes**: Log before/after state updates

Example log format:

```typescript
console.log('[DEBUG] FunctionName - description:', { varName: value });
```

### 3. Reproduce the Issue

// turbo

Run the scenario that triggers the bug:

```bash
npm run dev
# OR
npm test -- --grep "test name"
```

### 4. Analyze Log Output

Look for:

- Unexpected values (null, undefined, wrong type)
- Missing logs (function not called)
- Wrong execution order
- Failed conditions

### 5. Form Hypothesis

Based on logs, state:

- What you think is wrong
- What specific change should fix it

### 6. Make Minimal Fix

Change only what's needed to test the hypothesis:

- One change at a time
- Don't refactor while debugging
- Keep original code commented for reference

### 7. Verify Fix

// turbo

```bash
npm test
npm run build
```

### 8. Clean Up

- Remove debug console.logs
- Uncomment/restore any temporary changes
- Add regression test if applicable

---

## Common Patterns

### Null/Undefined Errors

```typescript
console.log('[DEBUG] Before access:', { obj, key: obj?.key });
```

### Async Issues

```typescript
console.log('[DEBUG] Before await:', Date.now());
const result = await somePromise;
console.log('[DEBUG] After await:', Date.now(), result);
```

### State Not Updating

```typescript
console.log('[DEBUG] State before:', state);
setState(newValue);
// Note: State won't update until next render
console.log('[DEBUG] Set called with:', newValue);
```

### API Failures

```typescript
console.log('[DEBUG] Request:', { url, body });
const response = await fetch(url, { body });
console.log('[DEBUG] Response:', response.status, await response.text());
```

---

## Escalation

If after 3 debugging cycles the issue persists:

1. **Document findings** in a debug log file
2. **Minimal reproduction** - create smallest case that fails
3. **Search** for similar issues online
4. **Ask for help** with full context
