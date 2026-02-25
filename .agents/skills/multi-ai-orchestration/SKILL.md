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
| **Codex**          | Backend code generation                     |

## Current Workflow (Manual)

### Planning Phase

1. **Claude Code**: Research best practices, create implementation plan
2. **Gemini**: Validate plan against roadmap/playbook
3. **Claude Desktop**: Third opinion on architecture
4. Iterate until agreement

### Implementation Phase

1. **Claude Code**: Implement following approved PRD
2. Run quality checks after each file
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
Review this plan against our playbook and roadmap:

Plan: [paste]
Playbook: [paste relevant sections]

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
- Run pre-commit after each file
```

### To Gemini (Post-Implementation):

```
Review this code for issues:
[paste code]

Update documentation with:
- What was done
- Bugs found or fixed
- Any remaining concerns
```

## Future: LangGraph Automation

After 5+ manual features, consider automating with LangGraph:

```python
# Conceptual flow
graph = StateGraph(AgentState)

graph.add_node("research", research_agent)
graph.add_node("plan", planning_agent)
graph.add_node("validate", gemini_validation)
graph.add_node("implement", claude_code_agent)
graph.add_node("review", review_agent)

graph.add_edge("research", "plan")
graph.add_edge("plan", "validate")
graph.add_conditional_edges("validate", check_approval)
graph.add_edge("implement", "review")
```

Time investment: 8-16 hours to build, saves hours per feature after that.

## Resources

- [LangGraph Documentation](https://docs.langchain.com/oss/python/langgraph/overview)
- [Claude API](https://claude.com/pricing)
