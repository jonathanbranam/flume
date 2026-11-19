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

### Requirement: Every command prints its usage with --help  {#r-7fd1}
When --help (or -h) is given to flume, to any command or to any subcommand, flume SHALL print that command's usage to standard output, do nothing else and exit with code 0; flume help followed by a command, and a subcommand if it has one, SHALL print exactly what --help prints for it. Every command and subcommand listed in the top-level help or in a group's help is covered.

#### Scenario: Help on every listed command  {#s-1df5}
*Verification*: **executable**
- **GIVEN** any folder with no daemon running
- **WHEN** flume --help is run, and then --help and help are run on every command listed in the top-level help and on every subcommand listed in each group's help
- **THEN** each prints a usage line to standard output, nothing to standard error, exits with code 0, and flume help prints the same text as --help for the same command

### Requirement: Help prints guides  {#r-99ef}
When flume help is run with no argument, flume SHALL print the list of help topics (install, setup and usage), one line each with a one-line summary, and say how to print one, and exit with code 0; when flume help TOPIC is run, flume SHALL print that topic's guide to standard output and exit with code 0; when the argument is neither a topic nor a command, flume SHALL print the topic list to standard error and exit with code 1; and no topic name SHALL be the name of a command. The top-level help SHALL list the help command and say, before the command list, what flume is and that flume help setup is the place to start.

#### Scenario: The topic list  {#s-b8ca}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume help is run
- **THEN** standard output names install, setup and usage, each with a summary, and the exit code is 0

#### Scenario: Each topic prints  {#s-71b0}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume help install, flume help setup and flume help usage are run
- **THEN** each prints a non-empty guide to standard output, nothing to standard error, and exits with code 0

#### Scenario: An unknown topic  {#s-56a4}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume help frobnicate is run
- **THEN** standard output is empty, standard error holds the topic list, and the exit code is 1

#### Scenario: Topics are never commands  {#s-3e8e}
*Verification*: **executable**
- **GIVEN** the commands listed in the top-level help
- **WHEN** each help topic name is compared with them
- **THEN** no topic name is a command name

#### Scenario: The top-level help lists help  {#s-6710}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume --help is run
- **THEN** standard output lists the help command, mentions flume help setup before the command list, and the exit code is 0

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
- **THEN** standard output lists the serve command with a description saying the human runs it and agents never do, and the exit code is 0

#### Scenario: Serve help  {#s-0396}
*Verification*: **executable**
- **GIVEN** any folder
- **WHEN** flume serve --help is run
- **THEN** standard output holds the usage line "Usage: flume serve [options]" and the line "Only the human runs flume serve, in its own pane. Agents never start it.", and the exit code is 0

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
When flume init [--root PATH] [--dir NAME] is run in a folder (the workspace, which need not be a git repository), flume SHALL create .flume in it (if missing) with a .gitignore holding * and, when --root is given, a config.yaml holding root (relative to the workspace folder when inside it; without --root an existing config.yaml is kept); the task root is --root, else the root in config.yaml, else the current folder's git repository (main checkout). When the task root has no flume.yaml, flume SHALL write one there holding dir: NAME (default flume; NAME is . or one plain folder name, else exit with code 2 and create nothing) and commit it as one commit, and when it has one flume SHALL keep it unchanged and exit with code 1, changing nothing, if --dir names a different folder. flume SHALL NOT copy any workflow into the task root, push, run git init, start the daemon, create task folders, or write anything else in a project or in .flume. When the task root is not a git repository, or there is none, flume SHALL print a message to standard error saying there is no task root, exit with code 1, and create nothing. flume init SHALL NOT accept --force.

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

#### Scenario: Force is gone  {#s-88ec}
*Verification*: **executable**
- **GIVEN** a git repository
- **WHEN** flume init --force is run in it
- **THEN** the exit code is 2 and no .flume folder exists

### Requirement: Init does not look at projects  {#r-e839}
When flume init is run, flume SHALL NOT read or check the projects in flume.yaml or look for their folders, and it SHALL NOT accept --clone (an unknown option, exit code 2). It SHALL end by telling the human that flume project clone clones the projects and that flume serve is run in the workspace.

#### Scenario: Init ignores project folders  {#s-9b23}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists a project backend whose folder is not there
- **WHEN** flume init is run
- **THEN** the exit code is 0, the output mentions flume project clone and flume serve but not backend, and no backend folder exists

#### Scenario: Init no longer clones  {#s-9766}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists a project backend
- **WHEN** flume init --clone is run
- **THEN** the exit code is 2 and no backend folder exists

#### Scenario: Init again is safe  {#s-1d04}
*Verification*: **executable**
- **GIVEN** a workspace already set up with flume init
- **WHEN** flume init is run again
- **THEN** the exit code is 0 and the task repository has no new commit

### Requirement: Project clone clones projects  {#r-7e4b}
When flume project clone [<name>...] [--json] is run in a workspace, flume SHALL clone each named project, or every project in flume.yaml when no name is given, into <workspace>/<name>/ (on the project's branch when flume.yaml gives one, else the repository's own default branch). It SHALL skip, with a line saying so, a project whose folder already exists (leaving it unchanged) and a project with no URL; report a failed clone on standard error with the project's name and URL and carry on with the rest; and be safe to run again. It SHALL exit with code 0 when no clone failed, 1 when any failed, and 2 for a name not in flume.yaml or an unknown option. With --json it SHALL print one JSON array on standard output with one object per project holding name and status (cloned, skipped or failed) and, for skipped and failed, reason. It SHALL work without a running daemon.

#### Scenario: Project clone on a branch  {#s-5c01}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists a project backend with a branch develop of a local repository
- **WHEN** flume project clone is run
- **THEN** the exit code is 0 and backend holds a clone with develop checked out

#### Scenario: A failed clone is reported and the rest carry on  {#s-7930}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists a project bad with a URL that is not a repository, then a project good with a local repository
- **WHEN** flume project clone is run
- **THEN** the exit code is 1, standard error names bad and its URL, and the good folder holds a clone

#### Scenario: An existing folder is skipped  {#s-3782}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists a project backend and a folder backend already holding a file
- **WHEN** flume project clone is run
- **THEN** the exit code is 0, the output says backend was skipped, and the file in backend is unchanged

#### Scenario: Named projects only, with JSON  {#s-5c02}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists backend and frontend (local repositories), with the backend folder already there
- **WHEN** flume project clone frontend --json and flume project clone --json are run
- **THEN** the first prints one record, frontend cloned, and the second prints backend skipped with a reason and frontend skipped with a reason

#### Scenario: Unknown project name  {#s-5c03}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists backend
- **WHEN** flume project clone nosuch is run
- **THEN** the exit code is 2 and no folder is made

#### Scenario: A project with no URL is skipped  {#s-5c04}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists a project with no url
- **WHEN** flume project clone --json is run
- **THEN** the exit code is 0 and the record for the project has status skipped

### Requirement: Clone sets up a workspace from the tasks repository  {#r-1dd4}
When flume clone <git-url> [<workspace>] is run, flume SHALL use the current folder, or <workspace> when given, as the workspace (making it if missing), clone the tasks repository into it as a folder named after the repository (the last part of the URL without .git), then run flume init there with the clone as the task root, and then flume project clone for every project. It SHALL NOT start the daemon, and it SHALL end by telling the human to run flume serve in the workspace. When the clone fails, or the folder for the tasks repository already exists, it SHALL print a message to standard error and exit with code 1; with no URL, or an unknown option, it SHALL exit with code 2.

#### Scenario: Clone makes the whole workspace  {#s-2a1f}
*Verification*: **executable**
- **GIVEN** a local tasks repository named fluff-flume whose flume.yaml lists a project backend of a local repository
- **WHEN** flume clone with the repository's path and a workspace path that does not exist yet is run
- **THEN** the exit code is 0, the workspace holds fluff-flume and backend, and .flume/config.yaml holds root: fluff-flume

#### Scenario: Clone into the current folder  {#s-bc32}
*Verification*: **executable**
- **GIVEN** a local tasks repository named fluff-flume and an empty folder
- **WHEN** flume clone with the repository's path is run in the folder
- **THEN** the exit code is 0 and the folder holds fluff-flume and .flume

#### Scenario: Clone of a bad URL  {#s-566d}
*Verification*: **executable**
- **GIVEN** an empty folder
- **WHEN** flume clone with a path that is not a repository is run in it
- **THEN** the exit code is 1, standard error says the clone failed, and no .flume folder exists

#### Scenario: Clone without a URL  {#s-e816}
*Verification*: **executable**
- **GIVEN** an empty folder
- **WHEN** flume clone is run with no arguments
- **THEN** the exit code is 2

### Requirement: Project list shows the projects  {#r-de77}
When flume project list is run in a workspace, flume SHALL print one line per project in flume.yaml with its name, URL and branch (blank when not set), separated by tabs, and SHALL NOT look at project folders; with --json it SHALL print one JSON array on standard output of objects with name, url and branch (empty string when not set). It SHALL work without a running daemon.

#### Scenario: List as text and JSON  {#s-52c6}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml lists backend with branch develop and frontend with no branch, and no project folders
- **WHEN** flume project list and flume project list --json are run
- **THEN** the text has the line backend, its URL and develop, and the line frontend, its URL and an empty branch, and the JSON is the same data without any present or missing field

### Requirement: Project add sets a project up  {#r-b6a8}
When flume project add <git-url | name> [--name NAME] [--branch BRANCH] is run in a workspace, flume SHALL treat the argument as a git URL when it contains "://", or has the form user@host:path, or contains a path separator; otherwise it SHALL treat it as the project's name. For a URL, flume SHALL add the project to flume.yaml (the name defaults to the last part of the URL without .git; branch is written only when --branch is given), commit flume.yaml in the tasks repository as one commit, and clone the project into <workspace>/<name>/ as flume project clone does. For a name, flume SHALL add the project to flume.yaml with no url, commit it the same way, and clone nothing; it SHALL print a warning to standard error that the project has no URL and so cannot be set up on another machine until a url is added to flume.yaml, and exit with code 0. It SHALL refuse, changing nothing and exiting with code 1, when the name is already in flume.yaml, or, for a URL, when <workspace>/<name>/ exists and is not a clone of that URL. It SHALL refuse, changing nothing and exiting with code 2, a name given with --branch, or a name given with --name. It SHALL NOT start the daemon or push.

#### Scenario: Add a project  {#s-9440}
*Verification*: **executable**
- **GIVEN** a workspace set up with flume init and a local repository
- **WHEN** flume project add with that repository's path and --branch develop is run
- **THEN** the exit code is 0, flume.yaml lists the project under the repository's name with url and branch develop, the task repository has one new commit, and the project is cloned in the workspace

#### Scenario: Add a project by name, with no URL  {#s-8d3e}
*Verification*: **executable**
- **GIVEN** a workspace set up with flume init
- **WHEN** flume project add backend is run
- **THEN** the exit code is 0, standard error warns that project backend has no URL, flume.yaml lists backend with no url, the task repository has one new commit, and no folder backend is made in the workspace

#### Scenario: Add by name refuses a branch  {#s-f003}
*Verification*: **executable**
- **GIVEN** a workspace set up with flume init
- **WHEN** flume project add backend --branch develop is run
- **THEN** the exit code is 2 and flume.yaml and the task repository's history are unchanged

#### Scenario: Add refuses a known name  {#s-bd6a}
*Verification*: **executable**
- **GIVEN** a workspace whose flume.yaml already lists backend
- **WHEN** flume project add is run with --name backend
- **THEN** the exit code is 1 and flume.yaml and the task repository's history are unchanged

#### Scenario: Add refuses a folder in the way  {#s-9cec}
*Verification*: **executable**
- **GIVEN** a workspace with a folder backend that is not a repository
- **WHEN** flume project add is run with --name backend
- **THEN** the exit code is 1 and flume.yaml and the task repository's history are unchanged

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
When flume task new is run with a title, flume SHALL create the task and print its ID alone on one line (no path in the tasks repository); options are -k or --kind (default feature), --project NAME, --parent ID, --blocked-by IDS and --related IDS (comma separated lists), and the body as --body TEXT or --body-file PATH (a dash means standard input).

#### Scenario: New with a body from standard input  {#s-f616}
*Verification*: **executable**
- **GIVEN** a daemon running for a project
- **WHEN** flume task new "Fix redirect" -k bug --body-file - is run with the text Users land on the home page on standard input
- **THEN** one line is printed holding only a 4 character ID, and that task's body is Users land on the home page

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
When flume task show is run with an ID, flume SHALL print the task's task.yaml exactly as stored, then a blank line, then the line "parts: " and the names of the parts the task has, separated by a comma and a space, then the line "For what to do now: flume task instructions ID" (with the ID as given; not in --json), to standard output and exit with code 0; for an ID that names no task it SHALL print a message to standard error and exit with code 1. (The text of one part: see the workflow spec.)

#### Scenario: Show by bare ID  {#s-e485}
*Verification*: **executable**
- **GIVEN** an open task with ID k7tm
- **WHEN** flume task show k7tm is run
- **THEN** the output is task.yaml as stored, a blank line, the line parts: body and the line For what to do now: flume task instructions followed by the ID as given

#### Scenario: Show finds a resolved task  {#s-13df}
*Verification*: **executable**
- **GIVEN** a resolved task with ID k7tm
- **WHEN** flume task show k7tm is run
- **THEN** the output is task.yaml as stored, a blank line, the line parts: body and the line For what to do now: flume task instructions followed by the ID as given

### Requirement: Task list prints one line per task  {#r-1a8b}
When flume task list is run, it SHALL print one line per task, ordered by created date and then ID, each with the ID, kind, state (open or resolved), phase, assignee (empty when none) and title separated by single tabs; it SHALL list open tasks unless --closed (resolved only) or --all (both) is given, and --kind K and --parent ID SHALL keep only matching tasks (more filters: the workflow spec).

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
When flume task comment is run with an ID and text (as an argument after --text, or from a file with --body-file PATH, where a dash means standard input), flume SHALL add the text as a comment per the task-files spec (appended to comments.md, each comment under a heading ### header), using the actor (AGENT_NAME when set; agent-<first 8 characters of CLAUDE_CODE_SESSION_ID> or agent-unknown when CLAUDECODE is set; see the workflow spec) as the author, and the operating system user name otherwise, and leave task.yaml and body.md unchanged; with neither --text nor --body-file it SHALL exit 2.

#### Scenario: Two comments in order  {#s-2660}
*Verification*: **executable**
- **GIVEN** an open task with the default body and AGENT_NAME set to scout
- **WHEN** flume task comment adds First and then adds Second
- **THEN** comments.md holds a header line ending in ", scout" and First, then a header line ending in ", scout" and Second, in that order

### Requirement: Task close and reopen change the state  {#r-7226}
When flume task close is run with an ID, flume SHALL resolve the task as done; when it is run with --dropped REASON, flume SHALL resolve it as dropped and add REASON as a comment (an empty or missing REASON is a usage error, exit code 2, with nothing changed); and when flume task reopen is run it SHALL reopen it, per the task-files spec; closing a resolved task or reopening an open task SHALL exit with code 1 and change nothing.

#### Scenario: Close twice  {#s-b27b}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** flume task close is run twice with its ID
- **THEN** the first exits with code 0 and the second with code 1, and the file is in resolved

#### Scenario: Close as dropped  {#s-e7f4}
*Verification*: **executable**
- **GIVEN** an open task
- **WHEN** flume task close is run with its ID and --dropped Duplicate of abcd, and a second task is closed with --dropped and an empty reason
- **THEN** the first exits with code 0, its folder is in archive/tasks with resolution dropped and its comments hold Duplicate of abcd, and the second exits with code 2 and stays open

### Requirement: Check runs the task file check  {#r-b850}
When flume check is run, it SHALL print the result of the check described in the task-files spec, one problem per line, and exit with code 0 when there are none and 1 otherwise; it SHALL work without a running daemon.

#### Scenario: Check offline  {#s-8645}
*Verification*: **executable**
- **GIVEN** no daemon running and a project with one task whose id differs from its folder name
- **WHEN** flume check is run
- **THEN** one problem line names that task folder and the exit code is 1

### Requirement: Check reports bad guides  {#r-353a}
When flume check is run, it SHALL also report each guide file (base/guides/NAME.md or projects/PROJECT/guides/NAME.md of the flume root) whose front matter is missing, unparsable, not flat, has a name differing from the file name, or has no description, as one problem naming the file.

#### Scenario: Guide without front matter  {#s-0630}
*Verification*: **executable**
- **GIVEN** a base/guides/deploy.md with no front matter
- **WHEN** flume check is run
- **THEN** one problem line names base/guides/deploy.md and the exit code is 1

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
