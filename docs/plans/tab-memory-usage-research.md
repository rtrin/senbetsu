# Research: Tab Memory Usage

## 1. Define the Problem
We need to implement a feature to check the memory usage of open tabs, specifically to identify the top tabs using memory.
**Key requirements:**
- Accurately determine the memory consumption of individual tabs.
- Process and sort this information to find the most memory-intensive tabs.
- Display memory info in the popup alongside existing tab groups.

## 2. Web Search Summary
Based on official Chrome Extension documentation and developer discussions:
- The standard Web API `performance.memory` only measures the memory of the current page/context (JS heap size), not other tabs, and doesn't represent the full OS process memory.
- Chrome provides a dedicated `chrome.processes` API designed specifically to interact with the browser's processes, including retrieving detailed information like private memory and JS memory for Renderer processes.
- To use `chrome.processes`, the extension needs the `"processes"` permission in its `manifest.json`.
- The flow involves mapping a tab to its underlying renderer process. We get the process ID for a tab and then query the memory for that process by passing `includeMemory: true` to `chrome.processes.getProcessInfo`.

## 3. Compare Approaches

| Approach | Pros | Cons | Complexity |
| -------- | ---- | ---- | ---------- |
| **`chrome.processes` API** | Built-in, accurate, provides private and JS memory stats directly. | **Dev channel only** — not available on Chrome stable/beta. Cannot ship to real users. Requires the `processes` permission. | Low |
| **Content Scripts with `performance.memory`** | No special permissions beyond `scripting` (which we already have). Available on stable Chrome. | Only measures JS heap size per frame — not total tab memory (excludes DOM, images, CSS, GPU). Inaccurate for multi-frame tabs. | Medium |
| **`performance.measureUserAgentSpecificMemory()`** | More accurate than `performance.memory`, includes DOM and other allocations. | Requires cross-origin isolation (`COOP`/`COEP` headers) which most websites don't set. Would fail on ~95% of tabs. | Medium |

## 4. Document Decision

**Decision:** Use `performance.memory` via `chrome.scripting.executeScript` (JS heap size).

**Why:** The `chrome.processes` API is **only available on Chrome Dev channel** — it cannot be used in a shipping extension on stable Chrome. `performance.measureUserAgentSpecificMemory()` requires cross-origin isolation that most sites don't have. `performance.memory` is the only approach that works reliably on stable Chrome without additional permissions (we already have `scripting` + `<all_urls>`).

**Trade-off:** JS heap size is an approximation — it won't match Chrome Task Manager numbers (which include DOM, images, GPU memory, etc.). But it's directionally useful: tabs running heavy JS frameworks/SPAs will show higher values, and it's enough to identify the worst offenders.

## 5. Data Model

```typescript
interface TabMemoryInfo {
  tabId: number;
  title: string;
  url: string;
  favIconUrl: string;
  jsHeapUsedMB: number;  // usedJSHeapSize in MB
  category?: string;      // from latest session, if available
}
```

## 6. Implementation Steps

### Step 1: Create memory scraping utility (`lib/memory.ts`)
- Use `chrome.scripting.executeScript` to inject a function that reads `performance.memory.usedJSHeapSize` from each tab.
- Batch execution in groups of 10 (same pattern as existing `scrapeTabContent` in `commands.ts`) to avoid IPC saturation.
- Wrap each call in try/catch — special tabs (`chrome://`, `devtools://`, `edge://`) will fail and should return `null`.
- Filter out tabs that haven't finished loading (no `performance.memory` available yet).
- Filter out discarded/frozen tabs (check `tab.discarded` flag — these have no active process).
- Filter out the extension's own popup tab.

### Step 2: Add command (`CMD_GET_MEMORY_USAGE`)
- New command type in `types.ts`, handler in `commands.ts`.
- Handler calls `chrome.tabs.query({ currentWindow: true })`, filters classifiable tabs, scrapes memory from each, returns sorted results.
- Sort descending by `jsHeapUsedMB`.

### Step 3: Add to popup UI
- **Where:** New section in the popup below the tab groups, or a toggle/tab to switch between "Groups" and "Memory" views.
- **Display:** Sorted list showing favicon, title, and memory badge (e.g., "24 MB").
- **Format:** Auto-format as KB/MB — use MB for ≥1 MB, KB for smaller values.
- **Limit:** Show all tabs sorted by memory, with a visual emphasis on the top consumers (e.g., bold/colored badge for top 3).

### Step 4: Add refresh mechanism
- Fetch memory info once when popup opens (or when user navigates to memory view).
- Add a manual refresh button — no auto-polling interval.
- No background polling at all. Memory data is only fetched on demand.

## 7. Edge Cases

| Case | Handling |
| ---- | -------- |
| `chrome://`, `devtools://`, extension pages | `executeScript` will throw — catch and exclude from results |
| Discarded/frozen tabs | Check `tab.discarded` before scraping — show as "Suspended" with 0 MB |
| Tabs still loading | `performance.memory` may be undefined — return `null`, exclude from results |
| `performance.memory` unavailable (Firefox, etc.) | Return `null` — this is Chrome-only. If porting later, gate behind feature check |
| Extension's own popup | Filter out by matching against `chrome.runtime.getURL('')` |

## 8. Potential Risks & Mitigations

- **Risk:** JS heap ≠ total memory. Users may compare to Chrome Task Manager and see different numbers.
  **Mitigation:** Label clearly as "JS Memory" (not "Memory"). Add a tooltip or footnote: "JS heap size — actual tab memory may be higher."

- **Risk:** `performance.memory` is a non-standard Chrome-only API that may be deprecated.
  **Mitigation:** It's been stable in Chrome for years with no deprecation signals. If it's removed, we can gate the feature behind a capability check and hide the UI when unavailable.

- **Risk:** Scraping 50+ tabs for memory info could be slow.
  **Mitigation:** Batch in groups of 10 (already proven pattern). `performance.memory` reads are synchronous and near-instant — much faster than text scraping.

## 9. Future Enhancement

If/when `chrome.processes` moves to stable channel, swap the implementation to use process-level `privateMemory` for accurate total memory. The UI and data flow can stay the same — only the scraping layer changes.
