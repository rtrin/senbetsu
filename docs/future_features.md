## Backlog:

### misc:
* create agentic workflow with trees (https://medium.com/@thelazyindiantechie/the-ultimate-agentic-prompt-engineering-workflow-5f3c51d958e0)

### memory:
* Set clear memory thresholds - if they surpass them, list them as high memory usage
* unused tabs (remind user to close them)

### ui/ux:
* toggle to either create new groups or add to existing groups
  * STRICTLY get the names of the groups first (if add to existing groups)
* Session saving & restoring (maintain a history of tab groups/folders that overrides local groupings)
* Mark tabs to not be grouped (in the tab list)
* Inline renaming of groups and bookmark folders

### folders
* for nested folders... (think about this more)

## Doing:
## NOTE: Keep solutions elegant and simple!

### marketing
* Update landing page to include chrome web store / lemonsqueezy links

### memory
* Critical: browser crashes when trying to group too many tabs at once. (might investigate this more, because I tried again with 30+ tabs but didn't crash?)

### ui/ux (iterate slowly, build one feature + fully test at a time)

* manage unopened tab groups on bookmark bar
* have drag and drop be scrollable (user hovering tab near the top causes scroll up action, etc)
* revise drag and drop to place exactly where user wants it to go (dragging in middle of two tabs in a specific group should place it exactly there)
* rename bookmark folder to bookmark bar (should show all folders AND tabs)
* make it so input field and group tabs button appear below the toggle view header
* fix slowness with opening massive folders (find way to load titles/favicons without loading each page in memory)
* rename tabs
* Auto-grouping rules — Let users define rules like "all GitHub tabs go in Dev" so new
tabs get grouped automatically without AI.**
* Right-click context menu integration — "Add to group..." or "Save to bookmarks
folder" from the page itself, not just the popup.
* Pinned tab management — Pinned tabs are a blind spot in most tab managers. Let
users include/exclude them from grouping.
* Some kind of "exclude" button for groups (when pressing group tabs)
