# Claude AI Guidelines

> **Important**: Also read [AGENTS.md](./AGENTS.md) for general AI coding practices.

## Claude-Specific Notes

### Thinking Process

- Think step-by-step before making changes
- Explain reasoning when making non-obvious decisions
- Ask clarifying questions rather than assuming

### Code Modifications

- Make minimal, targeted changes
- Preserve existing code style and patterns
- Test changes before considering complete

### Communication Style

- Be concise and direct
- Use markdown formatting for clarity
- Provide code snippets in fenced blocks

### Project Context

- This is a Next.js 15 App Router project
- Uses TypeScript strict mode
- Supabase for database
- Tailwind CSS for styling
- `@stackframe/stack` for authentication

### Tool Usage

- Use `view_file` to understand context before editing
- Use `grep_search` to find related code across the project
- Run `npm run lint` after making changes

### Workflow Patterns

- Read `.agents/workflows/` for project-specific workflows
- Follow `/refactoring` workflow for cleanup tasks
- Use `/debugging` workflow when stuck

### Key Files to Know

- `lib/actions/` - Server actions by domain
- `lib/types.ts` - Shared TypeScript types
- `components/` - React components
- `.agents/workflows/` - Automation workflows

### Before Making Changes

1. Understand the current implementation
2. Check for related code that might be affected
3. Follow existing patterns in the codebase

### After Making Changes

1. Run `npm run lint`
2. Verify the change works as expected
3. Document any non-obvious decisions

### Pre-Merge Checklist

> **⚠️ MANDATORY**: Every PR with new features must pass this checklist.

1. **Code Review**: Run `/code-review` workflow for new features
2. **Lint/Test**: `npm run lint` && `npm test`
