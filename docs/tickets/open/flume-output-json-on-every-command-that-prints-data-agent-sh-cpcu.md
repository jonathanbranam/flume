---
id: fl-cpcu
title: "flume output: --json on every command that prints data; agent show prints YAML"
kind: chore
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-89z2]
---

## The ask

Every flume command that prints data takes `--json`; by default it prints for a human. `flume agent show` prints YAML by default.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

- Rule for all commands: a command that prints data prints human-readable text by default and takes `--json` to print the same data as JSON on stdout (one JSON document, nothing else on stdout), for `| jq`.
- Commands that lack `--json` today and get it:
  - `flume agent list`: a JSON array of agent entries.
  - `flume agent show <name>`: the entry as a JSON object.
  - `flume status`: running or not, address, root.
  - `flume check`: the problems as a JSON array (empty when none; exit codes unchanged).
  - `flume roadmap check`: same shape as `flume check`.
- `flume agent show <name>` prints the entry as YAML by default (today it prints JSON).
- Already have `--json`: `flume task ...`, `flume roadmap show`.
- Not data, so no `--json`: `flume --version`, `flume --help`, `flume bug` (a template to paste), `flume prime` (agent text; fl-87h9).
- Record the rule in `docs/conventions.md` so new commands follow it.
- Specs and tests for each new `--json` (rule specs-for-every-surface).

### Assumed (advisor; change if wrong)

- Errors stay as text on stderr with the same exit codes, with or without `--json`.

## Discussion (for reference, not authoritative)

The human, 2026-11-17 (verbatim): "flume agent show should print something human-readable by default, sure yaml is fine; all output commands should have a --json option though for sure. | jq is super useful"

Survey of `src/cli` at the time: `--json` exists in task.ts (all task commands) and roadmap.ts (`roadmap show` only); `agent show` printed `JSON.stringify(entry)` (src/cli/agent.ts:270).
