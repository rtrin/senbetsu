---
name: prd-workflow
description: Create and review PRDs using multi-AI cross-validation
---

# PRD Workflow

Generate Product Requirement Documents with multi-AI review to catch issues before implementation.

## When to Use

After researching best practices and before writing code.

## Workflow

### Step 1: Generate PRD (Terminal 1 / Claude Code)

Create a PRD in `docs/prds/[feature-name].md` using this template:

```markdown
# [Feature Name] PRD

## Problem Statement

What problem are we solving? Why does it matter?

## Proposed Solution

High-level description of the solution.

## Success Criteria

- [ ] Measurable outcome 1
- [ ] Measurable outcome 2

## Technical Approach

### Architecture

How will this integrate with the existing system?

### Data Model

What data structures are needed?

### API Changes

New endpoints or modifications?

## UX Considerations

- User flow description
- Edge cases
- Error states

## Out of Scope

What we're NOT building (helps prevent scope creep)

## Open Questions

Things that need clarification before implementation
```

### Step 2: Review PRD (Terminal 2 / Second Claude)

Open a second terminal and ask it to review:

```
Review this PRD for:
1. Logical inconsistencies
2. Missing edge cases
3. Bad UX patterns
4. Security concerns
5. Performance implications
6. Over-engineering

PRD content:
[paste PRD]
```

### Step 3: Cross-Check with Gemini

For a third opinion, use Gemini:

```
Compare this PRD against our project roadmap and existing skills.
Suggest alterations or different perspectives.

PRD: [paste]
Roadmap: [paste relevant sections]
```

### Step 4: Iterate Until Agreement

Repeat steps 2-3 until all AIs agree on the approach. Common issues caught:

- Conflicting requirements
- Missing user flows
- Unnecessary complexity
- Better existing solutions

### Step 5: Finalize

Update the PRD with all feedback and mark as approved:

```markdown
## Approval Status

- [x] Initial draft
- [x] Second Claude review
- [x] Gemini cross-check
- [x] Final approval

Approved by: [your name]
Date: [date]
```

## Tips

- **Don't skip Gemini check**: Different models catch different issues
- **Document disagreements**: When AIs disagree, document both perspectives
- **Time investment**: 1-2 hours of planning saves 4-8 hours of rework

## Integration

This skill feeds into:

- `/feature-development` workflow (steps 2-5)
- `multi-ai-orchestration` skill
