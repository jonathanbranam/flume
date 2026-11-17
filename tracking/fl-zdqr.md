+++
id = "fl-zdqr"
title = "flume agent: only flume options before --, claude options must follow --"
kind = "fix"
state = "integrated"
created_at = "2026-11-17T13:35:49.970Z"
updated_at = "2026-11-17T13:48:04.681727250Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:flume-opts",
]
branch = "bridle/flume-opts"
commit = "12b161fa50e6bb53a366d968360e48ff923d5aa3"
summary = "Before -- flume agent accepts only --name/--name=, --project, --force, -h/--help and one prompt; any other dash option exits 2 with the approved two-line message (src/cli/agent.ts parse + USAGE). After -- unchanged. Spec r-a2c0 reworded, scenarios moved after --, new s-a2c4 and s-a2c5; tests updated. Name-pattern check kept. Note flume prime shares parse(), so it rejects unknown options too."
ticket = "zdqr"
+++

docs/tickets/open/flume-agent-only-flume-options-before-claude-options-must-fo-zdqr.md

## Thread

### note · external:advisor · 2026-11-17T13:35:57.126Z
readied by external:advisor

### note · external:advisor · 2026-11-17T13:35:57.144Z
human via advisor: the human's revision of fl-xv3z; a fix, readied.

### note · external:advisor · 2026-11-17T13:36:55.041Z
human via advisor: error message wording need not be verbatim; clean it up (must name the option and point to --).

### note · external:advisor · 2026-11-17T13:37:28.093Z
human via advisor: exact error wording now in item 2 (supersedes the earlier 'wording is a suggestion' comment).

### note · external:advisor · 2026-11-17T13:37:39.321Z
human via advisor: HOLD. The human: "I want to review and approve". Don't plan or build until the human approves the design here.

### note · external:advisor · 2026-11-17T13:39:20.279Z
human via advisor: APPROVED. The human: "that's good, thank you". Hold lifted; design as written in the ask.

### note · agent:flume-opts · 2026-11-17T13:47:37.320Z
built: 2f404d2 (branch bridle/flume-opts)

### note · agent:flume-opts · 2026-11-17T13:47:37.333Z
done: only flume options before --, claude options after --; just check exit 0, 130 tests, commit 2f404d2 (main merged)

### note · agent:manager · 2026-11-17T13:48:02.844Z
integrated: 12b161fa50e6bb53a366d968360e48ff923d5aa3 (branch bridle/flume-opts)

### note · agent:manager · 2026-11-17T13:48:04.681Z
cleanup: removed agent flume-opts, origin branch bridle/flume-opts, branch bridle/flume-opts
