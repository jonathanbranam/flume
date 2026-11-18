# Flume project conventions

The human's conventions for this project, recorded as they are given. The ones agents must follow
are also bridle rules in `.bridle/rules/`, which every agent gets at startup; this page is the
human-readable record.

## Specs and tests

- Every CLI command, every daemon API endpoint, every UI view and the task file format has a
  spec, and every executable scenario has a test that names its scenario ID. Rule
  `specs-for-every-surface`.
  The human, 2026-11-16: "I DO want clear specs written for every CLI command and the API and UI -
  use bridle specs and write tests for them".
- Specs are bridle capability specs in `design/specs/<capability>.md`, checked with
  `bridle spec check --require-ids` and `bridle spec coverage`.
- Style: each requirement one EARS sentence ("When <trigger>, flume SHALL <response>"), with
  Given/When/Then scenarios under it. The human: "yes, that's it". Bridle's parser accepts EARS
  requirements; scenario steps must be plain text (no backticks).
  The human: "if bridle doesn't allow EARS in a spec, then write your own specs out to the docs/
  folder maybe docs/specs." It does allow it, so specs stay in `design/specs/`.
- Specs are clear and language- and implementation-agnostic: observable behaviour only. Rule
  `specs-implementation-agnostic`.
  The human: "we should be writing language-agnostic specs for this anyway!!" and "The specs
  should be clear and as language and implementation-agnostic as possible."
- Where and how (fl-47b8): one file per capability in `design/specs/` (`task-files.md`, `cli.md`,
  `api.md`; the UI spec follows in fl-8g3q as `ui.md`). Heading shape: `### Requirement: <name>`
  with the EARS sentence as the paragraph below, then `#### Scenario: <name>` with a
  `*Verification*: **executable**` line and GIVEN/WHEN/THEN bullets. Run `bridle spec id` to assign
  IDs, then `bridle spec check --require-ids`. Each file opens with its recorded assumptions and
  open questions. Terms: the unit is a task; a command is written `flume task list`; paths are
  relative to the project root; no language, library or module names.

## CLI output

- Rule `cli-json-output` (fl-cpcu). A command that prints data prints human-readable text by
  default and takes `--json` to print the same data as JSON, for `| jq` and for agents.
- With `--json`, stdout holds exactly one JSON document and nothing else. Errors stay text on
  stderr, with the same exit codes, with or without `--json`.
- Not data, so no `--json`: `flume --version`, `flume --help`, `flume bug`, `flume prime`.
- A YAML default is fine for a single record (`flume agent show`).
- A new command that prints data ships with `--json`, its spec and its test.

## Stack

- TypeScript on Node for the daemon, the CLI and the UI; Go was the alternative. Ticket fl-28pa.
  The human: "i'm still unsure between typescript and golang, but I do like your argument about
  typescript being more nimble; that we have one language for the UI and server; and it handles
  multi-processing just fine".

## Working style

- Make reasonable assumptions, record them and their tradeoffs on the ticket, keep moving. KISS
  and YAGNI. Rule `assume-and-record`.
  The human: "please make assumptions and take the best choice. KISS in times of doubt, and
  YAGNI - don't build too much." and "please make reasonable assumptions and record tradeoffs and
  keep the project moving overnight" ... "I've given a reasonable outline of the work and we can
  always pivot going forwards."
- Commit and push all updates and changes. The human: "please keep committing and pushing all
  updates and changes".

## How Flume reaches work

- Rule `built-for-the-work-sandbox`. The human: "1. work on it using bridle 2. file bug reports at
  work 3. email those to you using bridle 4. when the update ships, then update at work." and "I
  can directly reach public github and clone, but I'm not allowed to push at all".
- At work: Claude Code sandbox, no Claude hooks, git hooks allowed if they run in the sandbox,
  localhost allowed, packages through Artifactory, and Node, Python, Go, Rust, Java and Scala
  all work. Releases and updating: ticket fl-jc84.

## Layout and words

- The unit of work is a "task" (not "ticket"); task files under `flume/tasks/open/` and
  `flume/tasks/resolved/`; slugs capped at 50 characters (the human: "either 40 or 50. 60 gets
  pretty darn long"). Epic fl-danq.

The brief these come from: `docs/brief/`.
