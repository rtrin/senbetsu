# Prompt-based Tab Sorting Plan

## 1. Problem Statement
The current Senbetsu extension uses a hard-coded list of categories to organize tabs. The user wants the ability to input a custom prompt (e.g., "Sort by project", "Group travel research separately") to dictate how tabs should be grouped.

## 2. Research & Approaches
Based on web research, AI tab groupers handle prompt-based sorting via two main approaches:

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **1. Zero-shot Dynamic Categorization** | Extremely flexible; AI decides categories and group names on the fly based on the prompt. | Hard to map colors consistently; risk of too many groups. | Medium |
| **2. Prompt as a Filter/Instruction** | Simpler to maintain; the AI uses the prompt to guide placement into either dynamic or slightly bounded categories. | Requires prompt engineering to ensure the AI doesn't hallucinate invalid JSON. | Low-Medium |

**Selected Approach: Zero-shot Dynamic Categorization with Bounded Formatting**
Since the user wants dynamic grouping without *any* hardcoded constraints, we are completely removing the `TAB_CATEGORIES` list.
- If a user prompt is provided (e.g., "Group my JS frameworks"), the AI will dynamically extract categories aligned with the prompt ("React", "Vue").
- If no prompt is provided, the AI will evaluate the open tabs and independently determine the best logical groupings on the fly.
We will use the `gpt-4o-mini` JSON object response format to force the AI to return `{ "category": "extracted_name" }`. Grouping logic will assign a random or deterministic Chrome Tab Group color to new dynamic categories.

## 3. High-level Technical Design

**A. Storage/State**
- Save the `userPrompt` in `chrome.storage.local` (via `lib/storage.ts`) so it persists between sessions.

**B. UI (Popup)**
- Add a text input field in `App.tsx` or a new component (`PromptInput.tsx`) to accept the prompt.
- Pass the prompt to the background script during the `CMD_SAVE_AND_GROUP` command.

**C. API / AI Logic (`lib/ai.ts`)**
- Remove `TAB_CATEGORIES` entirely.
- Rewrite `SYSTEM_PROMPT`: "You are an intelligent tab organizer. Group tabs into broad, logical categories dynamically. Try not to exceed 5 distinct categories total. If the user provides a custom prompt, categorize the tabs based specifically on those instructions."
- Remove the `isValidCategory` check.

**D. Grouping (`lib/grouping.ts`)**
- Change color assignment from a hardcoded map `CATEGORY_COLORS` to a deterministic hash function that selects from `TAB_COLORS` (`['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']`).

## 4. Dependencies and Risks
- **Risk:** AI hallucinates too many categories or generates overly specific 1-off categories without predefined bounds.
  - *Mitigation:* Explicitly prompt the AI to limit the number of categories (e.g., max 5) and to group vaguely related tabs into broader categories.
- **Risk:** Type checking breaking across UI and State.
  - *Mitigation:* Delete the strictly typed `TabCategory` union type and replace instances of it with a standard `string` type across `types.ts`, `storage.ts`, and the React components.
