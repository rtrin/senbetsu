# One-Click Bookmark Tab — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-tab bookmark button that saves to Bookmarks Bar with optional auto-close.

**Architecture:** Uses existing command pattern (popup sends `CMD_BOOKMARK_TAB` to background, background calls `chrome.bookmarks.create()`). Auto-close controlled by `bookmarkAutoClose` setting in `AppSettings`.

**Tech Stack:** React 19, TypeScript, Chrome Extension APIs (`chrome.bookmarks`, `chrome.tabs`), Vitest

---

### Task 1: Add bookmarks permission and types

**Files:**
- Modify: `wxt.config.ts:7`
- Modify: `lib/types.ts:20-26` (AppSettings)
- Modify: `lib/types.ts:91-101` (PopupCommand union)
- Modify: `lib/constants.ts:32-36` (DEFAULT_SETTINGS)

**Step 1: Add `bookmarks` permission**

In `wxt.config.ts`, change line 7:
```ts
permissions: ['tabs', 'tabGroups', 'storage', 'scripting', 'bookmarks'],
```

**Step 2: Add `bookmarkAutoClose` to `AppSettings`**

In `lib/types.ts`, add to the `AppSettings` interface after line 25:
```ts
bookmarkAutoClose?: boolean;
```

**Step 3: Add `CmdBookmarkTab` command type**

In `lib/types.ts`, add after the `CmdDeactivateLicense` interface (after line 89):
```ts
export interface CmdBookmarkTab {
  type: 'CMD_BOOKMARK_TAB';
  tabId: number;
}
```

Then add `| CmdBookmarkTab` to the `PopupCommand` union (after `| CmdDeactivateLicense` on line 101).

**Step 4: Update DEFAULT_SETTINGS**

In `lib/constants.ts`, add `bookmarkAutoClose: true` to `DEFAULT_SETTINGS`:
```ts
export const DEFAULT_SETTINGS: AppSettings = {
  tier: 'free',
  dailyUsageCount: 0,
  dailyUsageDate: '',
  bookmarkAutoClose: true,
};
```

**Step 5: Run type check**

Run: `tsc --noEmit`
Expected: Fails on `background.ts` exhaustive check (expected — we haven't added the case yet)

**Step 6: Commit**

```bash
git add wxt.config.ts lib/types.ts lib/constants.ts
git commit -m "feat: add bookmarks permission and CmdBookmarkTab types"
```

---

### Task 2: Add command handler and background routing

**Files:**
- Modify: `lib/commands.ts`
- Modify: `entrypoints/background.ts`
- Create: `lib/__tests__/commands.test.ts`

**Step 1: Write the test for `handleBookmarkTab`**

Create `lib/__tests__/commands.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockStore: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStore[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockStore, items);
      }),
    },
  },
  tabs: {
    get: vi.fn(),
    remove: vi.fn(),
  },
  bookmarks: {
    create: vi.fn(),
  },
});

const { handleBookmarkTab } = await import('../commands');

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(mockStore)) {
    delete mockStore[key];
  }
});

describe('handleBookmarkTab', () => {
  it('creates a bookmark in the Bookmarks Bar', async () => {
    vi.mocked(chrome.tabs.get).mockResolvedValue({
      id: 1,
      index: 0,
      pinned: false,
      highlighted: false,
      windowId: 1,
      active: true,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: true,
      groupId: -1,
      title: 'Example',
      url: 'https://example.com',
    });

    const result = await handleBookmarkTab(1);

    expect(result.ok).toBe(true);
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '1',
      title: 'Example',
      url: 'https://example.com',
    });
  });

  it('closes the tab when bookmarkAutoClose is true', async () => {
    mockStore.senbetsu_settings = { tier: 'free', dailyUsageCount: 0, dailyUsageDate: '', bookmarkAutoClose: true };
    vi.mocked(chrome.tabs.get).mockResolvedValue({
      id: 1,
      index: 0,
      pinned: false,
      highlighted: false,
      windowId: 1,
      active: true,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: true,
      groupId: -1,
      title: 'Example',
      url: 'https://example.com',
    });

    await handleBookmarkTab(1);

    expect(chrome.tabs.remove).toHaveBeenCalledWith(1);
  });

  it('does not close the tab when bookmarkAutoClose is false', async () => {
    mockStore.senbetsu_settings = { tier: 'free', dailyUsageCount: 0, dailyUsageDate: '', bookmarkAutoClose: false };
    vi.mocked(chrome.tabs.get).mockResolvedValue({
      id: 1,
      index: 0,
      pinned: false,
      highlighted: false,
      windowId: 1,
      active: true,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: true,
      groupId: -1,
      title: 'Example',
      url: 'https://example.com',
    });

    await handleBookmarkTab(1);

    expect(chrome.tabs.remove).not.toHaveBeenCalled();
  });

  it('returns error when tab.get fails', async () => {
    vi.mocked(chrome.tabs.get).mockRejectedValue(new Error('Tab not found'));

    const result = await handleBookmarkTab(999);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Tab not found');
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `vitest run lib/__tests__/commands.test.ts`
Expected: FAIL — `handleBookmarkTab` is not exported

**Step 3: Implement `handleBookmarkTab`**

In `lib/commands.ts`, add the import at line 7:
```ts
import type { CommandResponse, TabClassificationInput } from './types';
```
(This import already exists — no change needed.)

Add the handler function at the end of the file (after `handleSaveSettings`):
```ts
export async function handleBookmarkTab(tabId: number): Promise<CommandResponse> {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.bookmarks.create({
      parentId: '1',
      title: tab.title ?? tab.url ?? 'Untitled',
      url: tab.url,
    });

    const settings = await storage.getSettings();
    if (settings.bookmarkAutoClose !== false) {
      await chrome.tabs.remove(tabId);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
```

**Step 4: Run the test to verify it passes**

Run: `vitest run lib/__tests__/commands.test.ts`
Expected: PASS

**Step 5: Wire up in background.ts**

In `entrypoints/background.ts`, add `handleBookmarkTab` to the import on line 1-12:
```ts
import {
  handleActivateLicense,
  handleBookmarkTab,
  handleClassifyUnsorted,
  ...
```

Add a new case before `default:` (after line 53):
```ts
case 'CMD_BOOKMARK_TAB':
  responsePromise = handleBookmarkTab(message.tabId);
  break;
```

**Step 6: Run type check**

Run: `tsc --noEmit`
Expected: PASS

**Step 7: Commit**

```bash
git add lib/commands.ts lib/__tests__/commands.test.ts entrypoints/background.ts
git commit -m "feat: add handleBookmarkTab command with auto-close support"
```

---

### Task 3: Add bookmark button to TabItem UI

**Files:**
- Modify: `entrypoints/popup/components/TabItem.tsx`
- Modify: `entrypoints/popup/components/TabCategoryList.tsx`
- Modify: `entrypoints/popup/App.tsx`
- Modify: `entrypoints/popup/App.css`

**Step 1: Add `onBookmarkTab` prop and button to TabItem**

In `entrypoints/popup/components/TabItem.tsx`, add to `SharedTabItemProps`:
```ts
onBookmarkTab: (tabId: number) => void;
```

Add to the destructured props and add the bookmark button between the tab button and close button in the JSX:
```tsx
<button
  type="button"
  className="action-btn action-btn--bookmark"
  onClick={() => onBookmarkTab(id)}
  title="Bookmark tab"
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
</button>
```

**Step 2: Add CSS for the bookmark button**

In `entrypoints/popup/App.css`, add after the `.close-btn--tab` styles (after line 324):
```css
.action-btn--bookmark {
  font-size: 14px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  background: none;
  border: none;
  color: inherit;
  opacity: 0;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-item-row:hover .action-btn--bookmark {
  opacity: 1;
}
```

**Step 3: Thread `onBookmarkTab` through TabCategoryList**

In `entrypoints/popup/components/TabCategoryList.tsx`:

Add `onBookmarkTab: (tabId: number) => void;` to `TabCategoryListProps` interface (after line 11).

Add `onBookmarkTab` to the destructured props.

Pass `onBookmarkTab={onBookmarkTab}` to both `<TabItem>` usages (lines 94 and 159).

**Step 4: Wire up in App.tsx**

In `entrypoints/popup/App.tsx`, add the handler after `handleCloseGroup` (after line 142):
```tsx
const handleBookmarkTab = useCallback((tabId: number) => {
  sendCommand({ type: 'CMD_BOOKMARK_TAB', tabId });
}, []);
```

Pass `onBookmarkTab={handleBookmarkTab}` to `<TabCategoryList>` (line 179-188).

**Step 5: Run lint and type check**

Run: `biome check . && tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add entrypoints/popup/components/TabItem.tsx entrypoints/popup/components/TabCategoryList.tsx entrypoints/popup/App.tsx entrypoints/popup/App.css
git commit -m "feat: add bookmark button to tab items"
```

---

### Task 4: Add auto-close toggle in Settings

**Files:**
- Modify: `entrypoints/popup/components/SettingsPanel.tsx`

**Step 1: Add toggle state and handler**

In `SettingsPanel`, add state for the toggle after the existing state declarations:
```tsx
const [bookmarkAutoClose, setBookmarkAutoClose] = useState(settings.bookmarkAutoClose !== false);
```

Add a handler:
```tsx
const handleToggleAutoClose = async () => {
  const newValue = !bookmarkAutoClose;
  setBookmarkAutoClose(newValue);
  await sendCommand({ type: 'CMD_SAVE_SETTINGS', openaiApiKey: settings.openaiApiKey });
  // Save directly via storage since CMD_SAVE_SETTINGS only handles openaiApiKey
};
```

Wait — `CMD_SAVE_SETTINGS` only saves `openaiApiKey`. We need to save `bookmarkAutoClose` directly. Since the popup has access to `chrome.storage`, we can use `storage.updateSettings()` directly from the popup (it's already imported in `App.tsx`).

**Revised approach:** Pass `onToggleBookmarkAutoClose` from App.tsx, or import storage directly in SettingsPanel.

Simpler: Import `storage` in SettingsPanel and call `storage.updateSettings({ bookmarkAutoClose })` directly. The popup has full Chrome API access.

In `SettingsPanel.tsx`, add the import:
```tsx
import { storage } from '@/lib/storage';
```

Add the toggle handler:
```tsx
const handleToggleAutoClose = async () => {
  const newValue = !bookmarkAutoClose;
  setBookmarkAutoClose(newValue);
  await storage.updateSettings({ bookmarkAutoClose: newValue });
};
```

**Step 2: Add toggle UI**

In `SettingsPanel.tsx`, add a new section before the Tips section (before line 216):
```tsx
{/* ── Bookmarks ── */}
<div className="settings-section">
  <h3 className="settings-section__title">Bookmarks</h3>
  <div className="toggle-row">
    <span className="toggle-row__label">Auto-close tab after bookmarking</span>
    <button
      type="button"
      className={`toggle ${bookmarkAutoClose ? 'toggle--on' : ''}`}
      onClick={handleToggleAutoClose}
    >
      <span className="toggle__knob" />
    </button>
  </div>
</div>
```

**Step 3: Run lint and type check**

Run: `biome check . && tsc --noEmit`
Expected: PASS

**Step 4: Run all tests**

Run: `vitest run`
Expected: PASS

**Step 5: Commit**

```bash
git add entrypoints/popup/components/SettingsPanel.tsx
git commit -m "feat: add auto-close toggle for bookmarking in settings"
```

---

### Task 5: Manual verification and final lint

**Step 1: Run full lint + type check + tests**

Run: `biome check . && tsc --noEmit && vitest run`
Expected: All PASS

**Step 2: Manual test (dev server)**

Run: `wxt` to start the dev server, then in Chrome:
1. Open extension popup
2. Hover over a tab — bookmark icon should appear
3. Click bookmark icon — tab should be saved to Bookmarks Bar and auto-close
4. Go to Settings — toggle "Auto-close tab after bookmarking" off
5. Bookmark another tab — tab should remain open
6. Check Bookmarks Bar — both bookmarks should be there

**Step 3: Commit design + plan docs**

```bash
git add docs/plans/2026-03-04-one-click-bookmark-design.md docs/plans/2026-03-04-one-click-bookmark-plan.md
git commit -m "docs: add one-click bookmark design and implementation plan"
```
