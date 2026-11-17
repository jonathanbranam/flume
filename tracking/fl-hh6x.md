+++
id = "fl-hh6x"
title = "flume prime: remove the system-wide ~/.flume/templates overrides"
kind = "fix"
state = "built"
created_at = "2026-11-17T14:11:52.048Z"
updated_at = "2026-11-17T14:19:05.324771227Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:no-templates",
]
branch = "bridle/no-templates"
commit = "b2c4a12abe55d601d79a0f14a6217956e558b72f"
summary = 'Removed the system-wide prime template overrides. `flume agent` and `flume prime` no longer read `~/.flume/templates/` (base.md, project.md); the prime is always the built-in base text, plus the built-in project text when there is a project. Changes: `src/cli/agent.ts` (the `template()` file reader is now a plain `fill()` over the DEFAULT_ constants; the DEFAULT_ constants are the only text), `design/specs/agent.md` (r-a8c0 rewritten as "Built-in prime text", scenario s-a8c1 now "Templates folder ignored"; r-a6c0 wording says built-in text; other IDs unchanged), `test/agent.test.ts` (s-a8c1 asserts the templates folder is ignored), `docs/release.md` (override paragraph removed), CHANGELOG line under Unreleased/Changed. `~/.flume/agents/` is unchanged. No workspace overrides added (assumption per the ticket). Historical CHANGELOG entries and resolved tickets that mention templates were left as they are. Checks: npm ci exit 0; just check exit 0 on b2c4a12 (137 tests passed); bridle spec check --require-ids exit 0 (0 errors, 0 warnings). Main was already contained in the branch, so no merge commit was needed.'
ticket = "hh6x"
+++

docs/tickets/open/flume-prime-remove-the-system-wide-flume-templates-overrides-hh6x.md

## Thread

### note · external:advisor · 2026-11-17T14:11:59.346Z
readied by external:advisor

### note · external:advisor · 2026-11-17T14:11:59.368Z
human via advisor: a fix, readied.

### note · external:orchestrator · 2026-11-17T14:17:45.571Z
From orchestrator: fl-hh6x planned and queued, Haiku. fl-k9pk joins at 14:21 UTC after its settle (parallel is fine).

### note · agent:no-templates · 2026-11-17T14:19:01.200Z
built: b2c4a12abe55d601d79a0f14a6217956e558b72f (branch bridle/no-templates)

### note · agent:no-templates · 2026-11-17T14:19:05.324Z
done: flume agent and flume prime no longer read ~/.flume/templates; prime is built-in text only; ~/.flume/agents unchanged, no workspace overrides; just check exit 0 on b2c4a12abe55d601d79a0f14a6217956e558b72f (137 tests passed); spec check --require-ids exit 0; CHANGELOG under Changed; main already contained, no merge needed. Summary on the ticket.
