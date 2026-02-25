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
- **Integration points**: API calls, database operations

### 2. Set Up Test Environment

// turbo

Ensure test dependencies are installed:

```bash
npm test -- --version
```

### 3. Create Test File

Place tests in appropriate location:

- Unit tests: `tests/unit/` or `__tests__/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`

Naming convention: `[component].test.ts` or `[component].spec.ts`

### 4. Write Unit Tests

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

### 5. Write Integration Tests

Test component interactions:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '../components/Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Result')).toBeInTheDocument();
  });
});
```

### 6. Write E2E Tests

Test complete user flows with Playwright:

```typescript
import { test, expect } from '@playwright/test';

test('user can complete flow', async ({ page }) => {
  await page.goto('/');

  // Interact with page
  await page.click('button[data-testid="start"]');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // Verify result
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### 7. Run Tests

// turbo

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run with coverage
npm test -- --coverage

# Run E2E tests
npx playwright test
```

### 8. Check Coverage

// turbo

```bash
npm test -- --coverage
```

Target coverage:

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### 9. Fix Failing Tests

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

### Snapshot Testing

```typescript
it('should match snapshot', () => {
  const { container } = render(<Component />);
  expect(container).toMatchSnapshot();
});
```

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react';

it('should return correct value', () => {
  const { result } = renderHook(() => useCustomHook());
  expect(result.current.value).toBe('expected');
});
```

---

## Checklist

- [ ] Unit tests for new functions
- [ ] Integration tests for component interactions
- [ ] E2E tests for critical user flows
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] Tests pass locally
- [ ] Coverage meets targets
