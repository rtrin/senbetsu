# Review: View Folder Tabs & Large Folder Opening Performance

Date: 2026-03-08
Reviewer: AI

## Findings

- **Folder Alignment**: Folder icons and bookmark favicons in the expanded dropdown were not vertically aligned perfectly.
- **Child Count Metric**: Replaced `contents.length` with `bookmarks.length` so count badge correctly displays number of bookmarks (excluding sub-folders). 
- **Timeouts**: Added a 30-second timeout to `waitForTabLoad` in `commands.ts` so `chrome.tabs.onUpdated` listeners do not mem-leak.
- **Fail Mutes**: Handled the discard fire-and-forget Promise rejection (`waitForTabLoad(id).then(...).catch(...)`).
- **Data Lookup Performance**: Optimized folder lookup using `chrome.bookmarks.get` rather than `chrome.bookmarks.getChildren()`.
- **UI Error Guard**: Added `onError` fallback handling for bookmark favicons.

## Resolutions

- Updated padding/margin classes in `FolderList.tsx` block to properly align nested favicons.
- Assigned `bookmarks.length` directly safely as type is assured from `tab` mappings.
- Cleaned up dangling event listeners post-timeout inside the `handleOpenFolderAsGroup` Promise loops.
- Overwrote generic `.catch()` loggers safely.
- Fixed performance by replacing global search loop with correct API endpoint.
- Appended `style.display` modifications on `currentTarget` explicitly in fallback scenarios.

## Approval

- [x] Quality gates pass
- [x] AI review complete
- [x] Critical issues addressed
