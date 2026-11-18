# Roadmap

The roadmap is one hand-edited Markdown file, roadmap.md in the flume root, that orders the project's work. Flume reads it and checks it; it never writes it. Ticket: fl-s52x.

Assumptions (recorded on fl-s52x): the brief leaves the file format open, so take the simplest reading. Each heading starts a section (Now, Next, Later and Done are the usual ones, but any heading works). A list item (bulleted or numbered) that holds a wiki link is an entry; the link names a task file by its file name without .md, as in [[slug-id]] or [[slug-id|label]]. The order of sections and items is the plan, and flume does not reorder. Any text on the item after the link is its note. A section headed Done (any letter case) holds finished work; every other section is upcoming. Only epics go on the roadmap in the brief, but this version does not require it (YAGNI). Editing the roadmap through the CLI is not covered.

## Requirements

### Requirement: The roadmap file  {#r-eb35}
When the file roadmap.md in the flume root exists under the project root, flume SHALL read it as sections started by Markdown headings, each holding entries given by list items with a wiki link naming a task file, in the order written.

#### Scenario: Entries in order  {#s-d6a3}
*Verification*: **executable**
- **GIVEN** a roadmap with a Now section listing tasks A then B and a Later section listing task C
- **WHEN** GET /api/roadmap is requested
- **THEN** the sections are Now then Later, and the entries are A, B in Now and C in Later

### Requirement: Roadmap show prints the roadmap with task states  {#r-9a1e}
When flume roadmap show is run, it SHALL print each section heading followed by one line per entry holding the task's ID, its state, its title and its note, separated by tabs, with state missing and the link in place of the title for a link that names no task, and exit 0; with --json it SHALL print the daemon's JSON; when no daemon answers it SHALL print to standard error the same two not-running lines as the cli spec (r-67a9) and exit 1; when the roadmap file does not exist it SHALL print an error and exit 1.

#### Scenario: Show  {#s-7e41}
*Verification*: **executable**
- **GIVEN** a running daemon and a roadmap listing an open task Fix redirect and a resolved task Setup
- **WHEN** flume roadmap show is run
- **THEN** the output has the section heading, a line with the first task's ID, open and Fix redirect, and a line with the second task's ID, resolved and Setup, and the exit code is 0

#### Scenario: Show as JSON  {#s-0f93}
*Verification*: **executable**
- **GIVEN** a running daemon and a roadmap listing one open task
- **WHEN** flume roadmap show --json is run
- **THEN** the output is JSON with sections whose entry has state open

#### Scenario: Show without a daemon  {#s-c4b8}
*Verification*: **executable**
- **GIVEN** no daemon running and a roadmap file
- **WHEN** flume roadmap show is run
- **THEN** standard error is the two not-running lines ("flume: the flume daemon is not running for this workspace." and "Ask the human to start it: flume serve (in its own pane).") and the exit code is 1

#### Scenario: Show without a roadmap  {#s-a870}
*Verification*: **executable**
- **GIVEN** a running daemon and no roadmap file
- **WHEN** flume roadmap show is run
- **THEN** an error is printed and the exit code is 1

### Requirement: Roadmap check validates the roadmap  {#r-62d7}
When flume roadmap check is run, it SHALL print one line per problem, holding the file path, the line number and a message, and exit 0 when there are none and 1 otherwise; with --json it SHALL print one JSON array with one object per problem, holding path and message, instead of lines, with the same exit codes; it SHALL report a wiki link that names no task file, and a resolved task listed in a section other than Done with no note on its item; it SHALL work without a running daemon; when the roadmap file does not exist it SHALL print an error and exit 1.

#### Scenario: Clean roadmap  {#s-3d2c}
*Verification*: **executable**
- **GIVEN** a roadmap listing an open task, and a resolved task under Done
- **WHEN** flume roadmap check is run with no daemon
- **THEN** nothing is printed and the exit code is 0

#### Scenario: Link to no task  {#s-e19a}
*Verification*: **executable**
- **GIVEN** a roadmap with an entry linking to no-such-task-zzzz
- **WHEN** flume roadmap check is run
- **THEN** one problem line names roadmap.md in the flume root, the line number and no-such-task-zzzz, and the exit code is 1

#### Scenario: Resolved task listed as upcoming  {#s-4b70}
*Verification*: **executable**
- **GIVEN** a roadmap listing a resolved task under Now with no note
- **WHEN** flume roadmap check is run
- **THEN** one problem line names that entry and says the task is resolved, and the exit code is 1

#### Scenario: Resolved task with a note  {#s-8d56}
*Verification*: **executable**
- **GIVEN** a roadmap listing a resolved task under Now with the note "reopen planned"
- **WHEN** flume roadmap check is run
- **THEN** nothing is printed and the exit code is 0

#### Scenario: Check as JSON  {#s-6c1e}
*Verification*: **executable**
- **GIVEN** a roadmap with an entry linking to no-such-task-zzzz
- **WHEN** flume roadmap check --json is run
- **THEN** standard output is a JSON array of one object whose path is roadmap.md in the flume root, and the exit code is 1

#### Scenario: Check without a roadmap  {#s-f2e5}
*Verification*: **executable**
- **GIVEN** a project with no roadmap file
- **WHEN** flume roadmap check is run
- **THEN** an error is printed and the exit code is 1

### Requirement: Flume check includes the roadmap  {#r-1c8f}
When flume check is run and roadmap.md in the flume root exists, it SHALL also print the problems of the roadmap check, and a project with no roadmap file SHALL have no roadmap problems.

#### Scenario: Check reports a roadmap problem  {#s-6a39}
*Verification*: **executable**
- **GIVEN** a roadmap with an entry linking to no task, and otherwise valid task files
- **WHEN** flume check is run
- **THEN** a problem line names roadmap.md in the flume root and the exit code is 1

#### Scenario: Check without a roadmap file  {#s-b0c7}
*Verification*: **executable**
- **GIVEN** valid task files and no roadmap file
- **WHEN** flume check is run
- **THEN** nothing is printed and the exit code is 0
