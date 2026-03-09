# Senbetsu — Claude Code Guidelines

> Also read [AGENTS.md](./AGENTS.md) for general AI coding practices.

## Project

WXT Chrome extension with React 19, TypeScript strict mode, Biome (lint/format), Vitest (tests).

AI-powered tab manager that groups browser tabs and tracks memory usage.

## Commands

```bash
wxt                   # Dev server (loads extension in Chrome)
wxt build             # Production build
biome check .         # Lint + format check
biome check --write . # Lint + format with auto-fix
vitest run            # Run tests
tsc --noEmit          # Type check
```

## Structure

```
entrypoints/popup/          # React popup UI (components, hooks, CSS)
entrypoints/background.ts   # Service worker (no DOM access)
entrypoints/content.ts      # Content script (injected into pages)
lib/                        # Shared utils (ai, storage, grouping, types)
docs/                       # Plans, PRDs, future features
public/                     # Static assets (icons, images)
```

## Key Files

- `lib/types.ts` — shared TypeScript types
- `lib/ai.ts` — OpenAI integration for tab grouping
- `lib/storage.ts` — chrome.storage wrapper
- `lib/grouping.ts` — tab categorization logic
- `lib/memory.ts` — tab memory usage tracking
- `lib/commands.ts` — keyboard shortcut commands
- `entrypoints/popup/App.tsx` — main popup component
- `entrypoints/background.ts` — service worker entry point
- `wxt.config.ts` — WXT/extension configuration

## Code Style

- 2-space indent, single quotes, trailing commas (enforced by Biome)
- Functional style, no classes
- Interfaces for props and data structures in `lib/types.ts`
- Keep files under 500 lines, functions under 60 lines

## Workflow

- Plan with Opus before non-trivial work
- Atomic commits — one logical change per commit
- Run `biome check .` and `vitest run` before committing
- Use `/compact` between unrelated tasks

## Mistakes Log

When you encounter an error during development — build failures, type errors, wrong API usage, incorrect assumptions about the codebase, flaky tests, Chrome extension gotchas — log it here immediately. Format:

```
- **[category]**: Brief description of the mistake and the fix/lesson learned
```

Categories: `build`, `types`, `chrome-api`, `testing`, `lint`, `logic`, `config`

Review this section before starting any task to avoid repeating past mistakes.

<!-- Log mistakes below this line -->
