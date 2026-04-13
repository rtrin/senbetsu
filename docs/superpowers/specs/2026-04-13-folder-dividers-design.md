# Folder Dividers — Design Spec

## Problem

The bookmark folder list is a flat list of folders with no visual organization. Users with many saved folders have no way to group related folders (e.g. "Work" vs "Personal") without moving bookmarks in Chrome itself.

## Solution

Labeled, collapsible section dividers rendered in the folder view. Dividers are view-only — stored in `chrome.storage.local`, Chrome's bookmark bar is never mutated.

## Design Pattern

**Container/Presentational with Colocated State Hook**

- `FolderList` is the container/orchestrator — owns the `useFolderSections` hook, computes derived data, manages drag state, composes children
- `SectionDivider` and `FolderItem` are presentational — pure prop-driven, no knowledge of storage or chrome APIs
- `useFolderSections` is a colocated state hook — encapsulates chrome.storage read/write, lives inside `FolderList` (not lifted to App.tsx)

Data flows one direction: `chrome.storage` -> hook -> container -> presentational -> user actions -> hook mutations -> re-render.

## Feature Behavior

### Sections
- Users create sections via a "+ Add Section" button at the bottom of the folder list
- Sections have a label displayed as: `── Label ──────` (small, uppercase, muted text with horizontal rules)
- Sections are collapsible via a chevron toggle (all open by default)
- Collapse state persists across popup close via `chrome.storage.local`
- Sections can be renamed inline (reusing `InlineEdit`)
- Sections can be deleted via a hover-reveal X button
- Deleting a section moves its folders to the implicit "Unsorted" section
- Empty sections are allowed

### Folder Assignment
- Drag a folder onto a section divider header to assign it to that section
- Folders not assigned to any section appear in the "Unsorted" section at the bottom (consistent with ungrouped tabs in the groups view)
- The "Unsorted" label only renders when at least one named section exists

### Section Reordering
- Drag section divider headers to reorder sections relative to each other
- No folder reordering within sections (future feature)

### Visual Design
- Section header: collapse chevron | left rule | label (11px, uppercase, grey, letter-spaced) | right rule | delete X (hover)
- Label uses the same styling as the existing "Bookmark Folders" heading
- Drop target feedback: dashed blue outline (reusing existing `.drop-target` CSS class)
- When no sections exist, the view looks identical to today (no visual regression)

## Data Model

```ts
interface FolderSection {
  id: string           // crypto.randomUUID()
  label: string
  folderIds: string[]  // ordered bookmark folder IDs assigned to this section
}

interface FolderSectionsState {
  sections: FolderSection[]          // ordered, excludes implicit Unsorted
  collapsed: Record<string, boolean> // sectionId -> true if collapsed
}
```

Storage key: `senbetsu_folder_sections` in `chrome.storage.local`.

Default state: `{ sections: [], collapsed: {} }`. Absence of a key in `collapsed` means not collapsed (open by default).

A folder not referenced in any `section.folderIds` is implicitly Unsorted. Deleting a section just removes it from `sections` — its folder IDs naturally fall out of all mappings.

Stale folder IDs (folders deleted externally in Chrome) are silently filtered out at render time via `folderById.get(id)`.

## Component Architecture

```
FolderList (container/orchestrator)
  useFolderSections()
  computes: folderById, folderSectionMap, unsortedFolders
  manages: dragOverTarget (discriminated union)
  |
  +-- SectionDivider (presentational, new file)
  |     InlineEdit (reused)
  |     [collapse chevron, delete X, drag handle]
  |
  +-- FolderItem[] (presentational, extracted from current FolderList)
  |     InlineEdit (reused)
  |     [expand/collapse, bookmarks list, action buttons]
  |
  +-- "Unsorted" label (static, only when sections exist)
  +-- FolderItem[] (unsorted folders)
  +-- "+ Add Section" button
```

## Drag-and-Drop

Three drag operations distinguished by `dataTransfer` key:

| Drag | Source | Target | dataTransfer key | Action |
|------|--------|--------|-----------------|--------|
| Bookmark between folders | Bookmark row | FolderItem | `text/plain` + `application/x-folder-id` | `onMoveBookmark` (existing) |
| Folder into section | FolderItem header | SectionDivider | `application/x-bookmark-folder-id` | `assignFolderToSection` |
| Section reorder | SectionDivider | SectionDivider | `application/x-section-id` | `reorderSections` |

Drop handlers check keys in priority order: section-id first, then bookmark-folder-id. No overlap with existing bookmark drag keys.

## Hook API: `useFolderSections`

Follows the same pattern as `useAnnotations` — load on mount, optimistic state update, fire-and-forget save.

```
Returns:
  sections: FolderSection[]
  collapsed: Record<string, boolean>
  addSection(label: string)
  renameSection(id: string, label: string)
  deleteSection(id: string)
  toggleCollapsed(id: string)
  assignFolderToSection(folderId: string, sectionId: string | null)  // null = unassign
  reorderSections(fromIndex: number, toIndex: number)
```

## Files Changed

| File | Change |
|------|--------|
| `lib/types.ts` | Add `FolderSection`, `FolderSectionsState` |
| `lib/constants.ts` | Add `folderSections` to `STORAGE_KEYS` |
| `entrypoints/popup/hooks/useFolderSections.ts` | New — state hook |
| `entrypoints/popup/components/FolderItem.tsx` | New — extracted from FolderList |
| `entrypoints/popup/components/SectionDivider.tsx` | New — divider header row |
| `entrypoints/popup/components/FolderList.tsx` | Rewritten as orchestrator |
| `entrypoints/popup/App.tsx` | No changes |

## Build Sequence

1. Data layer: types, storage key, `useFolderSections` hook
2. Extract `FolderItem` from `FolderList`, verify no regressions
3. Create `SectionDivider` component
4. Rewrite `FolderList` as orchestrator with section rendering
5. Wire drag-and-drop for folder assignment and section reorder
6. Polish: collapse persistence, stale folder cleanup, "+ Add Section" auto-focus

## Out of Scope

- Folder reordering within sections (future feature, data model already supports it)
- Syncing section order to Chrome's bookmark bar order
- Background service worker changes (no new commands needed)
