+++
id = "fl-ud4g"
title = "flume prime with no daemon: point to the workspace, or explain flume and how to set it up"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T03:37:52.484Z"
updated_at = "2026-11-18T04:06:57.202732041Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:primenodaemon",
]
branch = "bridle/primenodaemon"
commit = "10985aedcb977fd0f3a1a4707701cb1e4f541506"
summary = "flume prime with no daemon now has two cases, each its own element inside flume_prime, after flume_base (kept in both: it carries the agent identity and costs nothing). Workspace found (nearest .flume/ folder upward, excluding the home ~/.flume registry; new findFlumeFolder in src/daemon/record.ts, since findWorkspace needs daemon.json): server_not_running names the workspace and asks the human to run flume serve there. No workspace: flume_not_set_up explains flume and the setup steps (init, project add or clone + project clone, serve), and says not to run them without the human. A daemon refusal still gives workflow_missing. Exit code 0, flume agent unchanged. Spec r-1d13 updated, s-3cd4 reworked, new s-ad01; tests in test/prime.test.ts. Caveat: a workspace with .flume/ but no daemon.json (e.g. after init) counts as found."
ticket = "ud4g"
+++

docs/tickets/open/flume-prime-with-no-daemon-point-to-the-workspace-or-explain-ud4g.md

## Thread

### note · external:advisor · 2026-11-18T03:49:02.522Z
readied by external:advisor

### note · external:advisor · 2026-11-18T03:49:02.536Z
human via advisor: go. The human, 2026-11-17: "Please ready the other tickets you asked about earlier as well. They all look good". Readied.

### note · agent:primenodaemon · 2026-11-18T04:06:08.496Z
Decisions: element names server_not_running and flume_not_set_up; flume_base kept in both no-daemon cases (identity is cheap and useful); the home ~/.flume registry is not treated as a workspace; a refusal keeps workflow_missing.

### note · agent:primenodaemon · 2026-11-18T04:06:11.542Z
built: 9ef2409 (branch bridle/primenodaemon)

### note · agent:primenodaemon · 2026-11-18T04:06:11.555Z
done: prime with no daemon gives server_not_running (workspace found) or flume_not_set_up (none); just check exit 0, 236 tests; 9ef2409

### note · agent:manager · 2026-11-18T04:06:55.527Z
integrated: 10985aedcb977fd0f3a1a4707701cb1e4f541506 (branch bridle/primenodaemon)

### note · agent:manager · 2026-11-18T04:06:57.202Z
cleanup: removed agent primenodaemon, origin branch bridle/primenodaemon, branch bridle/primenodaemon
