# One-Click Bookmark Tab — Design

## Summary

Add a per-tab bookmark button to the popup UI. Clicking it saves the tab's URL to the Bookmarks Bar and optionally auto-closes the tab. A toggle in Settings controls auto-close behavior (on by default).

## Decisions

- **Destination:** Bookmarks Bar (parentId `'1'`)
- **No state tracking:** Button always looks the same — no filled/outline distinction for already-bookmarked URLs
- **Auto-close toggle:** Lives in SettingsPanel
- **Architecture:** Uses existing command pattern (popup -> background) for consistency

## Changes

### Permission

Add `'bookmarks'` to `permissions` in `wxt.config.ts`.

### Types (`lib/types.ts`)

- Add `bookmarkAutoClose?: boolean` to `AppSettings` (defaults to `true`)
- Add `CmdBookmarkTab` command type to `PopupCommand` union

### Command Handler (`lib/commands.ts`)

`handleBookmarkTab(tabId: number)`:
1. Get tab info via `chrome.tabs.get(tabId)`
2. Create bookmark via `chrome.bookmarks.create({ title, url })` to Bookmarks Bar
3. If `bookmarkAutoClose` setting is true, close the tab
4. Return `CommandResponse`

### Background (`entrypoints/background.ts`)

Add `case 'CMD_BOOKMARK_TAB':` routing to handler.

### UI — TabItem

Add bookmark button in `.tab-item-row` between tab button and close button. Same hover-reveal pattern. Inline SVG icon.

New prop: `onBookmarkTab: (tabId: number) => void`

### UI — SettingsPanel

Add "Bookmarks" section with toggle: "Auto-close tab after bookmarking" (on by default). Uses existing `.toggle` CSS classes.

### CSS

Minimal `.bookmark-btn` styling following `.close-btn--tab` pattern.
