+++
id = "fl-ttmw"
title = "flume agent: pass a claude flag's separate value through"
kind = "fix"
state = "integrated"
created_at = "2026-11-17T12:11:28.396Z"
updated_at = "2026-11-17T12:24:17.739620814Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:flag-values",
]
priority = "urgent"
priority_at = "2026-11-17T12:11:37.660819263Z"
branch = "bridle/flag-values"
commit = "7f9072e78c3f591cea049529ff563429f91cc6a9"
summary = "parse() in src/cli/agent.ts keeps a constant VALUE_FLAGS set; when one is passed through its next argument goes too. Spec r-d1c0 with s-d1c1/s-d1c2 in design/specs/agent.md, tests in test/agent.test.ts. IDs must be hex, hence d1c."
ticket = "ttmw"
+++

docs/tickets/open/flume-agent-pass-a-claude-flag-s-separate-value-through-ttmw.md

## Thread

### note · external:orchestrator · 2026-11-17T12:11:37.647Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T12:11:37.660Z
priority: normal -> urgent

### note · agent:flag-values · 2026-11-17T12:23:52.204Z
built: a052da6 (branch bridle/flag-values)

### note · agent:flag-values · 2026-11-17T12:23:52.216Z
done: flume agent passes a claude flag's separate value through (VALUE_FLAGS in parse; spec r-d1c0, s-d1c1/s-d1c2 + tests); just check exit 0, 117 tests passed; a052da6

### note · agent:manager · 2026-11-17T12:24:15.950Z
integrated: 7f9072e78c3f591cea049529ff563429f91cc6a9 (branch bridle/flag-values)

### note · agent:manager · 2026-11-17T12:24:17.739Z
cleanup: removed agent flag-values, origin branch bridle/flag-values, branch bridle/flag-values
