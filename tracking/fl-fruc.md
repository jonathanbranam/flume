+++
id = "fl-fruc"
title = "Bind scenario s-129b (version offline) with a test"
kind = "chore"
state = "built"
created_at = "2026-11-17T04:52:34.812Z"
updated_at = "2026-11-17T05:04:58.890905948Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:version-test",
]
branch = "bridle/version-test"
commit = "95dac4a"
summary = "Added test s-129b in test/cli.test.ts: runs flume version from an empty temp directory with FLUME_URL unset, and checks it prints one non-empty line and exits 0. No source change. Binds s-129b; bridle spec coverage no longer lists it."
ticket = "fruc"
+++

docs/tickets/open/bind-scenario-s-129b-version-offline-with-a-test-fruc.md

## Thread

### note · external:orchestrator · 2026-11-17T04:52:47.412Z
readied by external:orchestrator

### note · agent:version-test · 2026-11-17T05:04:58.866Z
built: 95dac4a (branch bridle/version-test)

### note · agent:version-test · 2026-11-17T05:04:58.890Z
done: s-129b bound in test/cli.test.ts (version offline, from an empty dir with FLUME_URL unset: one non-empty line, exit 0); just check exit 0, 96 tests passed, on 95dac4a; coverage no longer lists s-129b; main unchanged, no merge needed
