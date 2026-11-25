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
2. Claim it (`flume task claim ID`); it prints your instructions. Follow them.
3. If you are waiting on the human, assign the task back to them
   (`flume task assign ID human`).
4. Record important conversations with the human as comments
   (`flume task comment ID`), quoting the human verbatim.
