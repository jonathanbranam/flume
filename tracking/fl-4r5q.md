+++
id = "fl-4r5q"
title = "Scaffold the TypeScript project and check command"
kind = "chore"
state = "integrated"
created_at = "2026-11-17T04:10:37.420Z"
updated_at = "2026-11-17T04:33:13.708027414Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:scaffold",
]
branch = "bridle/scaffold"
commit = "80d1a35c533f6877ac8e7b4809793f03d8c3b8e5"
summary = "TypeScript on Node scaffold: bin/flume.js runs src/*.ts directly via Node type stripping (Node >=22.18, no build step); flume --help, flume version (package version + short git commit, 'unknown' outside git). tsc strict, vitest, biome, npm run check = typecheck+lint+test+spec. scripts/spec-check.js runs bridle spec check --require-ids (failing) and spec coverage (report-only); skips with a message if bridle is not on PATH or design/specs/ is absent (it is absent now). justfile, .bridle/config.toml check/integration/setup, README Develop, CHANGELOG. Assumption: biome over eslint (one package)."
ticket = "4r5q"
+++

docs/tickets/open/scaffold-the-typescript-project-and-check-command-4r5q.md

## Thread

### note · external:orchestrator · 2026-11-17T04:10:52.363Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T04:10:52.387Z
Readied by human via orchestrator. The human, 2026-11-16 ~11:10 PM (orchestrator session): "the work is progressing, please help by approving and readying tickets over night and handling any admin tasks that need done". Child of fl-danq, split by orchestrator (acting PM; flume has no PM).

### note · external:orchestrator · 2026-11-17T04:13:59.683Z
Added by orchestrator, on the advisor's request (the human asked for conventions enforced; rules in .bridle/rules/, docs/conventions.md): the check command also runs 'bridle spec check --require-ids' (failing). Run 'bridle spec coverage' too, but report-only for now (don't fail on it): the specs from fl-47b8 land before the code tickets write their tests, so a failing coverage check would turn main red for every later ticket. Turning coverage into a failing check is the last step of fl-danq, once its children have landed. Note that bridle must be on PATH for the check; if spec check can't run in a worktree, record it and make that part skip with a message rather than fail.

### note · agent:scaffold · 2026-11-17T04:32:59.741Z
built: d7d993f (branch bridle/scaffold)

### note · agent:scaffold · 2026-11-17T04:32:59.754Z
done: TS/Node scaffold; just check exit 0, 2 tests passed (also npm ci from clean node_modules), flume version prints '0.0.1 (<commit>)'; spec part skips (no design/specs yet, bridle on PATH); d7d993f

### note · agent:manager · 2026-11-17T04:33:12.157Z
integrated: 80d1a35c533f6877ac8e7b4809793f03d8c3b8e5 (branch bridle/scaffold)

### note · agent:manager · 2026-11-17T04:33:13.708Z
cleanup: removed agent scaffold, origin branch bridle/scaffold, branch bridle/scaffold
