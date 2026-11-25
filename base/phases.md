# Phases

## Proposal

Check that the task has a clear proposal, goal and scope.

- Read the task: `flume task show ID body`.
- If the proposal, goal or scope is unclear, ask the human (assign the task to
  them: `flume task assign ID human`).
- Write them in the body: `flume task write ID body`, starting from the
  template below (or the existing text).
- When they are clear, move on: `flume task phase ID design`.

## Design

Think through the design questions and write the design.

- Read the body: `flume task show ID body`.
- Write the design: `flume task write ID design`, starting from the template
  below.
- Record each decision, the alternatives and why this one. Ask the human about
  anything open.
- When the design is clear, move on: `flume task phase ID specs`.

## Specs

Write the spec, clear requirements in EARS form.

- Read the body and design: `flume task show ID body`,
  `flume task show ID design`.
- Write the spec: `flume task write ID spec`, starting from the template below.
- A requirement is one EARS sentence ("When <trigger>, the system SHALL
  <response>") with Given/When/Then scenarios.
- When the spec is clear, move on: `flume task phase ID plan`.

## Plan

Write the plan, how to implement the task step by step.

- Read the body, design and spec: `flume task show ID PART`.
- Write the plan: `flume task write ID plan`, starting from the template below.
  Numbered groups of numbered items.
- Decide which guides (`flume guide`) apply to each group and name them with
  Guide: lines under the group's heading, before its items. The guides are
  printed with the group when an agent runs `flume task next`.
- Then mark the task ready: `flume task phase ID implement`.

## Implement

Do the plan, one group at a time.

- Read the body, design and spec for context.
- Get the current group of plan items and its guides: `flume task next ID`.
- Do the items, and report each one: `flume task done ID ITEM`, or
  `flume task skip ID ITEM --reason TEXT` if it should not be done. Repeat
  until the plan is complete.
- When writing code, enter a git worktree to make the changes; when done, merge
  main into it, then exit the worktree and merge it into main.
- Close the task when done: `flume task close ID`.

## Every phase

- If you see guides (`flume guide`) that matter for a later phase of this
  task, push them: `flume task guide ID NAME --phase PHASE`. Read any guide
  that matters for your own work now: `flume guide NAME`.
- Record important conversations with the human as comments
  (`flume task comment ID`), quoting the human verbatim.
- When your phase is done, set the next phase (`flume task phase ID PHASE`).
  Another agent may take the next phase. If you are waiting on the human,
  assign the task back to them (`flume task assign ID human`).
