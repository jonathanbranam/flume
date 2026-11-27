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

## i-ac8f Flume remembers an agent

When an agent is launched, flume records it in the registry with its name, project and role, and
ties it to the terminal pane it runs in. When the agent exits, its session ends but the record
stays. Relaunched later from the same terminal pane, it comes back as the same agent with the same
settings.

Why: an agent outlives any one session; the human can stop and restart it without saying again
who it is (i-8716).

## i-fe40 Settings change only when given

At a relaunch, a project or role given changes what flume remembers for the agent; anything not
given stays as it was.

Why: a relaunch must never lose an agent's settings by accident; changing one is always explicit.

## i-a058 Agent records and configuration are human-readable

The registry of agents, and flume's configuration as a whole, are kept in a form a human can read
and edit. The human manages the registry through flume's CLI, which has commands for it.

Why: nothing about the agents or how flume is set up is hidden from the human, who can always
inspect it (P2). The CLI is the normal way to change the registry.

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

## i-899c What every agent receives at launch

However it is launched, every agent receives:

1. its name;
2. its project's name;
3. its role's instructions, resolved by flume's layers (base, then workspace, then project);
4. flume's instructions: a brief account of how flume works and its core commands, pointing the
   agent to the flume CLI for the details.

Why: whatever else it is given, an agent always knows who it is, what its role is and how to use
flume (P5).

## i-7df3 Flume chooses one first prompt

After what every agent receives, flume gives the agent exactly one first prompt, the first of
these that exists: a prompt the human gave at launch (i-72d8), else a handover note (i-7693), else the
start-up instructions (i-3316).

Why: the most specific brief wins, and every launch starts the agent working.

## i-72d8 A given prompt is the whole brief

A prompt the human gives at launch is given to the agent as is, and the agent gets no start-up
instructions.

Why: a given prompt is a specific brief; the agent goes straight to it, without spending the
early, most valuable part of its context window searching for tasks and working out what to do.

## i-7693 A handover note carries work across a restart

An agent can record a handover note through the CLI before it stops (the human can record one
too). The human can ask an agent to write one, and flume provides the instructions (a guide or
the CLI's help) for writing it. A note is consumed when it is used: the launch that gives it to
the agent uses it up, and a launch that does not use it (one with a given prompt) leaves it for
the next.

Why: an agent's understanding of its work would otherwise be lost when its session ends.

## i-3316 Start-up instructions start an agent with no brief

With neither a prompt nor a handover note, the agent gets the start-up instructions, resolved by
flume's layers (base, then workspace, then project).

Why: an agent with no brief starts working at once, and each workspace and project can say what
starting work means for it.

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
- 2026-11-27 (fl-acpm review), on how agents are named (not decided; ideas for later, not intent):
  - Bridle names agents after roles; only some agents get a name besides the role, so how many of
    each there are is implied. "It is useful, though, in Bridle: when I say "talk to the aid on
    that project" or "talk to the orchestrator on that machine," Bridle knows immediately what I'm
    talking about and can find that agent. It's easier than remembering a unique name for each
    agent that's serving the same role on a different project."
  - For flume: "because it needs to be project-configurable, Flume itself will probably not
    enforce anything here beyond the fact that agent names need to be unique."
  - At work: "I have a list of unique agent names for each project, and I just assign them when I
    create new agents. It would be possible for Flume itself to pull from that agent list and find
    an unused name in that list."
  - What names are for: tracking which agent is working on which thing; unique messaging; and the
    human's memory: "I tend to remember that the agent named Series is working on some particular
    task right now, and it just sticks in my mind that way. I find that somewhat useful."
  - Likely practice, not a requirement: a name holding the project and the role ("Project XYZ
    manager"), "and then maybe a unique identifier for that particular agent if I need one
    specifically for workers and interactive sessions."
  - "I haven't made a firm decision on agent naming here yet, for sure."

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

## i-ac8f Flume remembers an agent

- 2026-11-27 (fl-acpm review): "when an agent is launched from the CLI, Flume stores an
  association with that agent and its role and project in the registry. If the agent is exited,
  that session is ended. Later, if it is relaunched from the same terminal (or CLI, or same
  terminal window), it will come back as the same agent with the same settings."

## i-fe40 Settings change only when given

- 2026-11-27 (fl-acpm review), on advisor's candidate "settings change only when given": "Agree:
  settings only change when given."

## i-a058 Agent records and configuration are human-readable

- 2026-11-27 (fl-acpm review): "the registry should really be managed through the CLI. Yes, there
  are CLI commands for the human to interact with the registry, and yes, I do prefer even
  configuration to be human-readable. ... Let's say that the Flume configuration as well should
  all be human-readable and editable." And: "For 5, yes, let's store it as human-readable config."

## i-8716 Launching is short for the common case

- 2026-11-17 (fl-xv3z): "I don't want a CLI guessing about the meaning of a parameter based on
  whether it has spaces in it or not." "80% of the time, I'm running Claude as bare because I've
  already set the agent name in the session. ... 20% of the time, I'm giving it a specific prompt.
  ... very rarely, I'm giving the agent a name."
- 2026-11-27 (fl-acpm review): "Most launches never give a name, a project, a role, or a prompt."
  "90% of the time, we can just say "Flume agent" is what we're getting at here, and everything
  about that is known from that Tmux pane."

## i-899c What every agent receives at launch

- 2026-11-27 (fl-acpm review): "No matter what the launch, every agent receives: 1. it's name
  2. it's project name 3. role instructions (resolved by flume: base->workspace->project) 4. flume
  instructions - how flume works and core CLI commands; brief and points agent to flume CLI for
  details". Split out of a longer item at the human's word: "I think i-899c How an agent starts is
  too long for a single intent though, can we split it?"

## i-7df3 Flume chooses one first prompt

- 2026-11-27 (fl-acpm review): "Then flume checks these in order: 1. A user-supplied prompt ...
  2. A "handover note" ... 3. No prompt, no hand-over note: start up instructions".

## i-72d8 A given prompt is the whole brief

- 2026-11-27: "i have found this very useful in my work context. What i'm doing is starting an
  agent with a specific brief for what is should work on. the agent still gets its name, role,
  project, and flume instructions, and then is given the prompt to work on. This skips the
  start-up prompt entirely." Why: "to preserve context; an agent that spends crucial tokens in its
  early context window to search for tasks and figure what to do".
- 2026-11-17 (fl-xv3z): "If I'm passing a prompt in ... I don't want the agent to go spend a lot
  of tokens and attention pulling up other tickets and things".

## i-7693 A handover note carries work across a restart

- 2026-11-27 (fl-acpm review): "A "handover note" - recorded by agent using the cli (usually by an
  agent, but the human could also record one); this allows the user to prompt the agent: "write a
  hand-over note" and the CLI / guide should exist to instruct the agent how to write one".
- 2026-11-27 (fl-acpm review): "yes a handover note is consumed when it is used. We haven't built
  that yet, AFAIK."

## i-3316 Start-up instructions start an agent with no brief

- 2026-11-27 (fl-acpm review): "No prompt, no hand-over note: start up instructions are given to
  the agent (resolved by flume layering: base->workspace->project overrides)".
- 2026-11-17 (fl-xv3z): "if there's no prompt, then I think Flume should send an interactive
  suggestion, because that kicks off Claude working. ... "Read the status of your tickets, suggest
  next steps, follow up, whatever.""

---

### Also in this change

- docs/intent/.ids: the eighteen IDs above, one per line.
- No *Intent* lines in design/specs/agent.md yet: that follows the rules of fl-srst.

### Open for the human

- i-1e7a's why is advisor's inference; no recorded reason found.
- i-7693: handover notes do not exist in flume today; a build ticket follows approval. That a
  launch with a given prompt leaves the note for the next is advisor's reading of "consumed when
  it is used".
- i-a058 covers all of flume's configuration, not only agents; it may move to the setup intent
  when that is written.
- Declined as intent (2026-11-27): the human names agents (open for later), a record ends only
  on the human's word, resuming the last conversation (not wanted).
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

The human, 2026-11-27 (review), verbatim: "Yeah, don't worry about the prompts thing, and it's fine
how it is. Let's maybe update this, look through this, and give some other ideas here. I think we
can try to come up with a general intent for Flume remembering an agent that doesn't necessarily
specify too much with it, but I think the CLI is something where it's okay to specify. I would say
that when an agent is launched from the CLI, Flume stores an association with that agent and its
role and project in the registry. If the agent is exited, that session is ended. Later, if it is
relaunched from the same terminal (or CLI, or same terminal window), it will come back as the same
agent with the same settings."

The human, 2026-11-27 (review of advisor's five candidates), verbatim, as corrected: "1. Agree:
settings only change when given. 2. I don't want to record this yet in intent. Currently, the
human names agents, but that's something that's open for discussion later." Then: "4: no, that's
not intent. I don't want resume." "3: no, don't update that, and then don't mark 3 as an intent."
"For 5, yes, let's store it as human-readable config." And on 5: "the registry should really be
managed through the CLI. Yes, there are CLI commands for the human to interact with the registry,
and yes, I do prefer even configuration to be human-readable. ... Let's say that the Flume
configuration as well should all be human-readable and editable."

The human, 2026-11-27, verbatim: "We're writing a provenance at the same time. We should definitely
be doing that." Then the agent naming notes, recorded under i-631d in the provenance draft: "This
is just provenance and ideas for the future, not anything we're doing today."

The human, 2026-11-27 (review), verbatim: "I think we need a specific intent for the unique ways
that an agent can be started." (Full text in the provenance draft under i-899c.)

The human, 2026-11-27 (review), verbatim: "I think i-899c How an agent starts is too long for a
single intent though, can we split it? hmmm.... I was thinking intents as follows: 1. what every
agent received no matter what on launch 2. how flume decided which prompt to give an agent Then
one intent each for the three types of prompts"

The human, 2026-11-27, verbatim: "also, yes a handover note is consumed when it is used. We haven't
built that yet, AFAIK."
