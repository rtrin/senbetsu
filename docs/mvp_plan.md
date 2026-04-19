# Recommended Build Order

Given that the core product is passive auto-grouping with zero input, the build order is structured into the following phases.

> [!IMPORTANT]
> **Immediate Next Step:** Start with Phase 1.
> Wire up the content script to extract page info.
> Send it to an AI API from the background worker.
> Auto-group tabs based on the response.

## Phase 1: Core Auto-Grouping Engine (MVP)
*Build This First. Get it working with a hardcoded API key first.*

- **Content Script**
  - Extract page metadata (title, meta description, OG tags, maybe visible text snippets) from every tab.
- **Background Service Worker**
  - Listen for `tabs.onCreated`, `tabs.onUpdated`, and `tabs.onActivated` to trigger classification.
- **AI Classification Service**
  - Send page context to an LLM API.
  - Receive a category/group label in response.
- **Tab Grouping**
  - Auto-create or assign using Chrome’s native `chrome.tabGroups`.
  - Use color-coded dividers based on the AI response.

---

## Phase 2: Popup UI + Spaces

- **Popup**
  - Show current spaces/groups.
  - Let users see what's grouped and manually override.
- **Storage Layer**
  - Use `chrome.storage.local` to:
    - Persist spaces.
    - Save folders.
    - Store user preferences.
- **Spaces Concept**
  - Define what a “space” is (e.g., a named collection of tab groups or a workspace context).

---

## Phase 3: BYOK Setup

- **BYOK (Bring Your Own Key) Flow**
  - Settings page where the user enters their OpenAI API key.
  - Store in `chrome.storage.local` (never leaves their machine).
  - All features free, no license required.

---

## Phase 4: Polish

- **Folder Saving**
  - Use Bookmarks API or custom storage.
- **Workspace Switching**
- **Onboarding Flow**
- **Chrome Web Store Listing**