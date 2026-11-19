# Workflow

A task moves through five phases, and records who holds it. This spec covers the task fields assignee, agent and phase and the commands that change them. Ticket: fl-fu3v. The history of changes (fl-eg2q) is specified at the end.

Assumptions (recorded on fl-fu3v, widened by fl-6hkt): an agent is a command run with AGENT_NAME set, or run under Claude Code (CLAUDECODE set) without it; the human is a command run with neither; flume task assign with no name and no AGENT_NAME is a usage error (exit 2); a task created before phases existed counts as being in phase proposal.

## Requirements

### Requirement: A task has an assignee, an agent and a phase  {#r-47db}
A task's task.yaml SHALL hold the field phase (one of proposal, design, specs, plan, implement; proposal for a new task) and MAY hold assignee (an agent name or human) and agent (an agent name), and flume task show SHALL print all three.

#### Scenario: A new task starts at proposal  {#s-3b36}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created
- **THEN** its task.yaml has phase proposal and no assignee and no agent

### Requirement: Assign sets the assignee and the agent  {#r-fe5b}
When flume task assign ID NAME is run, flume SHALL set assignee to NAME, and agent to NAME as well unless NAME is human; when NAME is left out it SHALL use the value of AGENT_NAME, and when that is not set either it SHALL exit with code 2 with a message saying AGENT_NAME is not set and that the agent should be launched with flume agent (also when CLAUDECODE is set).

#### Scenario: Assign to an agent, then to the human  {#s-8367}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** it is assigned to scout, and then to human
- **THEN** after the first step assignee and agent are scout, and after the second assignee is human and agent is still scout

#### Scenario: Assign with no name uses AGENT_NAME  {#s-2bb8}
*Verification*: **executable**
- **GIVEN** an open task and AGENT_NAME set to scout
- **WHEN** flume task assign is run with the task ID and no name
- **THEN** assignee and agent are scout

#### Scenario: Assign with no name and no AGENT_NAME  {#s-6f57}
*Verification*: **executable**
- **GIVEN** an open task and AGENT_NAME not set
- **WHEN** flume task assign is run with the task ID and no name
- **THEN** the exit code is 2 and the task is unchanged

### Requirement: An agent needs force to take a held task  {#r-02d4}
When an agent (AGENT_NAME set, or CLAUDECODE set without it) assigns a task whose assignee is someone else, flume SHALL, without --force, change nothing, exit with code 1 and say who holds the task and that --force takes it over; with --force it SHALL assign it. Assigning a task to its current holder SHALL succeed and change nothing. The human (neither set) SHALL never need --force.

#### Scenario: Refused without force  {#s-55e0}
*Verification*: **executable**
- **GIVEN** a task assigned to scout and AGENT_NAME set to rook
- **WHEN** flume task assign is run with the task ID and no name
- **THEN** the exit code is 1, standard error names scout and --force, and the assignee is still scout

#### Scenario: Force takes it over  {#s-35b3}
*Verification*: **executable**
- **GIVEN** a task assigned to scout and AGENT_NAME set to rook
- **WHEN** flume task assign is run with the task ID and --force
- **THEN** the exit code is 0 and assignee and agent are rook

#### Scenario: The human re-assigns freely, the holder re-assigns to itself  {#s-56c8}
*Verification*: **executable**
- **GIVEN** a task assigned to scout
- **WHEN** the human assigns it to rook without AGENT_NAME, and rook then assigns it to rook
- **THEN** both exit with code 0 and the assignee is rook

### Requirement: An unnamed Claude Code agent is never the human  {#r-c7d0}
Flume SHALL decide who runs a command in this order: the value of AGENT_NAME when set; else, when CLAUDECODE is set, the unnamed agent agent-<first 8 characters of CLAUDE_CODE_SESSION_ID> (agent-unknown when that is not set); else human. Flume SHALL use that actor, and never human for an agent, for the author of task comments, the actor of assign and claim (so an unnamed agent needs --force like a named one), the by of task history, and the X-Flume-Agent header sent to the daemon.

#### Scenario: Unnamed agent  {#s-c7d1}
*Verification*: **executable**
- **GIVEN** a task assigned to scout, CLAUDECODE set, CLAUDE_CODE_SESSION_ID set to abcdef0123456789 and AGENT_NAME not set
- **WHEN** flume task claim is run, then flume task assign to rook with and without --force, then a comment is added and a phase changed
- **THEN** claim exits 2 mentioning AGENT_NAME, assign without --force exits 1 naming --force, with --force exits 0, the comment is headed agent-abcdef01, and history shows by agent-abcdef01 for the comment and agent-unknown for a phase change made without a session id

### Requirement: Claim is assign to yourself  {#r-5dfb}
When flume task claim ID [--force] is run, flume SHALL behave exactly as flume task assign ID [--force] with no name: the same checks, messages and exit codes.

#### Scenario: Claim behaves like assign  {#s-418e}
*Verification*: **executable**
- **GIVEN** a task assigned to scout and AGENT_NAME set to rook
- **WHEN** flume task claim is run, and then flume task claim --force
- **THEN** the first exits 1 with a message naming scout and --force, the second exits 0, and the assignee is rook

### Requirement: A task is read and written by part name  {#r-3ae7}
A task SHALL have the parts body, design, spec, plan and comments, named so and never by file path; flume task show ID SHALL print the task's fields, a line "parts: " followed by the names of the parts it has and a last line pointing to flume task instructions ID, flume task show ID PART SHALL print that part's text, and for a part the task does not have it SHALL exit with code 1 saying so and naming the command flume task template PART.

#### Scenario: Show lists the parts  {#s-773d}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** flume task show is run with its ID
- **THEN** the output holds the task fields, the line parts: body, the line For what to do now: flume task instructions, and no path in the tasks repository

#### Scenario: A missing part  {#s-9260}
*Verification*: **executable**
- **GIVEN** a new task with no design
- **WHEN** flume task show is run with its ID and design
- **THEN** the exit code is 1 and standard error says the task has no design and names flume task template design

### Requirement: Write replaces or removes a part  {#r-4ab5}
When flume task write ID PART is run, flume SHALL replace the text of the part (body, design, spec or plan) with the file named by --file, or standard input when --file is a dash or left out, and commit the change; with --remove it SHALL remove the part instead; it SHALL exit with code 1, changing nothing, for an empty text, for a part that is not one of the four, for removing a part the task does not have, and for removing the body.

#### Scenario: Write, read and remove a design  {#s-4bba}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** a design is written from standard input, read back with flume task show ID design, and then removed with --remove
- **THEN** the text read back is the text written, the parts line then lists design, and after the removal it no longer does

#### Scenario: Write from a file and refuse bad requests  {#s-9b0f}
*Verification*: **executable**
- **GIVEN** a new task and a file holding a spec
- **WHEN** flume task write is run with --file for spec, and then for the part comments, then with --remove for the body, then with --remove for the plan
- **THEN** the first exits 0 and show prints the file's text, and the other three exit with code 1

### Requirement: Every written part has a template  {#r-e3d9}
When flume task template PART is run, flume SHALL print the template of the part (body, design, spec or plan): the file projects/PROJECT/templates/PART.md of the flume root when --project PROJECT is given and the file exists, else base/templates/PART.md of the flume root when it exists, else flume's built-in template; the most specific one SHALL be printed whole, never joined with another.

#### Scenario: Built-in templates  {#s-3a2d}
*Verification*: **executable**
- **GIVEN** no template files
- **WHEN** flume task template is run for each of body, design, spec and plan
- **THEN** each prints a non-empty Markdown text, the spec template holds a Scenario heading with GIVEN, WHEN and THEN lines, and the plan template holds a group heading and an open item

#### Scenario: Overrides replace  {#s-dd9e}
*Verification*: **executable**
- **GIVEN** a base template for design with the text BASE and a project template for design in project web with the text WEB
- **WHEN** flume task template design is run with no project, and with --project web, and flume task template spec with --project web
- **THEN** they print BASE, WEB and the built-in spec template, each exactly and without any other text

### Requirement: The plan is a checklist in a fixed form  {#r-8402}
When flume task write ID plan is run, flume SHALL accept only a plan made of numbered groups ("## 1. Name", numbered from 1 in order), each optionally naming guides with lines "Guide: name" right under its heading (see the instructions spec) and with at least one item ("- [ ] 1.1 text", numbered group.item in order, with [ ] open, [x] done or [-] skipped), where a skipped item MAY be followed by a line "  Skipped: reason"; blank lines and one-line comments in the form <!-- text --> are allowed; for any other plan flume SHALL exit with code 1, say what is wrong and change nothing.

#### Scenario: A good plan is accepted  {#s-847c}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** a plan with two groups, the first holding a done item and a skipped item with a Skipped line, is written
- **THEN** the exit code is 0 and flume task show ID plan prints the same plan

#### Scenario: Bad plans are refused  {#s-bcce}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** plans are written that have no group, an item before any group, an item numbered 1.2 first, a group with no items, a group numbered 2 first, or a stray line of prose
- **THEN** each exits with code 1 with a message naming the problem and the task has no plan

### Requirement: Next feeds one group at a time  {#r-983b}
When flume task next ID is run, flume SHALL print the first group of the plan that has an open item (its heading, a blank line and its items, each with its mark and, for a skipped item with a reason, the Skipped line), or, when every item is done or skipped, a line saying the plan is complete; for a task with no plan it SHALL exit with code 1 with a message.

#### Scenario: Groups come in turn  {#s-276f}
*Verification*: **executable**
- **GIVEN** a task whose plan has group 1 with items 1.1 and 1.2 and group 2 with item 2.1
- **WHEN** flume task next is run, then 1.1 is marked done and next is run, then 1.2 is marked done and next is run, then 2.1 is marked done and next is run
- **THEN** the first two print group 1, the third prints group 2, and the last says the plan is complete

#### Scenario: No plan  {#s-4a75}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** flume task next is run
- **THEN** the exit code is 1 and standard error says the task has no plan

### Requirement: Done and skip mark items of the current group  {#r-776d}
When flume task done ID ITEM... is run, flume SHALL mark those items done in the plan; when flume task skip ID ITEM... --reason TEXT is run, flume SHALL mark them skipped and store the reason on the line "  Skipped: TEXT" under each; --reason is required (exit 2 without it); for an item that is outside the current group or not in the plan, or when the plan is complete, flume SHALL exit with code 1 and change nothing, not even the other items named.

#### Scenario: Done and skip  {#s-c986}
*Verification*: **executable**
- **GIVEN** a task whose plan has group 1 with items 1.1, 1.2 and 1.3
- **WHEN** 1.1 is marked done, and then 1.2 is skipped with the reason not needed
- **THEN** the plan holds - [x] 1.1, - [-] 1.2 followed by the line "  Skipped: not needed", and - [ ] 1.3

#### Scenario: Refused marks change nothing  {#s-7d6a}
*Verification*: **executable**
- **GIVEN** a task whose plan has group 1 with item 1.1 and group 2 with item 2.1
- **WHEN** done is run for 1.1 and 2.1 together, for 9.9, and skip is run for 1.1 with no reason
- **THEN** the first two exit with code 1, the third with code 2, and the plan is unchanged

### Requirement: Phase sets the phase  {#r-f0e3}
When flume task phase ID PHASE is run, flume SHALL set the task's phase to PHASE (one of proposal, design, specs, plan, implement), whatever the phase was (forwards, backwards or skipping), and commit the change (an agent moving forward is subject to the instructions spec); for any other value it SHALL exit with code 1 and change nothing.

#### Scenario: Any phase may follow any other  {#s-0872}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** its phase is set to implement, then to design, and then to nonsense
- **THEN** the first two exit 0 and show phase implement and then design, and the last exits with code 1 and the phase stays design

### Requirement: Workflow prints the phases  {#r-71cc}
When flume workflow is run, flume SHALL print the phases in order, one line each, naming the phase, the part it writes (proposal writes body, design writes design, specs writes spec, plan writes plan, implement writes none) and the phase it requires (the one before; proposal requires nothing); with --json it SHALL print one JSON list of objects with the keys phase, part (null for implement) and requires (null for proposal), and nothing else.

#### Scenario: The workflow as text and JSON  {#s-737f}
*Verification*: **executable**
- **GIVEN** a daemon running for a project
- **WHEN** flume workflow is run, and flume workflow --json is run
- **THEN** the first prints five lines starting with 1. proposal and ending with 5. implement, and the second is a JSON list whose phases are proposal, design, specs, plan, implement in that order, where design requires proposal and implement has part null

### Requirement: Task list shows phase and assignee and filters on them  {#r-f6de}
When flume task list is run, each line SHALL hold the ID, kind, state, phase, assignee (empty when none) and title separated by single tabs; --assignee NAME (or human) and --phase PHASE SHALL keep only tasks with that assignee or phase, a phase that is not one of the five being an error with exit code 1; and the JSON form of the list SHALL give each task the keys phase, assignee and agent.

#### Scenario: Filter by assignee and phase  {#s-fd1f}
*Verification*: **executable**
- **GIVEN** three tasks, the first assigned to scout, the second assigned to human and in phase design, the third unassigned
- **WHEN** flume task list is run with --assignee scout, with --assignee human, with --phase design, and with --phase proposal, and with --phase nonsense
- **THEN** they list the first task, the second, the second, the first and third, and the last exits with code 1; each line has the phase and assignee columns, and the JSON list has the keys phase, assignee and agent

### Requirement: The prime text teaches the workflow  {#r-745b}
flume prime SHALL begin its flume_base section with text that names the agent (You are agent NAME, stored in $AGENT_NAME), tells the agent to use only flume commands for tasks, says the human is in control of the phases, and names the commands for each phase: flume task claim (saying that it prints the instructions for the current phase), flume task instructions (saying to run it, not flume task show, to see them again), flume task show, flume task guide (with --phase, for pushing a guide to a later phase), the Guide: lines of a plan group, flume task template, flume task write, flume task phase, flume task next, flume task done, flume task skip with --reason, flume task assign ID human, flume task comment and flume task close; and it SHALL NOT name any path in the tasks repository.

#### Scenario: Prime names the workflow commands  {#s-7bb1}
*Verification*: **executable**
- **GIVEN** any project with no daemon running
- **WHEN** flume prime is run for the agent scout
- **THEN** the flume_base section holds You are agent scout and each of the commands above (and Guide:), and holds none of the file names body.md, design.md, spec.md, plan.md, task.yaml

### Requirement: Every change to a task is appended to its history  {#r-1a7e}
When a command changes a task (create, update of a field, assign or claim, phase, comment, plan done or skip, close, reopen, write or remove of a part), flume SHALL append one line to the file history.jsonl in the task's folder and never rewrite an earlier line; each line is a JSON object with time (UTC, ISO 8601 ending in Z), by (the actor of the command per the actor requirement: the name in AGENT_NAME, else agent-<first 8 characters of CLAUDE_CODE_SESSION_ID> (agent-unknown without it) when CLAUDECODE is set, else human) and action, plus field, from and to for a field change (update, assign with field assignee, phase with field phase), part (the name only, not the text) for write and remove, items (and reason for a skip) for plan_done and plan_skip, title and kind for create, and resolution (done or dropped) for close; a command that changes nothing or is refused SHALL append nothing; and the file SHALL move with the folder on close and reopen.

#### Scenario: Changes are recorded with who and what  {#s-2b8c}
*Verification*: **executable**
- **GIVEN** a running daemon and a new task made by the agent scout
- **WHEN** scout updates the title, assigns the task to scout, fetches the task's instructions, sets the phase to design, writes the plan, marks item 1.1 done, adds a comment, closes the task and reopens it, and a request with no agent name sets the phase to plan
- **THEN** history.jsonl in the task folder has one line per change in that order with the actions create, update, assign, instructions, phase, write, plan_done, comment, close, reopen and phase, every line has a time ending in Z, the first ten have by scout and the last has by human, the update line has field title with its from and to, the write line has part plan and no text, and the file is in the tasks folder

#### Scenario: A refused or empty change adds no line  {#s-3c9d}
*Verification*: **executable**
- **GIVEN** a task in phase proposal with one history line
- **WHEN** the phase is set to proposal again and an update with an unknown kind is refused
- **THEN** history.jsonl still has one line

### Requirement: Task history prints the history  {#r-4d0a}
When flume task history ID is run, flume SHALL print the task's history oldest first, one line per entry holding the time, by and action and then the other keys as key=value, tab separated, and with --json SHALL print one JSON list of the entries as stored and nothing else; a task with no history prints nothing (an empty list for --json); an ID that names no task prints a message to standard error and exits with code 1. The daemon answers GET /api/tasks/{id}/history with the same list, and 404 for an unknown ID.

#### Scenario: History as text and JSON  {#s-5e1f}
*Verification*: **executable**
- **GIVEN** a task created by the agent scout, who then fetches its instructions and puts it in phase design
- **WHEN** flume task history is run for it, then with --json, then for an unknown ID, and GET /api/tasks/{id}/history is requested
- **THEN** the first prints three lines whose second and third columns are scout and create, scout and instructions, then scout and phase; the second is a JSON list of three objects with the same actions; the third exits with code 1; and the request answers 200 with the same list
