# Stack decision

Status: decided (2026-11-16, by the human). Ticket fl-28pa.

## Decision

Flume is built in **TypeScript on Node**: the daemon, the CLI and the React UI.

**Go** was the runner-up and is the recorded alternative (see below).

## Context

The install path did not decide this. Node, Python, Go, Rust, Java and Scala all work at work,
because Artifactory mirrors the package registries. The constraints that matter are in
[[docs/brief/project-note]]: no pushes from work, updates by `git pull`, and a sandbox that
forbids hooks.

## Why TypeScript

- One language and one set of types from the task file, through the localhost API, to the Kanban
  UI.
- Quick to change while the design is still unsettled.
- Good Markdown tooling (remark, unified) and YAML tooling (`yaml`) for task files.
- A CLI start of 40 to 80 ms is fine for Flume's use.

## Concurrency

Node runs JavaScript on one thread with an event loop. That is enough for Flume's load: localhost
requests, file reads and git commands are all I/O that the event loop handles well. Heavier work,
such as running sensors, goes to child processes. Node does not run JavaScript in parallel
threads by default; it is not "multi-threaded" in the way Go is.

## Why Go was the runner-up

- A single binary: no Node runtime and no `node_modules` to keep healthy on the work machines.
- A small dependency tree.
- About 5 ms start time.
- Real parallelism across cores without child processes.

## When to revisit

Revisit if either of these happens:

- Keeping the work install healthy becomes the main pain.
- CLI start time starts to matter.

The task files and the localhost API are the contract, and the specs are language-agnostic
(see [[docs/conventions]]). So the daemon can be rewritten in Go without touching the UI or the
files.

## Ruled out

- **Rust**: bridle is written in Rust and some code could be reused, but it is slow to change for
  a light tool.
- **Python**: no longer ahead once every toolchain works at work.
- **Java and Scala**: the JVM start on every agent call is heavier than Flume needs.
