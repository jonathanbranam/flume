# Command line

The flume command is a thin client of the daemon (see the api spec). It writes no task files itself; only version and check work without the daemon. Ticket: fl-47b8.

Assumptions (recorded on fl-47b8): exit code 0 is success, 1 is a refused or failed request, 2 is wrong usage; errors go to standard error and results to standard output; commands take a bare task ID; the daemon commits each task change in the task root's repository and never pushes (see the api spec); the task root may be a separate task repository. Not yet specified (open questions on fl-47b8): prime, guide, rules, step, workflow, roadmap, task start, projects, tmux and agent commands.

## Requirements

### Requirement: Usage errors exit 2  {#r-2faf}
When flume is run with an unknown command, a missing required argument or an unknown option, it SHALL print a usage message to standard error and exit with code 2.

#### Scenario: Unknown command  {#s-2c86}
*Verification*: **executable**
- **GIVEN** any project
- **WHEN** flume frobnicate is run
- **THEN** standard error holds a usage message and the exit code is 2

### Requirement: The CLI finds the daemon by walking up  {#r-656f}
When a command needs the daemon, flume SHALL use the address in the FLUME_URL environment variable if set, and otherwise the address in the nearest file .flume/daemon.json found in the current folder or any folder above it (the workspace of that daemon).

#### Scenario: From a folder inside the workspace  {#s-bdbc}
*Verification*: **executable**
- **GIVEN** a daemon running for a workspace folder that holds a subfolder src
- **WHEN** flume status is run inside src
- **THEN** it prints the daemon's address and exits with code 0

#### Scenario: FLUME_URL wins  {#s-fe01}
*Verification*: **executable**
- **GIVEN** a daemon running for a workspace and FLUME_URL set to its address
- **WHEN** flume status is run in a folder outside the workspace
- **THEN** it prints the daemon's address and exits with code 0

### Requirement: Without a daemon, commands say so  {#r-67a9}
When a command needs the daemon and none answers, flume SHALL print to standard error exactly these two lines: "flume: the flume daemon is not running for this workspace." and "Ask the human to start it: flume serve (in its own pane)." and exit with code 1. flume SHALL NOT start a daemon itself.

#### Scenario: Daemon not running  {#s-41e6}
*Verification*: **executable**
- **GIVEN** a project with no daemon running and FLUME_URL unset
- **WHEN** flume task list is run
- **THEN** standard error is exactly the two lines "flume: the flume daemon is not running for this workspace." and "Ask the human to start it: flume serve (in its own pane).", and the exit code is 1

### Requirement: Version prints the version  {#r-5465}
When flume --version is run, it SHALL print the Flume version and git commit on one line to standard output and exit with code 0, without needing the daemon.

#### Scenario: Version offline  {#s-129b}
*Verification*: **executable**
- **GIVEN** no daemon running
- **WHEN** flume --version is run
- **THEN** one non-empty line is printed and the exit code is 0

#### Scenario: version as a command is unknown  {#s-7662}
*Verification*: **executable**
- **GIVEN** no daemon running
- **WHEN** flume version is run
- **THEN** standard error holds a usage message and the exit code is 2

### Requirement: Serve starts the daemon  {#r-495d}
When flume serve is run in a folder (the workspace) that holds a .flume folder (made by flume init), it SHALL start the daemon on the local machine only, write its address to .flume/daemon.json in that folder, print one line stating the address, and keep running until stopped, removing daemon.json when it stops; with --port N it SHALL listen on port N, and otherwise on a free port. The workspace folder need not be a git repository, and flume SHALL NOT run git init or create a repository.

#### Scenario: Serve prints its address  {#s-a4db}
*Verification*: **executable**
- **GIVEN** a git repository set up with flume init and no daemon running
- **WHEN** flume serve --port 0 is run
- **THEN** the first output line holds an address beginning http://127.0.0.1: and flume status then exits with code 0

#### Scenario: The flume folder is ignored  {#s-fe02}
*Verification*: **executable**
- **GIVEN** a git repository set up with flume init and no daemon running
- **WHEN** flume serve is run
- **THEN** the folder .flume holds daemon.json and a .gitignore whose content is *, and git status in the repository lists nothing untracked

### Requirement: Serve needs init  {#r-1d10}
When flume serve is run in a folder that has no .flume folder, flume SHALL print a message to standard error saying no flume workspace is here and to run flume init first, exit with code 1, and create nothing. flume serve SHALL NOT accept --root (exit code 2).

#### Scenario: Serve without init  {#s-1d01}
*Verification*: **executable**
- **GIVEN** a folder with no .flume folder
- **WHEN** flume serve is run
- **THEN** the exit code is 1, standard error says to run flume init first, and no .flume folder exists

#### Scenario: Serve takes no root option  {#s-1d02}
*Verification*: **executable**
- **GIVEN** a folder
- **WHEN** flume serve --root x is run
- **THEN** the exit code is 2

### Requirement: Help says agents never start serve  {#r-49f3}
flume SHALL say, in its top-level help, that the serve command is for the human and that agents never run it; flume serve --help SHALL print the serve usage and the line "Only the human runs flume serve, in its own pane. Agents never start it." and exit with code 0; and a serve usage error SHALL print that same line after its usage message.

#### Scenario: Top-level help serve line  {#s-7eb6}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume --help is run
- **THEN** standard output holds the line "  serve      run the daemon in the foreground [--port N] (the human runs this; agents never do)" and the exit code is 0

#### Scenario: Serve help  {#s-0396}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume serve --help is run
- **THEN** standard output holds "usage: flume serve [--port N]" and the line "Only the human runs flume serve, in its own pane. Agents never start it.", and the exit code is 0

#### Scenario: Serve usage error  {#s-f885}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume serve --bogus is run
- **THEN** standard error holds the line "Only the human runs flume serve, in its own pane. Agents never start it." and the exit code is 2

### Requirement: Serve chooses the task root  {#r-fe03}
When flume serve is run, it SHALL use as the task root, in this order: the root in .flume/config.yaml of the workspace folder; the current folder's git repository (main checkout). A relative path in config.yaml is relative to the workspace folder, and an absolute path also works. A config.toml in .flume is not read. When the task root is not a git repository, or there is none, flume SHALL print a message to standard error and exit with code 1.

#### Scenario: Root from config  {#s-fe04}
*Verification*: **executable**
- **GIVEN** a folder that is not a git repository holding a git repository named tasks, set up with flume init --root tasks
- **WHEN** flume serve is run
- **THEN** config.yaml in .flume holds root: tasks, and the server's task root is the tasks repository

#### Scenario: A bad flume.yaml stops serve  {#s-bdb3}
*Verification*: **executable**
- **GIVEN** a workspace set up with flume init, and then flume.yaml in the task repository edited to say dir: a/b
- **WHEN** flume serve is run
- **THEN** the exit code is 1 and standard error says flume.yaml dir must be . or one folder name

### Requirement: Init sets up a workspace  {#r-1d11}
When flume init [--root PATH] [--dir NAME] is run in a folder (the workspace, which need not be a git repository), flume SHALL create .flume in it with a .gitignore holding * and, when --root is given, a config.yaml holding root (relative to the workspace folder when inside it); the task root is --root, else the root in config.yaml, else the current folder's git repository (main checkout). When the task root has no flume.yaml, flume SHALL write one there holding dir: NAME (default flume; NAME is . or one plain folder name, else exit with code 2 and create nothing) and commit it as one commit, and when it has one flume SHALL keep it and exit with code 1, changing nothing, if --dir names a different folder. flume SHALL NOT copy any workflow into the task root, push, run git init, or write anything else in a project or in .flume. When the task root is not a git repository, or there is none, flume SHALL print a message to standard error saying there is no task root, exit with code 1, and create nothing. flume init SHALL NOT accept --force.

#### Scenario: Init in a workspace  {#s-1d03}
*Verification*: **executable**
- **GIVEN** a folder that is not a git repository holding a git repository named tasks
- **WHEN** flume init --root tasks is run in the folder
- **THEN** .flume holds a .gitignore of * and config.yaml with root: tasks, tasks/flume.yaml holds dir: flume and is committed in tasks as one new commit, and the folder is not a git repository

#### Scenario: Init in a repository  {#s-1d06}
*Verification*: **executable**
- **GIVEN** a git repository
- **WHEN** flume init is run in it
- **THEN** flume.yaml in the repository holds dir: flume, git status lists nothing, and there is no workflow folder

#### Scenario: Init with another folder name  {#s-91f1}
*Verification*: **executable**
- **GIVEN** a git repository
- **WHEN** flume init --dir . is run in it
- **THEN** flume.yaml in the repository holds dir: .

#### Scenario: Init with no task root  {#s-1d07}
*Verification*: **executable**
- **GIVEN** a folder that is not a git repository
- **WHEN** flume init is run
- **THEN** the exit code is 1, standard error says there is no task root, and no .flume folder exists

### Requirement: Init again changes nothing  {#r-1d12}
When flume init is run in a folder that already has a .flume folder, it SHALL print a message to standard error saying the folder is already set up, exit with code 1, and change nothing.

#### Scenario: Second init  {#s-1d04}
*Verification*: **executable**
- **GIVEN** a workspace already set up with flume init
- **WHEN** flume init is run again
- **THEN** the exit code is 1, standard error says the folder is already set up, and the task repository has no new commit

#### Scenario: Force is gone  {#s-88ec}
*Verification*: **executable**
- **GIVEN** a git repository
- **WHEN** flume init --force is run in it
- **THEN** the exit code is 2 and no .flume folder exists

### Requirement: A second serve is refused  {#r-6579}
When flume serve is run in a workspace folder whose .flume/daemon.json names a running daemon, it SHALL print a message naming the running daemon's address to standard error and exit with code 1.

#### Scenario: Two serves  {#s-7e28}
*Verification*: **executable**
- **GIVEN** a daemon running for a workspace
- **WHEN** flume serve is run again in the workspace folder
- **THEN** the exit code is 1 and standard error names the first daemon's address

### Requirement: Status reports whether the daemon runs  {#r-4ebf}
When flume status is run, it SHALL print the daemon's address and the task root and exit with code 0 if the daemon answers, and otherwise print "not running" and exit with code 1.

#### Scenario: Status when stopped  {#s-62cc}
*Verification*: **executable**
- **GIVEN** no daemon running
- **WHEN** flume status is run
- **THEN** it prints not running and exits with code 1

### Requirement: Stop ends the daemon  {#r-563a}
When flume stop is run, it SHALL ask the daemon to exit, wait until it has, and exit with code 0; when no daemon runs it SHALL print "not running" and exit with code 1.

#### Scenario: Stop then status  {#s-8ee4}
*Verification*: **executable**
- **GIVEN** a daemon running
- **WHEN** flume stop is run, then flume status
- **THEN** stop exits with code 0 and status prints not running with exit code 1

### Requirement: Task new creates a task  {#r-9812}
When flume task new is run with a title, flume SHALL create the task and print its ID and the path of its folder relative to the project root, separated by one space, on one line; options are -k or --kind (default feature), --project NAME, --parent ID, --blocked-by IDS and --related IDS (comma separated lists), and the body as --body TEXT or --body-file PATH (a dash means standard input).

#### Scenario: New with a body from standard input  {#s-f616}
*Verification*: **executable**
- **GIVEN** a daemon running for a project
- **WHEN** flume task new "Fix redirect" -k bug --body-file - is run with the text Users land on the home page on standard input
- **THEN** one line is printed with a 4 character ID and a path under flume/tasks/open, and that task's body.md is Users land on the home page

#### Scenario: Default kind  {#s-803e}
*Verification*: **executable**
- **GIVEN** a daemon running for a project
- **WHEN** flume task new "Add search" is run
- **THEN** the new task's kind is feature

#### Scenario: Bad parent  {#s-a33e}
*Verification*: **executable**
- **GIVEN** a daemon running and no task with ID abcd
- **WHEN** flume task new "Child" --parent abcd is run
- **THEN** the exit code is 1, standard error says no task abcd, and no file is written

#### Scenario: Links and a body argument  {#s-5a1c}
*Verification*: **executable**
- **GIVEN** open tasks k7tm and q3rp
- **WHEN** flume task new "Follow up" --blocked-by k7tm --related q3rp --body "Details here" is run
- **THEN** the new task's task.yaml has blocked_by holding k7tm and related holding q3rp, and its body.md is Details here

### Requirement: Task commands take --json  {#r-3d7e}
When any flume task command is given --json, flume SHALL print the daemon's JSON answer (a task object, or a list of task objects for list) to standard output instead of the human-readable form; errors stay on standard error with exit code 1.

#### Scenario: List as JSON  {#s-6b2f}
*Verification*: **executable**
- **GIVEN** two open tasks
- **WHEN** flume task list --json is run
- **THEN** standard output is a JSON list of two task objects, each with an id, title, kind and state

#### Scenario: Task usage error  {#s-0c9d}
*Verification*: **executable**
- **GIVEN** any project
- **WHEN** flume task new is run with no title, and flume task list --bogus is run
- **THEN** both print a usage message to standard error and exit with code 2

### Requirement: Task show prints the task  {#r-c36b}
When flume task show is run with an ID, flume SHALL print the task's task.yaml exactly as stored, then a blank line, then body.md exactly as stored, then (when comments.md exists) a blank line and comments.md exactly as stored, to standard output and exit with code 0; for an ID that names no task it SHALL print a message to standard error and exit with code 1.

#### Scenario: Show by bare ID  {#s-e485}
*Verification*: **executable**
- **GIVEN** an open task with ID k7tm
- **WHEN** flume task show k7tm is run
- **THEN** the output is task.yaml, a blank line and body.md of that task, as stored

#### Scenario: Show finds a resolved task  {#s-13df}
*Verification*: **executable**
- **GIVEN** a resolved task with ID k7tm
- **WHEN** flume task show k7tm is run
- **THEN** the output is task.yaml, a blank line and body.md of the task in resolved, as stored

### Requirement: Task list prints one line per task  {#r-1a8b}
When flume task list is run, it SHALL print one line per task, ordered by created date and then ID, each with the ID, kind, state (open or resolved), and title separated by single tabs; it SHALL list open tasks unless --closed (resolved only) or --all (both) is given, and --kind K and --parent ID SHALL keep only matching tasks.

#### Scenario: Default is open only  {#s-9e76}
*Verification*: **executable**
- **GIVEN** two open tasks and one resolved task
- **WHEN** flume task list is run
- **THEN** two lines are printed, both with state open

#### Scenario: Filter by parent  {#s-c56f}
*Verification*: **executable**
- **GIVEN** an epic with two children and one unrelated open task
- **WHEN** flume task list --parent with the epic's ID is run
- **THEN** exactly the two children are printed

#### Scenario: Closed and all  {#s-fcb0}
*Verification*: **executable**
- **GIVEN** two open tasks and one resolved task
- **WHEN** flume task list --closed is run, and then flume task list --all
- **THEN** the first prints one line with state resolved and the second prints three lines

### Requirement: Task update changes one field  {#r-6eca}
When flume task update is run with an ID, a field and a value, flume SHALL set that field in the task's task.yaml and print nothing else; the fields are title, kind, parent, blocked-by and related; for blocked-by and related the value is a comma separated list of IDs, and an empty value clears a field; an unknown field or a value that would break a rule of the task-files spec SHALL be refused with exit code 1 and the file left unchanged.

#### Scenario: Set blocked-by  {#s-9277}
*Verification*: **executable**
- **GIVEN** open tasks k7tm and q3rp
- **WHEN** flume task update k7tm blocked-by q3rp is run
- **THEN** the task.yaml of k7tm has blocked_by holding q3rp

#### Scenario: Unknown field refused  {#s-4fd6}
*Verification*: **executable**
- **GIVEN** an open task k7tm
- **WHEN** flume task update k7tm color red is run
- **THEN** the exit code is 1 and task.yaml is byte for byte unchanged

#### Scenario: Clear the parent  {#s-cf95}
*Verification*: **executable**
- **GIVEN** an open task with a parent
- **WHEN** flume task update with that task's ID, the field parent and an empty value is run
- **THEN** task.yaml has no parent field

### Requirement: Task comment adds a comment  {#r-52c7}
When flume task comment is run with an ID and text (as an argument after --text, or from a file with --body-file PATH, where a dash means standard input), flume SHALL add the text as a comment per the task-files spec (appended to comments.md, each comment under a heading ### header), using the AGENT_NAME environment variable as the author when it is set and the operating system user name otherwise, and leave task.yaml and body.md unchanged; with neither --text nor --body-file it SHALL exit 2.

#### Scenario: Two comments in order  {#s-2660}
*Verification*: **executable**
- **GIVEN** an open task with the default body and AGENT_NAME set to scout
- **WHEN** flume task comment adds First and then adds Second
- **THEN** comments.md holds a header line ending in ", scout" and First, then a header line ending in ", scout" and Second, in that order

### Requirement: Task close and reopen change the state  {#r-7226}
When flume task close is run with an ID, flume SHALL resolve the task, and when flume task reopen is run it SHALL reopen it, per the task-files spec; closing a resolved task or reopening an open task SHALL exit with code 1 and change nothing.

#### Scenario: Close twice  {#s-b27b}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** flume task close is run twice with its ID
- **THEN** the first exits with code 0 and the second with code 1, and the file is in resolved

### Requirement: Check runs the task file check  {#r-b850}
When flume check is run, it SHALL print the result of the check described in the task-files spec, one problem per line, and exit with code 0 when there are none and 1 otherwise; it SHALL work without a running daemon.

#### Scenario: Check offline  {#s-8645}
*Verification*: **executable**
- **GIVEN** no daemon running and a project with one task whose id differs from its folder name
- **WHEN** flume check is run
- **THEN** one problem line names that task folder and the exit code is 1

### Requirement: Status takes --json  {#r-9bef}

When flume status is run with --json, flume SHALL print one JSON object on standard output with the keys running (true or false), address and root, and exit with the same code as without --json.

#### Scenario: Status as JSON when running  {#s-458a}

*Verification*: **executable**
- **GIVEN** a daemon running in a workspace
- **WHEN** flume status --json is run
- **THEN** standard output is one JSON object with running true, the daemon's address and the task root, and the exit code is 0

#### Scenario: Status as JSON when stopped  {#s-7007}

*Verification*: **executable**
- **GIVEN** no daemon running
- **WHEN** flume status --json is run
- **THEN** standard output is one JSON object with running false and null address and root, and the exit code is 1

### Requirement: Check takes --json  {#r-d801}

When flume check is run with --json, flume SHALL print one JSON array on standard output, with one object per problem holding path and message (an empty array when there are none), and exit with the same code as without --json.

#### Scenario: Check as JSON with no problems  {#s-938a}

*Verification*: **executable**
- **GIVEN** no daemon running and valid task files
- **WHEN** flume check --json is run
- **THEN** standard output is an empty JSON array and the exit code is 0

#### Scenario: Check as JSON with a problem  {#s-2e9d}

*Verification*: **executable**
- **GIVEN** no daemon running and a task whose id differs from its folder name
- **WHEN** flume check --json is run
- **THEN** standard output is a JSON array of one object whose path names that task folder and whose message is not empty, and the exit code is 1
