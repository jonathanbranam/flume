+++
id = "fl-4r5q"
title = "Scaffold the TypeScript project and check command"
kind = "chore"
state = "open"
created_at = "2026-11-17T04:10:37.420Z"
updated_at = "2026-11-17T04:13:59.683580496Z"
created_by = "external:orchestrator"
watchers = ["external:orchestrator"]
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
