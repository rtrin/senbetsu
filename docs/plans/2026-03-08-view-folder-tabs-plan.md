# View Tabs in Folder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to click on a bookmark folder in the Folders view to expand it and see the bookmarks (tabs) inside it. Clicking a bookmark will open it in a new tab.

**Architecture:** Modify `CMD_GET_BOOKMARK_FOLDERS` to include child bookmarks. Add a new command `CMD_OPEN_BOOKMARK` to open URLs cleanly. Update `FolderList.tsx` with a local expansion state and rendering logic for bookmarks, reusing existing UI patterns.

**Tech Stack:** React 19, TypeScript, Chrome Extension APIs, Vitest

---

## User Review Required

- No breaking changes.
- UI wise, clicking the folder row will toggle expansion, while the "Open" button will still open the entire folder as a tab group. Is this intuitive? A chevron icon will be added to indicate expandability.

---

## Proposed Changes

### 1. Types & Commands Update
These files handle the data layer and extension messaging.

#### [MODIFY] `lib/types.ts`
- Add a `BookmarkItem` interface: `{ id: string; title: string; url: string; }`.
- Update `BookmarkFolder` interface to include `bookmarks: BookmarkItem[]`.
- Add a new command `CmdOpenBookmark` with `type: 'CMD_OPEN_BOOKMARK'` and `url: string`. Add it to the `PopupCommand` union.

#### [MODIFY] `lib/commands.ts`
- In `handleGetBookmarkFolders`, after fetching folder contents, explicitly filter for bookmarks (items with URLs: `contents.filter(node => node.url)`) to extract bookmarks and attach them to the returned folder objects.
- Add and export `handleOpenBookmark(url: string)` which calls `chrome.tabs.create({ url, active: true })`.

#### [MODIFY] `entrypoints/background.ts`
- Import `handleOpenBookmark`.
- Add a switch case for `CMD_OPEN_BOOKMARK` pointing to the new handler.

#### [MODIFY] `lib/__tests__/folder-commands.test.ts`
- Update the mock responses and assertions in `describe('handleGetBookmarkFolders')` to verify that `bookmarks` are returned correctly along with `childCount`.

---

### 2. UI Updates
These files handle the visual presentation in the extension popup.

#### [MODIFY] `entrypoints/popup/components/FolderList.tsx`
- Add `onOpenBookmark: (url: string) => void` to `FolderListProps`.
- Introduce local state: `const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());`.
- Add a toggle function `toggleFolder(id)`.
- Wrap the folder info in a clickable button (with a chevron icon) that calls `toggleFolder`.
- Conditionally render the bookmarks list underneath the folder item if it's expanded.
- Use a design similar to `TabItem.tsx` but simpler: fallback to a generic link icon or use Google's favicon service (`https://www.google.com/s2/favicons?domain=...&sz=32`), title, and URL.
- When a bookmark is clicked, call `onOpenBookmark(bookmark.url)`.
- Use Tailwind utility classes for all styling, including the chevron rotation (e.g., `className={clsx('transition-transform', expanded && 'rotate-90')}`).

#### [MODIFY] `entrypoints/popup/App.tsx`
- Add `handleOpenBookmark = useCallback((url: string) => { sendCommand({ type: 'CMD_OPEN_BOOKMARK', url }); window.close(); }, [])` to close the popup after navigating.
- Pass `onOpenBookmark={handleOpenBookmark}` to the `<FolderList>` component.

---

## Verification Plan

### Automated Tests
1. **Unit tests**: Run `npx vitest run lib/__tests__/folder-commands.test.ts` to ensure `CMD_GET_BOOKMARK_FOLDERS` correctly returns bookmarks in the payload.
2. **Type check**: Run `npx tsc --noEmit` to verify type safety.
3. **Linting**: Run `npx biome check .` to ensure formatting and linting rules are met.

### Manual Verification
1. Run `npm run dev` (or `wxt`) to start the extension.
2. Open the Senbetsu popup in Chrome.
3. Navigate to the **Folders** tab.
4. Click on a folder row; verify it expands to show the bookmarks inside.
5. Verify the chevron icon rotates to indicate the expanded state.
6. Click on one of the bookmarks; verify it opens in a new active tab in the browser.
7. Click the "Open" button on the folder; verify it still correctly opens all bookmarks as a tab group.
