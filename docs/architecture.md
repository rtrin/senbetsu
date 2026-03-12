# Senbetsu Architecture Documentation

## 1. Overview
**Senbetsu** is an AI-powered tab manager for Chrome that categorizes and auto-groups open tabs into Chrome Tab Groups based on the webpage's context. It is built using the **WXT** extension framework, **React** for the UI, and **TypeScript** for end-to-end type safety.

---

## 2. Directory Structure

```text
senbetsu/
├── docs/                   # Project documentation, plans, and features
├── entrypoints/            # WXT extension entry points
│   ├── background.ts       # Service worker (Central controller)
│   └── popup/              # Extension popup UI (React + CSS)
├── lib/                    # Shared business logic and utilities
│   ├── ai.ts               # OpenAI API integration
│   ├── commands.ts         # Actions fired from the popup
│   ├── constants.ts        # Shared constants (Categories, Colors, Keys)
│   ├── grouping.ts         # Logic for interacting with Chrome Tab Groups
│   ├── storage.ts          # Chrome Storage wrappers for settings & sessions
│   ├── types.ts            # Global TypeScript interfaces
│   └── utils.ts            # General utility functions
├── public/                 # Static assets (icons, images)
└── wxt.config.ts           # WXT build configuration
```

---

## 3. Core Components & Data Flow

### A. Central Orchestration (`entrypoints/background.ts`)
The Background Service Worker serves as the operational brain of the extension.
- **Debounce Queue:** Rapid fire tab opens are batched using a debounce timer (`CLASSIFICATION_DEBOUNCE_MS`), preventing rate limits when hitting the AI API.
- **Message Listener:** Listens for `CMD_*` events from the popup.
- **Lifecycle Management:** Cleans up memory maps when native tabs or windows are closed via `chrome.tabs.onRemoved` and `chrome.windows.onRemoved`.

### C. AI Classification Engine (`lib/ai.ts`)
Handles the payload generation and network request to the generic OpenAI Chat Completions API.
- **Prompting:** Uses a zero-shot system prompt instructing the AI to dynamically generate categories (max 5-7). If the user provides a custom instruction prompt, the AI strictly categorizes tabs based on that prompt. Enforces a single-category JSON response (e.g., `{"category": "React Frameworks"}`).
- **Batching:** `classifyTabs()` resolves multiple requests concurrently using `Promise.allSettled`.

### D. Native Tab Grouping (`lib/grouping.ts`)
Turns the AI classifications into physical browser changes using the `chrome.tabGroups` and `chrome.tabs` APIs.
- Maintains in-memory maps linking `windowId` ⭢ `category` ⭢ `groupId`.
- Re-uses existing category groups in the current window before creating new ones.
- Assigns specific predefined Chrome Native Colors (defined in `lib/constants.ts`) by hashing the dynamic category string using `getCategoryColor()` from `lib/utils.ts`.

---

## 4. User Interface & State Management

### Popup React App (`entrypoints/popup/`)
The interface is a standard React SPA utilizing localized CSS modules or standard stylesheets.
- **App.tsx:** The root component synchronizing state with `chrome.storage`.
- **hooks/useCurrentTabs.ts:** A custom hook listening to Chrome Tab events to keep the popup's view of open tabs perfectly in sync with the browser.
- **components/:**
  - `Header.tsx`: Title and current tab counter.
  - `OnboardingBanner.tsx`: Greets new users and prompts the first manual classification.
  - `SaveGroupButton.tsx`: Trigger to classify and snapshot the current session workspace. Includes an optional text input field for users to provide a custom sorting prompt to the AI.
  - `SessionHistory.tsx`: Renders previously saved session snapshots.
  - `TabCategoryList.tsx`: Displays live tabs organized by their AI-assigned category.

### Command Pattern (`lib/commands.ts`)
To keep the UI uncoupled from the background APIs, actions in the popup dispatch strictly typed commands to the background script (e.g., `CMD_SAVE_AND_GROUP`, `CMD_RESTORE_SESSION`). The background script performs the heavylifting and returns a `CommandResponse` (`{ ok: boolean, error?: string }`).

---

## 5. Storage Layer (`lib/storage.ts`)

All persistent state utilizes `chrome.storage.local`.
- **Settings:** Stores boolean preferences like `autoGroupEnabled` and `hasSeenOnboarding`. 
- **Sessions:** Saves an array of `SavedSession` objects, functioning like workspace snapshots that the user can restore later.

## 6. Development & Build
The extension is built utilizing the **WXT** framework which handles bundling (Vite under the hood) and manifest generation.
- **Development Server:** `npm run dev` (Runs WXT dev server with hot-reloading).
- **Production Build:** `npm run build` (Outputs the final `/dist` extension bundle).
- **Linting & Formatting:** Enforced globally using Biome (`biome check .`).
