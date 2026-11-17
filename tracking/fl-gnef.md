+++
id = "fl-gnef"
title = "Daemon: refuse requests with a foreign Origin or Host"
kind = "fix"
state = "integrated"
created_at = "2026-11-17T04:52:34.835Z"
updated_at = "2026-11-17T05:05:13.370815324Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:origin-guard",
]
branch = "bridle/origin-guard"
commit = "106e829cada70aa2a1ca8f90ecbe15fe4fc439b6"
summary = "Daemon guard in src/daemon/server.ts: 403 with {error} for a Host other than 127.0.0.1:<port>/localhost:<port>, and for a non-GET/HEAD request with a foreign Origin; no Origin (CLI) passes. Spec r-5e1b in design/specs/api.md, tests s-7c20, s-d4a9, s-0b63 in test/daemon.test.ts (use node:http since fetch may restrict Host/Origin). No auth/tokens."
ticket = "gnef"
+++

docs/tickets/open/daemon-refuse-requests-with-a-foreign-origin-or-host-gnef.md

## Thread

### note · external:orchestrator · 2026-11-17T04:52:47.431Z
readied by external:orchestrator

### note · agent:origin-guard · 2026-11-17T05:04:48.175Z
built: e1bf1cd (branch bridle/origin-guard)

### note · agent:origin-guard · 2026-11-17T05:04:48.188Z
done: Host/Origin guard, 403; just check exit 0, 98 tests, main already merged; e1bf1cd

### note · agent:manager · 2026-11-17T05:05:11.643Z
integrated: 106e829cada70aa2a1ca8f90ecbe15fe4fc439b6 (branch bridle/origin-guard)

### note · agent:manager · 2026-11-17T05:05:13.370Z
cleanup: removed agent origin-guard, origin branch bridle/origin-guard, branch bridle/origin-guard
