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

Before "--", flume SHALL accept only the options --name <n>, --name=<n>, --project <p>, --force, -h and --help and one bare argument, the prompt, in any order, and SHALL treat a bare argument as the prompt and never as the agent name; flume SHALL pass every argument after "--" to claude unchanged and in order.

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

flume SHALL store one YAML file per agent name at .flume/agents/<name>.yaml in the home folder, a flat mapping of string values holding name, project (empty when none), pane, created and last_launch, and when "--project" is not given SHALL use the project saved on the entry. flume SHALL NOT read a .json file in that folder, and SHALL ignore it in list and show. flume SHALL accept only a name of lowercase letters, digits and dashes that starts with a letter or digit, and SHALL refuse any other name with exit code 2, naming the name and the allowed pattern on standard error, before it reads or writes the registry or runs claude.

#### Scenario: Project is saved and reused  {#s-a3c1}

*Verification*: **executable**

- **GIVEN** an agent alpha launched once with --project web
- **WHEN** the user runs flume agent alpha again without --project
- **THEN** AGENT_PROJECT is web and the entry still holds the project web

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

flume SHALL pass claude the prime text (the built-in base text, then the built-in project text when there is a project) with --append-system-prompt, SHALL pass claude --name <agent>, and SHALL NOT put the prime text in the prompt.

#### Scenario: Prime contents  {#s-a6c1}

*Verification*: **executable**

- **GIVEN** an agent alpha with project web
- **WHEN** the user runs flume agent --name alpha "pick up xyz"
- **THEN** claude receives --append-system-prompt followed by text containing "You are agent alpha" and "You are working on the web project. Read that project's CLAUDE.md and follow its instructions."
- **AND** the prime text also contains "Use the flume CLI to work with tasks; run flume --help to learn it."
- **AND** the prime text also contains "Never start flume serve yourself; only the human does. If flume says the server is not running, ask the human to start it."
- **AND** claude receives --name followed by alpha
- **AND** the last argument of claude is exactly "pick up xyz"

### Requirement: First prompt  {#r-a7c0}

flume SHALL always give claude a first prompt as the last argument, after a closing "--": the prompt the user gave, exactly, or when none was given a short default that asks the agent to check its tickets and status, suggest next steps and follow up.

#### Scenario: Default prompt  {#s-a7c1}

*Verification*: **executable**

- **GIVEN** an agent alpha
- **WHEN** the user runs flume agent --name alpha --add-dir x
- **THEN** the last argument of claude is not empty and does not contain "You are agent alpha"
- **AND** the argument before it is --

### Requirement: Prime names the workflow layers  {#r-1d13}
When the current folder is inside a workspace set up with flume init and the task root has a workflow folder, the prime text SHALL end with one line telling the agent to read the .md files in workflow/base/ of the task root, then in workflow/ of the task root, then in the project's workflow/ folder, then the project's CLAUDE.md, each in name order, with later ones overriding earlier ones. Otherwise the prime text SHALL NOT mention the workflow. flume SHALL merge nothing.

#### Scenario: Prime with a workflow  {#s-1d08}
*Verification*: **executable**
- **GIVEN** a workspace that has not been set up with flume init
- **WHEN** the user runs flume prime --name a, then flume init --root tasks, then flume prime --name a again
- **THEN** the first output does not mention the workflow and the second names tasks/workflow/base/, CLAUDE.md and override

### Requirement: Built-in prime text  {#r-a8c0}

flume SHALL build the prime text only from its built-in base text and built-in project text, SHALL replace {name} and {project} in them, and SHALL NOT read any file in the home folder's templates folder.

#### Scenario: Templates folder ignored  {#s-a8c1}

*Verification*: **executable**

- **GIVEN** a file base.md in the templates folder of the home folder holding "Hello {name}"
- **WHEN** the user runs flume prime --name alpha
- **THEN** the output contains "You are agent alpha"
- **AND** the output does not contain "Hello alpha"

### Requirement: prime  {#r-a9c0}

When the user runs "flume prime [--name <name>] [--project <p>]", flume SHALL print the prime text a launch would send, base template then project template, and exit with code 0.

#### Scenario: Prime with a project  {#s-a9c1}

*Verification*: **executable**

- **GIVEN** a home folder with no agents
- **WHEN** the user runs flume prime --name alpha --project web
- **THEN** the output contains "You are agent alpha" and "You are working on the web project. Read that project's CLAUDE.md and follow its instructions."

### Requirement: list  {#r-b1c0}

When the user runs "flume agent list", flume SHALL print a header line NAME PANE PROJECT LIVE LAST-LAUNCH and one line per entry, where LIVE is yes when the pane exists and runs claude, pane when it exists running something else, and - when it is gone or when not in tmux.

#### Scenario: Live column  {#s-b1c1}

*Verification*: **executable**

- **GIVEN** entries for a in pane %1 (running claude), b in pane %2 (running zsh) and c in pane %3 (not listed)
- **WHEN** the user runs flume agent list
- **THEN** the lines for a, b and c show yes, pane and - in the LIVE column

### Requirement: show  {#r-b2c0}

When the user runs "flume agent show <name>", flume SHALL print the entry as JSON and exit with code 0, and for an unknown name SHALL print an error to standard error and exit with code 1.

#### Scenario: Show  {#s-b2c1}

*Verification*: **executable**

- **GIVEN** an agent alpha with project web
- **WHEN** the user runs flume agent show alpha, and then flume agent show nope
- **THEN** the first prints JSON holding "project": "web" and exits 0, the second exits 1

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
