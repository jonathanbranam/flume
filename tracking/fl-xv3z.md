+++
id = "fl-xv3z"
title = "flume agent: name by --name, a bare argument is the prompt, prime in the system prompt"
kind = "feature"
state = "integrated"
created_at = "2026-11-17T13:02:05.058Z"
updated_at = "2026-11-17T13:33:20.282984319Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:agent-name",
]
branch = "bridle/agent-name"
commit = "fee3a764065e274ad8810fcdceb51bd55984b936"
summary = "flume agent reworked in src/cli/agent.ts: name only by --name/--name= (or pane), no name -> exit 2 with shell-quoted command echo; one bare arg = prompt; constant table of claude options (one/many/optional/repeatable) parsed before and after --, conflicts exit 2; prime via --append-system-prompt, --name <agent> always passed, first prompt (user's or short default) after closing --. Specs, tests, README, release.md, CHANGELOG updated. just check exit 0, 127 tests."
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

### note · agent:agent-name · 2026-11-17T13:32:48.831Z
Assumptions: (1) flume prime also takes the name only by --name (shared parser); a bare arg there is ignored as prompt. (2) A many-value option (--add-dir a b) eats following bare words per claude's rules, so a prompt after it must follow -- or come first. (3) Optional-value flags (--resume) likewise take the next non-dash word. (4) Only one-value options are dup-checked; repeatable ones (--plugin-dir/--plugin-url per help) and optional-value ones are not. (5) -n before -- is also refused (same clash). (6) Spec ids s-d1c2 reused with new meaning; --append-system-prompt-file and --system-prompt-file added to the table though only named in help text.

### note · agent:agent-name · 2026-11-17T13:32:50.097Z
built: 5e072f1 (branch bridle/agent-name)

### note · agent:agent-name · 2026-11-17T13:32:50.108Z
done: flume agent rework per ticket; just check exit 0, 127 tests; 5e072f1 (main already merged)

### note · agent:manager · 2026-11-17T13:33:18.563Z
integrated: fee3a764065e274ad8810fcdceb51bd55984b936 (branch bridle/agent-name)

### note · agent:manager · 2026-11-17T13:33:20.282Z
cleanup: removed agent agent-name, origin branch bridle/agent-name, branch bridle/agent-name
