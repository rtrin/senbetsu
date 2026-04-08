# UX Recommendations

## Remove the "Clean Up" button from the Ungrouped section

**File:** `entrypoints/popup/components/TabCategoryList.tsx` (lines 170–181)

### Why it underperforms

`handleClassifyUnsorted` only sends the ungrouped tabs to the AI. It passes existing group names as context, but the AI doesn't see the already-grouped tabs themselves — so it classifies with incomplete context and produces inconsistent results (e.g. creating redundant groups or misfiling tabs).

`handleSaveAndGroup` (Group Tabs) sends all tabs together, giving the AI full context for coherent decisions.

### Recommendation

Remove the button. The prompt approach covers the use case more reliably — typing "group only ungrouped tabs" gives the AI full context. Consider adding it as a placeholder example or prompt hint in the input field to preserve discoverability.

### What to clean up

- Remove `onCleanUp` prop from `TabCategoryList` and `TabCategoryListProps`
- Remove `handleCleanUp` and `isCleaningUp` state from `App.tsx`
- Remove `CMD_CLASSIFY_UNSORTED` handling from `background.ts`
- Remove `handleClassifyUnsorted` from `lib/commands.ts`
- Remove `CMD_CLASSIFY_UNSORTED` from `lib/types.ts`
