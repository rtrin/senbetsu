---
globs: ["entrypoints/popup/**/*.tsx", "entrypoints/popup/**/*.css"]
---

# Popup UI Rules

- React functional components with hooks
- Plain CSS styling (no Tailwind in this project)
- Popup has full Chrome extension API access via `chrome.*`
- Keep components small and composable
- Popup is ephemeral — it closes when user clicks away, so don't rely on component state for persistence
- Use `chrome.storage.local` for any data that needs to survive popup close
