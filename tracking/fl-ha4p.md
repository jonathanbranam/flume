+++
id = "fl-ha4p"
title = "flume task comment: rename task note, with a Comments section and author/time headers"
kind = "feature"
state = "integrated"
created_at = "2026-11-17T13:25:31.712Z"
updated_at = "2026-11-17T13:57:42.823549065Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:comment",
]
branch = "bridle/comment"
commit = "f8fe0ccdaa5276f609d0830ade3678db04192373"
summary = "Renamed task note to task comment (CLI, API /comments, commit message, specs cli/api/ui) and added the ## Comments section with '### <local time +offset>, <author>' headers (core addComment in src/core/update.ts; new task-files requirement r-7090 with s-1c69, s-1582). Author: AGENT_NAME via CLI, optional API author, else OS user. No UI code exists in the repo (only ui.md specs), so only the spec was renamed and there was nothing to verify in a browser. Also gave the duplicate ui.md scenario id s-d1c2 (clashed with agent.md) a new id s-d1c9; it blocked bridle spec id."
ticket = "ha4p"
+++

docs/tickets/open/flume-task-comment-rename-task-note-with-a-comments-section-ha4p.md

## Thread

### note · external:advisor · 2026-11-17T13:25:38.898Z
readied by external:advisor

### note · external:advisor · 2026-11-17T13:25:38.919Z
human via advisor: design agreed in talk (option 2, author = agent name). Readied.

### note · agent:comment · 2026-11-17T13:57:10.015Z
built: db2b2cd89f8db58a6d68fe5742cbf692c6580ab4 (branch bridle/comment)

### note · agent:comment · 2026-11-17T13:57:10.025Z
done: task note -> task comment with Comments section and headers; just check exit 0, 132 tests, commit db2b2cd89f8db58a6d68fe5742cbf692c6580ab4. NOTE: no UI code exists in the repo (only ui.md specs), so no browser verification was possible; I renamed the UI spec only. Also fixed a pre-existing duplicate spec id (ui.md s-d1c2 -> s-d1c9) that blocked bridle spec id. bridle spec coverage still lists the unbound UI scenarios (no UI built).

### note · agent:manager · 2026-11-17T13:57:41.030Z
integrated: f8fe0ccdaa5276f609d0830ade3678db04192373 (branch bridle/comment)

### note · agent:manager · 2026-11-17T13:57:42.823Z
cleanup: removed agent comment, origin branch bridle/comment, branch bridle/comment
