---
id: fl-xv3z
title: "flume agent: name by --name, a bare argument is the prompt, prime in the system prompt"
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-macf, fl-ttmw]
---

## The ask

The human, 2026-11-17 (verbatim excerpts):

> I don't want a CLI guessing about the meaning of a parameter based on whether it has spaces in it or not.

> 80% of the time, I'm running Claude as bare because I've already set the agent name in the session. ... 20% of the time, I'm giving it a specific prompt. ... very rarely, I'm giving the agent a name.

> The agent name is the thing that is rare, and that's what needs a parameter. I think `name` should require a parameter, so it should be `--name` ... If it just runs `flum agent` and then a string, that's not a name. That is the interactive prompt ... It would be great to not have to write the `--`.

> Flume Prime should be injected in the system prompt so the agent knows how to use this tool. ... if there's no prompt, then I think Flume should send an interactive suggestion, because that kicks off Claude working. ... "Read the status of your tickets, suggest next steps, follow up, whatever."

> If I'm passing a prompt in ... I don't want the agent to go spend a lot of tokens and attention pulling up other tickets and things

> for KISS for now, it just says, "This agent doesn't have a name. Please start again and provide the name parameter."

On using Claude's own option rules: "We know exactly how Claude behaves ... I don't think we're guessing at all." / "Let's definitely start using that."

## Design (to confirm with the human before ready)

1. **Name only by flag.** `--name <n>` (and `--name=<n>`) sets the agent name. A bare argument is never a name.
2. **No name -> error.** With no `--name` and no `@flume_agent` on the tmux pane, exit 2 with: this agent has no name; start again with --name <name>.
3. **A bare argument is the prompt.** It is the user's prompt to the agent. More than one bare argument is an error ("quote the prompt"), not joined and not passed through.
4. **Claude's options parsed by Claude's rules** (from `claude --help`): `--flag value`, `--flag=value`, flags that take one value, flags that take several values (`<x...>`: --add-dir, --allowedTools, --disallowedTools, --tools, --mcp-config, --betas, --file) and take every following non-dash argument, flags with an optional value (`[x]`: --resume/-r, --debug/-d, --worktree/-w, --cloud, --from-pr, ...). Replaces the short VALUE_FLAGS list (fl-ttmw).
5. **After `--`, flume still parses the arguments by Claude's rules, only to catch errors, and passes them to claude unchanged.** Errors: a bare argument after `--` when a prompt was already given (two prompts), and Claude's own -n/--name (it would clash with the agent name, item 10).
6. **Prime always in the system prompt** (`--append-system-prompt`). The `--system` flag goes away (it becomes the only behaviour).
7. **Interactive prompt:** the user's prompt when given, verbatim, focused on that ask; else a default kickoff: check your tickets/status, suggest next steps, follow up. Exact wording: implementer's call, kept short.
8. **Launch order:** flume puts the interactive prompt after a closing `--` when it runs claude, so no claude flag (e.g. a trailing --add-dir) can eat it.
9. Specs (design/specs/agent.md) and tests updated in the same change; USAGE text too.
10. **Flume always passes the agent name to claude as `--name <agent>`** (Claude's session name), so the agent knows its own name for sending messages.

## Decided

The human, 2026-11-17, on the summary: "Yeah, we do need to parse some of these things that come after the `--`. I think just to avoid errors, but the Flume agent should pass the agent's name as the `--name` parameter. That's really key and really important here. Otherwise, the Claude doesn't know and can't use that name as an actual agent name for sending messages."

The human, 2026-11-17, on conflicts: "Yeah, let's have Flume parse what comes after the `--`, only to look for conflicts. ... I just want a Flume agent to error out quickly if there's ambiguous input into Claude. If we pass `--name`, and then the caller writes `flume agent --name name` and then `-- --name name` again, that should just error out immediately because it's unclear."

## Conflicts (flume exits 2 at once, naming the conflict; claude is not started)

Checked 2026-11-17 by advisor (claude -p, haiku): Claude takes a repeated single-value option silently, last one wins. `--append-system-prompt "...APPLE" --append-system-prompt "...BANANA"` left only BANANA in the system prompt; `--name aaa --name bbb` ran without error. So every repeat below loses input without a word from Claude.

Arguments for claude are checked wherever they appear (before or after `--`):

1. **Claude's -n / --name after `--`.** Flume always passes `--name <agent>`.
2. **--append-system-prompt or --append-system-prompt-file.** Flume always passes the prime there, and a repeat drops one of them.
3. **Two prompts:** more than one bare argument in total (before and after `--`). A value taken by a Claude flag is not a bare argument.
4. **Any other single-value Claude option given twice** (e.g. --model twice). Flags that take several values (--add-dir, --allowedTools, ...) may repeat; they add up.
5. **A Claude flag with a required value and none given** (it is last, or the next argument is another flag).

Not conflicts: --system-prompt (it replaces Claude's default prompt; the appended prime still applies), flags flume does not know (claude reports its own errors).
