+++
id = "fl-b2yb"
title = "Agent spec: fix the daemon line and drop requirements for removed features"
kind = "fix"
state = "integrated"
created_at = "2026-11-27T16:02:34.851Z"
updated_at = "2026-11-27T16:12:45.455493060Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:b2yb",
]
branch = "bridle/b2yb"
commit = "2d6a3558b07a103e025d0fb4932871db7b37256b"
summary = "Agent spec (design/specs/agent.md): opening line now names the commands that ask the daemon (flume agent, flume prime, flume guide) and says flume never starts it. Dropped the SHALL NOT clauses for the .json registry entries (r-a3c0, scenario s-a3c3) and the templates folder (r-a8c0, scenario s-a8c1), with their tests. r-a8c0 would have no scenario left, so added s-a8c2 (shipped workflow in the prime text) with an executable test. Code that ignores .json entries and the templates folder is left in place (KISS: no observable change; removal is a separate cleanup). Other SHALL NOT clauses kept. CHANGELOG under Changed."
ticket = "b2yb"
+++

docs/tickets/open/agent-spec-b2yb.md

## Thread

### note · external:advisor · 2026-11-27T16:03:01.901Z
readied by external:advisor

### note · external:advisor · 2026-11-27T16:03:01.927Z
advisor: readied (kind fix; the human decided it in the agent spec review, 2026-11-27).

### note · external:orchestrator · 2026-11-27T16:03:47.782Z
From orchestrator: fl-b2yb and fl-up3r are both readied with the human's approval quoted on each. They're settling until 11:08 AM; I'll plan and queue both in one tier right after.

### note · external:orchestrator · 2026-11-27T16:09:48.802Z
From orchestrator: fl-b2yb and fl-up3r are planned and queued in tier 1, both startable. Go ahead (Haiku for fl-b2yb as you proposed; your call on fl-up3r). They touch different areas (agent spec vs guides), so they can run in parallel.

### note · agent:b2yb · 2026-11-27T16:11:37.472Z
Kept the code that ignores .json entries and the templates folder (KISS; no observable change for a current install). Added scenario s-a8c2 under r-a8c0 so spec check stays clean after s-a8c1 was dropped.

### note · agent:b2yb · 2026-11-27T16:11:37.487Z
built: 155e247 (branch bridle/b2yb)

### note · agent:b2yb · 2026-11-27T16:11:42.397Z
done: agent spec fixed (daemon line, dropped r-a3c0/s-a3c3 and r-a8c0/s-a8c1 SHALL NOT clauses with tests; added s-a8c2 so r-a8c0 keeps a scenario; .json and templates code left in place); just check exit 0, 283 passed (283), spec check 0 errors; commit 155e247. Branch pushed, merged main (already up to date), ticket built.

### note · agent:manager · 2026-11-27T16:12:43.538Z
integrated: 2d6a3558b07a103e025d0fb4932871db7b37256b (branch bridle/b2yb)

### note · agent:manager · 2026-11-27T16:12:43.547Z
ticket file moved to docs/tickets/resolved/agent-spec-b2yb.md

### note · agent:manager · 2026-11-27T16:12:45.455Z
cleanup: removed agent b2yb, origin branch bridle/b2yb, branch bridle/b2yb
