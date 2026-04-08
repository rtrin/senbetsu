# Feature Ideas — From User Feedback

Source: Reddit comment from a user with ADHD who accumulates hundreds of tabs from task-switching and rabbit holes.

## Already Covered

- AI tab grouping/sorting
- Save groups as bookmark folders (fast cleanup)
- Reopen folders as tab groups
- Close groups in bulk
- Tab/Group annotations

## New Features

### 1. Task Workspaces

Save an entire window's state (tabs + groups + annotations) as a named workspace. Close everything, restore later. Think "Tab Outliner" but with AI grouping built in.

**Why:** Solves the core pain point — switching tasks without losing context. Users currently resort to keeping hundreds of tabs open as a makeshift todo list.

**Scope:** Medium — new data model, save/restore logic, workspace picker UI.

### 2. AI Context Dump

Before archiving a workspace, AI summarizes what you were working on across those tabs. Stored with the workspace so you remember _why_ you had those tabs open.

**Why:** The 10-minute "save bookmarks and type out context" cleanup becomes one click. Critical for ADHD workflows where you switch tasks without realizing.

**Scope:** Medium — leverages existing AI integration, needs summary storage and display.

### 3. Stale Tab Detection

Flag tabs untouched for a configurable duration (e.g., 2 hours, 1 day). Suggest archiving or closing them. Optional auto-archive to a workspace.

**Why:** Addresses the "I didn't realize I switched tasks" problem. Passive detection beats requiring the user to remember to clean up.

**Scope:** Small/Medium — track last-active timestamps via background worker, threshold-based UI alerts.

## Suggested Build Order

1. **Workspaces** — biggest impact on the described pain point
2. **AI Context Dump** — natural extension of workspaces + existing AI
3. **Stale Tab Detection** — polish feature, builds on workspace archiving
