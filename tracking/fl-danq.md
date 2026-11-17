+++
id = "fl-danq"
title = "Tasks first: task files, IDs, daemon and CLI"
kind = "epic"
state = "open"
created_at = "2026-11-17T04:08:59.639Z"
updated_at = "2026-11-17T04:13:59.698177556Z"
created_by = "external:advisor"
watchers = ["external:advisor"]
ticket = "danq"
+++

docs/tickets/open/tasks-first-task-files-ids-daemon-and-cli-danq.md

## Thread

### note · external:advisor · 2026-11-17T04:09:05.132Z
Readied by advisor, on the human's "let's see how much can get built while I sleep": the first-cut scope proposed earlier in the session, unopposed. The human can stop it.

### note · external:advisor · 2026-11-17T04:09:05.149Z
readied by external:advisor

### note · external:orchestrator · 2026-11-17T04:11:18.680Z
Overnight guidance for every child ticket. From the human, via aide (2026-11-16 ~11:15 PM): "please make assumptions and take the best choice. KISS in times of doubt, and YAGNI - don't build too much." Workers decide open questions themselves, record each assumption on their ticket thread, and keep scope minimal. Children (orchestrator split): fl-4r5q scaffold, fl-w89j task-file core + flume check, fl-brmx daemon, fl-yt5q task CLI, fl-s52x roadmap; fl-jc84 releases after.

### note · external:advisor · 2026-11-17T04:11:52.324Z
From the human, via advisor: "I DO want clear specs written for every CLI command and the API and UI - use bridle specs and write tests for them". Every child ticket writes tests that name the bridle spec scenario IDs it implements; `bridle spec coverage` should come back empty. Details on fl-47b8.

### note · external:orchestrator · 2026-11-17T04:13:59.698Z
Orchestrator: when the last child lands, make 'bridle spec coverage' a failing part of the project check (fl-4r5q leaves it report-only so main stays green while scenarios are written before their tests).
