+++
id = "fl-35bq"
title = "docs: what flume's daemon is for (agents and the UI)"
kind = "docs"
state = "integrated"
created_at = "2026-11-18T02:12:05.242Z"
updated_at = "2026-11-18T02:20:50.699646650Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:daemon-doc",
]
branch = "bridle/daemon-doc"
commit = "9ad5c54b04b76650832cb6cf75ef66dfaf13a6dd"
summary = "Added docs/design/daemon.md stating the agreed daemon design (flume serve is for agents and the UI; init/clone/project run without a daemon; only the human starts it; one daemon per workspace, state in .flume/daemon.json). stack.md now links it where the daemon is named. No docs/README.md exists, so no index entry. Docs only; just check green (148 tests passed)."
ticket = "35bq"
+++

docs/tickets/open/docs-what-flume-s-daemon-is-for-agents-and-the-ui-35bq.md

## Thread

### note · external:advisor · 2026-11-18T02:12:06.852Z
readied by external:advisor

### note · external:advisor · 2026-11-18T02:12:06.875Z
advisor: readied (docs, self-evident; rule ready-without-asking).

### note · external:orchestrator · 2026-11-18T02:18:21.736Z
From orchestrator: fl-35bq planned and queued. Haiku (short docs). fl-89z2 follows after its settle (~02:22 UTC), Haiku too, parallel OK (no file overlap).

### note · agent:daemon-doc · 2026-11-18T02:19:14.901Z
built: 2e0f8929e51693e1a2cc68d518bdd4139c2979b0 (branch bridle/daemon-doc)

### note · agent:daemon-doc · 2026-11-18T02:19:16.621Z
done: added docs/design/daemon.md with the Design bullets, linked from stack.md; no docs/README.md exists so no index entry; just check exit 0, 148 tests passed, 0 failed, on commit 2e0f8929e51693e1a2cc68d518bdd4139c2979b0 (main merged, already up to date). Note: $BRIDLE_WORKSPACE/last-full-test-count does not exist, so I could not compare the count to a band.

### note · agent:manager · 2026-11-18T02:19:29.870Z
manager: my brief was wrong, sorry: the land refuses without a CHANGELOG line (only docs/tickets-only changes are exempt). Add one line at the top of ### Internal under ## Unreleased (create the ### Internal heading after the existing sections if it is missing), e.g. 'docs/design/daemon.md records what the daemon is for: agents and the UI; setup commands need no daemon; only the human starts it (fl-35bq).' Commit, merge main, run just check once to a file (quote exit and test count for the sha), then message me.

### note · agent:daemon-doc · 2026-11-18T02:20:02.406Z
done: CHANGELOG line added under ### Internal (Unreleased); main merged (already up to date); just check exit 0, 148 tests passed, 0 failed, on commit b00f9bea3a34d4bf5333415884c1f8aa4c34f348; branch pushed (2e0f892..b00f9be). Note: the ticket is already built at 2e0f892 (the pre-CHANGELOG commit); 'ticket built' with the new sha was refused (not claimed; re-claim refused: not ready). Please land with --checked-commit b00f9bea3a34d4bf5333415884c1f8aa4c34f348 or have the built record updated.

### note · agent:manager · 2026-11-18T02:20:48.741Z
integrated: 9ad5c54b04b76650832cb6cf75ef66dfaf13a6dd (branch bridle/daemon-doc)

### note · agent:manager · 2026-11-18T02:20:50.699Z
cleanup: removed agent daemon-doc, origin branch bridle/daemon-doc, branch bridle/daemon-doc
