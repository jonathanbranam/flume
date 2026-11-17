# Web UI

The pages a person opens in a browser, served by the daemon. Ticket: fl-8g3q.

Assumptions (recorded on fl-8g3q): the UI is served by the daemon at its address and talks to it only through the daemon HTTP API (api spec), so every change a click makes is an API request and the screen shows what the API answered; there is no login (api spec); the views are those the brief names (the Kanban board, a task's detail, the roadmap), reached by the paths / (board), /tasks/{id} (detail) and /roadmap; the board has two columns, Open and Resolved, because a task has only those two states (task-files spec); a card shows the task's title, kind and ID; the roadmap is derived from the epics and their children (no roadmap file is read, because the API has none); an epic's progress is the number of its children that are resolved out of all its children; an API error is shown as its error message on the page and the screen is not otherwise changed. Not yet specified (open questions on fl-8g3q): creating or editing a task in the UI (title, kind, parent, blocked_by, related); moving a card by dragging; the Now, Next, Later and Done groups of the roadmap in the brief (they need a roadmap file or field the API does not serve); refreshing while open; filters and search.

## Requirements

### Requirement: The board shows tasks in a column per state  {#r-b0a1}
When the board path / is opened, the UI SHALL request GET /api/tasks?state=all and show one column named Open and one named Resolved, each holding a card for every task of that state, in the order the API returned them, with the number of cards in the column's heading.

#### Scenario: Tasks land in their columns  {#s-b0a2}
*Verification*: **executable**
- **GIVEN** two open tasks and one resolved task
- **WHEN** the board is opened
- **THEN** the Open column heading shows 2 and holds two cards, and the Resolved column heading shows 1 and holds one card

#### Scenario: An empty board  {#s-b0a3}
*Verification*: **executable**
- **GIVEN** a daemon with no tasks
- **WHEN** the board is opened
- **THEN** both columns are shown with 0 cards and the page shows no error

### Requirement: A card shows the task at a glance  {#r-c0b1}
The UI SHALL show on each card the task's title, its kind and its ID.

#### Scenario: Card contents  {#s-c0b2}
*Verification*: **executable**
- **GIVEN** an open task k7tm titled Fix redirect with kind bug
- **WHEN** the board is opened
- **THEN** the card in the Open column shows Fix redirect, bug and k7tm

### Requirement: Clicking a card opens the task  {#r-d0c1}
When a card is clicked, the UI SHALL go to the path /tasks/ followed by that task's ID.

#### Scenario: Open from the board  {#s-d0c2}
*Verification*: **executable**
- **GIVEN** an open task k7tm shown on the board
- **WHEN** its card is clicked
- **THEN** the page path is /tasks/k7tm and the task's title is shown

### Requirement: The detail shows the whole task  {#r-e0d1}
When the path /tasks/{id} is opened, the UI SHALL request GET /api/tasks/{id} and show the task's title, ID, kind, state, created date, resolved timestamp when it has one, parent, blocked_by and related IDs, and body, with a link back to the board.

#### Scenario: Detail of an open task  {#s-e0d2}
*Verification*: **executable**
- **GIVEN** an open task k7tm titled Fix redirect with kind bug and a body
- **WHEN** /tasks/k7tm is opened
- **THEN** the page shows Fix redirect, k7tm, bug, open, the created date and the body, and shows no resolved timestamp

#### Scenario: Detail of a resolved task  {#s-e0d3}
*Verification*: **executable**
- **GIVEN** a resolved task k7tm
- **WHEN** /tasks/k7tm is opened
- **THEN** the page shows state resolved and the resolved timestamp

#### Scenario: Unknown task  {#s-e0d4}
*Verification*: **executable**
- **GIVEN** a running daemon and no task abcd
- **WHEN** /tasks/abcd is opened
- **THEN** the page shows the message the API answered for the 404 and no task fields

#### Scenario: Related tasks are links  {#s-e0d5}
*Verification*: **executable**
- **GIVEN** an open task k7tm whose parent is the epic q3rp
- **WHEN** /tasks/k7tm is opened and the parent ID is clicked
- **THEN** the page path is /tasks/q3rp

### Requirement: A comment can be added from the detail  {#r-f0e1}
When the comment form on an open or resolved task's detail is submitted with text, the UI SHALL send POST /api/tasks/{id}/comments with that text and then show the task as the API answered, with the form cleared; with empty text it SHALL send nothing.

#### Scenario: Add a comment  {#s-f0e2}
*Verification*: **executable**
- **GIVEN** the detail of an open task k7tm
- **WHEN** the text Found the cause is entered and the form is submitted
- **THEN** one POST /api/tasks/k7tm/comments request is sent with that text, the body shown ends with Found the cause, and the text box is empty

#### Scenario: Empty comment  {#s-f0e3}
*Verification*: **executable**
- **GIVEN** the detail of an open task k7tm
- **WHEN** the form is submitted with no text
- **THEN** no request is sent

### Requirement: A task can be closed or reopened from the detail  {#r-a1f1}
The detail of an open task SHALL offer a Close button and the detail of a resolved task a Reopen button, and no other; when clicked, the UI SHALL send POST /api/tasks/{id}/close or POST /api/tasks/{id}/reopen and then show the task as the API answered.

#### Scenario: Close  {#s-a1f2}
*Verification*: **executable**
- **GIVEN** the detail of an open task k7tm
- **WHEN** Close is clicked
- **THEN** one POST /api/tasks/k7tm/close request is sent, the page shows state resolved and a resolved timestamp, and the button now reads Reopen

#### Scenario: Reopen  {#s-a1f3}
*Verification*: **executable**
- **GIVEN** the detail of a resolved task k7tm
- **WHEN** Reopen is clicked
- **THEN** one POST /api/tasks/k7tm/reopen request is sent, the page shows state open and no resolved timestamp, and the button now reads Close

#### Scenario: The board follows  {#s-a1f4}
*Verification*: **executable**
- **GIVEN** an open task k7tm that was closed from its detail
- **WHEN** the link back to the board is clicked
- **THEN** the card for k7tm is in the Resolved column and not in the Open column

### Requirement: Failed requests show the error  {#r-b1a1}
When a request the UI sent is answered with an error status, the UI SHALL show the error message from the response on the page and SHALL NOT change the task shown.

#### Scenario: Closing a task that is already resolved  {#s-b1a2}
*Verification*: **executable**
- **GIVEN** the detail of an open task k7tm that another client has since closed
- **WHEN** Close is clicked
- **THEN** the page shows the error message of the 409 answer and the task is still shown as before

### Requirement: The roadmap lists epics with their progress  {#r-c1b1}
When the path /roadmap is opened, the UI SHALL request GET /api/tasks?state=all and show every task of kind epic, open epics first, each with its title, ID, state and progress as the number of its children that are resolved out of all its children (for example 2 of 3), and an epic with no children SHALL show 0 of 0.

#### Scenario: Progress  {#s-c1b2}
*Verification*: **executable**
- **GIVEN** an open epic q3rp with three children of which two are resolved, and a resolved epic h7ds with no children
- **WHEN** /roadmap is opened
- **THEN** q3rp is listed before h7ds, q3rp shows 2 of 3, and h7ds shows 0 of 0

#### Scenario: Only epics  {#s-c1b3}
*Verification*: **executable**
- **GIVEN** one epic and two tasks of other kinds
- **WHEN** /roadmap is opened
- **THEN** exactly one entry is listed

### Requirement: An epic on the roadmap opens its detail  {#r-d1c1}
When an epic's title on the roadmap is clicked, the UI SHALL go to /tasks/ followed by the epic's ID, and the epic's detail SHALL list its children, each linking to that child's detail.

#### Scenario: From roadmap to child  {#s-d1c9}
*Verification*: **executable**
- **GIVEN** an open epic q3rp with a child k7tm
- **WHEN** the epic is clicked on /roadmap and then k7tm is clicked in the epic's detail
- **THEN** the page path is first /tasks/q3rp, listing k7tm, and then /tasks/k7tm

### Requirement: Every page links to the others  {#r-e1d1}
Every page SHALL show links to the board and to the roadmap.

#### Scenario: Navigation  {#s-e1d2}
*Verification*: **executable**
- **GIVEN** the board
- **WHEN** the Roadmap link is clicked and then the Board link is clicked
- **THEN** the page path is first /roadmap and then /
