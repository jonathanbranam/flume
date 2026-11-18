# The daemon

Status: decided (2026-11-17, by the human). Ticket fl-35bq. Related: fl-pshd, fl-4dgp.

## Design

- The daemon (`flume serve`) is for two things: agents and the UI.
- Commands the human runs to set up or change the workspace (`flume init`, `flume clone`,
  `flume project ...`) work on the files and git directly and need no daemon.
- Only the human starts the daemon. No flume command starts it (rule
  built-for-the-work-sandbox).
- One daemon per workspace. Its state is in `.flume/daemon.json` (fl-4dgp).
