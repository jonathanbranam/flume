# Instructions and pushed guides

Per-phase instructions for a task, guides pushed to a phase or a plan group, and the rule that an agent reads the instructions before it advances a task. Ticket: fl-4tx8. Builds on guides (agent spec), the workflow and history (workflow spec).

Assumptions (recorded on fl-4tx8): the human is not exempt from the rule that a guide is pushed only to the current or a later phase (it keeps the data honest); guides are pushed per phase or per plan group, not per plan item.

## Requirements

### Requirement: A guide is pushed to a phase of a task  {#r-4a01}
When the user runs "flume task guide ID NAME --phase PHASE", flume SHALL record in the task's task.yaml that guide NAME applies to PHASE, in a field guides nested by phase (each phase name lowercase as a key holding a list of guide names, keys in workflow order, a phase with no guides left out), and exit with code 0; with --remove it SHALL drop that guide from PHASE instead, removing the field when no guide is left. Pushing a guide already pushed to PHASE SHALL change nothing. flume SHALL refuse with exit code 1, changing nothing, a guide that does not exist for the task's project (the project's guide, else the base guide), a removal of a guide not pushed to PHASE, and a PHASE earlier in the workflow than the task's current phase (adding or removing), the message saying to move the task back first with flume task phase ID PHASE; a PHASE equal to or later than the current phase is allowed. A missing --phase SHALL be a usage error (exit code 2). flume task show ID SHALL list the pushed guides (in its fields text, and as guides, an object of phase to list of names, in its --json output).

#### Scenario: Push and remove guides  {#s-4a02}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base guides testing and db-schema, and a task in phase proposal
- **WHEN** testing is pushed to implement, db-schema to design, db-schema to design again, then db-schema is removed from design and testing from implement
- **THEN** after the first three commands the fields of the task show a guides field with design holding db-schema listed before implement holding testing, and the JSON guides is design db-schema and implement testing; after the removals the guides field is gone

#### Scenario: Refused pushes change nothing  {#s-4a03}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has the base guide testing, and a task in phase plan with testing pushed to implement
- **WHEN** a guide named nope is pushed to implement, testing is pushed to design, testing is removed from design, a guide is removed that is not pushed, and testing is pushed to plan and then to specs after the task is moved back to specs
- **THEN** the first five exit with code 1 and leave task.yaml as it was (the push to design says to run flume task phase with the task ID and design), the push to plan succeeds, and after the move back the push to specs succeeds

### Requirement: Pushing a guide is recorded in the history  {#r-4a04}
When a guide is pushed or removed, flume SHALL append to the task's history one line with action guide_push or guide_remove and the keys guide and phase; a push that changes nothing or is refused SHALL append nothing. The daemon answers POST /api/tasks/{id}/guides (JSON guide, phase, optional remove) with the task object, 400 for a refusal and 404 for an unknown task.

#### Scenario: History and endpoint  {#s-4a05}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has the base guide testing, and a task
- **WHEN** POST /api/tasks/{id}/guides is requested with guide testing and phase design, again the same, then with remove true, and with guide nope
- **THEN** the answers are 200, 200, 200 and 400, and the history has one guide_push line (guide testing, phase design) and one guide_remove line after the create line

### Requirement: A plan group names guides  {#r-4b01}
A plan group MAY list guides with lines "Guide: NAME" under its heading, before its items (blank lines allowed between them); flume task write ID plan SHALL refuse with exit code 1, changing nothing, a plan with a Guide line after the group's first item, with a name that is not a plain name, or naming a guide that does not exist for the task's project (the project's guide, else the base guide), the message naming the group and the guide. The Guide lines SHALL be kept when the plan is printed and when items are marked done or skipped.

#### Scenario: Guide lines are checked and kept  {#s-4b02}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has the base guides testing and api-conventions, and a new task
- **WHEN** a plan whose group 1 has the lines Guide: api-conventions and Guide: testing before its items is written, then item 1.1 is marked done, and then plans are written whose group names the guide nope, or has a Guide line after an item
- **THEN** the first write exits with code 0, flume task show ID plan prints the Guide lines under the group 1 heading both before and after 1.1 is marked done, and the later writes exit with code 1 (the first naming nope) and leave the plan as it was

### Requirement: Instructions print what to do now  {#r-4c01}
When the user runs "flume task instructions ID", flume SHALL ask the daemon and print, as agent text, one flume_instructions element (attributes task and phase, the task's ID and current phase), whose tags are on their own lines and which holds, in this order: a steps element (attribute phase) with the built-in steps for that phase, naming the task ID in the commands, followed by the steps that hold in every phase (pushing guides, recording conversations, setting the next phase); a template element (attribute part) with the template for the part the phase writes (the project's template, else the base one, else the built-in one; none for implement); and one guide element (attributes name and, when the guide has one, stage) with the full text of each guide pushed to that phase, in the order pushed. A pushed guide that no longer exists (or whose front matter is broken) SHALL be reported in a guide_missing element naming it, and SHALL NOT be an error. Text of a guide, template or task that would end or forge one of these elements SHALL be neutralized as in the prime text. The command SHALL take no --json (usage error, exit code 2), SHALL exit with code 1 with a message for an unknown task or when no daemon answers, and SHALL NOT start the daemon. The daemon answers POST /api/tasks/{id}/instructions with 200 and an object holding phase and text (the same text), and 404 for an unknown task.

#### Scenario: Instructions for a phase  {#s-4c02}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has the base guides db-schema (stage design) and testing, and a task in phase design with db-schema pushed to design and testing pushed to implement
- **WHEN** the user runs flume task instructions for it, then moves the task to implement and runs it again
- **THEN** the first output starts with a flume_instructions line naming the task and the phase design, holds a steps element naming flume task write and the task ID, a template element for the part design, and a guide element named db-schema with stage design holding its text and no guide element named testing; the second holds the implement steps, no template element, and a guide element named testing

#### Scenario: A pushed guide has disappeared  {#s-4c03}
*Verification*: **executable**
- **GIVEN** a running daemon, a task in phase design with the base guide db-schema pushed to design, and then the guide's file removed from the flume root
- **WHEN** the user runs flume task instructions, and flume task instructions with --json, and for an unknown ID
- **THEN** the first exits with code 0 and prints a guide_missing element naming db-schema and no guide element; the second exits with code 2; the third exits with code 1

#### Scenario: The instructions endpoint  {#s-4c04}
*Verification*: **executable**
- **GIVEN** a running daemon and a task in phase specs
- **WHEN** POST /api/tasks/{id}/instructions is requested, and for an unknown task
- **THEN** the first answers 200 with phase specs and a text holding a flume_instructions element, and the second answers 404

### Requirement: Next adds the guides of the group  {#r-4c05}
When flume task next ID prints a plan group that is not complete, flume SHALL print after it, each in its own guide element (or guide_missing element when it has gone), the guides the group names with Guide lines and then the guides pushed to the phase implement, each guide once; with none it SHALL print the group exactly as before. With --json the object SHALL also hold guides, a list with one object per guide holding name, stage (when it has one) and body, or name and missing (the reason) for a guide that has gone; GET /api/tasks/{id}/plan/next SHALL answer the same.

#### Scenario: Group and implement guides  {#s-4c06}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has the base guides api-conventions, testing and style, and a task whose plan has group 1 naming api-conventions and testing and group 2 naming nothing, with testing and style pushed to implement
- **WHEN** flume task next is run, then all of group 1 is marked done and flume task next is run, then with --json
- **THEN** the first prints group 1 followed by guide elements api-conventions, testing and style (testing once); the second prints group 2 followed by the guide elements testing and style only; the JSON guides list has the same two guides with their bodies

### Requirement: Fetching instructions is recorded, and claim prints them  {#r-4d01}
When the instructions of a task are fetched (flume task instructions ID, or the claim below), flume SHALL append to the task's history one line with action instructions and the key phase (the task's current phase). When an agent runs flume task claim ID, or flume task assign ID with its own name (the name in AGENT_NAME), and the task is then held by it, flume SHALL print, right after the claim, the same text flume task instructions ID prints, and record the fetch; claiming a task the agent already holds SHALL print them again; the same commands with --json, assigning to someone else, and the human assigning SHALL print no instructions. When flume task phase ID PHASE succeeds, flume SHALL print as its last line "next: flume task instructions ID" (the ID as given; nothing with --json).

#### Scenario: Claim prints the instructions  {#s-4d02}
*Verification*: **executable**
- **GIVEN** a running daemon and a new task, and an agent scout (AGENT_NAME set)
- **WHEN** scout runs flume task claim, runs it again, runs flume task assign with the name human, and the human runs flume task assign with the name scout and then claim with --json for scout
- **THEN** the first two print a flume_instructions element for phase proposal, the third and the human's assign print no such element, the --json claim prints only the task as JSON, and the history has two instructions lines by scout with phase proposal

#### Scenario: Phase ends with the pointer  {#s-4d03}
*Verification*: **executable**
- **GIVEN** a running daemon and a new task
- **WHEN** the human runs flume task phase for design, and then flume task phase for specs with --json
- **THEN** the first prints exactly the line next: flume task instructions followed by the ID, and the second prints one JSON object and no next line

### Requirement: An agent does not advance a task without its instructions  {#r-4d04}
When an agent moves a task to a later phase (flume task phase ID PHASE with PHASE after the task's current phase, skipping phases included), flume SHALL refuse with exit code 1, changing nothing and appending nothing, unless the history holds an instructions line by that same agent for the task's current phase after the line recording the task's entry into that phase (the create line for the first phase); the message SHALL name flume task instructions ID. Moving to the same or an earlier phase SHALL never be refused, and a command run by the human (no AGENT_NAME and not under Claude Code) SHALL never be refused. An instructions line by another agent, or one from before the task last entered the phase, does not count. The daemon applies this to the actor named in the X-Flume-Agent header and answers 409.

#### Scenario: Forward needs the instructions, backward and the human do not  {#s-4d05}
*Verification*: **executable**
- **GIVEN** a running daemon and a task in phase proposal, and agents scout and rook
- **WHEN** scout moves it to design, rook runs flume task instructions and scout moves it to specs, scout runs instructions and moves it to specs, scout moves it back to design with no fetch, scout runs instructions, the human moves it to specs and back to design, scout moves it to plan, and the human moves it to implement
- **THEN** the first move exits with code 1 and names flume task instructions with the task ID, the second exits with code 1, the third succeeds, the move back succeeds, the move to plan after the human's round trip exits with code 1, the human's move to implement succeeds, and a refused move leaves the phase and the history as they were
