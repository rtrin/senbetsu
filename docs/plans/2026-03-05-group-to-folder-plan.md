# Save Group to Folder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add one-click save-group-to-bookmark-folder with a Folders view to re-open saved folders as tab groups.

**Architecture:** Three new commands through the existing popup→background command pattern. A new `FolderList` component follows the on-demand fetch pattern used by MemoryUsageList. The Folders view becomes a 4th pill tab.

**Tech Stack:** React 19, TypeScript, Chrome Extension APIs (`chrome.bookmarks`, `chrome.tabs`, `chrome.tabGroups`), Vitest

---

### Task 1: Add types for folder commands

**Files:**
- Modify: `lib/types.ts:92-108` (add interfaces and extend PopupCommand union)

**Step 1: Add a `BookmarkFolder` data type**

After the `CommandResponse` interface (after line 114), add:
```ts
// ─── Bookmark Folders ───────────────────────────────────────────

export interface BookmarkFolder {
  id: string;
  title: string;
  childCount: number;
}
```

**Step 2: Add three new command interfaces**

After `CmdBookmarkTab` (after line 95), add:
```ts
export interface CmdSaveGroupToFolder {
  type: 'CMD_SAVE_GROUP_TO_FOLDER';
  tabIds: number[];
  groupName: string;
}

export interface CmdOpenFolderAsGroup {
  type: 'CMD_OPEN_FOLDER_AS_GROUP';
  folderId: string;
}

export interface CmdGetBookmarkFolders {
  type: 'CMD_GET_BOOKMARK_FOLDERS';
}
```

**Step 3: Extend PopupCommand union**

Add the three new types to the union (after `| CmdBookmarkTab`):
```ts
  | CmdSaveGroupToFolder
  | CmdOpenFolderAsGroup
  | CmdGetBookmarkFolders;
```

**Step 4: Run type check**

Run: `tsc --noEmit`
Expected: Fails on background.ts exhaustive switch (expected)

**Step 5: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add folder command types and BookmarkFolder interface"
```

---

### Task 2: Implement folder command handlers

**Files:**
- Modify: `lib/commands.ts` (add 3 handlers)
- Modify: `entrypoints/background.ts` (add 3 cases and imports)
- Create: `lib/__tests__/folder-commands.test.ts`

**Step 1: Write tests**

Create `lib/__tests__/folder-commands.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockStore: Record<string, unknown> = {};
const mockBookmarkNodes: Record<string, unknown[]> = {};

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
    create: vi.fn(),
    group: vi.fn(),
    query: vi.fn(),
  },
  tabGroups: {
    update: vi.fn(),
    query: vi.fn(async () => []),
  },
  bookmarks: {
    create: vi.fn(),
    getChildren: vi.fn(async (id: string) => mockBookmarkNodes[id] ?? []),
    removeTree: vi.fn(),
  },
  scripting: { executeScript: vi.fn() },
  windows: { update: vi.fn() },
  runtime: { sendMessage: vi.fn() },
});

const {
  handleSaveGroupToFolder,
  handleGetBookmarkFolders,
  handleOpenFolderAsGroup,
} = await import('../commands');

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(mockStore)) delete mockStore[key];
  for (const key of Object.keys(mockBookmarkNodes)) delete mockBookmarkNodes[key];
});

describe('handleSaveGroupToFolder', () => {
  it('creates a folder with bookmarks for each tab', async () => {
    vi.mocked(chrome.bookmarks.create)
      .mockResolvedValueOnce({ id: '100', title: 'Dev' } as chrome.bookmarks.BookmarkTreeNode)
      .mockResolvedValue({} as chrome.bookmarks.BookmarkTreeNode);

    vi.mocked(chrome.tabs.get)
      .mockResolvedValueOnce({
        id: 1, index: 0, pinned: false, highlighted: false, windowId: 1,
        active: true, incognito: false, selected: false, discarded: false,
        autoDiscardable: true, groupId: 1,
        title: 'Page A', url: 'https://a.com',
      })
      .mockResolvedValueOnce({
        id: 2, index: 1, pinned: false, highlighted: false, windowId: 1,
        active: false, incognito: false, selected: false, discarded: false,
        autoDiscardable: true, groupId: 1,
        title: 'Page B', url: 'https://b.com',
      });

    const result = await handleSaveGroupToFolder([1, 2], 'Dev');

    expect(result.ok).toBe(true);
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '1',
      title: 'Dev',
    });
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '100',
      title: 'Page A',
      url: 'https://a.com',
    });
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '100',
      title: 'Page B',
      url: 'https://b.com',
    });
  });

  it('closes tabs when bookmarkAutoClose is true', async () => {
    mockStore.senbetsu_settings = {
      tier: 'free', dailyUsageCount: 0, dailyUsageDate: '',
      bookmarkAutoClose: true,
    };
    vi.mocked(chrome.bookmarks.create)
      .mockResolvedValueOnce({ id: '100', title: 'Dev' } as chrome.bookmarks.BookmarkTreeNode)
      .mockResolvedValue({} as chrome.bookmarks.BookmarkTreeNode);
    vi.mocked(chrome.tabs.get).mockResolvedValue({
      id: 1, index: 0, pinned: false, highlighted: false, windowId: 1,
      active: true, incognito: false, selected: false, discarded: false,
      autoDiscardable: true, groupId: 1,
      title: 'Page', url: 'https://a.com',
    });

    await handleSaveGroupToFolder([1], 'Dev');

    expect(chrome.tabs.remove).toHaveBeenCalledWith([1]);
  });

  it('does not close tabs when bookmarkAutoClose is false', async () => {
    mockStore.senbetsu_settings = {
      tier: 'free', dailyUsageCount: 0, dailyUsageDate: '',
      bookmarkAutoClose: false,
    };
    vi.mocked(chrome.bookmarks.create)
      .mockResolvedValueOnce({ id: '100', title: 'Dev' } as chrome.bookmarks.BookmarkTreeNode)
      .mockResolvedValue({} as chrome.bookmarks.BookmarkTreeNode);
    vi.mocked(chrome.tabs.get).mockResolvedValue({
      id: 1, index: 0, pinned: false, highlighted: false, windowId: 1,
      active: true, incognito: false, selected: false, discarded: false,
      autoDiscardable: true, groupId: 1,
      title: 'Page', url: 'https://a.com',
    });

    await handleSaveGroupToFolder([1], 'Dev');

    expect(chrome.tabs.remove).not.toHaveBeenCalled();
  });
});

describe('handleGetBookmarkFolders', () => {
  it('returns folders (nodes without url) from Bookmarks Bar', async () => {
    mockBookmarkNodes['1'] = [
      { id: '10', title: 'Dev', children: [] },
      { id: '11', title: 'Google', url: 'https://google.com' },
      { id: '12', title: 'Work', children: [] },
    ];
    mockBookmarkNodes['10'] = [
      { id: '20', title: 'Page A', url: 'https://a.com' },
      { id: '21', title: 'Page B', url: 'https://b.com' },
    ];
    mockBookmarkNodes['12'] = [];

    const result = await handleGetBookmarkFolders();

    expect(result.ok).toBe(true);
    const folders = result.data as Array<{ id: string; title: string; childCount: number }>;
    expect(folders).toHaveLength(2);
    expect(folders[0]).toEqual({ id: '10', title: 'Dev', childCount: 2 });
    expect(folders[1]).toEqual({ id: '12', title: 'Work', childCount: 0 });
  });
});

describe('handleOpenFolderAsGroup', () => {
  it('opens folder bookmarks as tabs, groups them, and deletes the folder', async () => {
    mockBookmarkNodes['10'] = [
      { id: '20', title: 'Page A', url: 'https://a.com' },
      { id: '21', title: 'Page B', url: 'https://b.com' },
    ];
    vi.mocked(chrome.bookmarks.getChildren).mockImplementation(
      async (id: string) => (mockBookmarkNodes[id] ?? []) as chrome.bookmarks.BookmarkTreeNode[],
    );

    // Mock the parent folder lookup to get the folder title
    const parentNode = { id: '10', title: 'Dev', parentId: '1' };
    // getChildren('1') should include the folder node to resolve the title
    mockBookmarkNodes['1'] = [parentNode];

    vi.mocked(chrome.tabs.create)
      .mockResolvedValueOnce({ id: 50 } as chrome.tabs.Tab)
      .mockResolvedValueOnce({ id: 51 } as chrome.tabs.Tab);
    vi.mocked(chrome.tabs.group).mockResolvedValue(5);

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(true);
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://a.com', active: false });
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://b.com', active: false });
    expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [50, 51] });
    expect(chrome.bookmarks.removeTree).toHaveBeenCalledWith('10');
  });

  it('returns error for empty folder', async () => {
    mockBookmarkNodes['10'] = [];

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('empty');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/__tests__/folder-commands.test.ts`
Expected: FAIL — handlers not exported yet

**Step 3: Implement handlers in `lib/commands.ts`**

Add at the end of the file:

```ts
export async function handleSaveGroupToFolder(
  tabIds: number[],
  groupName: string,
): Promise<CommandResponse> {
  try {
    const folder = await chrome.bookmarks.create({
      parentId: '1',
      title: groupName,
    });

    for (const tabId of tabIds) {
      const tab = await chrome.tabs.get(tabId);
      await chrome.bookmarks.create({
        parentId: folder.id,
        title: tab.title ?? tab.url ?? 'Untitled',
        url: tab.url,
      });
    }

    const settings = await storage.getSettings();
    if (settings.bookmarkAutoClose !== false) {
      await chrome.tabs.remove(tabIds);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleGetBookmarkFolders(): Promise<CommandResponse> {
  try {
    const children = await chrome.bookmarks.getChildren('1');
    const folders = children.filter((node) => !node.url);

    const result = await Promise.all(
      folders.map(async (folder) => {
        const contents = await chrome.bookmarks.getChildren(folder.id);
        return {
          id: folder.id,
          title: folder.title,
          childCount: contents.length,
        };
      }),
    );

    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleOpenFolderAsGroup(folderId: string): Promise<CommandResponse> {
  try {
    const children = await chrome.bookmarks.getChildren(folderId);
    const bookmarks = children.filter((node) => node.url);

    if (bookmarks.length === 0) {
      return { ok: false, error: 'Folder is empty' };
    }

    const newTabIds: number[] = [];
    for (const bookmark of bookmarks) {
      const tab = await chrome.tabs.create({ url: bookmark.url, active: false });
      if (tab.id) newTabIds.push(tab.id);
    }

    if (newTabIds.length > 0) {
      const groupId = await chrome.tabs.group({ tabIds: newTabIds });

      // Get folder title for the group name
      const parent = await chrome.bookmarks.getChildren('1');
      const folder = parent.find((n) => n.id === folderId);
      const title = folder?.title ?? 'Restored';
      const color = 'blue' as chrome.tabGroups.Color;
      await chrome.tabGroups.update(groupId, { title, color });
    }

    await chrome.bookmarks.removeTree(folderId);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
```

Note on `handleOpenFolderAsGroup`: we look up the folder title by checking `chrome.bookmarks.getChildren('1')` and finding the matching node. An alternative is `chrome.bookmarks.get(folderId)` — use that if it's simpler to mock. The important thing is getting the folder title to name the tab group.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/__tests__/folder-commands.test.ts`
Expected: PASS

**Step 5: Wire up in `entrypoints/background.ts`**

Add imports:
```ts
import {
  handleActivateLicense,
  handleBookmarkTab,
  handleClassifyUnsorted,
  handleCloseGroup,
  handleCloseTab,
  handleDeactivateLicense,
  handleGetBookmarkFolders,
  handleGetMemoryUsage,
  handleMoveTabToGroup,
  handleOpenFolderAsGroup,
  handleSaveAndGroup,
  handleSaveGroupToFolder,
  handleSaveSettings,
  handleSwitchTab,
} from '@/lib/commands';
```

Add cases before `default:`:
```ts
case 'CMD_SAVE_GROUP_TO_FOLDER':
  responsePromise = handleSaveGroupToFolder(message.tabIds, message.groupName);
  break;
case 'CMD_OPEN_FOLDER_AS_GROUP':
  responsePromise = handleOpenFolderAsGroup(message.folderId);
  break;
case 'CMD_GET_BOOKMARK_FOLDERS':
  responsePromise = handleGetBookmarkFolders();
  break;
```

**Step 6: Run all tests and type check**

Run: `npx vitest run && npx tsc --noEmit && npx biome check .`
Expected: All pass

**Step 7: Commit**

```bash
git add lib/commands.ts lib/__tests__/folder-commands.test.ts entrypoints/background.ts
git commit -m "feat: add save-group-to-folder, get-folders, and open-folder-as-group handlers"
```

---

### Task 3: Add save-to-folder button on group headers

**Files:**
- Modify: `entrypoints/popup/components/TabCategoryList.tsx`
- Modify: `entrypoints/popup/App.tsx`
- Modify: `entrypoints/popup/App.css`

**Step 1: Add `onSaveGroupToFolder` prop to TabCategoryList**

In `TabCategoryListProps` (line 5-15), add:
```ts
onSaveGroupToFolder: (tabIds: number[], groupName: string) => void;
```

Add it to the destructured props.

**Step 2: Add folder save button to group headers**

In the group header (around line 82-93), add a save-to-folder button BEFORE the close button:
```tsx
<button
  type="button"
  className="action-btn action-btn--save-folder"
  onClick={() => onSaveGroupToFolder(groupTabs.map((t) => t.id!), groupName)}
  title={`Save "${groupName}" as bookmark folder`}
>
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label="Save to folder"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
</button>
```

Place this between the `.tab-group__count` span and the close button. Do NOT add this to the Ungrouped section — you can only save named groups.

**Step 3: Add CSS for the save-folder button**

In `App.css`, add after the `.action-btn--bookmark` styles:
```css
.action-btn--save-folder {
  font-size: 14px;
  width: 20px;
  height: 20px;
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
```

Update the group header hover rule. Find:
```css
.tab-group__header:hover .close-btn--group,
```

Change to:
```css
.tab-group__header:hover .close-btn--group,
.tab-group__header:hover .action-btn--save-folder,
```

**Step 4: Wire up in App.tsx**

Add handler after `handleBookmarkTab` (after line 146):
```tsx
const handleSaveGroupToFolder = useCallback(
  async (tabIds: number[], groupName: string) => {
    const resp = await sendCommand({
      type: 'CMD_SAVE_GROUP_TO_FOLDER',
      tabIds,
      groupName,
    });
    if (!resp.ok) {
      setGroupingError(resp.error ?? 'Failed to save group');
    }
  },
  [],
);
```

Pass to `<TabCategoryList>`:
```tsx
onSaveGroupToFolder={handleSaveGroupToFolder}
```

**Step 5: Run lint and type check**

Run: `npx biome check . && npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add entrypoints/popup/components/TabCategoryList.tsx entrypoints/popup/App.tsx entrypoints/popup/App.css
git commit -m "feat: add save-to-folder button on tab group headers"
```

---

### Task 4: Create FolderList component and Folders view

**Files:**
- Create: `entrypoints/popup/components/FolderList.tsx`
- Modify: `entrypoints/popup/App.tsx`
- Modify: `entrypoints/popup/App.css`

**Step 1: Create FolderList component**

Create `entrypoints/popup/components/FolderList.tsx`:
```tsx
import type { BookmarkFolder } from '@/lib/types';

interface FolderListProps {
  folders: BookmarkFolder[];
  isFetching: boolean;
  onOpenFolder: (folderId: string) => void;
}

export function FolderList({ folders, isFetching, onOpenFolder }: FolderListProps) {
  if (isFetching && folders.length === 0) {
    return <div className="memory-loading">Loading folders...</div>;
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">Bookmark Folders</h2>
      </div>
      {folders.length === 0 ? (
        <div className="folder-empty">
          No bookmark folders in the Bookmarks Bar.
        </div>
      ) : (
        <div className="folder-list">
          {folders.map((folder) => (
            <div key={folder.id} className="folder-item">
              <div className="folder-item__info">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="folder-item__icon"
                  role="img"
                  aria-label="Folder"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span className="folder-item__name">{folder.title}</span>
                <span className="folder-item__count">{folder.childCount}</span>
              </div>
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={() => onOpenFolder(folder.id)}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

**Step 2: Add CSS for FolderList**

In `App.css`, add at the end (or after the memory-related styles):
```css
/* ─── Folder List ───────────────────────────────────────────── */

.folder-empty {
  padding: 12px 8px;
  font-size: 13px;
  opacity: 0.6;
  text-align: center;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.folder-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.folder-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.folder-item__info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.folder-item__icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.folder-item__name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-item__count {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1px 6px;
  flex-shrink: 0;
}

@media (prefers-color-scheme: light) {
  .folder-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .folder-item__count {
    background: rgba(0, 0, 0, 0.08);
  }
}
```

**Step 3: Wire up Folders view in App.tsx**

Update the activeView type (line 20):
```ts
const [activeView, setActiveView] = useState<'groups' | 'folders' | 'memory' | 'settings'>('groups');
```

Add state and fetch for folders (after memoryInfos state):
```ts
const [folders, setFolders] = useState<BookmarkFolder[]>([]);
const [isFetchingFolders, setIsFetchingFolders] = useState(false);
```

Add import for `BookmarkFolder` type (line 3):
```ts
import type { AppSettings, BookmarkFolder, CommandResponse, PopupCommand, TabMemoryInfo } from '@/lib/types';
```

Add import for FolderList component:
```ts
import { FolderList } from './components/FolderList';
```

Add fetch function (after `fetchMemoryUsage`):
```ts
const fetchFolders = useCallback(async () => {
  setIsFetchingFolders(true);
  try {
    const resp = await sendCommand({ type: 'CMD_GET_BOOKMARK_FOLDERS' });
    if (resp.ok && resp.data) {
      setFolders(resp.data as BookmarkFolder[]);
    }
  } finally {
    setIsFetchingFolders(false);
  }
}, []);

const handleSwitchToFolders = useCallback(() => {
  setActiveView('folders');
  fetchFolders();
}, [fetchFolders]);
```

Add open-folder handler:
```ts
const handleOpenFolder = useCallback(
  async (folderId: string) => {
    const resp = await sendCommand({ type: 'CMD_OPEN_FOLDER_AS_GROUP', folderId });
    if (resp.ok) {
      fetchFolders();
      refreshLiveTabs();
    }
  },
  [fetchFolders, refreshLiveTabs],
);
```

**Step 4: Add Folders toggle button**

In the view-toggle div (after the Groups button, before Memory), add:
```tsx
<button
  type="button"
  className={`toggle-btn ${activeView === 'folders' ? 'active' : ''}`}
  onClick={handleSwitchToFolders}
>
  Folders
</button>
```

**Step 5: Add conditional render for Folders view**

After the groups view block and before the memory view block:
```tsx
{activeView === 'folders' && (
  <FolderList
    folders={folders}
    isFetching={isFetchingFolders}
    onOpenFolder={handleOpenFolder}
  />
)}
```

**Step 6: Hide SaveGroupButton on folders view too**

Update the condition (line 152) from:
```tsx
{activeView !== 'settings' && (
```
to:
```tsx
{activeView !== 'settings' && activeView !== 'folders' && (
```

**Step 7: Also refresh folders after saving a group**

Update `handleSaveGroupToFolder` to also refresh folders if the user switches to the folders view:
```tsx
const handleSaveGroupToFolder = useCallback(
  async (tabIds: number[], groupName: string) => {
    const resp = await sendCommand({
      type: 'CMD_SAVE_GROUP_TO_FOLDER',
      tabIds,
      groupName,
    });
    if (!resp.ok) {
      setGroupingError(resp.error ?? 'Failed to save group');
    }
  },
  [],
);
```
(No change needed — the folders view fetches on switch, so stale data will be refreshed.)

**Step 8: Run lint and type check**

Run: `npx biome check . && npx tsc --noEmit && npx vitest run`
Expected: All pass

**Step 9: Commit**

```bash
git add entrypoints/popup/components/FolderList.tsx entrypoints/popup/App.tsx entrypoints/popup/App.css
git commit -m "feat: add Folders view with folder list and open-as-group action"
```

---

### Task 5: Final verification and docs commit

**Step 1: Run full lint + type check + tests**

Run: `npx biome check . && npx tsc --noEmit && npx vitest run`
Expected: All pass

**Step 2: Manual test with dev server**

Run: `npx wxt` to start the dev server, then in Chrome:
1. Create a tab group with 2-3 tabs
2. Hover over the group header — folder icon should appear
3. Click folder icon — group should be saved as a bookmark folder (check Bookmarks Bar)
4. If auto-close is on, tabs should close
5. Switch to Folders view — the saved folder should appear with correct child count
6. Click "Open" on the folder — tabs should open as a new tab group, folder should disappear from bookmarks
7. Toggle auto-close off in Settings, save another group — tabs should stay open

**Step 3: Commit plan and design docs**

```bash
git add docs/plans/2026-03-05-group-to-folder-plan.md
git commit -m "docs: add group-to-folder implementation plan"
```
