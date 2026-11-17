# Task files

A task is one Markdown file with a short front matter block. The folder it sits in is its state. This spec covers the file format, the IDs and the check that verifies them. Ticket: fl-47b8.

Assumptions (recorded on fl-47b8): the unit is a task; folders are flume/tasks/open and flume/tasks/resolved; slugs are cut to 50 characters; IDs have no project prefix (YAGNI); kinds are feature, bug, chore, docs, research and epic; the task format has no steps or workflow fields yet.

## Requirements

### Requirement: A task is a file in a state folder  {#r-94ad}
Each task SHALL be one file named slug-id.md, in flume/tasks/open for an open task or flume/tasks/resolved for a resolved task, under the project root.

#### Scenario: A new task lands in open  {#s-75e6}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task titled Fix the login redirect is created
- **THEN** exactly one file ending in .md exists in flume/tasks/open and none in flume/tasks/resolved

### Requirement: The slug comes from the title  {#r-d046}
When a task is created, flume SHALL build the slug from its title: lowercase ASCII letters and digits, every run of other characters replaced by one hyphen, no leading or trailing hyphen, cut to at most 50 characters with no trailing hyphen left by the cut.

#### Scenario: Punctuation and case  {#s-de2d}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task titled  Login page: drops the redirect (SSO)!  is created
- **THEN** its file name starts with login-page-drops-the-redirect-sso- and then a 4 character ID and .md

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

### Requirement: The file name never changes  {#r-a0da}
When a task's title changes or the task is resolved or reopened, flume SHALL keep the file name unchanged, apart from the folder.

#### Scenario: Retitle keeps the name  {#s-b4b4}
*Verification*: **executable**
- **GIVEN** an open task with the title Old title
- **WHEN** its title is changed to Brand new title
- **THEN** the file name is the same as before and the title line in the file reads Brand new title

### Requirement: Front matter holds the task's fields  {#r-770c}
A task file SHALL start with a front matter block between two lines of three hyphens, with these fields: id, title, kind, created (a date, YYYY-MM-DD, UTC), and optionally parent, blocked_by (a list of IDs), related (a list of IDs) and resolved (a UTC timestamp, YYYY-MM-DDTHH:MM:SSZ).

#### Scenario: A new task has the minimal fields  {#s-ee5a}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task titled Add a roadmap with kind feature is created on 2026-11-20 UTC
- **THEN** its front matter has id equal to the ID in the file name, title Add a roadmap, kind feature and created 2026-11-20
- **THEN** its front matter has no resolved field

#### Scenario: IDs in front matter are bare  {#s-9e99}
*Verification*: **executable**
- **GIVEN** an open epic with ID q3rp
- **WHEN** a task is created with parent q3rp
- **THEN** its front matter has parent q3rp, not a link and not a path

### Requirement: The kind is one of a fixed list  {#r-673b}
A task's kind SHALL be one of feature, bug, chore, docs, research or epic.

#### Scenario: An unknown kind is refused  {#s-ad67}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created with kind idea
- **THEN** the task is refused naming the allowed kinds and no file is written

### Requirement: Resolving moves the file and stamps the time  {#r-c30e}
When a task is resolved, flume SHALL move its file from open to resolved and set resolved to the current UTC time in its front matter; when a task is reopened, flume SHALL move it back and remove the resolved field.

#### Scenario: Resolve then reopen  {#s-8719}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** it is resolved, and then reopened
- **THEN** after the first step the file is in resolved with a resolved timestamp, and after the second it is in open with no resolved field

### Requirement: A parent is an epic and an epic has no parent  {#r-d671}
A task's parent, when present, SHALL be the ID of an epic, and a task of kind epic SHALL have no parent.

#### Scenario: A parent must be an epic  {#s-a614}
*Verification*: **executable**
- **GIVEN** an open task of kind feature with ID k7tm
- **WHEN** a task is created with parent k7tm
- **THEN** the task is refused saying the parent is not an epic

### Requirement: The body is free text  {#r-0aca}
Everything after the front matter SHALL be free Markdown that flume keeps as written, and a new task's body SHALL be the text given at creation, or the heading "## The ask" followed by an empty line when none is given.

#### Scenario: Default body  {#s-3437}
*Verification*: **executable**
- **GIVEN** a project with no tasks
- **WHEN** a task is created with no body
- **THEN** the text after the front matter is the line ## The ask followed by a blank line

### Requirement: Comments go under a Comments heading  {#r-7090}
When a comment is added to a task, flume SHALL put it at the end of the body under a line "## Comments" (adding that line after one blank line when the body has none, or using the last one when the body has several), newest last, each comment being a line "### <time>, <author>", a blank line and the text, where time is the local time with its UTC offset to the minute (as in 2026-11-17 14:05 -05:00), and flume SHALL NOT change the rest of the body.

#### Scenario: First and second comment  {#s-1c69}
*Verification*: **executable**
- **GIVEN** an open task with the default body
- **WHEN** a comment First by scout and then a comment Second by remus are added
- **THEN** the body ends with the line ## Comments, a header line ending in ", scout" and First, then a header line ending in ", remus" and Second, and the header time matches the form 2026-11-17 14:05 -05:00

#### Scenario: Existing Comments heading  {#s-1582}
*Verification*: **executable**
- **GIVEN** a task whose body already holds a line ## Comments
- **WHEN** a comment is added
- **THEN** the body still holds one Comments heading and the comment is at the end

### Requirement: A task link names the file stem  {#r-c5a3}
When a task body links to another task, the link SHALL be a wiki link by full file stem without folder or extension, as in [[login-page-drops-the-redirect-k7tm]] or with a label after a vertical bar.

#### Scenario: Link stays valid after a move  {#s-fa81}
*Verification*: **executable**
- **GIVEN** task A whose body links to task B by file stem, and flume check passing
- **WHEN** task B is resolved
- **THEN** flume check still passes

### Requirement: Check reports every problem in the task files  {#r-9fcb}
When flume check runs, it SHALL examine every task file in open and resolved and report each problem as a line holding the file path and a message, covering: front matter missing or not parsable; a required field missing; an ID not well formed; an ID in front matter that differs from the ID in the file name; two files with the same ID; a kind not in the list; a resolved field in open or no resolved field in resolved; a parent, blocked_by or related ID that names no task; a parent that is not an epic; and a wiki link that names no task file.

#### Scenario: A clean project  {#s-5496}
*Verification*: **executable**
- **GIVEN** three tasks made by flume, one resolved
- **WHEN** flume check runs
- **THEN** it prints no problems and exits with code 0

#### Scenario: A hand edit breaks the ID  {#s-d5a6}
*Verification*: **executable**
- **GIVEN** an open task whose front matter id is changed by hand to zzzz
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a line with that file path saying the id differs from the file name

#### Scenario: Duplicate IDs  {#s-b0d8}
*Verification*: **executable**
- **GIVEN** a file in open and a file in resolved whose names end in the same 4 character ID
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for both files

#### Scenario: A broken reference and a broken link  {#s-b427}
*Verification*: **executable**
- **GIVEN** an open task with blocked_by naming an ID that no task has and a body linking to [[no-such-task-abcd]]
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints one problem for the blocked_by ID and one for the link

#### Scenario: Wrong folder  {#s-a4c6}
*Verification*: **executable**
- **GIVEN** a file in open whose front matter has a resolved field
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for that file

### Requirement: Check also reports file names and dependency cycles  {#r-43e7}
When flume check runs, it SHALL report a file name that is not a slug of lowercase letters, digits and hyphens (at most 50 characters) followed by a hyphen, a well formed 4 character ID and .md, and each task that is blocked, directly or through other tasks, by itself.

#### Scenario: A bad file name  {#s-cb3b}
*Verification*: **executable**
- **GIVEN** an open task file named Bad Name.md
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for that file

#### Scenario: A dependency cycle  {#s-258c}
*Verification*: **executable**
- **GIVEN** two open tasks that each name the other in blocked_by
- **WHEN** flume check runs
- **THEN** it exits with code 1 and prints a problem for each of the two files
