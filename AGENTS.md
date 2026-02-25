# AI Coding Agent Guidelines

Best practices for AI assistants working on this codebase.

## Agent Configuration

- **Read files in `.agents/`**: Check this directory for workflows, rules, and skills before starting tasks.

## Project Structure

```
lib/actions/     # Server actions (split by domain)
components/      # React components
app/             # Next.js App Router pages
docs/            # Documentation and PRDs
```

## Code Standards

### File Limits

- **Max file size**: 500 lines (target: 400)
- **Max function size**: 60 lines (target: 50)
- Split large files into domain-specific modules

### TypeScript

- Use strict types, avoid `any`
- Define interfaces for all props and data structures
- Export types from `lib/types.ts`

### Server Actions

- All server actions must call `getUser()` for authentication
- Place in `lib/actions/[domain].ts`
- Mark files with `'use server'` directive

### Components

- Use `'use client'` only when necessary
- Prefer composition over large monolithic components
- Use Tailwind CSS for styling

### Code Review

> **⚠️ MANDATORY**: All new features and significant refactors MUST undergo AI Code Review.

- **Run the `/code-review` workflow** before merging to `develop` or `main`
- Ask for specific review on:
  - **Logic**: Edge cases, race conditions, error handling
  - **Security**: Auth checks, data validation, injection risks
  - **Performance**: N+1 queries, memory usage, bundle size
  - **Quality**: Code duplication, naming, complexity

## Commit Practices

- Make atomic commits (one logical change per commit)
- Test before committing
- Run `npm run lint` before pushing

## Environment Variables

Required:

- `GOOGLE_API_KEY` - Gemini API key
- `NEXT_PUBLIC_APP_URL` - App URL (for referrer headers)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key

## Common Patterns

### Data Fetching

- Server components: Fetch directly in component
- Client components: Use `@tanstack/react-query`

### Error Handling

- Throw errors from server actions
- Catch and display in UI with toast/error boundaries

### Caching

- Store computed data in database (e.g., `words` column)
- Check cache before expensive API calls
