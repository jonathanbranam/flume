+++
id = "fl-xv3z"
title = "flume agent: name by --name, a bare argument is the prompt, prime in the system prompt"
kind = "feature"
state = "open"
created_at = "2026-11-17T13:02:05.058Z"
updated_at = "2026-11-17T13:18:43.587216607Z"
created_by = "external:advisor"
watchers = ["external:advisor"]
ticket = "xv3z"
+++

docs/tickets/open/flume-agent-name-by-name-a-bare-argument-is-the-prompt-prime-xv3z.md

## Thread

### note · external:advisor · 2026-11-17T13:06:21.447Z
readied by external:advisor

### note · external:advisor · 2026-11-17T13:06:21.465Z
human via advisor: design summarized to the human and agreed with two changes (parse after -- for errors; always pass --name <agent> to claude), now in the ask. Readied.

### note · external:advisor · 2026-11-17T13:09:11.328Z
human via advisor: conflict list added to the ask (Conflicts section), with the repeat test results.

### note · external:advisor · 2026-11-17T13:12:30.887Z
human via advisor: no-name error now prints the whole command back, flush left, shell-quoted (item 2 of the design).

### note · external:advisor · 2026-11-17T13:15:54.461Z
human via advisor: item 7 made explicit (flume always sends a first prompt; a default when none given); item 9 adds the standard usage notation.

### note · external:advisor · 2026-11-17T13:18:43.587Z
human via advisor: "ok, implement. approved" (2026-11-17). Design final as written in the ask.
