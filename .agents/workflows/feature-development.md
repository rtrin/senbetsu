---
description: Full feature development workflow from research to deployment
---

# Feature Development Workflow

Complete workflow for developing a new feature with AI assistance. This workflow integrates all available skills in the proper order.

## Required Skills

Before starting, familiarize yourself with these skills (read each SKILL.md):

1. **research-best-practices** - Research before implementing
2. **prd-workflow** - Create and review PRDs with multi-AI validation
3. **multi-ai-orchestration** - Coordinate multiple AI models
4. **interface-design** - Design beautiful UIs (if feature involves UI)
5. **browser-testing** - AI-driven browser testing with Playwright
6. **debugging** - Log-based debugging for stuck situations

---

## Phase 1: Research & Planning

> **Skill**: `research-best-practices`

### 1. Research Best Practices

// turbo

Read the research skill first:

```bash
cat .agents/skills/research-best-practices/SKILL.md
```

Then research the feature:

```
Research best practices for implementing [feature].
- Search web for how other projects solve this
- Check existing codebase for related patterns
- Identify common patterns/libraries
- Document findings
```

### 2. Check Existing Codebase

// turbo

Search codebase for related code:

```bash
grep -r "[related-pattern]" --include="*.ts" --include="*.tsx" .
```

### 3. Create Implementation Plan

Document findings in `docs/plans/[feature]-plan.md`:

- Approaches considered
- Selected approach with rationale
- High-level technical design
- Dependencies and risks

---

## Phase 2: PRD Creation & Review

> **Skill**: `prd-workflow`, `multi-ai-orchestration`

### 4. Generate PRD

// turbo

Read the PRD workflow skill:

```bash
cat .agents/skills/prd-workflow/SKILL.md
```

Create `docs/prds/[feature]-prd.md` including:

- Problem statement
- Proposed solution
- Success criteria
- Technical approach
- UX considerations
- Edge cases

### 5. Multi-AI Cross-Validation

> **Skill**: `multi-ai-orchestration`

// turbo

Read the multi-AI skill:

```bash
cat .agents/skills/multi-ai-orchestration/SKILL.md
```

**First Review (Claude/Gemini):**

```
Review this PRD for:
- Logical inconsistencies
- Missing edge cases
- Bad UX patterns
- Security concerns
- Over-engineering
```

**Second Review (Different AI):**

```
Compare this PRD against our project patterns.
Suggest alterations or different perspectives.
What would you do differently?
```

### 6. Finalize PRD

Address all feedback and mark PRD as approved:

```
PRD Status: ✅ APPROVED
Reviewed by: [AI models used]
Date: [date]
```

---

## Phase 3: Interface Design (If Applicable)

> **Skill**: `interface-design`

### 7. Design UI Components

> **Note**: Skip this phase if the feature has no UI components.

// turbo

Read the interface design skill:

```bash
cat .agents/skills/interface-design/SKILL.md
```

Follow the design workflow:

```
Design the UI for [feature].
1. Create a mock or wireframe (using generate_image if helpful)
2. Define component structure and props
3. Apply project design system/tokens
4. Review against "Design Aesthetics" in AGENTS.md
```

---

## Phase 4: Implementation

### 8. Create Feature Branch

// turbo

```bash
git checkout -b feature/[feature-name]
```

### 9. Implement with Quality Checks

For each file/module:

```
Implement [component] following the approved PRD.
- Keep files under 500 lines
- Keep functions under 60 lines
- Add inline documentation
- Handle error cases
```

After each significant change:

// turbo

```bash
npm run lint
```

### 11. Write Tests

Create tests in `tests/` or `__tests__/`:

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for user flows (Phase 4)

---

## Phase 5: Testing & Verification

> **Skill**: `browser-testing`, `debugging`

### 12. Run Full Test Suite

// turbo

```bash
npm test                    # Unit tests
npm run lint                # Linting
npm run build               # Build check
```

### 13. Browser Testing (E2E)

// turbo

Read the browser testing skill:

```bash
cat .agents/skills/browser-testing/SKILL.md
```

Create and run E2E tests:

```bash
npx playwright test
```

Or use AI browser subagent for exploratory testing:

```
Test the [feature] flow:
1. Navigate to [page]
2. Perform [action]
3. Verify [expected result]
4. Take screenshots for documentation
```

### 14. Debugging (If Issues Found)

> **Skill**: `debugging`

If tests fail or unexpected behavior occurs:

// turbo

```bash
cat .agents/skills/debugging/SKILL.md
```

Follow the debugging skill's log-based feedback approach:

1. Add strategic console.logs
2. Run the failing scenario
3. Analyze logs
4. Fix and repeat

### 15. AI Code Review

Ask AI to review the implementation:

```
Review this implementation for:
- Code quality issues
- Missing edge cases
- Security concerns
- Performance problems
- Documentation gaps
```

### 16. Manual Testing

Test the feature locally:

- ✅ Happy path flows
- ✅ Edge cases
- ✅ Error states
- ✅ Mobile responsiveness (if applicable)

---

## Phase 6: Documentation & Deploy

### 17. Update Documentation

Ensure thorough documentation is complete:

**Code Documentation:**

- [ ] Functions have JSDoc comments explaining purpose, params, returns
- [ ] Complex logic has inline comments
- [ ] Types/interfaces are documented

**Project Documentation:**

- [ ] `README.md` updated if needed
- [ ] `docs/` contains feature documentation
- [ ] API endpoints documented (if applicable)
- [ ] Environment variables documented

**User-Facing Documentation:**

- [ ] Help text / tooltips in UI
- [ ] Error messages are clear and actionable

### 18. Commit and Push

// turbo

```bash
git add .
git commit -m "feat: [feature description]"
git push origin feature/[feature-name]
```

### 19. Create PR

Create pull request with:

- Link to PRD
- Summary of changes
- Test coverage notes
- Screenshots/recordings (from browser testing)

### 20. Deploy to Staging

// turbo

```bash
# Merge to develop for staging
git checkout develop
git merge feature/[feature-name]
git push origin develop
```

Test on staging environment.

### 21. Deploy to Production

// turbo

```bash
# Merge to main for production
git checkout main
git merge develop
git push origin main
```

Smoke test and monitor.

---

## Skill Usage Summary

| Phase                  | Skills Used                              |
| ---------------------- | ---------------------------------------- |
| Research & Planning    | `research-best-practices`                |
| PRD Creation           | `prd-workflow`, `multi-ai-orchestration` |
| Interface Design       | `interface-design`                       |
| Implementation         | (core coding, no specific skill)         |
| Testing & Verification | `browser-testing`, `debugging`           |
| Documentation & Deploy | (thorough documentation practices)       |

---

## Time Estimates

| Phase                  | Time       |
| ---------------------- | ---------- |
| Research & Planning    | 1-2 hours  |
| PRD Creation & Review  | 1-2 hours  |
| Implementation         | 4-8 hours  |
| Testing & Verification | 1-2 hours  |
| Documentation & Deploy | 30 mins    |
| **Total**              | 8-15 hours |

---

## Quick Reference Commands

```bash
# Read any skill
cat .agents/skills/[skill-name]/SKILL.md

# Run tests
npm test

# Build check
npm run build

# E2E tests
npx playwright test

# Quality checks
npm run lint
```
