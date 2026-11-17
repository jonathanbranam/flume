---
id: specs-implementation-agnostic
severity: must
roles: [orchestrator, project-manager, manager, worker, reviewer, advisor]
---
Specs state only what can be observed from outside: files on disk and their contents, CLI
arguments, output and exit codes, HTTP requests and responses, and what the UI shows and does.

- No language, library, framework, module, class or function names in a spec. No internal data
  structures or algorithms unless their result is observable (the task ID alphabet is; how it is
  drawn is not).
- Write so a second implementation in another language (Go is the named alternative) could be
  built and checked against the same specs.
- Clear over clever: one behaviour per requirement; concrete values in scenarios.

Why: the human, 2026-11-16: "we should be writing language-agnostic specs for this anyway!!" and
~11:22 PM ET: "The specs should be clear and as language and implementation-agnostic as possible."
(tickets fl-47b8, fl-28pa)
