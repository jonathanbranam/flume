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

### Requirement: Prime prints the workflow from the daemon  {#r-1d13}
When flume prime or flume agent builds the prime text, flume SHALL ask the daemon (the prime endpoint of the api spec) with the agent's project and role, and print the parts it returns after the built-in text, each in its own element (see the requirement on the XML layout), so that the order is: the built-in text (flume_base), base/workflow.md (workspace_workflow), the project's workflow.md (project_workflow, with attribute project), then base/roles/ROLE.md followed by the project's roles/ROLE.md in one role element (attribute name), of the flume root, later ones overriding earlier ones; a missing file is skipped without an error and a part with no text is left out, element and all; with no role flume SHALL print no role element, which is not an error. flume SHALL NOT tell the agent to read workflow files, SHALL NOT read them itself, and SHALL NOT start the daemon. When no daemon answers (or it refuses), flume SHALL print the built-in text followed by a workflow_missing element holding one line saying the workflow text is missing, and exit with code 0.

#### Scenario: Prime with a workflow  {#s-1d08}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/workflow.md holding BASE, projects/web/workflow.md holding WEB, base/roles/worker.md holding ROLE and projects/web/roles/worker.md holding WEBROLE
- **WHEN** the user runs flume prime --name a --project web --role worker
- **THEN** the output holds "You are agent a", then BASE, WEB, ROLE and WEBROLE in that order, and does not contain "read the .md files"
- **AND** BASE is inside a workspace_workflow element, WEB inside a project_workflow element with project="web", and ROLE and WEBROLE both inside one role element with name="worker"

#### Scenario: Prime with no role  {#s-141b}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/workflow.md holding BASE and base/roles/worker.md holding ROLE
- **WHEN** the user runs flume prime --name a
- **THEN** the exit code is 0 and the output holds BASE and does not hold ROLE or a role element

#### Scenario: Prime with no daemon  {#s-3cd4}
*Verification*: **executable**
- **GIVEN** no daemon running
- **WHEN** the user runs flume prime --name a
- **THEN** the exit code is 0, the output holds "You are agent a" inside a flume_base element and, inside the flume_prime element, a workflow_missing element saying the workflow text is missing, and no daemon has been started

#### Scenario: Launch passes the role to prime  {#s-afe2}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/roles/worker.md holding ROLE
- **WHEN** the user runs flume agent --name a --role worker
- **THEN** claude receives --append-system-prompt followed by text holding ROLE

### Requirement: Built-in prime text  {#r-a8c0}

flume SHALL build its own part of the prime text only from its built-in base text and built-in project text (the workflow part comes from the daemon), SHALL replace {name} and {project} in them, and SHALL NOT read any file in the home folder's templates folder.

#### Scenario: Templates folder ignored  {#s-a8c1}

*Verification*: **executable**

- **GIVEN** a file base.md in the templates folder of the home folder holding "Hello {name}"
- **WHEN** the user runs flume prime --name alpha
- **THEN** the output contains "You are agent alpha"
- **AND** the output does not contain "Hello alpha"

### Requirement: prime  {#r-a9c0}

When the user runs "flume prime [--name <name>] [--project <p>] [--role <r>]", flume SHALL print the prime text a launch would send, built-in text then the workflow text, in the XML layout of the requirement below, with no --json, and exit with code 0; with no --project or --role it SHALL use those saved on the entry.

#### Scenario: Prime with a project  {#s-a9c1}

*Verification*: **executable**

- **GIVEN** a home folder with no agents
- **WHEN** the user runs flume prime --name alpha --project web
- **THEN** the output contains "You are agent alpha" and "You are working on the web project. Read that project's CLAUDE.md and follow its instructions."

### Requirement: Prime XML layout  {#r-87a1}
The prime text (flume prime, and what flume agent passes to claude) SHALL be one flume_prime element with attributes agent, project (only when known) and role (only when known), holding one child element per part, in this order: flume_base (flume's built-in text, including the project text), workspace_workflow, project_workflow (attribute project), role (attribute name), guides; each opening and closing tag SHALL be on its own line with the part's text unchanged between them, and one blank line between parts. Where a part's text, a guide's description or an attribute value would end or forge one of these elements (a tag with one of these element names, opening or closing, in text; a double quote in an attribute value), flume SHALL neutralize it (the less-than sign of the tag written as &lt;; quotes in attributes as &quot;) and SHALL pass all other text through as written. flume prime and flume guide SHALL take no --json.

#### Scenario: Prime layout  {#s-87a2}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/workflow.md holding BASE
- **WHEN** the user runs flume prime --name a --project web --role worker
- **THEN** the output starts with the line \<flume_prime agent="a" project="web" role="worker"> followed by a blank line and the line \<flume_base>, and ends with the line \</flume_prime>
- **AND** a blank line separates \</flume_base> from \<workspace_workflow>

#### Scenario: Unknown project and role are not attributes  {#s-87a3}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has no files
- **WHEN** the user runs flume prime --name a
- **THEN** the first line of the output is \<flume_prime agent="a"> and the output holds no workspace_workflow, project_workflow, role or guides element

#### Scenario: Text cannot close its element  {#s-87a4}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/workflow.md holding the line \</workspace_workflow> and the line \<b>kept\</b>
- **WHEN** the user runs flume prime --name a
- **THEN** the output holds exactly one line \</workspace_workflow>, holds the line &lt;/workspace_workflow> and holds \<b>kept\</b> as written

### Requirement: Guides  {#r-c7a5}
A guide is a Markdown file with flat YAML front matter holding name (the file name without .md), description (what the guide covers and when to use it) and optionally stage, kept at base/guides/NAME.md or projects/PROJECT/guides/NAME.md of the flume root, a project's guide overriding the base guide of the same name. When the user runs "flume guide <name> [--name <agent>] [--project <p>]", flume SHALL ask the daemon (the guides endpoint of the api spec) and print the guide's text without its front matter inside a guide element with attribute name and, when the guide has one, stage (tags on their own lines), using the project given, else the one saved on the agent entry, and exit with code 0; when no such guide exists, or its front matter is missing or unparsable, flume SHALL print an error naming the guide to standard error and exit with code 1; when no daemon answers flume SHALL say so on standard error, exit with code 1 and SHALL NOT start the daemon. flume SHALL NOT read the guide files itself.

#### Scenario: Print a base guide  {#s-7c2b}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/guides/deploy.md with front matter name deploy and a description, then the body STEPS
- **WHEN** the user runs flume guide deploy
- **THEN** the output is the line \<guide name="deploy">, the line STEPS and the line \</guide>, without the front matter, and the exit code is 0

#### Scenario: A project guide overrides  {#s-a846}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has base/guides/deploy.md with body BASE and projects/web/guides/deploy.md with body WEB
- **WHEN** the user runs flume guide deploy --project web
- **THEN** the output is the line \<guide name="deploy">, the line WEB and the line \</guide>, and the exit code is 0

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
