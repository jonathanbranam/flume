+++
id = "fl-ha4p"
title = "flume task comment: rename task note, with a Comments section and author/time headers"
kind = "feature"
state = "claimed"
created_at = "2026-11-17T13:25:31.712Z"
updated_at = "2026-11-17T13:57:08.662559364Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:comment",
]
summary = "Renamed task note to task comment (CLI, API /comments, commit message, specs cli/api/ui) and added the ## Comments section with '### <local time +offset>, <author>' headers (core addComment in src/core/update.ts; new task-files requirement r-7090 with s-1c69, s-1582). Author: AGENT_NAME via CLI, optional API author, else OS user. No UI code exists in the repo (only ui.md specs), so only the spec was renamed and there was nothing to verify in a browser. Also gave the duplicate ui.md scenario id s-d1c2 (clashed with agent.md) a new id s-d1c9; it blocked bridle spec id."
ticket = "ha4p"
+++

docs/tickets/open/flume-task-comment-rename-task-note-with-a-comments-section-ha4p.md

## Thread

### note · external:advisor · 2026-11-17T13:25:38.898Z
readied by external:advisor

### note · external:advisor · 2026-11-17T13:25:38.919Z
human via advisor: design agreed in talk (option 2, author = agent name). Readied.
