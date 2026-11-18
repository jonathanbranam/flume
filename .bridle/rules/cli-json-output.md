---
id: cli-json-output
severity: must
roles: [worker, manager, project-manager, orchestrator, advisor, aide]
---
Every flume command whose output a human might pipe through jq, or an agent might read or pipe,
prints human-readable text by default and takes `--json` to print the same data as JSON.

- Default output is for a human. YAML is fine for a single record (e.g. `flume agent show`).
- `--json` prints one JSON document on stdout and nothing else on stdout.
- Errors stay text on stderr, with the same exit codes, with or without `--json`.
- Not data, so no `--json`: `flume --version`, `flume --help`, `flume bug` (a template to paste),
  `flume prime` (agent text; fl-87h9).
- A new command that prints data ships with `--json`, its spec and its test (rule
  specs-for-every-surface).

Ticket fl-cpcu applies this to the commands that lack `--json` today.

Why: the human, 2026-11-17 (via advisor, verbatim): "all output commands should have a --json
option though for sure. | jq is super useful" and "right, anything I might want to pipe through
jq or anything an agent might want to read or pipe through jq should support --json; your list
looks good; write this as a bridle rule for this project's CLI commands as well".
