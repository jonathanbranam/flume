---
id: fl-28pa
title: "Record the stack decision: TypeScript (Go considered)"
kind: docs
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

Record the decision on Flume's language in a short design doc (`docs/design/stack.md`), so later
work starts from it.

The decision: **TypeScript on Node** for the daemon, the CLI and the React UI. **Go** was the
runner-up and is recorded as the alternative.

The human, 2026-11-16 (advisor session): "i'm still unsure between typescript and golang, but I do
like your argument about typescript being more nimble; that we have one language for the UI and
server; and it handles multi-processing just fine". Then: "sure, we should be writing
language-agnostic specs for this anyway!!"

What the doc should say:

- Context: all of Node, Python, Go, Rust, Java and Scala work at work (Artifactory mirrors), so the
  install path did not decide it. Brief: `docs/brief/project-note.md`.
- Why TypeScript: one language and one set of types from the task file through the API to the
  Kanban UI; quick to change while the design is unsettled; strong Markdown tooling (remark,
  unified) and YAML (`yaml`); 40-80 ms CLI start is fine.
- Concurrency, stated accurately: Node is one thread with an event loop. That is enough for
  Flume's load (localhost requests, file reads, git). Heavier work such as running sensors goes
  to child processes.
- Why Go was the alternative: a single binary with no Node or `node_modules` to keep healthy at
  work, a small dependency tree, about 5 ms start, real parallelism.
- When to revisit: keeping the work install healthy becomes the main pain, or CLI start time
  starts to matter. The task files and the localhost API are the contract, and the specs are
  language-agnostic, so the daemon can be rewritten in Go without touching the UI or the files.
- Ruled out: Rust (bridle is Rust and code could be reused, but it is slow to change for a light
  tool), Python (no longer ahead once every toolchain works), Java and Scala (JVM start on every
  agent call; heavier than needed).
