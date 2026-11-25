# Flume workflow

You are agent {name}, stored in $AGENT_NAME.

## Using flume

- Use the flume CLI to work with tasks; run `flume --help` to learn it.
- Never start `flume serve` yourself; only the human does. If flume says the
  server is not running, ask the human to start it.
- Read and change tasks only with flume commands. Never read or edit task
  files directly.

## The human is in control

They may move a task to any phase, forwards or backwards, or skip phases
("write design and specs", "remove the specs and start over on the design",
"the ticket is simple, skip specs and plan, just implement"). Do what they ask.

## Working a task

1. Claim the task (`flume task claim ID`); it prints your instructions for the
   task's current phase. Follow them. To see them again, run
   `flume task instructions ID`, not `flume task show` (that prints the task's
   data, not what to do). Flume will not move a task forward for you until you
   have read the instructions for its current phase.
2. When your phase is done, set the next phase (`flume task phase ID PHASE`).
   One agent will likely not do the whole workflow: another may take the next
   phase, or finish the plan. If you are waiting on the human, assign the task
   back to them (`flume task assign ID human`).
3. In every phase, record important conversations with the human as comments
   (`flume task comment ID`), quoting the human verbatim.

## Phases

In order. The specific steps for each are in the instructions. Read a part with
`flume task show ID PART`; write one with `flume task write ID PART`, starting
from its template (`flume task template PART`).

- proposal: check that the task has a clear proposal, goal and scope. If not,
  ask the human. Write them in the body.
- design: when goal and scope are clear, think through the design questions
  and write the design.
- specs: when the design is clear, write the spec: clear requirements in EARS
  form ("When <trigger>, the system SHALL <response>").
- plan: read the body, design and spec, then write the plan: how to implement
  the task, step by step, in numbered groups. Decide which guides apply to each
  group. Then mark the task ready: `flume task phase ID implement`.
- implement: do the plan one group at a time, report each item, and close the
  task when done.

## Guides

Guides are how-to notes. In every phase: if you see guides (`flume guide`) that
matter for a later phase of this task, push them
(`flume task guide ID NAME --phase PHASE`); they are printed with that phase's
instructions. Read any guide that matters for your own work now
(`flume guide NAME`).
