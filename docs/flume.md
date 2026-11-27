# What flume is

This describes what flume is meant to be, not all of what is built today. What flume does now
is in its specs (design/specs/) and its CLI help.

Flume is a tool for orchestrating work between multiple coding agents by
organizing work into discrete tasks that follow a prescribed workflow. Flume
prioritizes transparency and human oversight by storing the workflow
configuration, agent instructions, and tasks as plain text files that can be
inspected and updated at any time. History is tracked in git. Agents interact
with the task system through a CLI to create, find, and claim tasks. The CLI
implements the task workflow and system rules are enforced through the CLI
instead of depending on agents to follow written instructions. Individual
projects (git repos) can be managed in a workspace.

The expected use case is for a single person working on a single workspace on a
single computer (one file system). Flume is not designed for multiple people
collaborating or to sync work between multiple checkouts of the workspace on
different computers. Flume has flexible capabilities so that it can work within
the constraints of a Claude Code sandbox, such as one an enterprise might put in
place.

Flume is made of:

- **Projects and workspaces**: a project is a single git repository; a workspace is a collection
  of related projects. Flume keeps its files (tasks, workflows, configuration) in a repository the
  user chooses, which can be the project's own repository when there is no workspace.
- **Tasks**: a task is made of one or more artifacts stored together. Documents are stored as
  Markdown, and structured data as YAML (in files or front matter). Kinds, epics and a roadmap
  organize them.
- **Agents**: Claude Code sessions started with flume agent, given the workflow, their identity
  and a role when they start (flume prime). Agents work with flume through its CLI, and flume
  tracks them: which agents exist, what each is working on and its state.
- **Workflows**: text for agents, and enforcement by the CLI of the workflow's steps, which can
  include required gates and reviews. Each step has instructions and names its required
  artifacts, each with a template. Flume ships some; a workspace or project can change or replace
  them.
- **Guides**: specific instructions for an agent doing a specific kind of work, such as adding a
  CLI command, building a UI component or doing a security review.
- **The daemon**, started by the human, which writes the task files and commits changes to git; the
  **CLI** agents and the human use; and a **web UI** to see the tasks.
