---
globs: ["entrypoints/background.ts"]
---

# Background Service Worker Rules

- No DOM access — no `window`, `document`, `localStorage`, or DOM APIs
- Use `chrome.runtime` for messaging between popup, content scripts, and background
- Service workers can be terminated at any time — keep operations efficient, don't hold long-running state
- Use `chrome.storage.local` for persistence
- Use `chrome.alarms` for scheduled tasks (not `setTimeout`/`setInterval` for long delays)
