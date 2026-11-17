# Daemon HTTP API

The daemon is the only writer of task files. It serves JSON over HTTP on the local machine. Ticket: fl-47b8.

Assumptions (recorded on fl-47b8): paths start with /api; requests with a body and all responses are JSON (UTF-8); an error response has the status code and a body {"error": "<message>"}; there is no login because the daemon listens on 127.0.0.1 only (a work-sandbox rule: localhost works); one daemon serves one task root, the folder holding flume/tasks (the project's own checkout or a separate task repository); the daemon commits each change there (advisor note on fl-47b8) and never pushes. A task object has the fields id, title, kind, state (open or resolved), created, resolved (null when open), parent (null when none), blocked_by, related, path (relative to the project root), body and file (the whole task file as stored, front matter and body). A list omits body and file.

## Requirements

### Requirement: The daemon listens on the local machine only  {#r-ac1d}
The daemon SHALL accept connections only on the loopback address 127.0.0.1.

#### Scenario: Not reachable from other addresses  {#s-92a8}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** a connection is made to the machine's non-loopback address on the daemon's port
- **THEN** the connection is refused

### Requirement: Status reports project and version  {#r-95db}
When GET /api/status is requested, the daemon SHALL answer 200 with the fields version (the Flume version string) and root (the absolute path of the project root).

#### Scenario: Status  {#s-b4ce}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** GET /api/status is requested
- **THEN** the status is 200 and the body has a non-empty version and the project root as root

### Requirement: Create a task  {#r-4b3f}
When POST /api/tasks is requested with title (required), kind (default feature), parent (optional) and body (optional), the daemon SHALL create the task per the task-files spec and answer 201 with the task object; for an invalid request it SHALL answer 400 and write nothing.

#### Scenario: Create  {#s-301e}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with title Fix redirect and kind bug
- **THEN** the status is 201, the body has a 4 character id, state open, kind bug, and the file at path exists

#### Scenario: Missing title  {#s-ec04}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with kind bug and no title
- **THEN** the status is 400, the body has an error message, and no task file is written

#### Scenario: Unknown kind  {#s-89d3}
*Verification*: **executable**
- **GIVEN** a running daemon
- **WHEN** POST /api/tasks is requested with title X and kind idea
- **THEN** the status is 400 and no task file is written

### Requirement: Read a task  {#r-0645}
When GET /api/tasks/{id} is requested, the daemon SHALL answer 200 with the task object, finding it in open or resolved, and 404 when no task has that ID.

#### Scenario: Read a resolved task  {#s-34d3}
*Verification*: **executable**
- **GIVEN** a resolved task with ID k7tm
- **WHEN** GET /api/tasks/k7tm is requested
- **THEN** the status is 200 and state is resolved and resolved is a timestamp

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
When PATCH /api/tasks/{id} is requested with an object of fields to set (title, kind, parent, blocked_by, related), the daemon SHALL apply them all or none per the task-files spec and answer 200 with the task object; a null value clears parent, blocked_by or related; an unknown field or a value that breaks a rule SHALL answer 400, and an unknown task 404, with the file unchanged.

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

### Requirement: Add a note  {#r-c1a0}
When POST /api/tasks/{id}/notes is requested with text, the daemon SHALL append it to the body after one blank line and answer 200 with the task object; an empty text SHALL answer 400 and an unknown task 404.

#### Scenario: Note  {#s-adcc}
*Verification*: **executable**
- **GIVEN** an open task with the default body
- **WHEN** POST /api/tasks/{id}/notes is requested with text Found the cause
- **THEN** the status is 200 and the body ends with a blank line and Found the cause

### Requirement: Close and reopen  {#r-17ac}
When POST /api/tasks/{id}/close or POST /api/tasks/{id}/reopen is requested, the daemon SHALL change the state per the task-files spec and answer 200 with the task object; closing a resolved task or reopening an open one SHALL answer 409 with nothing changed, and an unknown task 404.

#### Scenario: Close twice  {#s-3131}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** POST /api/tasks/{id}/close is requested twice
- **THEN** the first status is 200 with state resolved and the second is 409

### Requirement: Check  {#r-024a}
When GET /api/check is requested, the daemon SHALL answer 200 with ok (true when there are no problems) and problems (a list of objects with path and message), per the check in the task-files spec.

#### Scenario: Check finds a problem  {#s-9f87}
*Verification*: **executable**
- **GIVEN** a task file whose id differs from its file name
- **WHEN** GET /api/check is requested
- **THEN** the status is 200, ok is false, and problems has an entry with that file's path

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
- **THEN** all ten answer 201 with different IDs and ten files exist in open

### Requirement: Each change is one commit  {#r-a89d}
When a request creates or changes a task (create, update, note, close, reopen), the daemon SHALL commit the changed files in the git repository of the task root as one commit whose message names the task ID and the change, and SHALL NOT push.

#### Scenario: A create commits  {#s-1c86}
*Verification*: **executable**
- **GIVEN** a running daemon whose task root is a git repository with a clean working tree
- **WHEN** POST /api/tasks is requested with title Fix redirect
- **THEN** the repository has one new commit that holds only the new task file, its message contains the task ID, and the working tree is clean

#### Scenario: A close commits both paths  {#s-9a4e}
*Verification*: **executable**
- **GIVEN** an open task and a clean working tree
- **WHEN** POST /api/tasks/{id}/close is requested
- **THEN** one new commit exists, it removes the file from open and adds it to resolved, and the working tree is clean

#### Scenario: A note and an update commit  {#s-6f12}
*Verification*: **executable**
- **GIVEN** an open task and a clean working tree
- **WHEN** a note is added and then the title is changed
- **THEN** two new commits exist, each message contains the task ID, each holds only that task file, and the working tree is clean
