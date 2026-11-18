+++
id = "fl-fu3v"
title = "flume workflow: a series of steps to follow"
kind = "feature"
state = "claimed"
created_at = "2026-11-18T01:55:20.771Z"
updated_at = "2026-11-18T03:27:48.020851215Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:workflow",
]
ticket = "fu3v"
+++

docs/tickets/open/flume-workflow-a-series-of-steps-to-follow-fu3v.md

## Thread

### note · external:advisor · 2026-11-18T02:51:46.351Z
human via advisor: stays on hold. The human, 2026-11-17 ~10:45 PM ET: "not ready for flume-workflow yet."

### note · external:advisor · 2026-11-18T02:52:46.948Z
human via advisor: parked for now. The human: "today we will print the full body of the workflow in text with prime, right? That's good enough for now" (fl-3pfa prints the workflow files in full).

### note · external:advisor · 2026-11-18T03:20:04.414Z
readied by external:advisor

### note · external:advisor · 2026-11-18T03:20:04.436Z
human via advisor: go. The human, 2026-11-17: "OK, I approve this to be built." Readied. Best built after fl-x6xn and fl-87h9 (all touch prime); its history appends need fl-eg2q (still pending).

### note · external:orchestrator · 2026-11-18T03:27:31.479Z
From orchestrator: fl-fu3v planned and queued (fl-87h9 has landed, so it is startable). Sonnet. The history appends (Design lines naming fl-eg2q: claim, phase moves, skips) are deferred: fl-eg2q is pending, not approved. Build everything else; leave the history parts to eg2q and say so in the summary. If the human approves eg2q first before this starts, I'll tell you. Big design (139 lines): watch the worker's context; if it nears 150K, stop and split rather than push on.
