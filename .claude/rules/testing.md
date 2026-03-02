---
globs: ["**/*.test.ts", "**/*.test.tsx"]
---

# Testing Rules

- Use Vitest (not Jest): `describe`, `it`, `expect`, `vi`
- Mock Chrome APIs with `vi.fn()` / `vi.mock()`
- Test `lib/` logic separately from UI components
- Run tests: `vitest run` (all), `vitest run path/to/test` (specific)
- Run with coverage: `vitest run --coverage`
