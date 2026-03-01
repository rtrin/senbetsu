# PRD: Prompt-Based Tab Sorting

## 1. Problem Statement
Users of Senbetsu currently have their tabs sorted into hardcoded, generic categories. The user wants to completely remove these hardcoded categories to allow for completely dynamic groups, and also add a feature for power users to input a nuanced prompt that matches their current mental context (e.g., "Group my Japan trip research", "Separate GitHub PRs from issues").

## 2. Proposed Solution
Introduce **Prompt-Based Tab Sorting** and transition the core extension to **100% Dynamic Categorization**. 
1. The static `TAB_CATEGORIES` list will be entirely removed. 
2. In the popup UI, users will have an optional text input field to provide a natural language sorting instruction. 
3. The AI will dynamically analyze the tabs and create logical group names on the fly—whether guided by the user's prompt or using intelligent defaults if no prompt is provided.

## 3. Success Criteria
- **Total Removal of Hardcoded Lists:** The application will no longer contain predefined arrays like `TAB_CATEGORIES`. All categorization logic will be dynamic.
- **User Input:** The popup includes an accessible text input field for the sorting prompt.
- **Dynamic Categorization:** Tab groups created will reflect the terms or intent of the user prompt, or intelligently group unprompted tabs on the fly.
- **Accurate Placement:** The AI accurately groups matching tabs and excludes/groups remaining tabs reasonably.
- **Error Handling / Limits:** The AI does not create a ridiculous number of groups (e.g., 1 group per tab) and handles vague prompts gracefully.
- **Visuals:** Dynamic groups are assigned Chrome-supported colors cleanly.

## 4. Technical Approach
- **UI Element:** Add a `<textarea>` or `<input type="text">` to `entrypoints/popup/App.tsx` (or a subcomponent) above the `SaveGroupButton`.
- **State Management:** Hold the prompt string in React state. Pass it along with the `CMD_SAVE_AND_GROUP` message payload to the background script.
- **AI Integration (`lib/ai.ts`):** 
  - Update `ClassificationRequest` to include an optional `userPrompt: string`.
  - Rewrite the `SYSTEM_PROMPT` if a `userPrompt` is provided. The prompt should instruct the LLM to act as a tab organizer following the user's specific sorting rules.
  - Relax `isValidCategory` since the `category` string in the JSON response will no longer safely fall within `TAB_CATEGORIES`.
- **Grouping Logic (`lib/grouping.ts`):** 
  - Since Chrome requires specific colors (`grey`, `blue`, `red`, `yellow`, `green`, `pink`, `purple`, `cyan`, `orange`), implement a hash function that maps any dynamic category string to one of these valid color strings to maintain the UI aesthetic without crashing the `chrome.tabGroups.update` API.

## 5. UX Considerations
- **Simplicity:** The input should be optional. If left blank, the system still dynamically auto-groups tabs into AI-determined logical buckets (no longer falling back to a static list).
- **Feedback:** While the AI is processing the prompt (which might take slightly longer), the button loading state must clearly indicate progress.
- **Persistence:** Remembering the last used prompt via `chrome.storage.local` might be useful, but for MVP, clearing it after execution encourages context-specific usage.

## 6. Edge Cases
- **Vague Prompts:** E.g., "Sort them well". The AI should be instructed to fall back to the generic categories if the custom request is unactionable.
- **Over-segmentation:** E.g., "Put each tab in its own group". To prevent browser UI clutter, the AI prompt should explicitly cap the total number of allowed groups (e.g., max 5-7).
- **Empty Return Sets:** If the prompt is "Find recipes" but no recipe tabs exist, all tabs should ideally default to "Other" or remain ungrouped/left alone.
- **API Limits:** Larger prompts increase token usage; truncate input if it exceeds reasonable character limits (e.g., 200 chars).

## 7. AI Cross-Validation Review
**Reviewer:** Gemini (Self-Reflection)
**Feedback:**
- **Logical inconsistencies:** None found. Grouping by dynamic categories requires mapping to standard Chrome group colors.
- **Missing edge cases:** Long prompts might break the popup UI layout; ensure the input has a strict `maxLength` (e.g., 100-200 chars).
- **Security concerns:** Injection risks via OpenAI API are minimal, but we should strip excessive characters to save tokens.
- **UX patterns:** The prompt input should be clear but optional, blending well aesthetically.

**PRD Status:** ✅ APPROVED
**Reviewed by:** Gemini
**Date:** 2026-02-28
