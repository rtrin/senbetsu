# Feature Research: Unclassified Tabs Handling

## Problem Statement
Tabs that are opened *after* the most recent classification event, or tabs that cannot be classified (non-HTTP URLs), are currently invisible in the popup's groups view.

## Approaches Considered

| Approach | Pros | Cons | Complexity |
| -------- | ---- | ---- | ---------- |
| **Minimal approach** | Modifies existing `TabCategoryList`, zero new files, reuses existing `isWorking` state | Bloats `TabCategoryList` component with conditional logic. Manual array manipulation in generic save command. Loss of granular loading state meaning the whole UI spins. | Low |
| **Clean approach** | Uses separate `UnclassifiedGroup` component. Independent loading state. Cleaner `updateLatestSession` abstraction in storage. Native visual treatment (system badges). | Requires creating a new component and slightly more boilerplate plumbing. | Medium |

## Decision
We've selected the **Clean approach**.
The unclassified group has distinct behaviors (its own classify button, system badges for non-HTTP URLs) that warrant separation from standard AI-classified categories. Furthermore, isolating the storage logic to merge into the existing session prevents regressions related to whole-session overwrites.

## Risks & Mitigations
- **Risk:** Rapid consecutive clicks on "Save & Group" and "Classify Unclassified" could cause race conditions when appending to the `latestSession`.
- **Mitigation:** The UI should disable the other generic save button if `isClassifying` is true, and vice-versa. `updateLatestSession` will read the state right before writing to minimize race conditions.
