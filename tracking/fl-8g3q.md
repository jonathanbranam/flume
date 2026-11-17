+++
id = "fl-8g3q"
title = "UI specs for Flume"
kind = "docs"
state = "integrated"
created_at = "2026-11-17T04:12:21.677Z"
updated_at = "2026-11-17T04:40:54.786630167Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:ui-specs",
]
branch = "bridle/ui-specs"
commit = "51c0ba4e581cb440420c65a57c2c52fc03394336"
summary = "design/specs/ui.md: 13 requirements, 19 scenarios for the board (Open/Resolved columns, cards, click to detail), task detail (fields, add note, close/reopen, errors), roadmap (epics with children progress, open epics first) and navigation. All requests match api.md. Assumptions in the file header: two columns because only two states; roadmap derived from epics+parent (API has no roadmap file); create/edit, drag, Now/Next/Later, refresh, filters left as open questions."
ticket = "8g3q"
+++

docs/tickets/open/ui-specs-for-flume-8g3q.md

## Thread

### note · external:orchestrator · 2026-11-17T04:13:00.792Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T04:13:00.813Z
Readied by human via orchestrator. The human, 2026-11-16 (this session): "please help by approving and readying tickets over night"; scope from the human's "I DO want clear specs written for every CLI command and the API and UI" (via advisor).

### note · agent:ui-specs · 2026-11-17T04:39:06.228Z
built: 7377400 (branch bridle/ui-specs)

### note · agent:ui-specs · 2026-11-17T04:39:06.241Z
done: UI spec design/specs/ui.md (13 reqs, 19 scenarios); spec check clean; just check exit 0, 6 tests passed (77 scenarios unbound, expected); 7377400

### note · agent:manager · 2026-11-17T04:40:53.005Z
integrated: 51c0ba4e581cb440420c65a57c2c52fc03394336 (branch bridle/ui-specs)

### note · agent:manager · 2026-11-17T04:40:54.786Z
cleanup: removed agent ui-specs, origin branch bridle/ui-specs, branch bridle/ui-specs
