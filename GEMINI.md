# Gemini AI Guidelines

> **Important**: Also read [AGENTS.md](./AGENTS.md) for general AI coding practices. This project follows strict guidelines located in `.antigravity/rules.md`.

## Project Intelligence

### 🛠️ Workflows

Always refer to `.agents/workflows/` for structured task execution:

- `/code-review`: AI-assisted code review for PRs
- `/debugging`: Systematic debugging using log-based feedback
- `/documentation`: Maintain thorough project documentation
- `/feature-development`: End-to-end feature development (research to deployment)
- `/refactoring`: Periodic codebase cleanup and reorganization
- `/testing`: Write comprehensive tests for features

### 🧠 Agent Skills

Utilize specialized capabilities in `.agents/skills/`:

- `browser-testing`: AI-driven browser testing using Playwright
- `debugging`: Enhanced debugging loops and log analysis
- `documentation-workflow`: standards for project documentation
- `multi-ai-orchestration`: Coordinating multiple models for complex tasks
- `prd-workflow`: PRD creation and cross-validation
- `research-best-practices`: Pre-implementation research discovery

## Gemini-Specific Notes

### Context Window

- Gemini has a large context window—use it to understand full files
- Prefer viewing entire files over partial snippets when debugging

### Code Generation

- **Complete Blocks**: Generate complete, working code within imports
- **TS Standards**: Use strict types, avoid `any`, and define interfaces
- **File Size**: Target < 400 lines (Max 500); Target < 50 lines per function (Max 60)
- **Patterns**: Follow existing patterns; split large files into domain-modules

### Tool Usage

- Use `view_file` to understand context before editing
- Use `grep_search` to find related code across the project
- **Verification**: Run `npm run lint` and verify no regressions after ANY edit

### API Integration (Gemini SDK)

This project uses `@google/genai` for AI features:

```typescript
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  httpOptions: {
    headers: { Referer: process.env.NEXT_PUBLIC_APP_URL },
  },
});
```

### Common Tasks

1. **Before editing**: Check file structure, workflows, and related files
2. **After editing**: Run lint, test, and commit atomically
3. **Code Review**: Run `/code-review` workflow for new features
4. **For features**: Refer to `docs/prds/` and `/feature-development` workflow
