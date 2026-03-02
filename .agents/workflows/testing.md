---
description: Write comprehensive tests for features
---

# Testing Workflow

Create thorough test coverage for new and existing features.

## When to Use

- Before implementing new features (TDD)
- After implementing features
- When fixing bugs (add regression test)
- During refactoring

---

## Steps

### 1. Analyze Test Requirements

Identify what needs testing:

- **Happy path**: Normal expected usage
- **Edge cases**: Boundary conditions, empty inputs
- **Error cases**: Invalid inputs, failures
- **Chrome API interactions**: Storage, messaging, tabs

### 2. Create Test File

Place tests alongside or in `tests/`:

Naming convention: `[module].test.ts` or `[component].test.tsx`

### 3. Write Unit Tests

Test individual functions in isolation:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { functionName } from '../lib/module';

describe('functionName', () => {
  it('should return expected result for valid input', () => {
    const result = functionName('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle empty input', () => {
    const result = functionName('');
    expect(result).toBeNull();
  });

  it('should throw error for invalid input', () => {
    expect(() => functionName(null)).toThrow('Invalid input');
  });
});
```

### 4. Mock Chrome APIs

```typescript
// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {};
vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((keys) => Promise.resolve(mockStorage)),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
    },
  },
});
```

### 5. Run Tests

```bash
# Run all tests
vitest run

# Run specific test file
vitest run path/to/test.test.ts

# Run with coverage
vitest run --coverage

# Watch mode during development
vitest
```

### 6. Check Coverage

```bash
vitest run --coverage
```

Target coverage:

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### 7. Fix Failing Tests

If tests fail:

1. Read error message carefully
2. Check if code or test is wrong
3. Use debugging workflow if needed
4. Fix and re-run

---

## Test Patterns

### Mocking

```typescript
// Mock module
vi.mock('../lib/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' }),
}));

// Mock function
const mockFn = vi.fn().mockReturnValue('mocked');
```

### Async Testing

```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### Chrome Extension Testing

For testing that requires a real browser environment:

1. Build the extension: `wxt build`
2. Load unpacked from `.output/chrome-mv3/` in `chrome://extensions`
3. Test popup by clicking the extension icon
4. Inspect service worker via extension details page
5. Check console for errors in each context (popup, background, content)

---

## Checklist

- [ ] Unit tests for new functions
- [ ] Chrome API mocks for extension-specific code
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] Tests pass locally (`vitest run`)
- [ ] Coverage meets targets
