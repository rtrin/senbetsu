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
lib/                        # Shared utils (ai, storage, grouping, types)
docs/                       # Plans, PRDs, future features
public/                     # Static assets (icons, images)
```

## Key Files

- `lib/types.ts` — shared TypeScript types
- `lib/ai.ts` — provider-neutral grouping orchestration
- `lib/ai-provider.ts` — OpenAI, Claude, and Gemini adapters
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
- **[lint]**: A provider storage documentation edit introduced trailing whitespace; run `git diff --check` after documentation changes.
- **[testing]**: Strengthened grouping validation intentionally rejects a non-numeric tab ID, so the allowlist test must use an otherwise valid response and cover malformed IDs separately.
- **[config]**: `npm ci` could not install dependencies because the existing `package-lock.json` is stale relative to the modified `package.json` (Vitest and related versions differ); do not regenerate the lockfile while preserving unrelated working-tree changes.
- **[testing]**: The timeout adapter test attached its rejection assertion after advancing fake timers, creating an unhandled rejection; attach the assertion before advancing time.
- **[config]**: `biome check .` is currently blocked by a checked-in schema version mismatch (2.4.11 config vs 2.4.4 CLI) and existing unrelated class-order findings; ran scoped formatting for provider changes instead.
- **[types]**: Provider settings refactor invalidated OpenAI-only storage test types; update tests alongside the settings contract rather than retaining legacy fields in normalized types.
- **[config]**: The documented Serena `initial_instructions` tool was unavailable in this environment; searched the Serena tool catalog and used the available onboarding/activation flow instead.
- **[config]**: OpenCode's long-running service did not inherit the shell's GitHub token, leaving the MCP Authorization header empty; use a protected `{file:~/.config/opencode/github-token}` reference instead of relying on `{env:...}`.
- **[types]**: Chrome tab test fixtures require the non-optional `selected` and `groupId` fields; include them when constructing `chrome.tabs.Tab` mocks.
- **[testing]**: `vi.clearAllMocks()` does not remove queued `mockResolvedValueOnce` implementations; reset affected mocks when tests intentionally leave a one-shot mock unused.
