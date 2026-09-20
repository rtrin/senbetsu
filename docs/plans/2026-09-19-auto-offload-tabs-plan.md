# Plan: Configurable Automatic Tab Offloading

Date: 2026-09-19
Status: Planning only — no implementation included

## Goal

Add an Automatic tab offloading setting directly to the Memory Usage tab. The
user can choose Off, 1 minute, 3 minutes, or 5 minutes as a minimum inactivity
threshold. Eligible tabs are discarded with Chrome's native API and remain in
the tab strip until activation. Existing manual offload controls remain.

## User-facing behavior and acceptance criteria

- The control is visible on the Memory Usage tab even when optional scripting
  permission has not been granted. Memory measurement remains permission-gated.
- The default is Off. The setting is persisted in `chrome.storage.local` and
  survives popup closure, service-worker termination, and browser restart.
- The selected value is a minimum inactivity threshold, not an exact deadline:
  Chrome alarms can be delayed by scheduling, sleep, or device load.
- Off clears the background schedule and prevents future automatic sweeps.
- Automatic behavior applies across all browser windows, not just the current
  popup window.
- A tab is considered eligible only if the latest queried state shows: a valid
  integer ID, a finite non-negative `lastAccessed`, a completed HTTP(S) URL,
  and inactivity at least the selected threshold.
- Skip active, pinned, incognito, audible, frozen, discarded,
  `autoDiscardable === false`, loading, extension, DevTools, Chrome internal,
  missing-URL, and otherwise unsupported tabs.
- Existing manual per-tab and Offload All actions continue to work unchanged.
- No eligible tabs is a successful silent no-op. One tab's failure does not
  prevent other candidates from being attempted.

Acceptance criteria:

1. New and legacy installations normalize to Off.
2. Each enabled value creates one named alarm; Off clears it.
3. Startup and worker restart reconcile the alarm without duplicates.
4. Every alarm re-reads current settings before querying or discarding tabs.
5. A stale alarm cannot automatically discard after the setting is disabled.
6. A discarded tab reloads through native Chrome behavior when activated.
7. Settings load/save failures, tab races, and Chrome API failures do not
   create unhandled rejections.

## Technical approach

### Settings and storage

Add `AutoOffloadInterval = 'off' | 1 | 3 | 5` and the required
`AppSettings.autoOffloadInterval` field. Set it to `'off'` in
`DEFAULT_SETTINGS`. Explicitly validate this field in `normalizeSettings()`;
missing, legacy, string, non-finite, and unsupported values become `'off'`.
Preserve unrelated legacy settings as the existing storage layer does, but do
not allow an invalid interval to survive normalization.

The popup will persist changes through a narrowly scoped serialized settings
mutation. The current `storage.updateSettings()` is read-modify-write, so the
implementation must either serialize this mutation with other settings writes
or perform a bounded re-read/merge retry. It must not claim concurrent writers
are safe without a test. A concurrent provider or preference update must not
be overwritten by changing the auto-offload value.

### Alarm lifecycle

Create `lib/auto-offload.ts` with testable policy and orchestration helpers.
Use one stable alarm name, `senbetsu-auto-offload`, with a one-minute repeating
period for all enabled intervals. The interval remains the inactivity
threshold; the one-minute cadence avoids per-tab state and gives a reasonably
prompt check without sub-minute scheduling.

Register `chrome.alarms.onAlarm` and `chrome.storage.onChanged` synchronously
inside `defineBackground()`. Start initial reconciliation afterward and catch
startup failures. Filter storage events to `areaName === 'local'` and the
settings key. Serialize reconciliation tasks, with each task reading the
latest settings immediately before `chrome.alarms.create` or `clear`, so an
older startup read cannot win a race with a later user change. Repeated create
operations use the same name and must not create duplicate schedules.

The alarm handler ignores other alarms, re-reads normalized settings, and
returns immediately when the setting is Off. It queries all tabs, filters them,
and uses `Promise.allSettled` for discard calls. An in-flight guard prevents
overlapping sweeps within one live worker.

Maintain a monotonic sweep generation. Relevant settings changes increment the
generation. The sweep checks both generation and current settings again after
querying and immediately before dispatching discard calls. If the user turns
the feature Off or increases the threshold while a query is pending, the stale
sweep aborts before dispatching. A Chrome API call already dispatched cannot be
retroactively cancelled, so guarantees are explicitly based on the final check
immediately before each dispatch.

Eligibility is based on state observed immediately before dispatch, not an
impossible guarantee against all browser races. Tests cover a tab becoming
active, pinned, audible, frozen, or otherwise protected after the initial
query. Individual failures are tolerated; systemic failures are caught.

### Alternatives considered

| Approach | Advantages | Problems | Decision |
| --- | --- | --- | --- |
| Popup timer | Simple UI implementation | Stops when the popup closes | Reject |
| Service-worker `setInterval` | Familiar timer API | MV3 workers terminate; timer is not durable | Reject |
| One alarm per tab | Individual schedules | Excess state, cleanup, and race complexity | Reject |
| Chrome `autoDiscardable` only | Native browser behavior | Does not implement a user threshold | Reject |
| Memory polling | Reuses memory view | Requires page injection and measures a different concern | Reject |
| One named alarm plus tab metadata | Durable and small | Timing is approximate | Select |

## Files to create or modify

### Create

- `lib/auto-offload.ts` — interval validation, eligibility predicate, alarm
  reconciliation, generation handling, and sweep orchestration.
- `lib/__tests__/auto-offload.test.ts` — policy, alarm, race, concurrency, and
  failure tests.

### Modify

- `lib/types.ts` — add `AutoOffloadInterval` and the settings field.
- `lib/constants.ts` — add the default, interval options, alarm name, and
  cadence constants.
- `lib/storage.ts` — normalize the new setting and provide the safe serialized
  mutation/retry required for concurrent settings updates.
- `entrypoints/popup/App.tsx` — pass the setting to MemoryUsageList and persist
  changes while retaining confirmed state on failure.
- `entrypoints/popup/components/MemoryUsageList.tsx` — render the setting and
  explanatory copy regardless of scripting permission; keep memory data and
  manual actions in their existing permission/loading states.
- `entrypoints/background.ts` — register synchronous alarm/storage listeners,
  startup reconciliation, and caught sweep calls.
- `wxt.config.ts` — add required `alarms` permission. Do not add host or
  scripting permissions.
- `lib/__tests__/storage.test.ts` — add defaults, validation, persistence, and
  concurrent-write coverage.
- `docs/architecture.md` — document the popup → storage → worker → alarm →
  `tabs.discard` flow and MV3 timing/exclusions.
- `README.md` — add concise user-facing behavior, default, timing, exclusions,
  reload behavior, and disable instructions.

Do not add a runtime message, content script, memory polling, or host
permission. Leave the existing `CMD_OFFLOAD_TABS` path unchanged.

## Data flow and Chrome API implications

1. App loads normalized settings through `storage.getSettings()`.
2. The Memory Usage select calls the safe settings mutation and waits for
   persistence before showing the new confirmed value.
3. The background local-storage listener queues alarm reconciliation.
4. Reconciliation creates or clears the one named `chrome.alarms` alarm.
5. The alarm wakes the MV3 worker, which re-reads settings, queries
   `chrome.tabs.query({})`, filters current metadata, and calls
   `chrome.tabs.discard(tabId)` with `Promise.allSettled`.
6. Chrome keeps discarded tabs visible and reloads them when activated.

Required APIs are `chrome.alarms`, `chrome.storage.local`,
`chrome.tabs.query`, and `chrome.tabs.discard`. Add only `alarms` to the
manifest. Existing `tabs` and `storage` permissions cover the metadata and
persistence already used. The automatic path does not inject scripts, read
page content, or require new host permissions.

## Error, loading, empty, and edge behavior

- **Settings loading:** show the control but disable it until confirmed settings
  load; show a concise loading state.
- **Settings load failure:** keep it disabled, show an inline retry/error state,
  and do not assume a new default over unknown persisted data.
- **Save in progress:** disable the select and retain the last confirmed value.
- **Save failure:** perform a bounded re-read/merge recovery, restore the
  confirmed value, and show an inline error.
- **Invalid metadata:** require an integer non-negative ID, finite non-negative
  timestamp, completed status, and usable HTTP(S) URL. Skip future timestamps.
- **Protected tabs:** skip active, pinned, incognito, audible, frozen,
  discarded, loading, non-auto-discardable, and special/internal pages.
- **No eligible tabs:** silently complete without a discard call.
- **Tab closure/state race:** tolerate individual rejection and continue.
- **Settings change during sweep:** generation and current-setting checks stop
  stale work before dispatch; already-dispatched Chrome calls cannot be undone.
- **Alarm/storage/query failure:** catch at the background boundary, log a
  concise non-sensitive warning, and retry on a future event.
- **Discard failures:** log one aggregate count without URLs, titles, settings,
  or API keys; do not log provider secrets.
- **Sleep/delayed alarm:** evaluate current state once after wake-up; do not
  catch up by discarding every tab that might have crossed the threshold.

## Test strategy and manual verification

### Automated tests

- Storage: default Off; each valid interval; malformed values (`0`, `2`,
  `'1'`, `Infinity`, `null`, and absent); preservation of unrelated fields.
- Settings mutation: overlapping interval and unrelated preference writes retain
  both fields, including bounded retry behavior.
- Eligibility: exact threshold (`>=`), just below threshold, future timestamp,
  invalid ID/timestamp, and every exclusion independently.
- Alarm lifecycle: exact name, one-minute cadence, Off clear, enabled create,
  unrelated storage events, non-local changes, startup races, and latest value
  wins.
- Sweeps: stale disabled alarm, generation cancellation, tab state change after
  query, no eligible tabs, query failure, aggregate per-tab failures, and
  overlapping sweep suppression.
- Background listener tests confirm synchronous registration and caught startup
  errors.

Run `vitest run`, `tsc --noEmit`, `biome check .`, and `wxt build`. Distinguish
known pre-existing repository gate failures from feature failures.

### Manual verification

1. Run `wxt`, load the extension, and inspect the service worker.
2. Confirm the Memory Usage control is visible without scripting permission.
3. Verify default Off and persistence after popup close and browser restart.
4. Select 1, 3, and 5 minutes; verify exactly one named alarm.
5. Leave ordinary inactive HTTP(S) tabs past the approximate threshold and
   verify native discard/reload behavior.
6. Verify active tabs in every window and all protected/special categories stay
   loaded.
7. Disable the feature and verify the alarm is cleared and stale work does not
   discard tabs.
8. Restart the worker/browser with the feature enabled and verify reconciliation
   restores one alarm without duplicates.
9. Close or change tabs during a sweep and verify no unhandled rejection.
10. Exercise settings, query, and discard failures and verify useful warnings
    contain no secrets or tab metadata.

## Security, performance, and maintainability risks

- **Unexpected reloads:** native discard can interrupt background work and
  reload page state. Mitigate with Off by default, conservative exclusions,
  explicit copy, and an easy Off option.
- **Privacy:** only existing tab metadata is read; no page content or new host
  access is introduced. Incognito is explicitly skipped.
- **Resource use:** one global one-minute query is bounded and avoids injected
  scripts, memory snapshots, and per-tab alarms.
- **Timing:** alarms are approximate and delayed by sleep or browser policy;
  documentation and acceptance tests must avoid exact-deadline claims.
- **Races:** serialized settings mutation, serialized reconciliation, sweep
  generations, fresh checks, and all-settled calls constrain stale work.
- **Maintainability:** keep policy in `lib/auto-offload.ts`, preserve the
  existing manual path, and avoid broad UI/storage refactors.

## Required documentation and manifest changes

- Add `alarms` to `wxt.config.ts` and explain its purpose in architecture docs.
- Document Off as default, approximate thresholds, exclusions, native reloads,
  and disable instructions in `docs/architecture.md` and `README.md`.
- After implementation and final review, add the standard dated review record
  under `docs/reviews/`; this planning document does not claim implementation or
  test completion.

## Plan review and resolutions

The investigation was performed by the Luna-backed `code-explorer`. Planning
used the available `general` agent backed by `openai/gpt-5.6-terra` because no
dedicated planning agent was available. A Sol-backed `code-reviewer` reviewed
the plan and required these revisions:

- Add generation/cancellation checks for settings changes during an active
  sweep.
- Address read-modify-write races for interval and unrelated settings updates.
- Constrain the “never discard” promise to the final observed state and test
  post-query tab-state changes.
- Require integer non-negative IDs and finite non-negative timestamps.
- Add aggregate, non-sensitive logging for individual discard failures.
- Repair ambiguous implementation wording.

The revised plan is internally consistent and implementation-ready. No feature
code has been implemented in this planning phase.
