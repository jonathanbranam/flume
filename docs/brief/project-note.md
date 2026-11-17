<!-- From aide (notes) on vesta, message m-0006, 2026-11-16, verbatim: notes repo project/agent-workflow/Home.md. -->

# Agent Workflow: Flume (named 2026-11-16)

A very light, scaled-down version of something like bridle, built to run
on my work computers within the sandbox and restrictions there. Personal
coding project; see [[area/coding/Home]].

**Next action:** (done 11/16: named Flume, bridle project created, brief sent to its advisor) work it out with the flume project's advisor. Originally: pick a name, then create the GitHub repo and tell the
remus orchestrator (external:orchestrator@remus, via the remus-home
daemon) the repo URL and name; it sets up the folder
(`~/work/<name>-work/<name>`) and the bridle project. Then work the rest
out with that project's aide.

**End state:** the light workflow (tickets first) running on my work
computers.

## What I described (via the remus orchestrator, 2026-11-16)

Closely paraphrased by the remus orchestrator, not my exact words:

- What already works at work: agents can message each other, and
  entering and exiting git worktrees works. A lot works clearly and
  accurately there.
- The main thing is the ticketing system.
- I have a file to share with the project at least once. It's ready and
  shows the intended setup, roughly mirroring bridle's: the ticketing
  system, epics and roadmaps, maybe the documentation system, and some
  pieces of the UI.
- Rules should be in it somehow, but no hooks can be used at work.
- I don't like the name "bridle" either, so the name need not be
  horse-themed. The project is essentially "agent workflow."

## The tickets write-up

[[project/agent-workflow/Tickets Lite]]: the "tickets lite" design from
aide@bridle on dalek (2026-11-16), a simplified version of bridle's tickets
(stable IDs, epics, a roadmap, a small daemon and CLI). This is the file to
share with the new project.

## Still undecided

- The name.
- What the work computers can run: Python stdlib only, a single
  compiled binary, Node, or files only (markdown plus CLAUDE.md and
  skills, nothing to execute).

## Name: Flume (decided 2026-11-16, 10:33 PM)

"I love it; bridle project created." A flume is a built channel that
carries water (and, in logging, logs) along a set course to the mill: the
walls keep the work on course (guides), gates check what passes
(sensors). Repo manager role idea: flume tender (they walked the flume
and cleared jams). CLI `flume` (`flu` + Tab). Brief sent to the flume
project's advisor 10:35 PM.

## Name: leaning Muster (2026-11-16, 10:08 PM)

Muster: "mustering an army ... it's kind of what we're doing here." The
command can be an abbreviation like `mus` (as `kubectl`/`k9s` are for
Kubernetes); what I don't want is a CLI with an unrelated name. Rally was
liked ("energetic and exciting") but dropped: Rally (Broadcom's agile
tracker, ex-CA Agile Central) and OpenStack Rally exist. Roles in the
theme: sergeant (repo manager), crew/trooper (workers); `muster roll` =
the agents list. Not fully decided until the repo is created.

Web check 10:12 PM: "Muster" is crowded in this exact space. Giant Swarm's
Muster is an AI-agent control plane whose CLI has `serve`, `agent`,
`check`, `start`, `stop` (docs.giantswarm.io); muster-ai is a multi-agent
team inside Claude Code; a Product Hunt "Muster" is a cockpit for AI coding
agents; scott2b/muster manages tmux sessions; others (a bash deploy
orchestrator, a team-standup TUI). Name on hold.

## Name ideas (from the remus orchestrator)

- **docket**: a list of items waiting to be dealt with; fits a ticket
  system, and `docket new`, `docket list` read well. The orchestrator's
  pick.
- **slate**: the work lined up next ("on the slate"); short.
- **relay**: agents passing work to each other; fits messaging more than
  tickets.
- **tally**: a light, running count of the work.
- **roster**: the crew of agents and who's on what.
- **punch**: from "punch list," the short list of what's left.
- **halter** (horse): simple headgear for leading a horse, lighter than
  a bridle.
- **hackamore** (horse): a bridle with no bit, as this is bridle with no
  hooks.
- Check the chosen name doesn't clash with a tool already used at work.

## Name ideas, rounds 2 and 3 (remus orchestrator m-0312, 2026-11-16)

My feedback so far (closely paraphrased by the orchestrator):

- Rejected: docket (looks like Docker, autocompletes only at the "r", a
  little long); relay (already used: avoid names that already exist).
- Liked: slate, punch, tally; roster "not bad". Like "Linear": a catchy
  word that doesn't sound strictly like planning. Puns and metaphors welcome.
- My favorites from round 2: stub, chit, tack, punch, notch, rung, skein,
  spool, muster, tote.

Round 2 also had: cairn, hopper, errand, furrow. Ruled out: trellis
(Trello), cue (CUE), loom, wicket, beads (an existing agent issue
tracker). Possible clashes: Tally (tally.so forms), Slate (rich-text
editor library); neither is a tracker.

Round 3: tab, slip, tag, brad, pin, perf, stamp; tick, knot, tread,
cleat; bobbin, reel, hank, weft, ply; roll, mess, watch, posse, bosun;
haul, cart, satchel, pannier, dray.

Orchestrator's picks: tick, hank, weft, dray, bosun (round 3); strongest
overall: stub, chit, tack, tick, notch, skein, tote, dray.

Checks before choosing: the first three letters unique among commands on
the work machine; not an existing tool, especially a developer tool or
tracker. Also (my point, 2026-11-16 7:43 PM): it has to survive voice
transcription. "Chit" is hard to say and transcribe (it came out "chip").

Command shape (talked through 11/16, not settled): the bare verbs act on
tickets (`<name> new`, `show`, `list`, `note`, `close`); everything else
takes a noun (`<name> roadmap`, `prime`, `check`, `serve`); an epic is a
ticket with `--kind epic`. The alternative is `<name> ticket new`.

## Rules without hooks

Rules can still reach agents through CLAUDE.md, skills, and a `rules`
command that prints them at startup (as `bridle prime` does). Agents
follow them as instructions, but nothing enforces them.

## Related

- Overdue task in [[area/coding/Home]] (11/7): ask the meta-notes
  project to build a scaled-down notes advisor for the work laptop.
  This project may cover it.

## Name shortlist (2026-11-16, 8:52 PM)

My picks so far, from every round:

- Workflow/guiding: **keel** (maybe garbles; `keel new` may not read
  well, so `keel task new`), **drover**, **spur**, **scout**, **tiller**,
  **usher**, **jig**.
- Earlier, kept: **tally**, **slate**, **muster**; **chit**/**chip**
  (like typing chit; hard to say).
- Dropped: baton (funny, but no), heel (`heel new` sounds bad), plumb
  (won't come across in voice), docket, relay.
- Also from the aide's lists: blaze, marshal, tempo, coach (not
  remarked on).

Update 9:24 PM: shortlist is keel, tiller, spur, tally, slate, muster,
chip, **flume** (added: "pretty interesting, nice metaphors"), tether,
stride. Dropped: jig, usher (too many meanings), scout (ScoutSuite's
`scout` command), treadle (won't come out right spoken), outrider (too
long). Voice matters but typing matters more: "I can always save a word
in Wispr Flow, but I can't always save words in other areas."

Note: rebase is probably blocked at work (anything potentially
destructive usually is), so the "rebase, don't merge" idea likely won't
work there.

## Talk-through, 2026-11-16 7:54 PM (by voice, driving; lightly cleaned)

> Let's go through some more words related to the concept of a harness.
> What are we doing? We're trying to guide or direct the agent in a
> certain direction. This tool is going to have two purposes. It's still
> going to have the harness purpose, so I'm okay with commands that sound
> like that.
>
> The main thing I'm clashing with right now: I'm storing tickets in
> Markdown files, but the agents need to go into a worktree and do some
> work, and then they need to update their ticket, and they can't do that.
>
> One solution is that agents outside of the worktrees, like on main, are
> doing a bunch of work and committing all this stuff. We have this rule
> that you should merge in main before going back to main and merging your
> worktree into main. They just merge main, main moved again, main moved
> again, main moved again. That's the real big problem. Main is moving not
> because of any code changes, but because of a whole bunch of
> documentation changes. We don't want a million merge commits either. I
> bet we may be getting a lot of merge commits. We're also just getting a
> lot of commits. Commits are cheap, I guess, but the history is just full
> of commits.
>
> This is happening with documents as well that they want to update, but
> generally a document isn't so bad: it's not being updated by different
> people, it's not merging that much. But I am tempted, because agents
> write a lot of documents too, to move all of that out.
>
> The other thing I want this system to have is some of the things we
> have in bridle, like the rules. Birgitta Böckeler (ThoughtWorks) writes
> about this: sensors and guides. I think we need both. Guides come first:
> the agent's about to do something, and we want it to reference a guide
> before it writes the code. OpenSpec does this with rules you can add
> before each of the phases: rules are injected when you're about to
> write a proposal, a design, a spec file, or tasks. They're pretty broad.
> They're not really context-dependent; they're artifact-dependent.

(Heard as "a lady named Bridget who used to get ThoughtWorks"; taken to
be Birgitta Böckeler, to confirm.)

> (7:55 PM) What we want from this tool, and from bridle as well, is
> task-dependent injection. The skill system in Claude gets us kind of
> near this, so we might use Claude skills to deliver these guides, but we
> still need an extra layer of intelligence here. The agent may or may
> not be invoking the appropriate skill. They may or may not know to
> invoke a skill to learn how to write a Jupyter notebook, or how to
> write a graph or something. They might, but we also want to package up
> the information that goes into the guides. For example, if there's a
> guide on how to write a notebook, it should dynamically look up the
> notebook definition file from somewhere. What OpenSpec does: the
> OpenSpec CLI is installed, and whenever the skill runs, it says, "Run
> the CLI," and that's basically the whole skill. It just says
> (cut off)
>
> (7:58 PM) The benefit of the CLI is we can literally do anything we
> want. We can go off and read the file system. We can combine a bunch of
> rules together. The skill itself can tell the agent to describe the task
> it's about to perform, or something like that, and pass it to the CLI;
> or it can list, I don't know. It's flexible. We can also update all
> this even while the agent's still running, without having to change a
> skill on disk and reload the agent.
>
> These are the things I'm looking for.
>
> Sensors: a sensor is something that runs after the agent has done
> something and detects whether the agent did the right thing or the
> wrong thing. It's kind of like a test, but not really a test: more like
> a validation of some output. I haven't built a lot of these yet, but
> that's the idea.
>
> One sensor would be a tool like a linter or a formatter. A formatter is
> a type of sensor: you wrote a Markdown file; does it format cleanly? Or
> you wrote a Python script; does it format the way we decided is our
> standard? Another sensor could parse the AST of the code and verify some
> things. And another would be an agentic skill that asks the agent to do
> something. The skill could just do it, or the skill could run the CLI,
> and the CLI could say, "Okay, you need to do these things," and provide
> a more dynamic prompt based on the situation.
>
> Those are a lot of the concepts in bridle that I want to put in this
> thing. Just write all this down, and then let's talk about some of these
> other things.
>
> We might have a rule that gets fired, or we might have a guide.
> Definitely looking up guides would be something. We'd want an index, a
> list of those guides. The skill would be able to list the available
> guides and give some context on them, kind of like how skills work
> today, and provide that to the agent: "If you're about to do these
> things, this is the guide you should refer to."

> (8:02 PM) Some other things:
>
> - We're going to have tickets and epics.
> - Tickets are sequenced.
> - Tickets can have dependencies between them, and they can be
>   associated with a roadmap.
> - They can also have an ordering that's independent of a dependency.
> - A dependency is a hard ordering: this must come before that. The
>   ordering is just a suggestion: this should be done before that, but
>   the ordering could be broken for various reasons.
> - Ordering can be done in parallel too. Dependent tickets must be done
>   in sequence; ordering just provides an overall ordering, and tickets
>   without dependencies can be worked on in parallel by different
>   agents, or even the same agent.
> - Tickets can definitely have phases: a draft, proposal or planning
>   phase.
> - I like the OpenSpec flow more or less. We go from proposal to
>   planning and technical design, which designs what the ticket should
>   really be and do, and is really clear.
> - The proposal should be clear. We do a proposal, make it clear, then
>   move to technical design, then write some specifications for the
>   ticket, then write a list of tasks.
> - With this system I won't necessarily require a full OpenSpec list of
>   tasks, but it should be a possibility. In OpenSpec that means 4+
>   files on disk, usually in a folder: 1 proposal, 1 design, N specs
>   (depending on the complexity of the work or how many areas it
>   touches), and 1 set of tasks.
>
> I want a concept of a longer-range plan and longer-range designs.
> There's a framework called LID (Linked Intent Design) that I also like.
> It has a high-level design and a low-level design, with traceability
> between those and the specs. Its specs are written in the EARS
> specification language.
>
> I struggle between EARS, which is pretty nice, and Givens
> (Given/When/Then), which I also really like. I want to be flexible on
> those.
>
> Tasks are pretty generic: usually a list of steps to take, things to
> do. They can be pretty specific in OpenSpec, pretty constraining. We
> want guides that fire during design and during tasks, for sure, to
> guide the system in building things the way we want.
>
> The best thing about OpenSpec is you get a chance to nail things down
> with the agent pretty clearly before letting it off to run. And the
> injected rules make sure the agent does the right thing in the right
> situation.

(LID = Linked Intent Design: confirmed 8:04 PM; it's a Git repo.)

> (8:04 PM) Spec-driven: OpenSpec and LID are the ones I'm really
> primarily happy with for spec-driven development, which is part of
> this. This tool should support a generic spec-driven approach. Another
> thing in bridle we're trying to work out: a different workflow makes
> sense for each ticket, depending on the task type or ticket type, and
> you should be able to override the workflow for a specific ticket.
> Those are complexities we're probably not going to have here.
>
> I'm trying to get out all the ideas that go into bridle quickly and
> reformat them into a lighter-weight, simpler thing. We can't interrupt
> the agents with hooks, but otherwise things are fairly similar. There
> are no background agents and things like that, which I have in bridle.

> (8:07 PM) Prime is good. What I've figured out at work: when you
> launch Claude is the only time you really get a chance to do much with
> it, since the interactive sessions are kind of locked down.
>
> Part of what comes out of prime is a bunch of overall general
> guidelines. When the agent goes to do something, like start on a
> ticket, it runs a skill that runs the CLI, which gives it a bunch more
> constraints about what to do.
>
> We should have tasks in a ticket, and that should be a structured
> thing. The agent can ask, "What are the next tasks to implement?" The
> tool tells them, and then they should check them off. The tool should
> support checking tasks off as the agent works through them, and maybe
> be pretty strict about it. Some agents don't check off tasks as they
> work; sometimes they just skip that step. The tool could say, "I'm not
> going to list any more tasks until you tell me whether you've finished
> these ones."
>
> On names: chip was pretty interesting, even though it was a typo for
> chit, but chit is kind of hard to say. I like typing chit; chip and
> chit are both interesting terms. I still like slate and tally, but most
> of these are ticketing-system terms, not workflow-system terms. I want
> to talk about workflow, control and guiding as names.

> (9:30 PM) For the design of the folders, I'm going away from docs.
> Instead, the name of the tool would be the top level, and then probably
> the term we pick for ticket, which I think we're going to go with task,
> just to keep it a little shorter. I want a maximum on those slugs: either
> 40 or 50 characters. 60 gets pretty darn long.

> (9:33 PM) Another consideration: multi-project, or at least multi-repo,
> setups. I have meta-notes and meta-notes-ui; bridle and bridle-ui; RAFT
> and Glassbox (heard "glass door"; to confirm); data contracts; synthetic
> data and some other related things. I really want all those tickets in
> the same repository, at least for related projects. I'm not sure if
> that's a tag on a ticket or a project folder. What makes me think it's a
> project folder is that the roadmap would definitely be unique. The
> guides could be shared, but they'd probably be relatively unique.
>
> I actually have a shared roadmap for some of these projects: shared,
> but broken up by module. I'd like this structure to work for bridle as
> well (my work projects are very similar); not saying we adopt it for
> bridle. I'd want an architecture document for each project, and maybe
> an overall architecture that spans multiple repositories. I'm thinking
> more and more that I want most of the project documentation in here as
> well.

> (9:35 PM) That looks pretty good. The other option is to drop the
> name of the tool entirely, but that's probably too broad. What else is
> in this repo? I usually like to have the tool name at the top in most
> situations. Still thinking about it.
>
> We'd also have scripts at the top level for doing various things. Since
> we're building a tool we probably don't need many, but it's common to
> have them. I'd have linting: I use pre-commit from the Python ecosystem,
> and I'd set something like that up so certain things, even in this
> repo, are checked. The pre-commit would mostly call our tool, and our
> tool would delegate to various other tools or internal linting-type
> checks.

### Concepts so far (my summary of the talk-through)

- **Tickets** in Markdown, written by a daemon so agents in worktrees can
  update them; keep ticket (and maybe doc) commits off main so main moves
  only for code.
- **Guides** (before the work): task-dependent, not just per artifact.
  Delivered through a thin Claude skill that runs the CLI; the CLI builds
  the guide on the spot (reads files, combines rules, takes the agent's
  description of the task) and can change while agents run. A **guide
  index** lists the guides with when to use each, like the skill list.
- **Rules**: fired at a point, alongside guides.
- **Sensors** (after the work): check the output. Kinds: formatters and
  linters; AST checks; agentic checks (a skill, or the CLI giving the
  agent a dynamic prompt for the situation).
- **Epics and tickets.** Two kinds of order: **dependencies** (hard:
  must come first) and **ordering** (a suggestion: should come first;
  can be broken). Tickets without dependencies can run in parallel.
  Tickets can belong to a roadmap.
- **Phases** per ticket, OpenSpec-like: draft/proposal → technical
  design → specs → tasks. The full set (1 proposal, 1 design, N specs,
  1 tasks) is possible, not required.
- **Longer range**: a long-range plan and designs, high-level and
  low-level, traceable to the specs (as in LID). Spec style flexible:
  EARS or Given/When/Then.
- **Guides fire** during design and tasks especially. The point, as with
  OpenSpec: nail things down with the agent before it runs off.
- **Generic spec-driven**: support OpenSpec- and LID-style flows. Per-ticket
  workflows by type (with overrides), as bridle is working out: probably
  not here.
- **Lighter than bridle**: no hooks to interrupt agents, no background
  agents; otherwise similar.
- **Prime at launch** (the one real chance at work): general guidelines.
  Starting a ticket runs a skill → CLI for that ticket's constraints.
- **Structured tasks in a ticket**: the agent asks for the next tasks,
  checks them off as it goes; the tool can refuse to list more until the
  last ones are reported done (or not).
- **Name**: wants a workflow/control/guiding word, not just a ticket word.
- **Folders** (decided 9:30 PM, vs. tickets-lite's `docs/tickets/`):
  `<name>/` at the repo root, then `task/` (or `tasks/`): "task" replaces
  "ticket" as the word. Slugs capped at 40 or 50 characters, not 60.
- **Multi-repo**: one repo holds the tasks (and most docs) for a group of
  related repos (meta-notes + UI, bridle + UI, RAFT + Glassbox, ...).
  Per-project folders (own roadmap or roadmap section by module, own
  architecture doc, mostly own guides), plus an overall architecture
  across repos.
- **Repo top level**: the tool's folder (probably), `scripts/`, and
  pre-commit config whose hooks mostly call `<name> check`, which runs
  the sensors (other linters and internal checks). A git pre-commit hook
  is a sensor that works without Claude hooks.
  At work, git hooks are allowed, but whatever they call has to run
  inside Claude's sandbox (9:37 PM). The sandbox allows localhost (so
  the daemon works), internal servers, and many public sites (some
  blocked). Public package registries are blocked; Artifactory mirrors
  pip, Maven, npm and the rest, and holds the Docker images (whether
  Artifactory works from inside the sandbox: unsure). Installing new
  tools happens outside the sandbox; uv helps since it runs from its
  cache. (9:39 PM)
- **Build choice it points to**: Python, installed with uv (`uv tool
  install` from the Artifactory mirror, outside the sandbox; runs inside
  from the cache). Mostly stdlib, few dependencies. (Aide's suggestion.)
- Open: how the agent knows to ask for a guide when it doesn't think to.

## CLI draft (aide, 2026-11-16 9:39 PM; not settled)

```
<name> prime                      startup: guidelines, rules, open tasks
<name> task new "<title>" -k <kind> [--parent <epic>] [-p <project>]
<name> task show <id>
<name> task list [--open|--closed] [--kind] [--parent] [-p <project>]
<name> task update <id> <field> <value>   title, kind, parent, blocked-by
<name> task note <id>             add a finding or decision to the body
<name> task close <id> / reopen <id>
<name> task start <id>            the per-task guide and constraints
<name> step next <id>             the next steps to do (strict)
<name> step done <id> <n>         check one off; no new steps until reported
<name> phase <id> [<phase>]       draft → proposal → design → specs → steps
<name> roadmap [show|check]       shared; one section per project or module
<name> guide                      the guide index: what's there and when
<name> guide <topic>              build one guide on the spot
<name> rules [<rule>]
<name> check                      sensors: format, lint, AST, links, IDs
<name> serve / status / stop      the localhost daemon
```

"Steps" = the checklist inside a task (since "task" now means the unit).
Bare verbs (`<name> new`) could alias `task new` later.

## Talk-through, 2026-11-16 9:49 PM (on the CLI draft; lightly cleaned)

> This is looking pretty good. A couple things:
>
> - Phase doesn't feel like a verb, so I'm not sure what it does. It
>   doesn't feel right to just say "phase" to move on. I want to call the
>   thing that tasks move through a **workflow**. Workflows don't have
>   phases; they have **steps**. So let's swap that around.
> - Everything else looks pretty good. The one thing missing is
>   **project**. I just said this is multiple projects, so I think we
>   have to have it. Bridle has `--project`. Every project should have a
>   short identifier. The task IDs are universal, so maybe it's not needed
>   there. Roadmap is universal. Guides would need a project, because we
>   override guides within each project, and rules as well. Prime: maybe
>   the same for every project, but ideally we'd specify the project
>   during prime.
>
> I have a little bash function at work I really like, `claude-as`. It
> runs Claude, but first it reserves a name for the agent (or I give it
> one). Every agent has a unique name for agent messaging. This is all
> before Claude starts, so outside the sandbox. Today it writes to a
> central registry of agent names in a hidden folder in my home
> directory: the name, the tmux pane the agent runs in, and the project.
> It then reads a starting prompt from that file and passes it to the
> agent. It works like prime: when you start the agent you're already
> priming it, without the agent running anything. I like that a lot, and
> I'd use it to start my agents (through this tool from now on: an API
> call). That prime needs to be fairly focused.
>
> This is a route to specialized agents for a project. In bridle we have
> a manager and workers. A **manager agent per repo** would be super
> helpful, and a good way to avoid the churn: the manager could coordinate
> with each agent as it finishes its worktree. Right now the only recourse
> is to message every other agent on the project: "Is anyone merging right
> now?" That's a **role**, not a name: Claude names have to be globally
> unique on my system, so they contain a project name, or I give them
> names of planets, moons, stars, or fiction and science fiction. The role
> should follow the theme (helmsman, if we go with keel).
>
> **Claiming**: agents claim tasks while working on them. But if the agent
> isn't busy, there's no reason another agent can't pick up the task;
> agents have short memories. A claim just says this agent is currently
> working on this and hasn't finished. My current design needs a fair
> amount of improvement here. One agent says, "Ceres has this, and I'm
> Titan, so I can't work on that task; let's wait for Ceres." That's
> completely arbitrary and pointless: I run 3, 4, 5, 6 agents at once,
> they're all busy, and I assign partly done tasks based on availability.
>
> And I want a **user interface**: a nice React UI where I see live what
> every agent's doing and the assigned tasks, all based on the task repo.
> A Kanban board with swim lanes for tasks and agents; a view by epic; my
> roadmap. All similar to bridle, but better.

(Heard "Series" = Ceres, "Bridal" = bridle.)

### From this talk-through

- **Workflow with steps** replaces "phase": a task moves through its
  workflow's steps (draft → proposal → design → specs → work).
- **Project** short IDs: needed for guides, rules and prime; not for task
  IDs or the roadmap (both universal).
- **Agent launcher** (like `claude-as`, through the tool's API): reserve a
  unique name, record tmux pane and project, pass a focused starting
  prompt (prime before the agent runs anything).
- **Roles**: a manager per repo coordinates merges; names stay unique
  (planets, moons), roles are themed.
- **Claims are soft**: "working on it now", not ownership; any free agent
  can pick up a task whose agent is busy or gone.
- **UI**: React; live agents and tasks; Kanban with swim lanes; epic view;
  roadmap.

## Talk-through, 2026-11-16 9:53 PM (heartbeat, tmux, status line)

> When an agent starts, we can assign it a name and maybe a session ID.
> I'm not sure you can pull that out of Claude from within the agent; if
> it's an environment variable, it comes through when the agent runs a
> command. I'd like to keep a **heartbeat**: these agents call the tool a
> bunch of times, and any time they do, we know the agent's alive and
> active. That's a really powerful thing we can do.
>
> Something the tool can do that the Claude sandbox absolutely cannot:
> the daemon can talk with **tmux**. It can know which agents run in
> which panes and look at what's going on there. Not an agent: a
> deterministic tool can look at the tmux window. At a minimum it should
> tell whether Claude Code is running, and it could paste something into
> the agent's prompt if needed. That's bordering on what we're allowed
> to do at work, so I'm not sure I want to paste anything. I'd start
> with a basic liveness check: is this terminal running Claude Code or
> not? It could start an agent if we needed it to, but a liveness check
> would be really helpful.
>
> With bridle I use a **status line script** to pull out the context and
> a few other things from the agent. Super helpful, and another way to
> tell the agent's running, since the status line keeps getting hit.
> File that as something to investigate at work: it gives both an
> aliveness check and context checks.

### From this talk-through

- **Agent identity**: the launcher sets the name (and anything else) as
  environment variables before starting Claude; every command the agent
  runs inherits them, so each tool call says who's calling (bridle does
  this with `BRIDLE_AS`).
- **Heartbeat**: every tool call updates the agent's last-seen time.
- **tmux liveness** (daemon, outside the sandbox): is Claude Code running
  in the agent's pane? Pasting into a pane or starting agents: later, if
  allowed at work.
- **Status line**: context size and liveness, if it works in the work
  sandbox (task below).

- [ ] At work: check whether a Claude Code status line script works in the sandbox (context size, session, and as a liveness signal for the agent workflow tool) #work #next

## Name clash check (web, 2026-11-16 10:16 PM)

2-3 targeted searches per name (dev tool / AI agent workflow / ticket
tracker). Agent tooling is crowded: no name came out fully clean.

- RED (an agent harness, tracker or popular CLI already uses it):
  - keel: `keel-workflow` (multi-agent issue-to-done pipeline), `keel-harness` (gated pipelines over Claude Code)
  - tiller: gulp/tiller (Claude Code workflow CLI)
  - spur: gobing-ai/spur (`spur agent run` wraps Claude Code), `spur-cli`
  - slate: Random Labs' Slate (coding agent)
  - tether: tether-ai (`tether` CLI supervising Claude Code)
  - stride: cheezy/stride (kanban for AI agents), stridekit
  - stencil: StencilJS (popular `stencil` CLI)
  - proctor: nclandrei/proctor (makes coding agents prove they tested)
- YELLOW (another space, or minor):
  - tally: tally.so forms; Tallyfy (workflow SaaS) nearby
  - chip: @netsirk/chip (small npm agent task tracker)
  - flume: Apache Flume (log ingestion, dormant)
  - plinth: FreedomBox's old admin UI; Cardano's Plinth language
  - spotter: ThoughtSpot Spotter (an AI analytics agent; SpotterCode runs in Claude Code)
- Safest: plinth, flume; then tally, chip.

