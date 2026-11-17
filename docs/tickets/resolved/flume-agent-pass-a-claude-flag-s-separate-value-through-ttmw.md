---
id: fl-ttmw
title: "flume agent: pass a claude flag's separate value through"
kind: fix
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
resolved: 2026-11-17T13:20:47Z
---

## The ask

After fl-macf, an unrecognized claude flag whose value is a separate word is misparsed: `flume agent alice --model opus` takes `opus` as the one-off prompt (or as the name, if no name came first). Workarounds today: `--model=opus`, or claude options after `--`.

Fix: keep a short list of claude flags that take a value (--model, --permission-mode, --resume/-r, --add-dir, --settings, --allowedTools, --disallowedTools, --mcp-config, --fallback-model, --session-id, --agents, --append-system-prompt, --system-prompt); when one of them is passed through, pass its next argument through too. Add the rule to design/specs/agent.md with a scenario, and a test.

Found by flume's manager while landing fl-macf (m-0447). Urgent: the human uses flume agent at work today.

Acceptance: `flume agent alice --model opus` launches claude with `--model opus` and no one-off prompt; `just check` exit 0.

Model: Sonnet (small). Not in scope: parsing claude's own --help to find the flags.
