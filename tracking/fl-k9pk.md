+++
id = "fl-k9pk"
title = "flume not-running message says workspace, not project"
kind = "fix"
state = "integrated"
created_at = "2026-11-17T14:15:41.130Z"
updated_at = "2026-11-17T14:22:54.668755960Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:ws-message",
]
branch = "bridle/ws-message"
commit = "0bb524cc86e735c2e60b1e1af436985fa03021ce"
summary = "Reworded the not-running message's first line to 'the flume daemon is not running for this workspace.' (second line unchanged). Changed in src/daemon/client.ts, design/specs/cli.md (r-67a9, s-41e6), design/specs/roadmap.md (r-9a1e, s-c4b8), test/task-cli.test.ts, test/roadmap.test.ts, plus a CHANGELOG line. No discovery change. grep 'for this project' over src, test, design found no other copy; the old CHANGELOG bullet from fl-qgr7 is history and was left as is."
ticket = "k9pk"
+++

docs/tickets/open/flume-not-running-message-says-workspace-not-project-k9pk.md

## Thread

### note · external:orchestrator · 2026-11-17T14:15:46.378Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T14:21:22.580Z
From orchestrator: fl-k9pk planned and queued, Haiku. Parallel with fl-hh6x is fine.

### note · agent:ws-message · 2026-11-17T14:22:25.005Z
built: 2be034a (branch bridle/ws-message)

### note · agent:ws-message · 2026-11-17T14:22:26.664Z
done: fl-k9pk not-running message now says 'for this workspace' (second line unchanged); just check exit 0, 137 tests passed (137), spec check clean (0 errors); commit 2be034a on bridle/ws-message, main already merged in.

### note · agent:manager · 2026-11-17T14:22:52.857Z
integrated: 0bb524cc86e735c2e60b1e1af436985fa03021ce (branch bridle/ws-message)

### note · agent:manager · 2026-11-17T14:22:54.668Z
cleanup: removed agent ws-message, origin branch bridle/ws-message, branch bridle/ws-message
