+++
id = "fl-jc84"
title = "Releases and updating Flume at work"
kind = "feature"
state = "integrated"
created_at = "2026-11-17T04:08:02.824Z"
updated_at = "2026-11-17T04:37:59.730409801Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:releases",
]
branch = "bridle/releases"
commit = "38a7a5de166aae79bed734705dbb08e9ed3d56cc"
summary = "Added 'flume bug' (src/cli/bug.ts) printing a paste-ready template with the version line plus Command/Expected/Actual sections; docs/release.md covers cutting a release (bump, changelog, tag) and install/update at work (clone, checkout tag, no runtime deps); design/specs/releases.md specs version and bug (4 scenarios, bound by tests in test/cli.test.ts). biome.json now excludes design/specs because biome rewrote the spec's Verification markers. UI build pipeline deferred (no UI). No tag or version bump made."
ticket = "jc84"
+++

docs/tickets/open/releases-and-updating-flume-at-work-jc84.md

## Thread

### note · external:advisor · 2026-11-17T04:08:42.326Z
Readied by human via advisor ("yes ready the tickets").

### note · external:advisor · 2026-11-17T04:08:42.349Z
readied by external:advisor

### note · agent:releases · 2026-11-17T04:36:50.878Z
Assumptions: (1) flume version kept as is, no tag needed. (2) UI build pipeline deferred: no UI yet (YAGNI), noted in docs/release.md. (3) biome formats markdown and rewrote '*Verification*' to '_Verification_', which bridle spec check rejects; I excluded design/specs from biome in biome.json. The specs worker on fl-47b8 will likely hit the same, so a merge may touch biome.json.

### note · agent:releases · 2026-11-17T04:36:50.893Z
built: f9db990 (branch bridle/releases)

### note · agent:releases · 2026-11-17T04:36:50.905Z
done: flume bug + docs/release.md + design/specs/releases.md (4 scenarios bound); just check exit 0, 6 tests, on f9db990. Note: biome.json now excludes design/specs (biome rewrote spec markers).

### note · agent:releases · 2026-11-17T04:37:15.536Z
merged main (a1d5b68) into bridle/releases; conflicts in biome.json (took main's !design) and design/specs/.ids (union). just check exit 0, 6 tests, on 941db48. My 4 scenarios bound; the 59 unbound are the fl-47b8 specs.

### note · agent:manager · 2026-11-17T04:37:16.967Z
fl-47b8 just landed on main: design/specs/ (task-files, cli, api, .ids), docs/conventions.md (spec conventions), and biome.json now excludes '!design'. Merge main into your branch, resolve biome.json (keep main's '!design', drop your own design/specs exclude if it's redundant) and CHANGELOG (keep every line), check your releases.md follows the conventions in docs/conventions.md, run 'bridle spec id' and 'bridle spec check --require-ids' (no ID clashes with design/specs/.ids), then 'just check'. Message me with the sha, exit status and test count.

### note · agent:manager · 2026-11-17T04:37:28.023Z
integrated: 38a7a5de166aae79bed734705dbb08e9ed3d56cc (branch bridle/releases)

### note · agent:releases · 2026-11-17T04:37:29.649Z
done: main (fl-47b8) was already merged at 941db48 (biome.json has main's !design, CHANGELOG keeps all lines, .ids union, no ID clashes). Added the assumptions paragraph to releases.md per conventions. just check exit 0, 6 tests, on dadec4a.

### note · agent:manager · 2026-11-17T04:37:59.730Z
cleanup: removed agent releases, origin branch bridle/releases, branch bridle/releases
