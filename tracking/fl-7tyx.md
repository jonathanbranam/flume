+++
id = "fl-7tyx"
title = "Duplicate spec id r-c1a0 in cli.md and api.md breaks bridle spec id"
kind = "fix"
state = "integrated"
created_at = "2026-11-18T05:52:50.014Z"
updated_at = "2026-11-18T06:09:21.926729316Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:specids",
]
branch = "bridle/specids"
commit = "95fa8060712abab5c9e0a8b005e0e60714d5d26d"
summary = 'Duplicate spec id r-c1a0 fixed. cli.md "Project clone clones projects" now has r-7e4b; api.md "Add a comment" keeps r-c1a0 (no test names either id, so no test changed). design/specs/.ids gained 34 ledger entries for ids hand-assigned by fl-4tx8 (bridle spec id, dry run first, then real: 0 to assign). Only one duplicated id existed. bridle spec id clean, spec check --require-ids 0 errors, just check exit 0 with 248 tests passed on 56f3106. Caveat: bridle spec coverage still lists 18 unbound executable scenarios, all in design/specs/ui.md (s-b0a2..s-e1d2); those predate this change and need UI tests, so they are not fixed here. CHANGELOG bullet added at top of the existing Internal section under Unreleased. Unreleased also has a second "### Added" heading (pre-existing, not touched).'
ticket = "7tyx"
+++

docs/tickets/open/duplicate-spec-id-r-c1a0-in-cli-md-and-api-md-breaks-bridle-7tyx.md

## Thread

### note · external:advisor · 2026-11-18T05:53:01.132Z
readied by external:advisor

### note · external:advisor · 2026-11-18T05:53:01.172Z
advisor: readied (fix, self-evident; rule ready-without-asking).

### note · external:orchestrator · 2026-11-18T05:55:52.828Z
orchestrator: kept this over the duplicate fl-4d6q (manager's). Also from 4d6q: check no other spec id is duplicated, and update design/specs/.ids. Model: Haiku.

### note · external:orchestrator · 2026-11-18T06:05:24.358Z
From orchestrator: fl-7tyx planned and queued. Haiku. See my comment on the thread (also check for other duplicate ids; update design/specs/.ids).

### note · agent:specids · 2026-11-18T06:06:49.685Z
built: 56f31062a1d380fe105d077e0e423705069da766 (branch bridle/specids)

### note · agent:specids · 2026-11-18T06:06:51.798Z
done: r-c1a0 kept on api.md, cli.md Project clone re-IDed r-7e4b; .ids gained 34 hand-assigned entries (only duplicate was r-c1a0); spec id/check clean; just check exit 0, 248 tests passed; commit 56f31062a1d380fe105d077e0e423705069da766 (main merged, no-op). Caveat: spec coverage still lists 18 unbound scenarios, all in design/specs/ui.md (s-b0a2..s-e1d2), pre-existing and not touched here; they need UI tests, so say if you want them handled in a separate ticket.

### note · agent:manager · 2026-11-18T06:07:06.447Z
Good. One more on this branch: CHANGELOG.md has a second '### Added' heading under ## Unreleased (line ~66, between ### Fixed and ### Internal). Move its bullets to the end of the first ### Added section (keep their order) and delete the second heading, so Unreleased has Added, Changed, Fixed, Internal once each. Commit, run just check, message me with sha, exit code and test count. The 18 unbound ui.md scenarios: leave them, I'll raise them separately.

### note · agent:specids · 2026-11-18T06:07:54.551Z
done: CHANGELOG now has one Added, Changed, Fixed, Internal under Unreleased (second Added bullets moved to the end of the first, order kept); 18 ui.md scenarios left as asked; commit f5ec1c5ec2e08a917ed899dba663b57b223be4c8; just check exit 0, 248 tests passed.

### note · agent:manager · 2026-11-18T06:09:20.219Z
integrated: 95fa8060712abab5c9e0a8b005e0e60714d5d26d (branch bridle/specids)

### note · agent:manager · 2026-11-18T06:09:21.926Z
cleanup: removed agent specids, origin branch bridle/specids, branch bridle/specids
