# Agent launcher

flume launches Claude Code as a named agent, keeps a machine-wide registry of agents, and prints the prime text it sends. No command here needs the daemon. Ticket: fl-macf.

Assumptions (recorded on fl-macf): the one-off prompt is a bare argument before any "--"; a value for an unrecognized claude option must be written as option=value or after "--", because a bare word that looks like a name is taken as the agent name; exit code 2 is wrong usage, 1 a refusal or failure.

## Requirements

### Requirement: Launch  {#r-a1c0}

When the user runs "flume agent <name>", flume SHALL record the agent in the registry, run claude as a child process with the environment variable AGENT_NAME set to the name, and exit with claude's exit code.

#### Scenario: Launch by name  {#s-a1c1}

*Verification*: **executable**

- **GIVEN** a home folder with no agents and claude on the path
- **WHEN** the user runs flume agent with the argument alpha
- **THEN** claude runs once with AGENT_NAME set to alpha
- **AND** the file agents/alpha.json under the .flume folder of the home folder holds the name alpha
- **AND** the exit code equals the exit code of claude

### Requirement: Argument parsing  {#r-a2c0}

flume SHALL consume the options --project <p>, --force and --system, one agent name and one one-off prompt, in any order, SHALL pass every other argument to claude unchanged and in order, and SHALL pass everything after "--" to claude without interpreting it.

#### Scenario: Options before the name  {#s-a2c1}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments --project web alpha
- **THEN** AGENT_NAME is alpha and AGENT_PROJECT is web

#### Scenario: Unrecognized arguments and double dash  {#s-a2c2}

*Verification*: **executable**

- **GIVEN** a home folder and claude on the path
- **WHEN** the user runs flume agent with the arguments alpha --model=opus -- --force -p
- **THEN** claude receives --model=opus, --force and -p in that order
- **AND** no pane check is bypassed by that --force

### Requirement: Registry entry  {#r-a3c0}

flume SHALL store one JSON file per agent name at .flume/agents/<name>.json in the home folder, holding name, project (empty when none), pane, created and last_launch, and when "--project" is not given SHALL use the project saved on the entry.

#### Scenario: Project is saved and reused  {#s-a3c1}

*Verification*: **executable**

- **GIVEN** an agent alpha launched once with --project web
- **WHEN** the user runs flume agent alpha again without --project
- **THEN** AGENT_PROJECT is web and the entry still holds the project web

### Requirement: Name from the pane  {#r-a4c0}

When no name is given, flume SHALL read the name from the tmux pane option @flume_agent of the current pane, and when there is none SHALL print a usage message to standard error and exit with code 2.

#### Scenario: Name read from the pane  {#s-a4c1}

*Verification*: **executable**

- **GIVEN** a tmux pane %1 whose @flume_agent option is alpha
- **WHEN** the user runs flume agent in that pane with no name
- **THEN** AGENT_NAME is alpha

#### Scenario: No name anywhere  {#s-a4c2}

*Verification*: **executable**

- **GIVEN** no tmux pane option and no name argument
- **WHEN** the user runs flume agent
- **THEN** standard error holds a usage message and the exit code is 2

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

### Requirement: Default prompt  {#r-a6c0}

By default flume SHALL pass claude one positional prompt made of the base template, the project template when there is a project, and the one-off prompt when given.

#### Scenario: Prompt contents  {#s-a6c1}

*Verification*: **executable**

- **GIVEN** an agent alpha with project web
- **WHEN** the user runs flume agent alpha "pick up xyz"
- **THEN** the last argument of claude contains "You are agent alpha", "You are working on project web" and "pick up xyz"

### Requirement: System mode  {#r-a7c0}

When --system is given, flume SHALL pass the prime text to claude with --append-system-prompt and SHALL pass as the positional prompt the one-off prompt, or a short default kickoff when none is given.

#### Scenario: System mode  {#s-a7c1}

*Verification*: **executable**

- **GIVEN** an agent alpha
- **WHEN** the user runs flume agent alpha --system
- **THEN** claude receives --append-system-prompt followed by text containing "You are agent alpha"
- **AND** the last argument of claude is not empty and does not contain "You are agent alpha"

### Requirement: Templates  {#r-a8c0}

flume SHALL ship a default base template and project template, SHALL use base.md or project.md in .flume/templates of the home folder instead when present, and SHALL replace {name} and {project} in them.

#### Scenario: Override  {#s-a8c1}

*Verification*: **executable**

- **GIVEN** a file base.md in the templates folder holding "Hello {name}"
- **WHEN** the user runs flume prime alpha
- **THEN** the output contains "Hello alpha"

### Requirement: prime  {#r-a9c0}

When the user runs "flume prime [<name>] [--project <p>]", flume SHALL print the prime text a launch would send, base template then project template, and exit with code 0.

#### Scenario: Prime with a project  {#s-a9c1}

*Verification*: **executable**

- **GIVEN** a home folder with no agents
- **WHEN** the user runs flume prime alpha --project web
- **THEN** the output contains "You are agent alpha" and "You are working on project web"

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
