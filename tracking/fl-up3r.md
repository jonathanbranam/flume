+++
id = "fl-up3r"
title = "Guides: remove the stage field"
kind = "fix"
state = "integrated"
created_at = "2026-11-27T16:02:47.986Z"
updated_at = "2026-11-27T16:17:52.682589946Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:up3r",
]
branch = "bridle/up3r"
commit = "fafb945c5c275a29cfdb8d18e63506172f4775f9"
summary = """
Guides no longer carry a stage field. Front matter is read for name and description; a stage key in a guide file is ignored (the parser already ignores extra flat string keys, so no error and nothing printed). Removed from: the guide type and list (src/core/guides.ts), the plan group guides (src/core/plan-guides.ts: GroupGuide, guideBlocks, so flume task next text and --json and GET /api/tasks/{id}/plan/next), and the CLI output in src/cli/agent.ts (flume guide NAME element, flume guide list text and --json, prime guides element). GET /api/prime and GET /api/guides/NAME also drop it, since both serve the same guide type; api.md r-eee6 says so.
Specs edited in place: design/specs/agent.md (r-c7a5, r-9a01 with s-9a02, r-5dfe), design/specs/workflow.md (r-4c05 with s-0b7c), design/specs/api.md (r-eee6 with s-000f). New scenario s-9251 "A stage key is ignored" under r-c7a5 (agent.md), tested in test/prime.test.ts.
Shipped guides: none exist in the repo (no base/guides, no stage key in workflows/), so nothing to strip.
Check: just check exit 0, 284 of 284 tests passed, on commit 47ef945 (branch bridle/up3r, merged with local main)."""
ticket = "up3r"
+++

docs/tickets/open/guides-up3r.md

## Thread

### note · external:advisor · 2026-11-27T16:03:01.949Z
readied by external:advisor

### note · external:advisor · 2026-11-27T16:03:01.971Z
advisor: readied (kind fix; the human decided it in the agent spec review, 2026-11-27).

### note · agent:manager · 2026-11-27T16:10:02.729Z
manager: held until fl-b2yb lands; both edit design/specs/agent.md, so they run one after another (b2yb is the smaller). Haiku when it starts.

### note · agent:up3r · 2026-11-27T16:15:57.700Z
Choices: (1) a stage key is ignored, not an error: the parser already accepts any flat string key, so nothing new is needed to ignore it. (2) GET /api/guides/NAME also drops stage, not only the prime list: it is the same guide type and the api spec's r-eee6 covers both. (3) No shipped guides exist in this repo, so the strip is a no-op here. (4) The human asked for the workflow-as-config ticket to note the guide removal; that ticket is outside this task, so it is not touched here.

### note · agent:up3r · 2026-11-27T16:16:05.056Z
built: 47ef945406c4bfa9d6c9dd0e2c38d0149e518e77 (branch bridle/up3r)

### note · agent:up3r · 2026-11-27T16:16:05.068Z
done: guides no longer carry stage (front matter name and description only; a stage key is ignored); check exit 0, 284/284 tests passed; commit 47ef945 on bridle/up3r (merged local main, pushed); specs agent.md, workflow.md, api.md edited in place with new scenario s-9251; CHANGELOG line under Changed; choices on the thread. Not done: the workflow-as-config ticket note the human asked for is outside this ticket, untouched.

### note · agent:manager · 2026-11-27T16:17:50.844Z
integrated: fafb945c5c275a29cfdb8d18e63506172f4775f9 (branch bridle/up3r)

### note · agent:manager · 2026-11-27T16:17:50.855Z
ticket file moved to docs/tickets/resolved/guides-up3r.md

### note · agent:manager · 2026-11-27T16:17:52.682Z
cleanup: removed agent up3r, origin branch bridle/up3r, branch bridle/up3r
