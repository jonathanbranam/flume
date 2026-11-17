+++
id = "fl-5xjg"
title = "flume prime: default base template points the agent at flume --help"
kind = "fix"
state = "integrated"
created_at = "2026-11-17T13:44:40.484Z"
updated_at = "2026-11-17T13:55:21.710301304Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:prime-help",
]
branch = "bridle/prime-help"
commit = "da19f8559f5690fa26a1ff4245669f832b7ff06a"
summary = "Default base template in src/cli/agent.ts (DEFAULT_BASE, used when ~/.flume/templates/base.md is absent) now has the second line 'Use the flume CLI to work with tasks; run flume --help to learn it.' Spec s-a6c1 in design/specs/agent.md gets a matching AND line; tests s-a6c1 and s-a9c1 in test/agent.test.ts assert it. CHANGELOG Changed line added. Nothing else touched. Decision: kept minimal, no extra prime content, per the human."
ticket = "5xjg"
+++

docs/tickets/open/flume-prime-default-base-template-points-the-agent-at-flume-5xjg.md

## Thread

### note · external:advisor · 2026-11-17T13:44:48.432Z
readied by external:advisor

### note · external:advisor · 2026-11-17T13:44:48.453Z
human via advisor: kept minimal at the human's request; a fix, readied.

### note · agent:prime-help · 2026-11-17T13:54:09.030Z
built: 3cc2b999359c4e0bd1dd3b5f4191e2f71d00495d (branch bridle/prime-help)

### note · agent:prime-help · 2026-11-17T13:54:11.614Z
done: fl-5xjg default base template second line added (src/cli/agent.ts), spec s-a6c1 AND line, tests s-a6c1 and s-a9c1 assert it, CHANGELOG Changed line; just check exit 0, 130 tests passed, 0 failed; commit 3cc2b999359c4e0bd1dd3b5f4191e2f71d00495d; main already contained (no merge needed); bridle spec check --require-ids exit 0; ticket summary written, marked built.

### note · agent:prime-help · 2026-11-17T13:55:12.979Z
done (re-run after main moved to 380abb1): merged main into bridle/prime-help; CHANGELOG conflict resolved by keeping both Changed bullets (mine first); just check exit 0, 130 tests passed, 0 failed; checked commit 0a2ede9be99ebea5e614fc1daab0bfba199b7483 (merge of main), pushed. NOTE: the ticket was already marked built at 3cc2b99 before main moved; re-marking built is refused (not claimable in built state), so the landing should use --checked-commit 0a2ede9be99ebea5e614fc1daab0bfba199b7483 with the branch tip.

### note · agent:manager · 2026-11-17T13:55:19.995Z
integrated: da19f8559f5690fa26a1ff4245669f832b7ff06a (branch bridle/prime-help)

### note · agent:manager · 2026-11-17T13:55:21.710Z
cleanup: removed agent prime-help, origin branch bridle/prime-help, branch bridle/prime-help
