# Daemon HTTP API

The daemon is the only writer of task files. It serves JSON over HTTP on the local machine. Ticket: fl-47b8.

Assumptions (recorded on fl-47b8): paths start with /api; requests with a body and all responses are JSON (UTF-8); an error response has the status code and a body {"error": "<message>"}; there is no login because the daemon listens on 127.0.0.1 only (a work-sandbox rule: localhost works); one daemon serves one task root, the tasks repository whose flume.yaml names the flume root (a git repository in the workspace or a separate task repository); the daemon commits each change there (advisor note on fl-47b8) and never pushes. A task object has the fields id, title, kind, state (open or resolved), project (null when none), created, resolved (null when open), resolution (done or dropped; null when open), parent (null when none), blocked_by, related, assignee (empty when none), agent (empty when none), parts (the names of the parts the task has), path (the task folder, relative to the project root), body (body.md as stored), comments (comments.md as stored, empty when none) and fields (task.yaml as stored). A list omits body, comments and fields.

## Requirements

### Requirement: The daemon listens on the local machine only  {#r-ac1d}
The daemon SHALL accept connections only on the loopback address 127.0.0.1.

#### Scenario: Not reachable from other addresses  {#s-92a8}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** a connection is made to the machine's non-loopback address on the daemon's port
- **THEN** the connection is refused

### Requirement: Browser requests from other sites are refused  {#r-5e1b}
When a request's Host header is not 127.0.0.1 or localhost with the daemon's port, or a POST, PATCH or DELETE request carries an Origin header other than http://127.0.0.1 or http://localhost with the daemon's port, the daemon SHALL answer 403 with an error body and change nothing. A request with no Origin header (the command line client) SHALL be served as usual.

#### Scenario: Foreign Host refused  {#s-7c20}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** GET /api/status is requested with the Host header evil.example
- **THEN** the status is 403 and the body has an error message

#### Scenario: Foreign Origin on a write refused  {#s-d4a9}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with the Origin header http://evil.example and a valid title
- **THEN** the status is 403, the body has an error message and no task exists

#### Scenario: Request without Origin accepted  {#s-0b63}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with no Origin header and a valid title
- **THEN** the status is 201

### Requirement: Status reports project and version  {#r-95db}
When GET /api/status is requested, the daemon SHALL answer 200 with the fields version (the Flume version string) and root (the absolute path of the project root).

#### Scenario: Status  {#s-b4ce}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** GET /api/status is requested
- **THEN** the status is 200 and the body has a non-empty version and the project root as root

### Requirement: Create a task  {#r-4b3f}
When POST /api/tasks is requested with title (required), kind (default feature), project (optional name), parent (optional), blocked_by (optional list of task IDs), related (optional list of task IDs) and body (optional), the daemon SHALL create the task per the task-files spec, with the links in the same task.yaml, and answer 201 with the task object; for an invalid request, including a blocked_by or related entry that names no task, it SHALL answer 400 and write and commit nothing.

#### Scenario: Create  {#s-301e}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with title Fix redirect and kind bug
- **THEN** the status is 201, the body has a 4 character id, state open, kind bug, and the folder at path exists

#### Scenario: Missing title  {#s-ec04}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with kind bug and no title
- **THEN** the status is 400, the body has an error message, and no task folder is written

#### Scenario: Unknown kind  {#s-89d3}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with title X and kind idea
- **THEN** the status is 400 and no task folder is written

### Requirement: Read a task  {#r-0645}
When GET /api/tasks/{id} is requested, the daemon SHALL answer 200 with the task object, finding it in tasks or archive/tasks, and 404 when no task has that ID.

#### Scenario: Read a resolved task  {#s-34d3}
*Verification*: **executable**
- **GIVEN** a resolved task with ID k7tm
- **WHEN** GET /api/tasks/k7tm is requested
- **THEN** the status is 200 and state is resolved, resolved is a timestamp and resolution is done

#### Scenario: Unknown ID  {#s-063c}
*Verification*: **executable**
- **GIVEN** a running daemon and no task abcd
- **WHEN** GET /api/tasks/abcd is requested
- **THEN** the status is 404 and the body has an error message

### Requirement: List tasks  {#r-b71d}
When GET /api/tasks is requested, the daemon SHALL answer 200 with a list of task objects without the body field, ordered by created date and then ID, keeping only tasks that match the optional query parameters state (open, resolved or all; default open), kind and parent.

#### Scenario: List with filters  {#s-a3ca}
*Verification*: **executable**
- **GIVEN** an epic, two children of it, one other open task and one resolved task
- **WHEN** GET /api/tasks?parent= with the epic's ID is requested, and then GET /api/tasks?state=all
- **THEN** the first list holds exactly the two children and the second holds all five tasks

#### Scenario: Bad state value  {#s-1711}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** GET /api/tasks?state=sideways is requested
- **THEN** the status is 400

### Requirement: Update a task  {#r-8f5d}
When PATCH /api/tasks/{id} is requested with an object of fields to set (title, kind, parent, blocked_by, related), the daemon SHALL apply them all or none per the task-files spec and answer 200 with the task object; a null value clears parent, blocked_by or related; an unknown field or a value that breaks a rule SHALL answer 400, and an unknown task 404, with the files unchanged.

#### Scenario: Retitle  {#s-7abb}
*Verification*: **executable**
- **GIVEN** an open task k7tm
- **WHEN** PATCH /api/tasks/k7tm is requested with title New title
- **THEN** the status is 200, the title is New title, and the path is unchanged

#### Scenario: All or none  {#s-90c8}
*Verification*: **executable**
- **GIVEN** an open task k7tm titled Old
- **WHEN** PATCH /api/tasks/k7tm is requested with title New and kind idea
- **THEN** the status is 400 and the title is still Old

### Requirement: Add a comment  {#r-c1a0}
When POST /api/tasks/{id}/comments is requested with text and an optional author, the daemon SHALL add the text as a comment per the task-files spec, with the author given or, when it is missing or empty, the operating system user name of the daemon, and answer 200 with the task object; an empty text SHALL answer 400 and an unknown task 404.

#### Scenario: Comment  {#s-adcc}
*Verification*: **executable**
- **GIVEN** an open task with the default body
- **WHEN** POST /api/tasks/{id}/comments is requested with text Found the cause and author scout
- **THEN** the status is 200 and comments holds a header line ending in ", scout", a blank line and Found the cause

### Requirement: Close and reopen  {#r-17ac}
When POST /api/tasks/{id}/close or POST /api/tasks/{id}/reopen is requested, the daemon SHALL change the state per the task-files spec and answer 200 with the task object; close with a body holding dropped (a non-empty reason, and optionally author) SHALL resolve the task as dropped and add the reason as a comment, and an empty reason SHALL answer 400 with nothing changed; closing a resolved task or reopening an open one SHALL answer 409 with nothing changed, and an unknown task 404.

#### Scenario: Close twice  {#s-3131}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** POST /api/tasks/{id}/close is requested twice
- **THEN** the first status is 200 with state resolved and the second is 409

#### Scenario: Close as dropped  {#s-510a}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** POST /api/tasks/{id}/close is requested with dropped Duplicate of abcd
- **THEN** the status is 200, state is resolved, resolution is dropped and comments holds Duplicate of abcd; and a close with an empty dropped answers 400 and leaves the task open

### Requirement: Check  {#r-024a}
When GET /api/check is requested, the daemon SHALL answer 200 with ok (true when there are no problems) and problems (a list of objects with path and message), per the check in the task-files spec.

#### Scenario: Check finds a problem  {#s-9f87}
*Verification*: **executable**
- **GIVEN** a task file whose id differs from its file name
- **WHEN** GET /api/check is requested
- **THEN** the status is 200, ok is false, and problems has an entry with that file's path

### Requirement: Read the roadmap through the daemon  {#r-3bf6}
When GET /api/roadmap is requested, the daemon SHALL answer 200 with sections, a list of objects with heading and entries, where each entry has link (the file name stem), label (the text after the bar, or null), note (the text after the link on the item, or null), and either the task's id, title and state (open or resolved) or state null when no task has that file name; when the roadmap file does not exist it SHALL answer 404 with an error message.

#### Scenario: Entries carry task state  {#s-b25e}
*Verification*: **executable**
- **GIVEN** a roadmap listing an open task, a resolved task and a link to no task
- **WHEN** GET /api/roadmap is requested
- **THEN** the status is 200 and the entries have state open, resolved and null, and the first two have the task's id and title

#### Scenario: No roadmap file  {#s-5c0d}
*Verification*: **executable**
- **GIVEN** a running daemon and no roadmap.md in the flume root
- **WHEN** GET /api/roadmap is requested
- **THEN** the status is 404 and the body has an error message

### Requirement: Prime text from the flume root  {#r-216d}
When GET /api/prime is requested with the optional query parameters project and role, the daemon SHALL answer 200 with an object holding parts, an object with workflow (the merged workflow.md), project (the merged project.md, "" with no project) and role (the merged roles/ROLE.md, "" with no role or no file of it), merged as the workflow-layers spec says with placeholders left as written; text, the non-empty parts in that order separated by a blank line; and first_prompt, the text under the H1 of the merged first-prompt.md. A project or role that is not one plain name (letters, digits, dots, hyphens and underscores, starting with a letter or digit) SHALL answer 400 with an error message, and a merge error in one of these documents SHALL answer 422 with an error message holding every such error's file, line and heading.

#### Scenario: Layers in order  {#s-1581}
*Verification*: **executable**
- **GIVEN** a flume root with base/workflow.md adding BASE, projects/web/workflow.md adding WEB, base/roles/worker.md holding ROLE and projects/web/roles/worker.md appending WEBROLE
- **WHEN** GET /api/prime is requested with project web and role worker
- **THEN** the status is 200, parts.workflow is the shipped workflow with BASE and then WEB added, parts.project is the shipped project document, parts.role holds ROLE then WEBROLE, text joins the three and first_prompt is the shipped first prompt

#### Scenario: Missing files are skipped  {#s-3fa0}
*Verification*: **executable**
- **GIVEN** a flume root with no layered files
- **WHEN** GET /api/prime is requested with role worker
- **THEN** the status is 200, parts.workflow is the shipped workflow, parts.project and parts.role are empty and text equals parts.workflow

#### Scenario: A broken layer  {#s-0f6e}
*Verification*: **executable**
- **GIVEN** a flume root whose base/workflow.md has a heading Nope that matches nothing
- **WHEN** GET /api/prime is requested
- **THEN** the status is 422 and the error names flume/base/workflow.md, the line and the heading

#### Scenario: A path-like name is refused  {#s-f8c8}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** GET /api/prime is requested with role ../x
- **THEN** the status is 400 and the body has an error message

### Requirement: Guides  {#r-eee6}
When GET /api/prime is requested, the daemon SHALL also answer in the object a list guides with one object per guide available to the project (those of base/guides and, when project is given, projects/PROJECT/guides, a project's guide taking the place of the base one of the same name in the list) holding name, description and, when the guide has one, stage, ordered by name; a guide whose front matter is missing, unparsable, has a name differing from the file name or no description is left out. When GET /api/guides/NAME is requested with the optional query parameter project, the daemon SHALL answer 200 with an object holding name, description, stage (when present) and body (the text after the front matter, the project's guide merged into the base one as the workflow-layers spec says; the other fields those of the project's guide if its file exists, else the base guide); 404 with an error message when neither file exists; 400 with an error message when the guide's front matter is missing or unparsable or when NAME or project is not one plain name; 422 when its text has a merge error.

#### Scenario: Prime lists guides  {#s-000f}
*Verification*: **executable**
- **GIVEN** a flume root with base/guides/deploy.md (description Ship it, stage build), projects/web/guides/deploy.md (description Ship web) and base/guides/bad.md with no front matter
- **WHEN** GET /api/prime is requested with project web
- **THEN** the status is 200 and guides holds one guide, deploy, with description Ship web

#### Scenario: Read a guide  {#s-e610}
*Verification*: **executable**
- **GIVEN** a flume root with base/guides/deploy.md holding front matter and a heading Deploy with STEPS, and no guide for project web
- **WHEN** GET /api/guides/deploy is requested with project web
- **THEN** the status is 200 and body is the heading and STEPS and name is deploy

#### Scenario: Unknown or broken guide  {#s-b6e2}
*Verification*: **executable**
- **GIVEN** a flume root with base/guides/bad.md with no front matter
- **WHEN** GET /api/guides/nope and GET /api/guides/bad are requested
- **THEN** the first answers 404 and the second 400, each with an error message


### Requirement: Stop  {#r-23b5}
When POST /api/stop is requested, the daemon SHALL answer 200 and then exit, and a later request to its address SHALL fail to connect.

#### Scenario: Stop  {#s-0e75}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/stop is requested, then GET /api/status
- **THEN** the first answers 200 and the second cannot connect

### Requirement: Unknown paths and methods  {#r-6fed}
When a request names a path the daemon does not serve, it SHALL answer 404, and when it uses a method the path does not accept, 405, each with an error body.

#### Scenario: Unknown path  {#s-3377}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** GET /api/nothing is requested
- **THEN** the status is 404 and the body has an error message

#### Scenario: Wrong method  {#s-5d0e}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** DELETE /api/status is requested
- **THEN** the status is 405 and the body has an error message

### Requirement: Concurrent writes do not lose changes  {#r-89c2}
When several create or update requests arrive at the same time, the daemon SHALL apply every one, and each created task SHALL get a different ID.

#### Scenario: Ten creates at once  {#s-3304}
*Verification*: **executable**
- **GIVEN** a running daemon with no tasks
- **WHEN** ten POST /api/tasks requests are sent at the same time
- **THEN** all ten answer 201 with different IDs and ten folders exist in open

### Requirement: Each change is one commit  {#r-a89d}
When a request creates or changes a task (create, update, comment, assign, write or remove a part, plan done or skip, close, reopen), the daemon SHALL commit the changed files in the git repository of the task root as one commit whose message names the task ID and the change, and SHALL NOT push.

#### Scenario: A create commits  {#s-1c86}
*Verification*: **executable**
- **GIVEN** a running daemon whose task root is a git repository with a clean working tree
- **WHEN** POST /api/tasks is requested with title Fix redirect
- **THEN** the repository has one new commit that holds only the new task folder, its message contains the task ID, and the working tree is clean

#### Scenario: A create with links is one commit  {#s-fc8d}
*Verification*: **executable**
- **GIVEN** open tasks k7tm and q3rp and a clean working tree
- **WHEN** POST /api/tasks is requested with title Follow up, blocked_by k7tm and related q3rp
- **THEN** exactly one new commit exists, it holds only the new task folder, the task has blocked_by k7tm and related q3rp, and the working tree is clean

#### Scenario: A create with an unknown link writes nothing  {#s-88ac}
*Verification*: **executable**
- **GIVEN** a clean working tree and no task zzzz
- **WHEN** POST /api/tasks is requested with title Follow up and blocked_by zzzz
- **THEN** the status is 400, no new commit exists, and the working tree is clean

#### Scenario: A close commits both paths  {#s-9a4e}
*Verification*: **executable**
- **GIVEN** an open task and a clean working tree
- **WHEN** POST /api/tasks/{id}/close is requested
- **THEN** one new commit exists, it removes the folder from open and adds it to resolved, and the working tree is clean

#### Scenario: A comment and an update commit  {#s-6f12}
*Verification*: **executable**
- **GIVEN** an open task and a clean working tree
- **WHEN** a comment is added and then the title is changed
- **THEN** two new commits exist, each message contains the task ID, each holds only that task folder, and the working tree is clean

### Requirement: Workflow endpoints  {#r-a0d8}
The daemon SHALL answer these and commit each change as one commit naming the task: POST /api/tasks/{id}/assign (JSON assignee, optional actor and force; an actor that takes a task held by someone else without force gets 400 and no change); GET, PUT (JSON text) and DELETE /api/tasks/{id}/parts/{part} (400 for a name that is not plain); GET /api/tasks/{id}/plan/next (answers complete, group, text and guides), POST /api/tasks/{id}/plan/done (JSON items) and POST /api/tasks/{id}/plan/skip (JSON items and reason); GET /api/templates/{part} with an optional project query (the merged template, its text empty when no layer has one; 400 for a name that is not plain; 422 for a merge error); and GET /api/tasks takes an assignee query.

#### Scenario: Assign, parts and plan requests  {#s-1122}
*Verification*: **executable**
- **GIVEN** a running daemon and a task
- **WHEN** it is assigned to scout with actor rook and no force, then with force, a plan is written with PUT and marked with plan/done, and the plan is read with plan/next
- **THEN** the first assign answers 200 (nobody held it), a second assign by actor rook for another holder answers 400, the others answer 200, each change is one commit naming the task, and the plan/next answer is complete

#### Scenario: Templates over HTTP  {#s-223e}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** GET /api/templates/design, GET /api/templates/notes and GET /api/templates/.hidden are requested
- **THEN** the first answers 200 with non-empty text, the second 200 with empty text, and the third 400
