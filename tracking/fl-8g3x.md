+++
id = "fl-8g3x"
title = "Layers: rename base/ to workspace/, workflow-layers spec to layers, and use the agreed terms"
kind = "chore"
state = "integrated"
created_at = "2026-11-27T17:11:13.710Z"
updated_at = "2026-11-27T17:19:15.314456628Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:g3x",
]
branch = "bridle/g3x"
commit = "46105a949c0a69fe123f25aea78e3d1a6a00626d"
summary = """
The flume root's base/ is now workspace/ everywhere it is read or written (prime documents, guides, templates, check, init --workflow, workflow install). An old base/ is not read; no migration or warning. design/specs/workflow-layers.md is now layers.md (IDs unchanged) with a terms paragraph; specs, tests, docs/help, docs/design/workflow-later.md and CLI help/error text say built-in, workspace and project layer, overlay, layered document.
Kept on purpose: the flume repo's own top-level base/ (the built-in layer) keeps its path, so built-in files are still labelled "flume's own base/..." in preview and errors; internal identifiers (SHIPPED_DIR, SHIPPED_WORKFLOWS) are unchanged. docs/flume.md was not edited."""
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

### note · agent:g3x · 2026-11-27T17:19:01.328Z
built: c71e67b1e1482d45a46b2d03733229354a5fca9b (branch bridle/g3x)

### note · agent:g3x · 2026-11-27T17:19:01.340Z
done: base/ in the flume root is now workspace/, spec is layers.md, agreed terms used; c71e67b1e1482d45a46b2d03733229354a5fca9b (just check exit 0, 284 tests passed; spec check --require-ids 0 errors, no new unbound scenario). Repo's own base/ (built-in layer) path kept, see thread. No tool failures. Branch pushed.

### note · agent:manager · 2026-11-27T17:19:13.421Z
integrated: 46105a949c0a69fe123f25aea78e3d1a6a00626d (branch bridle/g3x)

### note · agent:manager · 2026-11-27T17:19:13.433Z
ticket file moved to docs/tickets/resolved/layers-8g3x.md

### note · agent:manager · 2026-11-27T17:19:15.314Z
cleanup: removed agent g3x, origin branch bridle/g3x, branch bridle/g3x
