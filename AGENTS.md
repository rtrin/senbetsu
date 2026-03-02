# AI Coding Agent Guidelines

Best practices for AI assistants working on this codebase.

## Agent Configuration

- Read files in `.agents/` for workflows, rules, and skills before starting tasks
- Read `.claude/rules/` for path-scoped rules that apply to specific files

## Project Structure

```
entrypoints/popup/        # React popup UI
entrypoints/background.ts # Service worker (no DOM)
entrypoints/content.ts    # Content script
lib/                      # Shared utilities
docs/                     # Documentation, plans, PRDs
```

## Code Standards

### File Limits

- **Max file size**: 500 lines (target: 400)
- **Max function size**: 60 lines (target: 50)
- Split large files into domain-specific modules
- **Quality Check**: Review the solution and ask yourself: "Would a staff engineer approve of this solution? Is it clean, simple, and elegant?"

### TypeScript

- Use strict types, avoid `any`
- Define interfaces for all props and data structures
- Export shared types from `lib/types.ts`

### Chrome Extension Specifics

- **Service worker** (`background.ts`): No DOM access, no `window`, no `document`. Use `chrome.runtime` for messaging.
- **Content scripts** (`content.ts`): Limited Chrome API access, runs in page context.
- **Popup** (`popup/`): Full Chrome API access, React UI, ephemeral (closes when user clicks away).
- Use `chrome.storage.local` for persistence, never `localStorage` (not available in service workers).

### Components

- React functional components with hooks
- Plain CSS for styling (no Tailwind)
- Keep components small and composable

### Code Review

> **MANDATORY**: All new features must undergo code review.

- Run the `/code-review` workflow before merging to `main`

## Verification

```bash
biome check .   # Lint + format
vitest run      # Tests
tsc --noEmit    # Type check
```

## Commit Practices

- Atomic commits (one logical change per commit)
- Test before committing
- Run `biome check .` before pushing
