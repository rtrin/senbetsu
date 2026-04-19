# Features

## Completed

- AI tab grouping/sorting
- Save groups as bookmark folders (fast cleanup)
- Reopen folders as tab groups
- Close groups in bulk
- Tab/Group annotations
- Inline renaming of groups and bookmark folders

## Backlog

### High Relevancy

**Task Workspaces**
Save an entire window's state (tabs + groups + annotations) as a named workspace. Close everything, restore later. Think "Tab Outliner" but with AI grouping built in.
- Scope: Medium — new data model, save/restore logic, workspace picker UI

**AI Context Dump**
Before archiving a workspace, AI summarizes what you were working on across those tabs. Stored with the workspace so you remember _why_ you had those tabs open.
- Scope: Medium — leverages existing AI integration, needs summary storage and display

**Stale Tab Detection**
Flag tabs untouched for a configurable duration (e.g., 2 hours, 1 day). Suggest archiving or closing them. Optional auto-archive to a workspace.
- Scope: Small/Medium — track last-active timestamps via background worker, threshold-based UI alerts

**Session saving & restoring**
Maintain a history of tab groups/folders that overrides local groupings.
- Scope: Medium — overlaps with Workspaces; decide if this is the same feature before building

### Medium Relevancy

- Folder reordering within divider sections — drag folders to reorder within a section (data model already supports it via ordered `folderIds`)
- Auto-grouping rules — user-defined rules like "all GitHub tabs → Dev"; new tabs grouped without AI
- Save to subfolder — dropdown on group tab to save into a specific bookmark subfolder
- Show subfolders inside folders — with button to open individually as tab group
- Drag and drop a group into another to combine

### Low Relevancy

- Drag-and-drop scrollable — hovering near top/bottom while dragging should scroll
- Agentic workflow trees — https://medium.com/@thelazyindiantechie/the-ultimate-agentic-prompt-engineering-workflow-5f3c51d958e0

## Doing

> NOTE: Keep solutions elegant and simple!

### Marketing
- Update landing page to include chrome web store links

### Memory
- Critical: browser crashes when trying to group too many tabs at once (investigate further)
- Button to offload memory usage for all tabs

### UI/UX
- Fix issue with group tabs not [finishing]
- Make input field and group tabs button appear below the toggle view header
- Make save group to folder and bookmark single tab buttons line up vertically
- Sometimes clicking on a tab in a group doesn't set it as active; it just stays on the current tab and closes the popup
- Rename tabs/groups (pencil icon button)
- Revise drag and drop to place exactly where user wants (dragging in middle of two tabs should place it exactly there)
- Rename bookmark folder to bookmark bar (should show all folders AND tabs)
- Delete folder/folder tab buttons
- Ability to prompt to delete tabs/groups (toggle between group/delete cmds so user knows what will happen)
