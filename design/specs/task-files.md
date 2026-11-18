# Task files

A task is a folder holding task.yaml (its fields), body.md (the ask), comments.md (the comments) and, once written, design.md, spec.md and plan.md (see the workflow spec). The folder it sits in is its state. This spec covers the folder layout, the files, the IDs and the check that verifies them. Tickets: fl-47b8, fl-3pfa.

In this spec the flume root is the folder named by the dir key of flume.yaml at the top of the tasks repository (flume, or . for the repository top itself); flume uses flume when there is no flume.yaml. The tasks repository root is called the project root below.

Assumptions (recorded on fl-47b8 and fl-3pfa): the unit is a task; task folders are tasks/open and tasks/resolved in the flume root; tasks of all projects share them; every file with fields is flat YAML; there is no migration, and the old layout (one Markdown file per task with front matter) is not read; slugs are cut to 50 characters; IDs have no project prefix (YAGNI); kinds are feature, bug, chore, docs, research and epic; the task format has no steps or workflow fields yet.

## Requirements

### Requirement: A task is a folder in a state folder  {#r-94ad}
Each task SHALL be one folder named slug-id, in tasks/open of the flume root for an open task or tasks/resolved of the flume root for a resolved task, holding the files task.yaml and body.md, and comments.md once a comment exists.

#### Scenario: A new task lands in open  {#s-75e6}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task titled Fix the login redirect is created
- **THEN** exactly one folder exists in flume/tasks/open, it holds task.yaml and body.md, and none exists in flume/tasks/resolved

#### Scenario: Tasks at the top of the repository  {#s-daad}
*Verification*: **executable**
- **GIVEN** a tasks repository whose flume.yaml says dir: .
- **WHEN** a task is created
- **THEN** its folder is in tasks/open at the top of the repository, and not in a folder named flume

### Requirement: The slug comes from the title  {#r-d046}
When a task is created, flume SHALL build the slug from its title: lowercase ASCII letters and digits, every run of other characters replaced by one hyphen, no leading or trailing hyphen, cut to at most 50 characters with no trailing hyphen left by the cut.

#### Scenario: Punctuation and case  {#s-de2d}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task titled  Login page: drops the redirect (SSO)!  is created
- **THEN** its file name starts with login-page-drops-the-redirect-sso- and then a 4 character ID, and it has no .md ending

#### Scenario: A long title is cut  {#s-e99a}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created whose title is 80 letters a through z in a row with a space after every 10 letters
- **THEN** the slug part of its file name is at most 50 characters and does not end in a hyphen

### Requirement: The ID is four characters from a fixed alphabet  {#r-24f3}
Every task ID SHALL be 4 characters from the alphabet abcdefghjkmnpqrstuvwxyz23456789 (lowercase letters and digits without i, l, o, 0 and 1), and the ID xxxx SHALL never be given to a task.

#### Scenario: A new ID is well formed  {#s-7ceb}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** 50 tasks are created
- **THEN** every ID is 4 characters, each in the alphabet, and none is xxxx

### Requirement: A new ID is unique among open and resolved tasks  {#r-d0f5}
When a task is created, flume SHALL give it an ID that no open or resolved task in the project has, and an ID SHALL never change or be reused.

#### Scenario: IDs of resolved tasks stay taken  {#s-96f3}
*Verification*: **executable**
- **GIVEN** 200 tasks created and all resolved
- **WHEN** 200 more tasks are created
- **THEN** all 400 IDs are different

### Requirement: The folder name never changes  {#r-a0da}
When a task's title changes or the task is resolved or reopened, flume SHALL keep the folder name unchanged, apart from the state folder it sits in.

#### Scenario: Retitle keeps the name  {#s-b4b4}
*Verification*: **executable**
- **GIVEN** an open task with the title Old title
- **WHEN** its title is changed to Brand new title
- **THEN** the folder name is the same as before and the title line in task.yaml reads Brand new title

### Requirement: task.yaml holds the task's fields  {#r-770c}
A task folder's task.yaml SHALL be a flat YAML mapping with these fields: id, title, kind, status (open or resolved, the same as the state folder), phase (proposal for a new task; see the workflow spec), created (a date, YYYY-MM-DD, UTC), and optionally assignee, agent (see the workflow spec), project (the name of the project the task belongs to), parent, blocked_by (a list of IDs), related (a list of IDs) and resolved (a UTC timestamp, YYYY-MM-DDTHH:MM:SSZ).

#### Scenario: A new task has the minimal fields  {#s-ee5a}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task titled Add a roadmap with kind feature is created on 2026-11-20 UTC
- **THEN** its task.yaml has id equal to the ID in the folder name, title Add a roadmap, kind feature, status open, phase proposal and created 2026-11-20
- **THEN** its task.yaml has no resolved field

#### Scenario: IDs in front matter are bare  {#s-9e99}
*Verification*: **executable**
- **GIVEN** an open epic with ID q3rp
- **WHEN** a task is created with parent q3rp
- **THEN** its task.yaml has parent q3rp, not a link and not a path

#### Scenario: A task with a project  {#s-ed18}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created with project backend
- **THEN** its task.yaml has project backend, and a task created with no project has no project field

### Requirement: The kind is one of a fixed list  {#r-673b}
A task's kind SHALL be one of feature, bug, chore, docs, research or epic.

#### Scenario: An unknown kind is refused  {#s-ad67}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created with kind idea
- **THEN** the task is refused naming the allowed kinds and no file is written

### Requirement: Resolving moves the folder and stamps the time  {#r-c30e}
When a task is resolved, flume SHALL move its folder from open to resolved, set status to resolved and set resolved to the current UTC time in task.yaml; when a task is reopened, flume SHALL move it back, set status to open and remove the resolved field; flume SHALL write only task.yaml (never body.md or comments.md) and SHALL move every other file in the folder along with it unchanged.

#### Scenario: Resolve then reopen  {#s-8719}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** it is resolved, and then reopened
- **THEN** after the first step the folder is in resolved with status resolved and a resolved timestamp, and after the second it is in open with status open and no resolved field

### Requirement: A parent is an epic and an epic has no parent  {#r-d671}
A task's parent, when present, SHALL be the ID of an epic, and a task of kind epic SHALL have no parent.

#### Scenario: A parent must be an epic  {#s-a614}
*Verification*: **executable**
- **GIVEN** an open task of kind feature with ID k7tm
- **WHEN** a task is created with parent k7tm
- **THEN** the task is refused saying the parent is not an epic

### Requirement: The body is free text  {#r-0aca}
body.md SHALL hold the ask as free Markdown with no front matter, that flume keeps as written, and a new task's body.md SHALL be the text given at creation, or the heading "## The ask" followed by an empty line when none is given.

#### Scenario: Default body  {#s-3437}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created with no body
- **THEN** body.md is the line ## The ask followed by a blank line

### Requirement: Comments go in comments.md  {#r-7090}
When a comment is added to a task, flume SHALL append it to comments.md in the task folder (creating the file when missing), newest last, each comment being a line "### <time>, <author>", a blank line and the text, separated from the one before by a blank line, where time is the local time with its UTC offset to the minute (as in 2026-11-17 14:05 -05:00), and flume SHALL NOT change task.yaml or body.md.

#### Scenario: First and second comment  {#s-1c69}
*Verification*: **executable**
- **GIVEN** an open task with the default body
- **WHEN** a comment First by scout and then a comment Second by remus are added
- **THEN** comments.md holds a header line ending in ", scout" and First, then a header line ending in ", remus" and Second, and the header time matches the form 2026-11-17 14:05 -05:00
- **THEN** body.md is unchanged

#### Scenario: Other files stay and travel  {#s-b2c3}
*Verification*: **executable**
- **GIVEN** an open task whose folder also holds a file notes.csv that flume did not write
- **WHEN** a comment is added and the task is resolved
- **THEN** notes.csv is unchanged and is in the folder under resolved, with body.md unchanged

### Requirement: A task link names the file stem  {#r-c5a3}
When a task body links to another task, the link SHALL be a wiki link by the task folder name without any path, as in [[login-page-drops-the-redirect-k7tm]] or with a label after a vertical bar.

#### Scenario: Link stays valid after a move  {#s-fa81}
*Verification*: **executable**
- **GIVEN** task A whose body links to task B by file stem, and flume check passing
- **WHEN** task B is resolved
- **THEN** flume check still passes

### Requirement: Check reports every problem in the task files  {#r-9fcb}
When flume check runs, it SHALL examine every task folder in open and resolved and report each problem as a line holding the folder path and a message, covering: task.yaml or body.md missing or task.yaml not parsable; a required field (id, title, kind, status, created) missing; an ID not well formed; an ID in task.yaml that differs from the ID in the folder name; a status that differs from the state folder; two folders with the same ID; a kind not in the list; a resolved field in open or no resolved field in resolved; a parent, blocked_by or related ID that names no task; a parent that is not an epic; and a wiki link, in body.md or comments.md, that names no task file.

#### Scenario: A clean project  {#s-5496}
*Verification*: **executable**
- **GIVEN** three tasks made by flume, one resolved
- **WHEN** flume check runs
- **THEN** it prints no problems and exits with code 0

#### Scenario: A hand edit breaks the ID  {#s-d5a6}
*Verification*: **executable**
- **GIVEN** an open task whose task.yaml id is changed by hand to zzzz
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a line with that folder path saying the id differs from the folder name

#### Scenario: Duplicate IDs  {#s-b0d8}
*Verification*: **executable**
- **GIVEN** a folder in open and a folder in resolved whose names end in the same 4 character ID
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for both folders

#### Scenario: A broken reference and a broken link  {#s-b427}
*Verification*: **executable**
- **GIVEN** an open task with blocked_by naming an ID that no task has and a body linking to [[no-such-task-abcd]]
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints one problem for the blocked_by ID and one for the link

#### Scenario: Wrong folder  {#s-a4c6}
*Verification*: **executable**
- **GIVEN** a folder in open whose task.yaml has a resolved field
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for that folder

#### Scenario: Status disagrees with the folder  {#s-da82}
*Verification*: **executable**
- **GIVEN** an open task whose task.yaml status is changed by hand to resolved
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for that folder saying the status differs from the folder

### Requirement: Check also reports file names and dependency cycles  {#r-43e7}
When flume check runs, it SHALL report a folder name that is not a slug of lowercase letters, digits and hyphens (at most 50 characters) followed by a hyphen and a well formed 4 character ID, and each task that is blocked, directly or through other tasks, by itself.

#### Scenario: A bad file name  {#s-cb3b}
*Verification*: **executable**
- **GIVEN** an open task folder named Bad Name
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for that folder

#### Scenario: A dependency cycle  {#s-258c}
*Verification*: **executable**
- **GIVEN** two open tasks that each name the other in blocked_by
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for each of the two folders

### Requirement: flume.yaml lists the projects  {#r-686f}
flume.yaml MAY hold projects, mapping each project's name (its folder in the workspace) to a set of fields: url (the git URL; optional, a project without one is set up by hand) and branch (optional; without it the repository's own default branch). The check SHALL report, as a problem naming flume.yaml, each project name that is not a valid folder name; it SHALL NOT report a project for having no url.

#### Scenario: A project without a url  {#s-a386}
*Verification*: **executable**
- **GIVEN** a tasks repository whose flume.yaml lists a project backend with only a branch
- **WHEN** flume check is run
- **THEN** it prints no problem for backend and the exit code is 0

#### Scenario: A bad project name  {#s-7873}
*Verification*: **executable**
- **GIVEN** a tasks repository whose flume.yaml lists a project named a/b with a url
- **WHEN** flume check is run
- **THEN** one problem line names flume.yaml and a/b and the exit code is 1
