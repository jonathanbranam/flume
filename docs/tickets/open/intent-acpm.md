---
id: fl-acpm
title: "Intent: agents (docs/intent/agents.md and its provenance)"
kind: docs
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-srst]
---

## The ask

Write flume's first intent file, docs/intent/agents.md: the decisions behind how flume launches,
names, instructs and tracks agents, each with its why, in the form fl-srst defines (durable i-
IDs, plain words, no CLI syntax). Drafted below for the human's review; nothing is in force until
the human approves it. With it: docs/intent/.ids (the ledger) and docs/provenance/agents.md.

## Design

### Draft: docs/intent/agents.md

---

# Intent: agents

How flume launches, names, instructs and tracks the coding agents that work on tasks. Agents are
Claude Code sessions. What they do on a task belongs to the tasks and workflow areas; this area is
about the agents themselves.

## i-bf0d Flume launches agents

An agent is a Claude Code session the human starts through flume. Flume adds only the agent's
identity and flume's instructions, appended to Claude Code's own system prompt. Claude Code
otherwise starts as it normally would on that computer: its standard system prompt, its settings
and configuration, and its CLAUDE.md files are used as they are, and any other command-line
arguments the human gives are passed to it unchanged.

Why: one command gives every agent the same start, while the Claude Code setup of the computer
that launches it stays in charge; flume overrides none of it.

## i-631d Agent names are unique on the machine

An agent's name is unique across the whole computer, not only within a workspace or project.

Why: Claude Code messaging addresses agents by name, and Claude Code's Remote Control and remote
sessions are named by it too, so two agents on one machine can never share a name, even in
different workspaces.

## i-ad05 Flume tracks only the agents it launched

Flume keeps a record of each agent it launched: that it exists, where it runs, whether it is
still running and when it was last seen. It does not track agents it did not launch.

Why: an agent flume launched has a name and a known start; anything else flume cannot reliably
identify.

## i-8e1c What an agent is working on is in the tasks

The agent record does not hold the agent's work. Which tasks an agent holds and their state are
in the tasks.

Why: two separate kinds of tracking; the task system is the record of work (P6), and keeping it
in one place avoids two records that disagree.

## i-8484 An agent always knows who it is

Every agent has a name, a project and a role, and is told all three at launch and in its
instructions. An agent given no other role has the default role, general. An agent working on
the workspace itself has the workspace's name as its project; in a single-project setup every
agent's project is that project. Flume writes these lines itself; no workflow or overlay can change or remove them.

Why: the identity is universal, and there is no good reason to override it; an agent that loses
it acts under the wrong name.

## i-a530 An agent is never recorded as the human

Flume recognizes a Claude Code session even without an agent name, and records what it does
under an agent name, never as the human.

Why: the human's rights (taking over held work, overriding the system) are the human's alone
(P2), and every change must show who really made it.

## i-0e49 An agent learns flume from flume

At launch the agent receives flume's instructions in its system prompt: the workflow, its
project's and role's text, and the list of guides it can print. The text is written as agent
instructions, in named sections, not as data.

Why: an agent needs no other knowledge of flume (P5), and never has to read flume's own files.

## i-b975 Flume never starts its server

No flume command starts the daemon. When it is not running, flume says so and the agent asks the
human to start it.

Why: in an enterprise sandbox a server started by an agent would be refused or sandboxed (P4),
and the human decides what runs on their machine (P2).

## i-8716 Launching is short for the common case

Most launches never give a name, a project, a role or a prompt: the human relaunches the agent,
with nothing more, in the terminal pane it last ran in. Flume resolves the agent's name from that
pane, and its project and role from the agent's record in the registry; with no prompt the agent
gets the start-up prompt (i-899c). A name, project, role or prompt is given only to set or change
it; a prompt is given as is, and a name, which is rare, must be named as such. Flume never
guesses what an argument means from how it looks.

Why: about 90% of launches are a bare relaunch in the same pane, so that must be the shortest
command, with everything else known. A command that guesses from content (spaces, quotes)
surprises.

## i-899c Every launch starts work

With no prompt, the agent gets a start-up prompt: check its tasks and status, suggest next
steps, follow up. With a prompt, it gets only that prompt.

Why: a start-up prompt sets the agent working at once; a given prompt is the whole job, and the
agent should not spend tokens and attention on other tasks.

## i-1e7a One agent runs in one place at a time

A named agent runs in one terminal pane at a time; launching it elsewhere needs the human to say
so.

Why (advisor's inference, not recorded): two sessions under one name would both act as that
agent, and their work and messages would mix.

---

### Draft: docs/provenance/agents.md

---

# Provenance: agents

Where each intent item in [agents](../intent/agents.md) came from. For reference only.

## i-bf0d Flume launches agents

- 2026-11-17 (fl-macf): flume agent replaces the human's own claude-as launcher. "i'll use 'flume
  agent' immediately; don't need backwards compat"; "consume args that flume agent recognizes.
  Unrecognized args pass to 'claude'".
- 2026-11-27 (fl-acpm review): "the overall point here actually is that Claude Code is launched as
  normal and that it reads the standard system prompt. It reads any file setting, any Claude Code
  settings or config. All of that is managed and used as is from the computer that launches
  Claude Code, so we're not overriding those things. One of the things we're not overriding as
  well is additional CLI arguments."
- 2026-11-17 (fl-xv3z), on parsing Claude's options by Claude's rules: "We know exactly how Claude
  behaves ... I don't think we're guessing at all."

## i-631d Agent names are unique on the machine

- 2026-11-27 (agent spec review): "the registry is for the entire machine. It has to be that way
  because if we're using Claude Code messaging, every agent on the machine has to have a unique
  name. Even if we're not using it in remote control, every agent needs to have a separate name.
  That is definitely true."
- 2026-11-27 (fl-acpm review): "for agent names that are unique on the machine, this should also
  say that they're unique so that remote code and remote control sessions also have unique names."

## i-ad05 Flume tracks only the agents it launched

- 2026-11-27 (fl-xp8s): "Flume only tracks agents that it spawned." And: "Regardless of the
  sandbox restrictions, Flume should be at least observing the agents and tracking them, even if
  it's not maybe actively managing them."

## i-8e1c What an agent is working on is in the tasks

- 2026-11-27 (agent spec review): "there are two separate means of tracking here ... One is the
  agent tracking here. It doesn't say what the agent is working on because that's covered in
  tickets".

## i-8484 An agent always knows who it is

- 2026-11-25 (fl-hq8k): "we should move that critical text outside of the workflow.md so that a
  user cannot override it; there is no good reason to override that text, IMO."
- 2026-11-27 (fl-acpm review): the role added: ""An agent knows who he is" is missing the
  agent's role."
  Then: "every agent is going to have a project and a role ... That was optional before, but it
  should just be a requirement. ... We should just have a role that is the role that an agent
  without another role has."

## i-a530 An agent is never recorded as the human

- 2026-11-17 (fl-6hkt): "Flume should check for env vars that Claude sets and then know that this
  is an agent. Even if agent name is missing. Don't record something from an agent as human".

## i-0e49 An agent learns flume from flume

- 2026-11-17 (fl-xv3z): "Flume Prime should be injected in the system prompt so the agent knows
  how to use this tool."
- 2026-11-17 (fl-87h9): "They should use XML sections to inform the agent what each section it."
  And: "for prime, it is XML. This isn't data, it is agent instructions".

## i-b975 Flume never starts its server

- 2026-11-17 (fl-qgr7): "don't start a daemon ever" and "a daemon started by claude would be
  refused or sandboxes".

## i-8716 Launching is short for the common case

- 2026-11-17 (fl-xv3z): "I don't want a CLI guessing about the meaning of a parameter based on
  whether it has spaces in it or not." "80% of the time, I'm running Claude as bare because I've
  already set the agent name in the session. ... 20% of the time, I'm giving it a specific prompt.
  ... very rarely, I'm giving the agent a name."
- 2026-11-27 (fl-acpm review): "Most launches never give a name, a project, a role, or a prompt."
  "90% of the time, we can just say "Flume agent" is what we're getting at here, and everything
  about that is known from that Tmux pane."

## i-899c Every launch starts work

- 2026-11-17 (fl-xv3z): "if there's no prompt, then I think Flume should send an interactive
  suggestion, because that kicks off Claude working." "If I'm passing a prompt in ... I don't want
  the agent to go spend a lot of tokens and attention pulling up other tickets and things".

---

### Also in this change

- docs/intent/.ids: the eleven IDs above, one per line.
- No *Intent* lines in design/specs/agent.md yet: that follows the rules of fl-srst.

### Open for the human

- i-1e7a's why is advisor's inference; no recorded reason found.
- i-8484: project and role are now required, with a default role. Today both are optional, and
  flume prints identity lines for the name and project only. Follow-up once approved: a ticket
  that makes them required, adds the default role and a role line.
- Left out as mechanics, not intent: the option rules, the conflict list, the XML layout details,
  the list and show columns, --json.

## Discussion (for reference, not authoritative)

The human, 2026-11-27, verbatim: "Draft the first intent here." Then: "Just create a ticket for
the intent. Use the same approach we have with HRs, dividing it from the rest of the body."

Sources: design/specs/agent.md and the tickets it names (fl-macf, fl-xv3z), fl-hq8k, fl-6hkt,
fl-87h9, fl-qgr7, and the agent spec review of 2026-11-27 (fl-b2yb, fl-xp8s threads).

The human, 2026-11-27 (review), verbatim: "For Flume launches agents, the comment "everything else"
is a little bit vague. ... The overall point here actually is that Claude Code is launched as
normal and that it reads the standard system prompt. It reads any file setting, any Claude Code
settings or config. All of that is managed and used as is from the computer that launches Claude
Code, so we're not overriding those things. One of the things we're not overriding as well is
additional CLI arguments. And also, for agent names that are unique on the machine, this should
also say that they're unique so that remote code and remote control sessions also have unique
names."

The human, 2026-11-27 (review), verbatim: ""An agent knows who he is" is missing the agent's role."

The human, 2026-11-27 (review), verbatim: "No, every agent is going to have a project and a role,
I think. I'm okay with that. That was optional before, but it should just be a requirement. An
agent without a role can just have the role of "age generic" or something. I don't know. We should
just have a role that is the role that an agent without another role has."

The human, 2026-11-27 (review), verbatim: "Sorry, that got mungled a little bit. An agent's role
could just be "agent," or it could be the name "General." Yeah, that's right." (Kept: general.)

The human, 2026-11-27 (review), verbatim: "I don't know if an agent can work in the workspace
itself, but an agent then would be given the name of the workspace. If there's a single project
setup, then every agent is just given the name of the project."

The human, 2026-11-27 (review), verbatim: "For "launching is short for the common case," please
expand this to say: "Most launches never give a name, a project, a role, or a prompt." The agent's
name is resolved from... That's fine to say where it was last run, I guess. That's a little bit
vague, but it's resolved from the registry as well as its project, role, and optional prompt.
Let's just make sure that's clear. 90% of the time, we can just say "Flume agent" is what we're
getting at here, and everything about that is known from that Tmux pane."
