# Gemini AI Guidelines

> **Important**: Also read [AGENTS.md](./AGENTS.md) for general AI coding practices.

## Project

WXT Chrome extension with React 19, TypeScript strict mode, Biome (lint/format), Vitest (tests).

AI-powered tab manager that groups browser tabs and tracks memory usage.

## Workflows

Refer to `.agents/workflows/` for structured task execution:

- `/code-review`: AI-assisted code review for PRs
- `/debugging`: Systematic debugging using log-based feedback
- `/documentation`: Maintain thorough project documentation
- `/feature-development`: End-to-end feature development
- `/refactoring`: Periodic codebase cleanup and reorganization
- `/testing`: Write comprehensive tests for features

## Skills

Utilize specialized capabilities in `.agents/skills/`:

- `browser-testing`: Chrome extension testing (manual + Vitest)
- `debugging`: Enhanced debugging loops and log analysis
- `documentation-workflow`: Standards for project documentation
- `multi-ai-orchestration`: Coordinating multiple models for complex tasks
- `prd-workflow`: PRD creation and cross-validation
- `research-best-practices`: Pre-implementation research discovery

## Gemini-Specific Notes

### Context Window

- Gemini has a large context window — use it to understand full files
- Prefer viewing entire files over partial snippets when debugging

### Code Generation

- **Complete Blocks**: Generate complete, working code with imports
- **TS Standards**: Use strict types, avoid `any`, define interfaces
- **File Size**: Target < 400 lines (max 500); target < 50 lines per function (max 60)
- **Patterns**: Follow existing patterns; split large files into domain-modules
- **Quality Check**: Review the solution and ask yourself: "Would a staff engineer approve of this solution? Is it clean, simple, and elegant?"

### Tool Usage

- Use `view_file` to understand context before editing
- Use `grep_search` to find related code across the project
- **Verification**: Run `biome check .` and verify no regressions after ANY edit

### API Integration (Gemini SDK)

This project uses `@google/genai` for AI features:

```typescript
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({
  apiKey: import.meta.env.WXT_GOOGLE_API_KEY,
});
```

### Commands

```bash
wxt                   # Dev server (loads extension in Chrome)
wxt build             # Production build
biome check .         # Lint + format check
vitest run            # Run tests
tsc --noEmit          # Type check
```

### Common Tasks

1. **Before editing**: Check file structure, workflows, and related files
2. **After editing**: Run `biome check .`, test, and commit atomically
3. **Code Review**: Run `/code-review` workflow for new features
4. **For features**: Refer to `docs/prds/` and `/feature-development` workflow
