# Fix Tab Group Name Not Visible

## Root Cause

This is a **known Chrome 145 rendering bug** — `chrome.tabGroups.update()` sets the title internally, but Chrome doesn't render it on the tab strip. The title is correctly stored (right-clicking the group shows it), but the visual label is missing. A fix is expected in Chrome 146.

## Workaround

Toggling the group's `collapsed` state forces Chrome to re-render the tab group, which makes the title appear. The strategy:

1. Set properties (title, color) with `collapsed: true`
2. Short `setTimeout` delay (lets Chrome process the first update)
3. Update again with `collapsed: false`

This produces a barely perceptible flicker but reliably forces the title to display.

> [!IMPORTANT]
> This is a Chrome bug workaround, not a logic fix. Once Chrome 146 ships and the bug is confirmed fixed, we should remove the toggle hack and revert to the clean single-update call.

## Proposed Changes

### Grouping Module

#### [MODIFY] [grouping.ts](file:///Users/richardtrinh/Development/projects/chrome-extensions/senbetsu/lib/grouping.ts)

Update `updateGroupMetadata` (lines 13–20) to toggle `collapsed` state as a rendering workaround:

```diff
 async function updateGroupMetadata(
   groupId: number,
   title: string,
   color: TabGroupColor,
 ): Promise<void> {
   const chromeColor = color as chrome.tabGroups.Color;
-  await chrome.tabGroups.update(groupId, { title, color: chromeColor, collapsed: false });
+  // Workaround for Chrome 145 rendering bug: title doesn't display unless
+  // we toggle collapsed state to force a re-render of the tab strip.
+  await chrome.tabGroups.update(groupId, { title, color: chromeColor, collapsed: true });
+  await new Promise((resolve) => setTimeout(resolve, 50));
+  await chrome.tabGroups.update(groupId, { title, color: chromeColor, collapsed: false });
 }
```

This single change fixes **both** `applyClassifications` and `moveTabToGroup` since they both call `updateGroupMetadata`.

---

### Commands Module

#### [MODIFY] [commands.ts](file:///Users/richardtrinh/Development/projects/chrome-extensions/senbetsu/lib/commands.ts)

Update `handleOpenFolderAsGroup` (line 346) to use the same toggle workaround:

```diff
-      await chrome.tabGroups.update(groupId, { title, color, collapsed: false });
+      // Workaround for Chrome 145 rendering bug (see grouping.ts)
+      await chrome.tabGroups.update(groupId, { title, color, collapsed: true });
+      await new Promise((resolve) => setTimeout(resolve, 50));
+      await chrome.tabGroups.update(groupId, { title, color, collapsed: false });
```

## Verification Plan

### Automated Tests

Update existing test expectations that assert `chrome.tabGroups.update` call counts and arguments:

- **`folder-commands.test.ts`** line 222: The test currently expects a single `tabGroups.update` call. After the fix, there will be **two** calls — first with `collapsed: true`, then with `collapsed: false`.

```bash
vitest run
biome check .
tsc --noEmit
```

### Manual Verification

1. Run `wxt` to start the dev server
2. Open the extension popup
3. Test **AI Sort**: Click the sort button → verify group names appear on the tab strip
4. Test **Open Folder as Group**: Save a group to bookmarks, then restore it → verify the group name is visible

> [!NOTE]
> Since I can't run the Chrome extension in a browser from here, I'll need you to do the manual verification after I make the changes.
