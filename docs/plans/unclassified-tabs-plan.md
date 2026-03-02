# Unclassified Tabs Implementation Plan

## Problem
Currently, after a user clicks "Group Tabs" or "Clean up", the popup doesn't automatically show the newly created groups until it's reopened.

## Approach: The Simplest Way
The `useCurrentTabs` hook already provides a `refresh` function that manually queries Chrome again for all tabs and all tab groups, replacing our React state with the latest source of truth.

Instead of writing custom `chrome.tabGroups` listeners across the codebase, **the simplest and most robust way** is to destructure `refresh` from the hook in `App.tsx` and call it immediately after the background command successfully resolves.

## Steps
1. Modify `App.tsx` to destructure `refresh: refreshTabs` from the `useCurrentTabs()` call.
2. In `handleSaveAndGroup`, if `resp.ok`, call `refreshTabs()`.
3. In `handleCleanUp`, if `resp.ok`, call `refreshTabs()`.
4. Optionally, add `changeInfo.groupId !== undefined` listener to `useCurrentTabs.ts` for safety if other windows modify things, but manual refresh covers the immediate need perfectly.
