# Workflow

A task records who holds it and is made of parts, one of which may be a plan that flume feeds to an agent one group at a time. This spec covers the task fields assignee and agent and the commands that change them, the parts and their templates, the plan and the guides its groups name, and the history of changes. flume does not know the steps of a workflow: that is text given to agents. Tickets: fl-fu3v, fl-eg2q, fl-4tx8, fl-94yx.

Assumptions (recorded on fl-fu3v, widened by fl-6hkt): an agent is a command run with AGENT_NAME set, or run under Claude Code (CLAUDECODE set) without it; the human is a command run with neither; flume task assign with no name and no AGENT_NAME is a usage error (exit 2). (Recorded on fl-94yx): a part name is a plain name; templates are asked for by part name alone; a task made by an earlier version keeps the fields flume no longer uses.

## Requirements

### Requirement: A task has an assignee and an agent  {#r-47db}
A task's task.yaml MAY hold assignee (an agent name or human) and agent (an agent name), a new task holding neither, and flume task show SHALL print those it holds.

#### Scenario: A new task has no holder  {#s-c12c}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created
- **THEN** its task.yaml has no assignee, no agent and no phase

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

#### Scenario: An unnamed agent acts under its own name  {#s-b38b}
*Verification*: **executable**
- **GIVEN** a task assigned to scout, CLAUDECODE set, CLAUDE_CODE_SESSION_ID set to abcdef0123456789 and AGENT_NAME not set
- **WHEN** flume task claim is run, then flume task assign to rook with and without --force, then a comment is added and, with no session id, a plan is written
- **THEN** claim exits 2 mentioning AGENT_NAME, assign without --force exits 1 naming --force, with --force exits 0, the comment is headed agent-abcdef01, and history shows by agent-abcdef01 for the comment and agent-unknown for the write made without a session id

### Requirement: Claim is assign to yourself  {#r-5dfb}
When flume task claim ID [--force] is run, flume SHALL behave exactly as flume task assign ID [--force] with no name: the same checks, messages and exit codes; neither command SHALL print anything on success without --json.

#### Scenario: Claim behaves like assign  {#s-418e}
*Verification*: **executable**
- **GIVEN** a task assigned to scout and AGENT_NAME set to rook
- **WHEN** flume task claim is run, and then flume task claim --force
- **THEN** the first exits 1 with a message naming scout and --force, the second exits 0, and the assignee is rook

#### Scenario: Claim only claims  {#s-f13a}
*Verification*: **executable**
- **GIVEN** a running daemon and a new task, and an agent scout (AGENT_NAME set)
- **WHEN** scout runs flume task claim
- **THEN** the exit code is 0, nothing is printed and the history gains one assign line only

### Requirement: flume ignores task fields it does not use  {#r-6f4f}
When a task.yaml holds a field flume does not use (such as phase or guides, written by earlier versions), flume SHALL keep it when it changes the task and otherwise ignore it.

#### Scenario: An old phase and guides are ignored  {#s-2087}
*Verification*: **executable**
- **GIVEN** a task whose task.yaml also holds phase implement and a guides field
- **WHEN** flume task list is run, flume task show with --json, and the title is updated
- **THEN** the list line and the JSON object hold no phase or guides, and task.yaml still holds both fields after the update

### Requirement: A task is read and written by part name  {#r-3ae7}
A task SHALL be made of named parts, each addressed by its name and never by file path: body, which every task has, comments, and any other part with a plain name (letters, digits, dots, hyphens and underscores, starting with a letter or digit); flume task show ID SHALL print the task's fields and then a line "parts: " followed by the names of the parts it has (body first, comments last, the others in name order), flume task show ID PART SHALL print that part's text, for a part the task does not have it SHALL exit with code 1 saying so and naming the command flume task template PART, and for a name that is not plain it SHALL exit with code 1 with a message.

#### Scenario: Show lists the parts  {#s-47ca}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** flume task show is run with its ID
- **THEN** the output holds the task fields and ends with the line parts: body, and holds no path in the tasks repository

#### Scenario: A missing part  {#s-9260}
*Verification*: **executable**
- **GIVEN** a new task with no design
- **WHEN** flume task show is run with its ID and design
- **THEN** the exit code is 1 and standard error says the task has no design and names flume task template design

### Requirement: Write replaces or removes a part  {#r-4ab5}
When flume task write ID PART is run, flume SHALL replace the text of the part, or create it, with the file named by --file, or standard input when --file is a dash or left out, and commit the change; with --remove it SHALL remove the part instead; it SHALL exit with code 1, changing nothing, for an empty text, for a name that is not plain, for a name differing only in letter case from a part the task has, for the part comments, for removing a part the task does not have, and for removing the body.

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

#### Scenario: A part by any plain name  {#s-6438}
*Verification*: **executable**
- **GIVEN** a new task
- **WHEN** a part named release-notes is written and read back, then parts named ../escape and Release-Notes are written
- **THEN** show prints the text written and its parts line lists body, release-notes, and the last two writes exit with code 1 and change nothing

### Requirement: Templates are looked up by part name  {#r-e3d9}
When flume task template PART is run, flume SHALL print the template of the part: the document templates/PART.md merged by heading (the layers spec) from the built-in document (for body, design, spec and plan), workspace/templates/PART.md of the flume root and, when --project PROJECT is given, projects/PROJECT/templates/PART.md; when none of these exists it SHALL print nothing and exit with code 0, and for a name that is not plain it SHALL exit with code 1.

#### Scenario: Built-in templates  {#s-3a2d}
*Verification*: **executable**
- **GIVEN** no template files
- **WHEN** flume task template is run for each of body, design, spec and plan
- **THEN** each prints a non-empty Markdown text, the spec template holds a Scenario heading with GIVEN, WHEN and THEN lines, the plan template holds a group heading and an open item, and the plan template as printed is accepted by flume task write ID plan

#### Scenario: Template layers merge  {#s-dd9e}
*Verification*: **executable**
- **GIVEN** a workspace template for design replacing the text of its Context section with BASE, and a project template for design in project web replacing the whole document with WEB
- **WHEN** flume task template design is run with no project, and with --project web, and flume task template spec with --project web
- **THEN** the first prints the built-in design template with BASE under Context, the second the heading Design and WEB alone, and the third the built-in spec template

#### Scenario: A part with no template, or one of its own  {#s-2677}
*Verification*: **executable**
- **GIVEN** a workspace template for the part risks holding RISKS and no template for the part notes
- **WHEN** flume task template is run for notes, for risks, and for ../escape
- **THEN** the first prints nothing and exits 0, the second prints RISKS, and the third exits with code 1

### Requirement: The plan is a checklist in a fixed form  {#r-8402}
When flume task write ID plan is run, flume SHALL accept only a plan made of an optional title line ("# Title") followed by numbered groups ("## 1. Name", numbered from 1 in order), each optionally naming guides with lines "Guide: name" right under its heading (see the requirement on guides in a plan group) and with at least one item ("- [ ] 1.1 text", numbered group.item in order, with [ ] open, [x] done or [-] skipped), where a skipped item MAY be followed by a line "  Skipped: reason"; blank lines and one-line comments in the form <!-- text --> are allowed; for any other plan flume SHALL exit with code 1, say what is wrong and change nothing.

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

### Requirement: A plan group names guides  {#r-4b01}
A plan group MAY list guides with lines "Guide: NAME" under its heading, before its items (blank lines allowed between them); flume task write ID plan SHALL refuse with exit code 1, changing nothing, a plan with a Guide line after the group's first item, with a name that is not a plain name, or naming a guide that does not exist for the task's project (the project's guide, else the workspace guide), the message naming the group and the guide. The Guide lines SHALL be kept when the plan is printed and when items are marked done or skipped.

#### Scenario: Guide lines are checked and kept  {#s-4b02}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has the workspace guides testing and api-conventions, and a new task
- **WHEN** a plan whose group 1 has the lines Guide: api-conventions and Guide: testing before its items is written, then item 1.1 is marked done, and then plans are written whose group names the guide nope, or has a Guide line after an item
- **THEN** the first write exits with code 0, flume task show ID plan prints the Guide lines under the group 1 heading both before and after 1.1 is marked done, and the later writes exit with code 1 (the first naming nope) and leave the plan as it was

### Requirement: Next adds the guides of the group  {#r-4c05}
When flume task next ID prints a plan group that is not complete, flume SHALL print after it each guide the group names with Guide lines, once, each in its own guide element (attribute name only) with the guide's full text, tags on their own lines, or in a guide_missing element naming it when it no longer exists or its front matter is broken (not an error); with none it SHALL print the group exactly as before. Text of a guide that would end or forge one of these elements SHALL be neutralized as in the prime text. When a guide of the group has a merge error flume SHALL print the errors (file, line and heading) to standard error and exit with code 1, and the daemon answers 422. With --json the object SHALL also hold guides, a list with one object per guide holding name and body, or name and missing (the reason) for a guide that has gone; GET /api/tasks/{id}/plan/next SHALL answer the same.

#### Scenario: The group's guides follow it  {#s-0b7c}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has the workspace guides api-conventions (with a stage key build, which is ignored) and testing, and a task whose plan has group 1 naming both and group 2 naming nothing
- **WHEN** flume task next is run, then with --json, then the file of testing is removed and next is run again, then all of group 1 is marked done and next is run
- **THEN** the first prints group 1 followed by guide elements api-conventions and testing, neither with a stage attribute; the JSON guides list has both with their bodies; the third prints a guide_missing element naming testing and exits 0; and the last prints group 2 with no guide element

### Requirement: Task list shows assignee and filters on it  {#r-f6de}
When flume task list is run, each line SHALL hold the ID, kind, state, assignee (empty when none) and title separated by single tabs; --assignee NAME (or human) SHALL keep only tasks with that assignee; and the JSON form of the list SHALL give each task the keys assignee and agent.

#### Scenario: Filter by assignee  {#s-4a30}
*Verification*: **executable**
- **GIVEN** three tasks, the first assigned to scout, the second assigned to human, the third unassigned
- **WHEN** flume task list is run with --assignee scout and with --assignee human, then with --phase design
- **THEN** they list the first task and then the second, each line has five columns, the JSON list has the keys assignee and agent and no key phase, and the last exits with code 2

### Requirement: The prime text teaches the workflow  {#r-745b}
The built-in workflow document SHALL tell the agent to use only flume commands for tasks, say that the human is in control and that flume does not enforce the workflow, describe in order the phases proposal, design, specs, plan and implement, and name the commands flume task claim, flume task show, flume task template, flume task write, flume task next, flume task done, flume task skip, flume task close, flume task assign ID human, flume task comment and flume guide; and it SHALL NOT name any path in the tasks repository.

#### Scenario: Prime names the workflow commands and phases  {#s-0865}
*Verification*: **executable**
- **GIVEN** any project with no daemon running
- **WHEN** flume prime is run for the agent scout
- **THEN** the prime text holds the line You are agent scout, stored in $AGENT_NAME., the workflow element holds each of the commands above and a heading for each of the five phases, and it holds none of flume task instructions, flume task phase, flume task guide and the file names body.md, design.md, spec.md, plan.md, task.yaml

### Requirement: Every change to a task is appended to its history  {#r-1a7e}
When a command changes a task (create, update of a field, assign or claim, comment, plan done or skip, close, reopen, write or remove of a part), flume SHALL append one line to the file history.jsonl in the task's folder and never rewrite an earlier line; each line is a JSON object with time (UTC, ISO 8601 ending in Z), by (the actor of the command per the actor requirement: the name in AGENT_NAME, else agent-<first 8 characters of CLAUDE_CODE_SESSION_ID> (agent-unknown without it) when CLAUDECODE is set, else human) and action, plus field, from and to for a field change (update, and assign with field assignee), part (the name only, not the text) for write and remove, items (and reason for a skip) for plan_done and plan_skip, title and kind for create, and resolution (done or dropped) for close; a command that changes nothing or is refused SHALL append nothing; and the file SHALL move with the folder on close and reopen.

#### Scenario: Each change is recorded with who and what  {#s-054e}
*Verification*: **executable**
- **GIVEN** a running daemon and a new task made by the agent scout
- **WHEN** scout updates the title, assigns the task to scout, writes the plan, marks item 1.1 done, adds a comment, closes the task and reopens it, and a request with no agent name removes the plan
- **THEN** history.jsonl in the task folder has one line per change in that order with the actions create, update, assign, write, plan_done, comment, close, reopen and remove, every line has a time ending in Z, the first eight have by scout and the last has by human, the update line has field title with its from and to, the write line has part plan and no text, and the file is in the tasks folder

#### Scenario: A refused or empty change records nothing  {#s-4979}
*Verification*: **executable**
- **GIVEN** a task assigned to scout with two history lines
- **WHEN** it is assigned to scout again and an update with an unknown kind is refused
- **THEN** history.jsonl still has two lines

### Requirement: Task history prints the history  {#r-4d0a}
When flume task history ID is run, flume SHALL print the task's history oldest first, one line per entry holding the time, by and action and then the other keys as key=value, tab separated, and with --json SHALL print one JSON list of the entries as stored and nothing else; a task with no history prints nothing (an empty list for --json); an ID that names no task prints a message to standard error and exits with code 1. The daemon answers GET /api/tasks/{id}/history with the same list, and 404 for an unknown ID.

#### Scenario: The history as text and as JSON  {#s-0014}
*Verification*: **executable**
- **GIVEN** a task created by the agent scout, who then claims it and writes its design
- **WHEN** flume task history is run for it, then with --json, then for an unknown ID, and GET /api/tasks/{id}/history is requested
- **THEN** the first prints three lines whose second and third columns are scout and create, scout and assign, then scout and write; the second is a JSON list of three objects with the same actions; the third exits with code 1; and the request answers 200 with the same list
