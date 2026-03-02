---
name: multi-ai-orchestration
description: Coordinate multiple AI models for specialized tasks
---

# Multi-AI Orchestration

Use multiple AI models for their strengths: Claude for planning/coding, Gemini for review/docs, specialized models for specific tasks.

## Model Strengths

| Model              | Best For                                    |
| ------------------ | ------------------------------------------- |
| **Claude Code**    | Implementation, debugging, refactoring      |
| **Claude Desktop** | High-level architecture, third opinions     |
| **Gemini**         | Documentation, plan validation, code review |
| **GPT-4**          | Alternative perspective, API design         |

## Current Workflow (Manual)

### Planning Phase

1. **Claude Code**: Research best practices, create implementation plan
2. **Gemini**: Validate plan against roadmap
3. **Claude Desktop**: Third opinion on architecture
4. Iterate until agreement

### Implementation Phase

1. **Claude Code**: Implement following approved plan
2. Run quality checks after each file:
   ```bash
   biome check .
   ```
3. Commit frequently

### Review Phase

1. **Gemini**: Check code for issues
2. **Gemini**: Update documentation
3. **Claude Code**: Address feedback

## Example Prompt Flow

### To Claude Code (Planning):

```
I want to implement [feature].
1. Research best practices
2. Create an implementation plan
3. Generate a PRD in docs/prds/
```

### To Gemini (Validation):

```
Review this plan against our project:

Plan: [paste]

Alter the plan or provide different perspective.
```

### To Claude Desktop (Third Opinion):

```
Two AIs have agreed on this approach. Provide a third opinion:
[paste plan]

Focus on: risks, alternatives, edge cases
```

### To Claude Code (Implementation):

```
Implement this approved PRD:
[paste PRD]

Follow quality checks:
- Max 500 lines per file
- Max 60 lines per function
- Run biome check . after each file
```

## Resources

- [Claude API](https://docs.anthropic.com/en/api)
- [Gemini API](https://ai.google.dev/docs)
