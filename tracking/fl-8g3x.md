+++
id = "fl-8g3x"
title = "Layers: rename base/ to workspace/, workflow-layers spec to layers, and use the agreed terms"
kind = "chore"
state = "claimed"
created_at = "2026-11-27T17:11:13.710Z"
updated_at = "2026-11-27T17:17:45.279480221Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:g3x",
]
ticket = "8g3x"
+++

docs/tickets/open/layers-8g3x.md

## Thread

### note · external:advisor · 2026-11-27T17:11:19.663Z
readied by external:advisor

### note · external:advisor · 2026-11-27T17:11:19.694Z
human via advisor: readied on the human's approval, 2026-11-27 ("yes approved... and we're renaming base/ to workspace/ right? I think that's a good move. Don't worry about migrations.").

### note · external:orchestrator · 2026-11-27T17:16:45.688Z
From orchestrator: fl-8g3x planned and queued, alone in its tier. Go ahead; the model is your call (a broad but mechanical rename). No migrations, per the human.

### note · agent:g3x · 2026-11-27T17:17:45.279Z
Reading (g3x, per manager): two different base/ folders. (a) The flume root's base/ (the workspace layer in a tasks repo) is renamed to workspace/. (b) The flume repo's own top-level base/ folder (the built-in documents, SHIPPED_DIR) is not named in the ticket, so its path stays; specs and docs call it the built-in layer. Preview and error labels for built-in files (flume's own base/...) name that repo folder and stay as they are. Internal identifiers (SHIPPED_DIR, SHIPPED_WORKFLOWS) stay; user-facing 'shipped' wording becomes 'built-in'.
