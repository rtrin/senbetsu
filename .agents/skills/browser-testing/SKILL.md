---
name: browser-testing
description: Chrome extension testing approach using manual testing and Vitest
---

# Chrome Extension Testing

Test the extension through a combination of unit tests (Vitest) and manual browser testing.

## Unit Testing (Vitest)

Test business logic in `lib/` with Vitest:

```bash
vitest run                    # Run all tests
vitest run path/to/test.ts    # Run specific test
vitest run --coverage         # With coverage
```

### Mock Chrome APIs

```typescript
import { describe, it, expect, vi } from 'vitest';

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
  },
});
```

## Manual Browser Testing

### Load the Extension

1. Run `wxt` for dev mode (auto-reloads on changes)
2. Or build and load manually:
   ```bash
   wxt build
   ```
3. Go to `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked" → select `.output/chrome-mv3/`

### Test the Popup

1. Click the extension icon in the toolbar
2. Verify UI renders correctly
3. Test all interactive elements
4. Check for console errors (right-click popup → Inspect)

### Test the Service Worker

1. Go to `chrome://extensions`
2. Find the extension → click "Inspect views: service worker"
3. Check console for errors
4. Test background functionality (alarms, messages, etc.)

### Test Content Scripts

1. Navigate to a page where content script runs
2. Open DevTools console
3. Filter by extension name
4. Check for injected elements or behaviors

## Testing Checklist

- [ ] Unit tests pass (`vitest run`)
- [ ] Extension loads without errors
- [ ] Popup opens and renders correctly
- [ ] Service worker starts without errors
- [ ] Content scripts inject properly (if applicable)
- [ ] Chrome storage reads/writes work
- [ ] Tab operations work as expected
- [ ] Error states are handled gracefully
- [ ] Extension works after browser restart

## Tips

- **Dev mode**: `wxt` auto-reloads the extension on file changes
- **Stable selectors**: Add `data-testid` attributes for UI testing
- **Multiple tabs**: Test with various numbers of tabs open
- **Permissions**: Test with and without optional permissions granted
