# Phases @replace

## Proposal

- Read the body (`flume task show ID body`). If the ask is unclear, ask the
  human.
- Move straight to implement: `flume task phase ID implement`.

## Implement

- Enter a git worktree to make the change. Run the tests.
- When done, merge main into it, then exit the worktree and merge it into main.
- Add a comment saying what you did (`flume task comment ID`), then close the
  task (`flume task close ID`).
