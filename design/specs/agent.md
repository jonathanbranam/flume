# Agent launcher

flume launches Claude Code as a named agent, keeps a machine-wide registry of agents, and prints the prime text it sends. No command here needs the daemon. Tickets: fl-macf, fl-xv3z.

Assumptions (recorded on fl-macf and fl-xv3z): the name is given only by --name; the one bare argument is the prompt; exit code 2 is wrong usage, 1 a refusal or failure.

## Requirements

### Requirement: Launch  {#r-a1c0}

When the user runs "flume agent --name <name>", flume SHALL record the agent in the registry, run claude as a child process with the environment variable AGENT_NAME set to the name, and exit with claude's exit code.

#### Scenario: Launch by name  {#s-a1c1}

*Verification*: **executable**

- **GIVEN** a home folder with no agents and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha
- **THEN** claude runs once with AGENT_NAME set to alpha
- **AND** the file agents/alpha.yaml under the .flume folder of the home folder holds the name alpha
- **AND** the exit code equals the exit code of claude

#### Scenario: Name with an equals sign  {#s-a1c2}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the argument --name=alpha
- **THEN** AGENT_NAME is alpha

### Requirement: Argument parsing  {#r-a2c0}

Before "--", flume SHALL accept only the options --name <n>, --name=<n>, --project <p>, --role <r>, --force, -h and --help and one bare argument, the prompt, in any order, and SHALL treat a bare argument as the prompt and never as the agent name; flume SHALL pass every argument after "--" to claude unchanged and in order.

#### Scenario: Options before the prompt  {#s-a2c1}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --project web --name alpha
- **THEN** AGENT_NAME is alpha and AGENT_PROJECT is web

#### Scenario: Claude arguments after the double dash  {#s-a2c2}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha -- --model=opus --force -p
- **THEN** claude receives --model=opus, --force and -p in that order
- **AND** no pane check is bypassed by that --force

#### Scenario: Claude option before the double dash  {#s-a2c4}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha --add-dir ../lib "fix the bug"
- **THEN** the exit code is 2 and claude does not run
- **AND** standard error is exactly two lines: "flume: unknown option --add-dir" and "Claude options go after --, as in: flume agent \<prompt\> -- --add-dir ..."

#### Scenario: Name option before the double dash  {#s-a2c5}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha -n other
- **THEN** the exit code is 2 and claude does not run
- **AND** the first line of standard error is "flume: unknown option -n"

#### Scenario: A bare argument is not a name  {#s-a2c3}

*Verification*: **executable**

- **GIVEN** a home folder, claude on the path and no tmux pane option
- **WHEN** the user runs flume agent with the argument alpha
- **THEN** claude does not run, the exit code is 2 and no agents/alpha.yaml file exists

### Requirement: Claude option values  {#r-d1c0}

flume SHALL parse the arguments for claude by claude's own option rules: an option that takes one value (for example --model, --permission-mode, --settings) takes the next argument, an option that takes several values (--add-dir, --allowedTools, --disallowedTools, --tools, --mcp-config, --betas, --file) takes every following argument that does not start with a dash, an option with an optional value (for example --resume, -r, --debug, -d, --worktree, -w) takes the next argument only when it does not start with a dash, and "option=value" carries its value; flume SHALL NOT take a value as the prompt.

#### Scenario: Value before and after the prompt  {#s-d1c1}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha --model opus "do xyz"
- **THEN** claude receives --model followed by opus
- **AND** the last argument of claude is "do xyz"

#### Scenario: Several values  {#s-d1c2}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha --add-dir a b -- "do xyz"
- **THEN** claude receives --add-dir, a and b in that order
- **AND** the last argument of claude is "do xyz"

#### Scenario: Optional value  {#s-d1c3}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha --resume --model opus
- **THEN** claude receives --resume followed by --model and opus

### Requirement: Registry entry  {#r-a3c0}

flume SHALL store one YAML file per agent name at .flume/agents/<name>.yaml in the home folder, a flat mapping of string values holding name, project (empty when none), role (empty when none), pane, created and last_launch (and last_seen once the daemon has set it), and when "--project" is not given SHALL use the project saved on the entry, and likewise when "--role" is not given SHALL use the role saved on the entry. flume SHALL NOT read a .json file in that folder, and SHALL ignore it in list and show. flume SHALL accept only a name of lowercase letters, digits and dashes that starts with a letter or digit, and SHALL refuse any other name with exit code 2, naming the name and the allowed pattern on standard error, before it reads or writes the registry or runs claude.

#### Scenario: Project is saved and reused  {#s-a3c1}

*Verification*: **executable**

- **GIVEN** an agent alpha launched once with --project web
- **WHEN** the user runs flume agent alpha again without --project
- **THEN** AGENT_PROJECT is web and the entry still holds the project web

#### Scenario: Role is saved and reused  {#s-a615}

*Verification*: **executable**

- **GIVEN** an agent alpha launched once with --role worker
- **WHEN** the user runs flume agent alpha again without --role
- **THEN** the entry still holds the role worker, and flume agent show alpha prints role: worker

#### Scenario: Name outside the pattern is refused  {#s-a3c2}

*Verification*: **executable**

- **GIVEN** a home folder with no agents and claude on the path
- **WHEN** the user runs flume agent with the arguments --name ../evil
- **THEN** the exit code is 2 and standard error names ../evil and the allowed pattern
- **AND** claude does not run
- **AND** the home folder holds no .flume folder

#### Scenario: A JSON entry is not read  {#s-a3c3}

*Verification*: **executable**

- **GIVEN** a home folder with the file agents/old.json holding a valid entry for old with project web
- **WHEN** the user runs flume agent list, and then flume agent show old
- **THEN** list does not show old and show exits 1

### Requirement: Name from the pane  {#r-a4c0}

When no --name is given, flume SHALL read the name from the tmux pane option @flume_agent of the current pane, and when there is none SHALL print to standard error that the agent has no name and to start again with --name <name>, then below it the whole command as typed, on its own line starting at the left edge and quoted for the shell so that it can be pasted back, and SHALL exit with code 2.

#### Scenario: Name read from the pane  {#s-a4c1}

*Verification*: **executable**

- **GIVEN** a tmux pane %1 whose @flume_agent option is alpha
- **WHEN** the user runs flume agent in that pane with no arguments
- **THEN** AGENT_NAME is alpha

#### Scenario: No name anywhere  {#s-a4c2}

*Verification*: **executable**

- **GIVEN** no tmux pane option
- **WHEN** the user runs flume agent with the arguments "pick up it's xyz" --model opus
- **THEN** the exit code is 2 and claude does not run
- **AND** standard error mentions --name
- **AND** standard error has a line, starting at the left edge, equal to: flume agent 'pick up it'\''s xyz' --model opus

### Requirement: One pane per agent  {#r-a5c0}

When the entry records a pane other than the current one, flume SHALL refuse to launch, name that pane on standard error and exit with code 1, unless --force is given; flume SHALL NOT check whether the recorded pane still exists. On launch flume SHALL record the current pane and, inside tmux, set the pane option @flume_agent of the current pane to the name.

#### Scenario: Refused when tied to another pane  {#s-a5c1}

*Verification*: **executable**

- **GIVEN** an entry for alpha recording pane %7
- **WHEN** the user runs flume agent alpha in pane %1
- **THEN** claude does not run, standard error names %7 and the exit code is 1

#### Scenario: Forced  {#s-a5c2}

*Verification*: **executable**

- **GIVEN** an entry for alpha recording pane %7
- **WHEN** the user runs flume agent alpha with --force in pane %1
- **THEN** claude runs, the entry records pane %1 and the pane option @flume_agent is set to alpha

### Requirement: Prime in the system prompt  {#r-a6c0}

flume SHALL pass claude the prime text (as flume prime prints it for the same name, project and role) with --append-system-prompt, SHALL pass claude --name <agent>, and SHALL NOT put the prime text in the prompt.

#### Scenario: Prime contents  {#s-a6c1}

*Verification*: **executable**

- **GIVEN** an agent alpha with project web
- **WHEN** the user runs flume agent --name alpha "pick up xyz"
- **THEN** claude receives --append-system-prompt followed by text containing "You are agent alpha" and "You are working on project web, stored in $AGENT_PROJECT." and "CLAUDE.md"
- **AND** the prime text also contains "Use the flume CLI to work with tasks"
- **AND** the prime text also says never to start flume serve and to ask the human to start it
- **AND** claude receives --name followed by alpha
- **AND** the last argument of claude is exactly "pick up xyz"

### Requirement: First prompt  {#r-a7c0}

flume SHALL always give claude a first prompt as the last argument, after a closing "--": the prompt the user gave, exactly, or when none was given the text under the H1 of the merged first-prompt.md (the workflow-layers spec; the shipped one asks the agent to check its tickets and status, suggest next steps and follow up).

#### Scenario: Default prompt  {#s-a7c1}

*Verification*: **executable**

- **GIVEN** an agent alpha
- **WHEN** the user runs flume agent --name alpha --add-dir x
- **THEN** the last argument of claude is not empty and does not contain "You are agent alpha"
- **AND** the argument before it is --

### Requirement: Prime prints the workflow from the daemon  {#r-1d13}
When flume prime or flume agent builds the prime text, flume SHALL ask the daemon (the prime endpoint of the api spec) with the agent's project and role, and print what it returns in one workflow element (see the requirement on the XML layout): the merged workflow document, then the merged project document (when a project is known), then the merged role document (when a role is given and a file of it exists), each separated by a blank line, merged as the workflow-layers spec says, with a missing file skipped without an error. flume SHALL NOT tell the agent to read workflow files, SHALL NOT read the flume root's files itself, and SHALL NOT start the daemon. When a layered file used has an error, flume SHALL print the errors (file, line and heading) to standard error and exit with code 1, printing no prime text (flume agent SHALL NOT start claude). When the daemon refuses the request for another reason, flume SHALL print the shipped workflow and project documents followed by a workflow_missing element holding one line saying the workflow text is missing, and exit with code 0. When no daemon answers, flume SHALL print a workflow element holding the shipped documents alone and then, depending on the folder, and exit with code 0: if a .flume folder is found in the current folder or the nearest one above it (other than the home folder's own .flume), a server_not_running element naming that workspace folder, saying flume looks set up there but its server is not running and asking the human to run flume serve in it; otherwise a flume_not_set_up element that explains what flume is (managing agents' work with tasks and workflows, run through flume commands, with flume serve as the server the human starts) and the setup steps (flume init in the workspace folder; flume project add <git-url> for each project, or flume clone <tasks-repo-url> and flume project clone; flume serve run by the human in its own pane), and says the agent must not run them without the human.

#### Scenario: Prime with a workflow  {#s-1d08}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/workflow.md adding a section holding BASE, projects/web/workflow.md adding a section holding WEB, base/roles/worker.md holding ROLE and projects/web/roles/worker.md appending WEBROLE
- **WHEN** the user runs flume prime --name a --project web --role worker
- **THEN** the output holds "You are agent a" and "You are working on project web, stored in $AGENT_PROJECT." before the workflow element, holds BASE, WEB, the project text, ROLE and WEBROLE in that order, all in the one workflow element, and does not contain "read the .md files" or a tag word such as @add

#### Scenario: Prime with no role  {#s-141b}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has a base/workflow.md adding BASE and base/roles/worker.md holding ROLE
- **WHEN** the user runs flume prime --name a
- **THEN** the exit code is 0 and the output holds BASE and does not hold ROLE or the role's heading

#### Scenario: Prime with no daemon in a workspace  {#s-3cd4}
*Verification*: **executable**
- **GIVEN** no daemon running and a workspace folder holding a .flume folder
- **WHEN** the user runs flume prime --name a from a folder inside that workspace
- **THEN** the exit code is 0, the output holds "You are agent a" before the workflow element and, inside the flume_prime element, a server_not_running element naming the workspace folder and asking for flume serve, no text from the flume root, and no daemon has been started

#### Scenario: Prime with no daemon and no workspace  {#s-ad01}
*Verification*: **executable**
- **GIVEN** no daemon running and no .flume folder in the current folder or above it
- **WHEN** the user runs flume prime --name a
- **THEN** the exit code is 0, the output holds "You are agent a" before the workflow element and a flume_not_set_up element that mentions flume init, flume project add, flume clone, flume serve and that the agent must not run them without the human, and no daemon has been started

#### Scenario: Launch passes the role to prime  {#s-afe2}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/roles/worker.md holding ROLE
- **WHEN** the user runs flume agent --name a --role worker
- **THEN** claude receives --append-system-prompt followed by text holding ROLE

### Requirement: Built-in prime text  {#r-a8c0}

flume's own part of the prime text SHALL come only from the base documents flume ships (workflow.md and project.md), merged with the layers of the flume root by the daemon; flume SHALL replace {name} and {project} in the merged workflow and project documents, and SHALL NOT read any file in the home folder's templates folder. The identity lines (the identity requirement) are not part of either document and are not read from any layer.

#### Scenario: Templates folder ignored  {#s-a8c1}

*Verification*: **executable**

- **GIVEN** a file base.md in the templates folder of the home folder holding "Hello {name}"
- **WHEN** the user runs flume prime --name alpha
- **THEN** the output contains "You are agent alpha"
- **AND** the output does not contain "Hello alpha"

### Requirement: prime  {#r-a9c0}

When the user runs "flume prime [--name <name>] [--project <p>] [--role <r>]", flume SHALL print the prime text a launch would send, the identity lines then the workflow text, in the XML layout of the requirement below, with no --json, and exit with code 0; with no --project or --role it SHALL use those saved on the entry.

#### Scenario: Prime with a project  {#s-a9c1}

*Verification*: **executable**

- **GIVEN** a home folder with no agents
- **WHEN** the user runs flume prime --name alpha --project web
- **THEN** the output contains "You are agent alpha" and "You are working on project web, stored in $AGENT_PROJECT." and "CLAUDE.md"

### Requirement: Prime XML layout  {#r-87a1}
The prime text (flume prime, and what flume agent passes to claude) SHALL be one flume_prime element with attributes agent, project (only when known) and role (only when known), holding the identity lines first (the identity requirement, outside any element of the workflow), then one child element per part, in this order: workflow (the merged workflow, project and role documents), then workflow_missing, server_not_running or flume_not_set_up when one applies, then guides; each opening and closing tag SHALL be on its own line with the part's text unchanged between them, and one blank line between parts. Where a part's text, a guide's description or an attribute value would end or forge one of these elements (a tag with one of these element names, opening or closing, in text; a double quote in an attribute value), flume SHALL neutralize it (the less-than sign of the tag written as &lt;; quotes in attributes as &quot;) and SHALL pass all other text through as written. flume prime SHALL take no --json.

#### Scenario: Prime layout  {#s-87a2}
*Verification*: **executable**
- **GIVEN** a running daemon with no layered files
- **WHEN** the user runs flume prime --name a --project web --role worker
- **THEN** the output starts with the line \<flume_prime agent="a" project="web" role="worker">, a blank line, the line You are agent a, stored in $AGENT_NAME., a blank line, the line You are working on project web, stored in $AGENT_PROJECT., a blank line and the line \<workflow>, and ends with the line \</workflow>, a blank line and the line \</flume_prime>

#### Scenario: Unknown project and role are not attributes  {#s-87a3}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has no files
- **WHEN** the user runs flume prime --name a
- **THEN** the first line of the output is \<flume_prime agent="a"> and the output holds no project document, no guides element and no line beginning You are working on project

#### Scenario: Text cannot close its element  {#s-87a4}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has a base/workflow.md replacing the whole document with the line \</workflow> and the line \<b>kept\</b>
- **WHEN** the user runs flume prime --name a
- **THEN** the output holds exactly one line \</workflow>, holds the line &lt;/workflow> and holds \<b>kept\</b> as written

### Requirement: Identity lines  {#r-1d7e}
flume SHALL print, in every prime text, first inside the flume_prime element and before the workflow element, the line "You are agent NAME, stored in $AGENT_NAME." (NAME being the agent's name), and, when a project is known, the line "You are working on project PROJECT, stored in $AGENT_PROJECT." (PROJECT being the project's name), each followed by a blank line. flume SHALL build these lines itself and SHALL NOT take them from any layered document, so that no layer can replace, remove or change them.

#### Scenario: Identity lines cannot be replaced by a layer  {#s-1d7f}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has a base/workflow.md replacing the whole document with the line BASE ONLY
- **WHEN** the user runs flume prime --name a --project web
- **THEN** the output holds the line "You are agent a, stored in $AGENT_NAME." and then the line "You are working on project web, stored in $AGENT_PROJECT." both before the line \<workflow>, and holds BASE ONLY inside the workflow element

#### Scenario: No project line without a project  {#s-1d80}
*Verification*: **executable**
- **GIVEN** a running daemon with no layered files
- **WHEN** the user runs flume prime --name a
- **THEN** the output holds the line "You are agent a, stored in $AGENT_NAME." and does not hold "You are working on project"

### Requirement: Guides  {#r-c7a5}
A guide is a Markdown file with flat YAML front matter holding name (the file name without .md), description (what the guide covers and when to use it) and optionally stage, followed by a layered document (the workflow-layers spec), kept at base/guides/NAME.md or projects/PROJECT/guides/NAME.md of the flume root; a project's guide merges into the base guide of the same name, and its front matter is used. When the user runs "flume guide <name> [--name <agent>] [--project <p>]", flume SHALL ask the daemon (the guides endpoint of the api spec) and print the merged guide's text without front matter inside a guide element with attribute name and, when the guide has one, stage (tags on their own lines), using the project given, else the one saved on the agent entry, and exit with code 0; when no such guide exists, its front matter is missing or unparsable, or its text has a merge error, flume SHALL print an error naming the guide's file (for a merge error also the line and heading) to standard error and exit with code 1; when no daemon answers flume SHALL say so on standard error, exit with code 1 and SHALL NOT start the daemon. flume SHALL NOT read the guide files itself.

#### Scenario: Print a base guide  {#s-7c2b}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/guides/deploy.md with front matter name deploy and a description, then a heading deploy holding STEPS
- **WHEN** the user runs flume guide deploy
- **THEN** the output is the line \<guide name="deploy">, the heading, a blank line, the line STEPS and the line \</guide>, without the front matter, and the exit code is 0

#### Scenario: A project guide merges  {#s-a846}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/guides/deploy.md holding BASE, and projects/web/guides/deploy.md adding a section holding WEB
- **WHEN** the user runs flume guide deploy --project web
- **THEN** the output holds BASE and then the added section with WEB inside the guide element, and the exit code is 0

#### Scenario: No such guide  {#s-8ee7}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has no guide named nope
- **WHEN** the user runs flume guide nope
- **THEN** the exit code is 1 and standard error names nope

#### Scenario: No daemon  {#s-c6b5}
*Verification*: **executable**
- **GIVEN** no daemon running
- **WHEN** the user runs flume guide deploy
- **THEN** the exit code is 1, standard error says the server is not running and no daemon was started

### Requirement: Guide with no name lists the guides  {#r-9a01}
When the user runs "flume guide" with no guide name (and optionally --project and --name as above), flume SHALL ask the daemon for the guides available to the project and print one line per guide, tab separated: name, stage (a dash when it has none) and description, ordered by name; with --json flume SHALL print one JSON list of objects holding name, description and, when present, stage, and nothing else; a guide with missing or unparsable front matter SHALL NOT be listed; with no guides nothing is printed (an empty list for --json); when no daemon answers flume SHALL say so on standard error and exit with code 1. Giving --json together with a guide name SHALL be a usage error (exit code 2).

#### Scenario: List the guides as text and JSON  {#s-9a02}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/guides/deploy.md (description Ship it, stage build), base/guides/lint.md (description Tidy, no stage) and base/guides/bad.md with no front matter
- **WHEN** the user runs flume guide, then flume guide --json, then flume guide deploy --json
- **THEN** the first prints the two lines deploy, build, Ship it and lint, a dash, Tidy (tab separated) and nothing about bad; the second prints a JSON list of two objects with the same names, descriptions and the stage of deploy; the third exits with code 2

### Requirement: Prime lists the guides  {#r-5dfe}
When flume prime or flume agent builds the prime text and the daemon returns guides, flume SHALL print after the workflow text a guides element whose first line is the XML comment "Print one with: flume guide <name>", then one guide element per guide on one line, with attributes name and stage (only when it has one) and its description as the text; guides with missing or unparsable front matter SHALL NOT be listed; with no guides flume SHALL print no guides element.

#### Scenario: Prime lists guides  {#s-193a}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/guides/deploy.md with description Ship it, and projects/web/guides/lint.md with no front matter
- **WHEN** the user runs flume prime --name a --project web
- **THEN** the output contains the line \<guide name="deploy">Ship it\</guide> inside a guides element mentioning flume guide, and does not contain lint

### Requirement: list  {#r-b1c0}

When the user runs "flume agent list", flume SHALL print a header line NAME PANE PROJECT LIVE LAST-LAUNCH LAST-SEEN and one line per entry, where LIVE is yes when the pane exists and runs claude, pane when it exists running something else, and - when it is gone or when not in tmux, and LAST-SEEN is the entry's last_seen, or - when it has none. With --json, flume SHALL print one JSON array with one object per entry instead, holding the entry's fields and live (yes, pane or -), and exit with code 0.

#### Scenario: Live column  {#s-b1c1}

*Verification*: **executable**

- **GIVEN** entries for a in pane %1 (running claude), b in pane %2 (running zsh) and c in pane %3 (not listed)
- **WHEN** the user runs flume agent list
- **THEN** the lines for a, b and c show yes, pane and - in the LIVE column

#### Scenario: List as JSON  {#s-b1c2}

*Verification*: **executable**

- **GIVEN** entries for a in pane %1 (running claude) and b in pane %2 (running zsh)
- **WHEN** the user runs flume agent list --json
- **THEN** standard output is a JSON array of two objects, a with live yes and b with live pane, each with name, project and last_launch

### Requirement: show  {#r-b2c0}

When the user runs "flume agent show <name>", flume SHALL print the entry as YAML and exit with code 0; with --json it SHALL print the entry as one JSON object instead; and for an unknown name SHALL print an error to standard error and exit with code 1.

#### Scenario: Show  {#s-b2c1}

*Verification*: **executable**

- **GIVEN** an agent alpha with project web
- **WHEN** the user runs flume agent show alpha, and then flume agent show nope
- **THEN** the first prints YAML holding project: web and exits 0, the second exits 1

#### Scenario: Show as JSON  {#s-b2c2}

*Verification*: **executable**

- **GIVEN** an agent alpha with project web
- **WHEN** the user runs flume agent show alpha --json
- **THEN** standard output is one JSON object holding "project": "web" and the exit code is 0

### Requirement: Last seen  {#r-e1c0}

When the daemon receives a request carrying the header X-Flume-Agent with the name of an existing agent entry, the daemon SHALL set that entry's last_seen to the current time as an ISO 8601 UTC string, keeping the entry's other fields. The daemon SHALL NOT create an entry, and SHALL change nothing for a request without the header or naming an unknown agent. Every flume command that calls the daemon SHALL send that header with the actor of the command (AGENT_NAME when set; else agent-<first 8 characters of CLAUDE_CODE_SESSION_ID>, or agent-unknown, when CLAUDECODE is set; else human). flume agent show and flume agent list SHALL show last_seen.

#### Scenario: Request from an agent sets last_seen  {#s-e1c1}

*Verification*: **executable**

- **GIVEN** a running daemon and an entry for alpha with project web and no last_seen
- **WHEN** GET /api/status is requested with the header X-Flume-Agent: alpha
- **THEN** the entry for alpha holds a last_seen that is a UTC time within the last minute, and still holds project web and its created and last_launch values

#### Scenario: No name or unknown name changes nothing  {#s-e1c2}

*Verification*: **executable**

- **GIVEN** a running daemon and an entry for alpha with no last_seen
- **WHEN** GET /api/status is requested with no X-Flume-Agent header, and again with X-Flume-Agent: ghost
- **THEN** the entry for alpha is unchanged and no entry for ghost exists

#### Scenario: A command sends AGENT_NAME  {#s-e1c3}

*Verification*: **executable**

- **GIVEN** a running daemon, an entry for alpha, and the environment variable AGENT_NAME set to alpha
- **WHEN** the user runs flume task list
- **THEN** the entry for alpha holds a last_seen

#### Scenario: An unnamed Claude Code agent sends its session name  {#s-c7d2}

*Verification*: **executable**

- **GIVEN** a running daemon, an entry for agent-abcdef01, CLAUDECODE set, CLAUDE_CODE_SESSION_ID set to abcdef0123456789 and AGENT_NAME not set
- **WHEN** the user runs flume task list
- **THEN** the entry for agent-abcdef01 holds a last_seen

#### Scenario: Show and list display last_seen  {#s-e1c4}

*Verification*: **executable**

- **GIVEN** an entry for alpha with last_seen 2026-11-17T10:00:00.000Z and an entry for b with none
- **WHEN** the user runs flume agent show alpha --json, and flume agent list
- **THEN** the JSON holds that last_seen, the list line for alpha shows it under LAST-SEEN, and the line for b shows - there

### Requirement: Conflicts  {#r-c1c0}

When the arguments contain a conflict, flume SHALL print the conflict to standard error, exit with code 2 and not start claude. The conflicts are: more than one bare argument; claude's -n or --name option after "--"; --append-system-prompt or --append-system-prompt-file; an option that takes one value (and may not repeat) given twice; and an option that needs a value given none because it is last or the next argument starts with a dash.

#### Scenario: Two prompts  {#s-c1c1}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha one -- two
- **THEN** the exit code is 2, standard error is not empty and claude does not run

#### Scenario: Claude name after the double dash  {#s-c1c2}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha -- --name other
- **THEN** the exit code is 2 and claude does not run

#### Scenario: Appended system prompt  {#s-c1c3}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha -- --append-system-prompt "extra"
- **THEN** the exit code is 2 and claude does not run

#### Scenario: Repeated single-value option  {#s-c1c4}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha -- --model opus --model haiku
- **THEN** the exit code is 2 and claude does not run

#### Scenario: Several-value option may repeat  {#s-c1c5}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha -- --add-dir a --add-dir b
- **THEN** the exit code is 0 and claude receives --add-dir a and --add-dir b

#### Scenario: Missing value  {#s-c1c6}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --name alpha -- --model
- **THEN** the exit code is 2 and claude does not run

### Requirement: Usage text  {#r-c2c0}

When the user runs "flume agent --help", flume SHALL print usage text in standard Unix notation (square brackets for optional, angle brackets for a placeholder, three dots for repeatable) and exit with code 0.

#### Scenario: Help  {#s-c2c1}

*Verification*: **executable**

- **GIVEN** a home folder
- **WHEN** the user runs flume agent --help
- **THEN** the exit code is 0 and the output contains "[--force]" and "[--]"
