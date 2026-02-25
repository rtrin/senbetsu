---
name: browser-testing
description: AI-driven browser testing using Playwright and screenshots
---

# Browser Testing

Use browser automation to test UI like a real user. Inspired by Vercel's browser-agent pattern.

## Setup

### Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Configure

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

## Workflow

### Step 1: Write E2E Tests

Create tests in `tests/e2e/[feature].spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('user can complete [action]', async ({ page }) => {
  await page.goto('/');

  // Take screenshot for AI review
  await page.screenshot({ path: 'tests/screenshots/step1.png' });

  // Interact like a user
  await page.click('[data-testid="submit-button"]');

  // Assert expected outcome
  await expect(page.locator('.success-message')).toBeVisible();

  // Final screenshot
  await page.screenshot({ path: 'tests/screenshots/final.png' });
});
```

### Step 2: Run Tests

```bash
npx playwright test
```

### Step 3: AI Screenshot Review

After tests run, have AI review screenshots:

```
Review these UI screenshots for:
1. Visual bugs or inconsistencies
2. UX issues (confusing layout, missing feedback)
3. Accessibility problems
4. Mobile responsiveness

Screenshots: [describe or attach]
```

## AI-Driven Testing Pattern

For Claude Code to test its own creations:

### 1. Implement Feature

```
Implement [feature] in [file]
```

### 2. Write Test

```
Write a Playwright E2E test for the feature you just implemented.
Save to tests/e2e/[feature].spec.ts
```

### 3. Run and Screenshot

```bash
npx playwright test --update-snapshots
```

### 4. Review Results

```
Run the E2E tests and review any failures.
Check screenshots in tests/screenshots/
Fix any issues found.
```

## Browser Subagent Pattern

For more complex testing, use the browser_subagent tool:

```
Task: Navigate to http://localhost:3000, log in with test credentials,
and verify the dashboard loads correctly. Take screenshots at each step.
Return: Success/failure status and any visual issues found.
```

## Tips

- **Unique IDs**: Add `data-testid` attributes to interactive elements
- **Stable selectors**: Prefer data-testid over CSS classes
- **Screenshot naming**: Use descriptive names like `checkout-step2-payment.png`
- **CI Integration**: Run on every PR to catch regressions

## Integration

Used in:

- `/feature-development` workflow (step 7: testing)
- Pre-merge CI checks
