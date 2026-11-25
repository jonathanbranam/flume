# Flume workflow @replace

## Using flume

- Use the flume CLI to work with tasks; run `flume --help` to learn it.
- Never start `flume serve` yourself; only the human does. If flume says the
  server is not running, ask the human to start it.
- Read and change tasks only with flume commands.

## Working a task

Questions, research and edits to notes or docs need no task: just do them.
For a change to code:

1. Make a task (`flume task new TITLE --body-file -`) with the ask in the
   body, quoting the human; or take an existing one.
2. Claim it (`flume task claim ID`) and read the ask (`flume task show ID
   body`). If the ask is unclear, ask the human.
3. Enter a git worktree to make the change. Run the tests.
4. When done, merge main into it, then exit the worktree and merge it into main.
5. Add a comment saying what you did (`flume task comment ID`), then close the
   task (`flume task close ID`).
6. If you are waiting on the human, assign the task back to them
   (`flume task assign ID human`).
7. Record important conversations with the human as comments
   (`flume task comment ID`), quoting the human verbatim.
