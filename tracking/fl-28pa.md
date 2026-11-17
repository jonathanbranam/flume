+++
id = "fl-28pa"
title = "Record the stack decision: TypeScript (Go considered)"
kind = "docs"
state = "integrated"
created_at = "2026-11-17T04:05:13.476Z"
updated_at = "2026-11-17T04:17:36.765896578Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:stack-doc",
]
branch = "bridle/stack-doc"
commit = "6793b67fe1b24a3debb7e936c2469bb19082b1d7"
summary = "Wrote docs/design/stack.md: TypeScript on Node (daemon, CLI, UI), Go as the recorded runner-up, with context, concurrency (one event loop plus child processes for sensors), revisit triggers, and ruled-out options (Rust, Python, Java, Scala). No docs/README.md index exists yet, so nothing was added to one. No justfile exists, so just check could not run."
ticket = "28pa"
+++

docs/tickets/open/record-the-stack-decision-typescript-go-considered-28pa.md

## Thread

### note · external:advisor · 2026-11-17T04:05:25.210Z
readied by external:advisor

### note · external:advisor · 2026-11-17T04:05:27.790Z
Readied by advisor: a docs ticket recording the human's decision (rule ready-without-asking).

### note · agent:stack-doc · 2026-11-17T04:16:58.172Z
built: 2d1229272bcf669036e372fd1339c1a4b105ddf8 (branch bridle/stack-doc)

### note · agent:stack-doc · 2026-11-17T04:17:00.817Z
done: wrote docs/design/stack.md (TypeScript on Node; Go as runner-up; concurrency, revisit triggers, ruled-out options). Not run: just check, since there is no justfile in this repo yet. docs/README.md does not exist, so no index entry was added. ASCII checked. Branch bridle/stack-doc is up to date with main; commit 2d1229272bcf669036e372fd1339c1a4b105ddf8

### note · agent:manager · 2026-11-17T04:17:23.989Z
Land refused: every landed ticket needs a CHANGELOG.md line under '## Unreleased' (only docs/tickets/-only changes are exempt; docs/design is not). My brief was wrong on that, sorry. CHANGELOG.md doesn't exist yet: create it on your branch with a '# Changelog' heading, a '## Unreleased' section, and under '### Internal' one line: '- Record the stack decision: TypeScript on Node, Go as the alternative (docs/design/stack.md).' ASCII only. Commit, then message me with the new sha.

### note · agent:stack-doc · 2026-11-17T04:17:30.425Z
done: CHANGELOG.md created on bridle/stack-doc with the Unreleased/Internal line; commit fd6dd0f2d868b19d840b93577dc38b011d91e07b (ASCII checked, branch up to date with main)

### note · agent:manager · 2026-11-17T04:17:35.082Z
integrated: 6793b67fe1b24a3debb7e936c2469bb19082b1d7 (branch bridle/stack-doc)

### note · agent:manager · 2026-11-17T04:17:36.765Z
cleanup: removed agent stack-doc, origin branch bridle/stack-doc, branch bridle/stack-doc
