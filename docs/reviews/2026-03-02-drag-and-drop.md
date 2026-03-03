# Review: Drag & Drop Tabs

Date: 2026-03-02
Reviewer: AI

## Findings

The goal of this Feature was to add manual tab drag-and-drop between groups to the extension popup, without a heavy reliance on new files or architecture changes.

### 1. Data Layer
- A new `CMD_MOVE_TAB_TO_GROUP` command was created and fully wired from `types.ts` to `background.ts`.
- The `moveTabToGroup` internal method handles the Chrome API orchestration.
  - Safely handles dropping onto the "Ungrouped" section via `chrome.tabs.ungroup()`.
  - Reuses the robust `findOrCreateGroup()` method to grab or initialize a named group for the destination.
- State is synchronized with Chrome in real-time.

### 2. UI Layer
- Used React's inline HTML5 DnD event handlers to make `<TabItem>` draggable, passing the `tabId` as plain-text data payload.
- Registered `.tab-group` and `.tab-group--ungrouped` as drop zones in `TabCategoryList`.
- State correctly manages an active `dragOverGroupId` for visual feedback.
- Used an offset `outline` for hover feedback to ensure the layout does not jitter when dropping.
- Guarded `onDragLeave` with a check against `relatedTarget` so dragging through child elements does not trigger flicker.
- `App.tsx` handles the optimistic drop by checking for same-group no-ops, calling the background worker, and dynamically invoking `refreshLiveTabs()` on success without reloading the popup.

### 3. Tests & Linting
- Compiled without errors (`tsc --noEmit` passed).
- `biome check .` reports no warnings or errors.
- Manual testing flows have been documented.

## Approvals

- [x] Biome checks pass
- [x] Compilation checks pass
- [x] AI Feature Verification complete
