import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { stringify } from "yaml";
import { agentsDir, type Entry, flumeHome, readEntry, writeEntry } from "../core/agents.ts";
import { xmlBlock, xmlOpen, xmlText } from "../core/prime.ts";
import { daemonUrl, findFlumeFolder, request } from "../daemon/index.ts";

const USAGE = `Usage:
  flume agent [--name <name>] [--project <p>] [--role <r>] [--force] [<prompt>] [-- <claude-arg>...]
  flume agent list [--json]
  flume agent show <name> [--json]
  flume prime [--name <name>] [--project <p>] [--role <r>]

Launch Claude Code as a named agent. The name comes only from --name, else from the tmux
pane option @flume_agent. One bare argument is the prompt sent to the agent (quote it); with
none, flume sends a short default. Before "--" flume accepts only --name, --project, --role, --force, -h/--help and the prompt;
any other option is an error (exit 2). Claude's options go after "--", which flume passes
to claude and checks only for conflicts (a second prompt, -n/--name, --append-system-prompt[-file], a repeated single-value
option, an option missing its value) and exits 2 on one. The prime text always goes to claude
with --append-system-prompt, and flume always passes --name <name>.
`;

const DEFAULT_BASE = `You are agent {name}, stored in $AGENT_NAME.
Use the flume CLI to work with tasks; run flume --help to learn it.
Never start flume serve yourself; only the human does. If flume says the server is not running, ask the human to start it.

Read and change tasks only with flume commands. Never read or edit task files directly.

The human is in control. They may move a task to any phase, forwards or backwards, or skip phases ("write design and specs", "remove the specs and start over on the design", "the ticket is simple, skip specs and plan, just implement"). Do what they ask.

Working a task:
1. Claim the task (flume task claim ID); it prints your instructions for the task's current phase. Follow them. To see them again, run flume task instructions ID, not flume task show (that prints the task's data, not what to do). Flume will not move a task forward for you until you have read the instructions for its current phase.
2. The phases, in order (the specific steps for each are in the instructions; read a part with flume task show ID PART, write one with flume task write ID PART starting from its template: flume task template PART):
   - proposal: check that the task has a clear proposal, goal and scope. If not, ask the human. Write them in the body.
   - design: when goal and scope are clear, think through the design questions and write the design.
   - specs: when the design is clear, write the spec: clear requirements in EARS form ("When <trigger>, the system SHALL <response>").
   - plan: read the body, design and spec, then write the plan: how to implement the task, step by step, in numbered groups. Decide which guides apply to each group and name them with Guide: lines under the group's heading. Then mark the task ready: flume task phase ID implement.
   - implement: get the current group of plan items and its guides (flume task next ID), do them, and report each one: flume task done ID ITEM, or flume task skip ID ITEM --reason TEXT if it should not be done. Repeat until the plan is complete. When writing code, enter a git worktree to make the changes; when done, merge main into it, then exit the worktree and merge it into main. Close the task when done (flume task close ID).
3. When your phase is done, set the next phase (flume task phase ID PHASE). One agent will likely not do the whole workflow: another may take the next phase, or finish the plan. If you are waiting on the human, assign the task back to them (flume task assign ID human).
4. In every phase, record important conversations with the human as comments (flume task comment ID), quoting the human verbatim.
5. Guides are how-to notes. In every phase: if you see guides (flume guide) that matter for a later phase of this task, push them (flume task guide ID NAME --phase PHASE); they are printed with that phase's instructions. Read any guide that matters for your own work now (flume guide NAME).
`;
const DEFAULT_PROJECT =
  "You are working on the {project} project. Read that project's CLAUDE.md and follow its instructions.\n";
const DEFAULT_PROMPT = "Check your tickets and status, suggest next steps, and follow up.";
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

interface Parsed {
  name?: string;
  project?: string;
  role?: string;
  force: boolean;
  prompt?: string;
  passthrough: string[];
}

function tmux(args: string[]): string | undefined {
  const r = spawnSync("tmux", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return r.status === 0 ? r.stdout : undefined;
}

/** pane id -> command running in it, from one tmux call; empty outside tmux or when tmux fails. */
function livePanes(): Map<string, string> {
  const out = tmux(["list-panes", "-a", "-F", "#{pane_id} #{pane_current_command}"]);
  const panes = new Map<string, string>();
  for (const line of (out ?? "").split("\n")) {
    const [id, ...cmd] = line.split(" ");
    if (id) panes.set(id, cmd.join(" "));
  }
  return panes;
}

type Kind = "one" | "many" | "opt" | "rep";

/**
 * Claude's options that take a value, from `claude --help` (option names, first is canonical).
 * one = <x> (one value, may not repeat), many = <x...> (every following non-dash argument,
 * may repeat), rep = <x> that may repeat, opt = [x] (optional value). Others are switches.
 */
const OPTIONS: [Kind, string[]][] = [
  ["many", ["--add-dir"]],
  ["one", ["--agent"]],
  ["one", ["--agents"]],
  ["many", ["--allowedTools", "--allowed-tools"]],
  ["one", ["--append-system-prompt"]],
  ["one", ["--append-system-prompt-file"]],
  ["one", ["--autocompact"]],
  ["many", ["--betas"]],
  ["opt", ["--cloud"]],
  ["opt", ["-d", "--debug"]],
  ["one", ["--debug-file"]],
  ["many", ["--disallowedTools", "--disallowed-tools"]],
  ["one", ["--effort"]],
  ["one", ["--environment"]],
  ["one", ["--fallback-model"]],
  ["many", ["--file"]],
  ["opt", ["--from-pr"]],
  ["one", ["--input-format"]],
  ["one", ["--json-schema"]],
  ["one", ["--max-budget-usd"]],
  ["many", ["--mcp-config"]],
  ["one", ["--model"]],
  ["one", ["-n", "--name"]],
  ["one", ["--output-format"]],
  ["one", ["--permission-mode"]],
  ["one", ["--permission-prompts"]],
  ["rep", ["--plugin-dir"]],
  ["rep", ["--plugin-url"]],
  ["opt", ["--prompt-suggestions"]],
  ["opt", ["--remote-control"]],
  ["one", ["--remote-control-session-name-prefix"]],
  ["opt", ["-r", "--resume"]],
  ["one", ["--session-id"]],
  ["one", ["--setting-sources"]],
  ["one", ["--settings"]],
  ["one", ["--system-prompt"]],
  ["one", ["--system-prompt-file"]],
  ["one", ["--system-prompt-snapshot"]],
  ["opt", ["--teleport"]],
  ["many", ["--tools"]],
  ["opt", ["-w", "--worktree"]],
];
const OPTION = new Map<string, [Kind, string]>();
for (const [kind, names] of OPTIONS)
  for (const n of names) OPTION.set(n, [kind, names[0] as string]);

/** Shell-quote one word so it pastes back exactly. */
function shq(w: string): string {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(w) ? w : `'${w.replaceAll("'", "'\\''")}'`;
}

function parse(args: string[]): Parsed | string {
  const p: Parsed = { force: false, passthrough: [] };
  const seen = new Set<string>();
  const bare: string[] = [];
  let afterDash = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (!afterDash && a === "--") {
      afterDash = true;
      continue;
    }
    if (!afterDash && a === "--force") {
      p.force = true;
      continue;
    }
    if (!afterDash && (a === "--project" || a === "--name" || a === "--role")) {
      const v = args[++i];
      if (v === undefined) return `${a} needs a value`;
      if (a === "--project") p.project = v;
      else if (a === "--role") p.role = v;
      else p.name = v;
      continue;
    }
    if (!afterDash && a.startsWith("--name=")) {
      p.name = a.slice(7);
      continue;
    }
    if (!a.startsWith("-")) {
      bare.push(a);
      if (bare.length > 1) return "more than one prompt; quote the prompt as one argument";
      continue;
    }
    const eq = a.indexOf("=");
    if (!afterDash) {
      const bad = eq > 0 && a.startsWith("--") ? a.slice(0, eq) : a;
      return `unknown option ${bad}\nClaude options go after --, as in: flume agent "<prompt>" -- ${bad} ...`;
    }
    const flag = a.startsWith("--") && eq > 0 ? a.slice(0, eq) : a;
    const opt = OPTION.get(flag);
    p.passthrough.push(a);
    if (flag === "--append-system-prompt" || flag === "--append-system-prompt-file")
      return `${flag} conflicts with the prime text flume always passes with --append-system-prompt`;
    if (opt?.[1] === "-n")
      return `${flag} conflicts with the --name <agent> flume always passes to claude`;
    if (!opt) continue;
    const [kind, canon] = opt;
    if (kind === "one" && seen.has(canon)) return `${flag} given twice; claude keeps only the last`;
    seen.add(canon);
    if (eq > 0 && a.startsWith("--")) continue;
    const takes = (v: string | undefined) => v !== undefined && !v.startsWith("-");
    if (kind === "opt") {
      if (takes(args[i + 1])) p.passthrough.push(args[++i] as string);
    } else if (!takes(args[i + 1])) {
      return `${flag} needs a value`;
    } else {
      p.passthrough.push(args[++i] as string);
      if (kind === "many") while (takes(args[i + 1])) p.passthrough.push(args[++i] as string);
    }
  }
  p.prompt = bare[0];
  return p;
}

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(name|project)\}/g, (_, k: string) => vars[k] ?? "");
}

function serverNotRunning(ws: string): string {
  return `Flume looks set up in ${ws}, but its server is not running, so the workflow text is missing.
Ask the human to run: flume serve (in ${ws}, in its own pane). Do not start it yourself.`;
}

const NOT_SET_UP = `The workflow text is missing, and no flume workspace was found here (no .flume folder in this folder or above it).

Flume manages agents' work with tasks and workflows. Tasks live in a tasks repo; agents work them through flume commands, phase by phase. "flume serve" is the server that agents and the web UI talk to; the human starts it.

To set up a new workspace, tell the human to do this:
1. In the workspace folder (a folder of related repos): flume init
2. For each project: flume project add <git-url>. Or, to set up a whole workspace from an existing tasks repo: flume clone <tasks-repo-url>, then flume project clone for the projects it already lists.
3. flume serve, run by the human in its own pane.

Do not run these commands yourself without the human, and never start the server yourself.`;

/**
 * The prime text: one flume_prime element holding flume's built-in text, then the workflow parts
 * the daemon builds from the flume-root files for this project and role, then the guides; empty
 * parts are left out. With no daemon (or a refusal) the built-in text is printed with a
 * server_not_running element (a workspace was found) or a flume_not_set_up element (none was) saying why the rest is missing; a refusal gives a workflow_missing element.
 */
async function primeText(name: string, project: string, role: string): Promise<string> {
  const vars = { name, project };
  let base = fill(DEFAULT_BASE, vars);
  if (project) base += `\n${fill(DEFAULT_PROJECT, vars)}`;
  const parts: string[] = [xmlBlock("flume_base", {}, base)];
  const url = daemonUrl(process.cwd());
  const q = new URLSearchParams({ project, role });
  const r = url ? await request(url, "GET", `/api/prime?${q}`) : undefined;
  if (!r) {
    const ws = findFlumeFolder(process.cwd(), flumeHome());
    if (ws) {
      parts.push(xmlBlock("server_not_running", {}, serverNotRunning(ws)));
    } else {
      parts.push(xmlBlock("flume_not_set_up", {}, NOT_SET_UP));
    }
  } else if (r.status !== 200) {
    parts.push(
      xmlBlock(
        "workflow_missing",
        {},
        `The workflow text is missing: ${r.body?.error ?? `request failed (${r.status})`}`,
      ),
    );
  } else {
    const w = (r.body.parts ?? {}) as { workspace?: string; project?: string; role?: string };
    if (w.workspace) parts.push(xmlBlock("workspace_workflow", {}, w.workspace));
    if (w.project) parts.push(xmlBlock("project_workflow", { project }, w.project));
    if (w.role) parts.push(xmlBlock("role", { name: role }, w.role));
    const guides = (r.body.guides ?? []) as { name: string; description: string; stage?: string }[];
    if (guides.length > 0) {
      let g = "<guides>\n<!-- Print one with: flume guide <name> -->\n";
      for (const x of guides)
        g += `${xmlOpen("guide", { name: x.name, stage: x.stage })}${xmlText(x.description)}</guide>\n`;
      parts.push(`${g}</guides>\n`);
    }
  }
  const root = xmlOpen("flume_prime", { agent: name, project, role });
  return `${root}\n\n${parts.join("\n")}\n</flume_prime>\n`;
}

/** Refuse a name outside NAME_RE before anything is read or written; undefined when it is fine. */
function badName(name: string): string | undefined {
  if (NAME_RE.test(name)) return undefined;
  return `agent name '${name}' is not allowed; use lowercase letters, digits and dashes, starting with a letter or digit (pattern ${NAME_RE.source})`;
}

function paneName(): string | undefined {
  const pane = process.env.TMUX_PANE;
  if (!pane) return undefined;
  const v = tmux(["show-options", "-p", "-q", "-v", "-t", pane, "@flume_agent"])?.trim();
  return v || undefined;
}

/** `flume agent list [--json]`: one line per entry, or with --json a JSON array of entries plus live. */
function list(args: string[]): number {
  const extra = args.filter((a) => a !== "--json");
  if (extra.length > 0) {
    process.stderr.write(`flume: unexpected argument '${extra[0]}'\n\n${USAGE}`);
    return 2;
  }
  const dir = agentsDir();
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  } catch {}
  const panes = livePanes();
  const entries: (Entry & { live: string })[] = [];
  for (const f of files.sort()) {
    const e = readEntry(f.slice(0, -5));
    if (!e) continue;
    const cmd = e.pane ? panes.get(e.pane) : undefined;
    const live = cmd === undefined ? "-" : cmd === "claude" ? "yes" : "pane";
    entries.push({ ...e, live });
  }
  if (args.includes("--json")) {
    process.stdout.write(`${JSON.stringify(entries)}\n`);
    return 0;
  }
  const rows = [["NAME", "PANE", "PROJECT", "LIVE", "LAST-LAUNCH", "LAST-SEEN"]];
  for (const e of entries)
    rows.push([e.name, e.pane || "-", e.project || "-", e.live, e.last_launch, e.last_seen || "-"]);
  const widths =
    rows[0]?.map((_, c) => Math.max(...rows.map((r) => (r[c] as string).length))) ?? [];
  for (const r of rows)
    process.stdout.write(
      `${r
        .map((v, c) => v.padEnd(widths[c] as number))
        .join("  ")
        .trimEnd()}\n`,
    );
  return 0;
}

/** `flume agent show <name> [--json]`: the entry as YAML, or as a JSON object with --json. */
function show(args: string[]): number {
  const rest = args.filter((a) => a !== "--json");
  const name = rest[0];
  if (!name || rest.length > 1) {
    process.stderr.write(`flume: agent show needs one name\n\n${USAGE}`);
    return 2;
  }
  const e = readEntry(name);
  if (!e) {
    process.stderr.write(`flume: no agent '${name}'\n`);
    return 1;
  }
  process.stdout.write(args.includes("--json") ? `${JSON.stringify(e, null, 2)}\n` : stringify(e));
  return 0;
}

/** `flume guide <name> [--name N] [--project P]`: print a guide's text, via the daemon like prime. */
export async function guide(args: string[]): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(
      "usage: flume guide [<guide-name>] [--name <agent>] [--project <p>] [--json]\n  with no name, lists the guides (--json for JSON)\n",
    );
    return 0;
  }
  const opts: Record<string, string> = {};
  const bare: string[] = [];
  let json = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (a === "--json") json = true;
    else if (a === "--name" || a === "--project") {
      const v = args[++i];
      if (v === undefined) {
        process.stderr.write(`flume: ${a} needs a value\n`);
        return 2;
      }
      opts[a.slice(2)] = v;
    } else if (a.startsWith("-")) {
      process.stderr.write(`flume: unknown option ${a}\nusage: flume guide <guide-name>\n`);
      return 2;
    } else bare.push(a);
  }
  if (bare.length > 1 || (json && bare.length === 1)) {
    process.stderr.write(
      "flume: guide takes at most one guide name, and --json only with no name\nusage: flume guide [<guide-name>] [--json]\n",
    );
    return 2;
  }
  const agentName = opts.name ?? paneName() ?? process.env.AGENT_NAME;
  const project = opts.project ?? (agentName ? readEntry(agentName)?.project : undefined) ?? "";
  const url = daemonUrl(process.cwd());
  if (!url) {
    process.stderr.write(
      "flume: the flume server is not running. Ask the human to start it: flume serve (in its own pane).\n",
    );
    return 1;
  }
  const q = new URLSearchParams({ project });
  if (bare.length === 0) {
    const l = await request(url, "GET", `/api/prime?${q}`);
    if (!l) {
      process.stderr.write("flume: the flume server did not answer\n");
      return 1;
    }
    if (l.status !== 200) {
      process.stderr.write(`flume: ${l.body?.error ?? `request failed (${l.status})`}\n`);
      return 1;
    }
    const list = (l.body.guides ?? []) as { name: string; description: string; stage?: string }[];
    if (json) process.stdout.write(`${JSON.stringify(list)}\n`);
    else
      for (const g of list)
        process.stdout.write(
          `${g.name}\t${g.stage ?? "-"}\t${g.description.replace(/\s+/g, " ")}\n`,
        );
    return 0;
  }
  const r = await request(url, "GET", `/api/guides/${encodeURIComponent(bare[0] as string)}?${q}`);
  if (!r) {
    process.stderr.write("flume: the flume server did not answer\n");
    return 1;
  }
  if (r.status !== 200) {
    process.stderr.write(`flume: ${r.body?.error ?? `request failed (${r.status})`}\n`);
    return 1;
  }
  process.stdout.write(
    xmlBlock(
      "guide",
      { name: r.body.name as string, stage: r.body.stage as string | undefined },
      r.body.body as string,
    ),
  );
  return 0;
}

/** `flume prime`: print the text the launcher would send. */
export async function prime(args: string[]): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return 0;
  }
  const p = parse(args);
  if (typeof p === "string") {
    process.stderr.write(`flume: ${p}\n`);
    return 2;
  }
  const name = p.name ?? paneName();
  if (!name) {
    process.stderr.write(
      `flume: no agent name given (use --name <name>) and none in the tmux pane\n\n${USAGE}`,
    );
    return 2;
  }
  const bad = badName(name);
  if (bad) {
    process.stderr.write(`flume: ${bad}\n`);
    return 2;
  }
  const old = readEntry(name);
  process.stdout.write(
    await primeText(name, p.project ?? old?.project ?? "", p.role ?? old?.role ?? ""),
  );
  return 0;
}

/** `flume agent ...`; returns the exit code (claude's, for a launch). */
export async function agent(args: string[]): Promise<number> {
  const [first] = args;
  if (first === "--help" || first === "-h") {
    process.stdout.write(USAGE);
    return 0;
  }
  if (first === "list") return list(args.slice(1));
  if (first === "show") return show(args.slice(1));
  const p = parse(args);
  if (typeof p === "string") {
    process.stderr.write(`flume: ${p}\n`);
    return 2;
  }
  const name = p.name ?? paneName();
  if (!name) {
    process.stderr.write(
      `flume: this agent has no name; start again with --name <name>\n\n${["flume", "agent", ...args].map(shq).join(" ")}\n`,
    );
    return 2;
  }
  const bad = badName(name);
  if (bad) {
    process.stderr.write(`flume: ${bad}\n`);
    return 2;
  }
  const old = readEntry(name);
  const project = p.project ?? old?.project ?? "";
  const role = p.role ?? old?.role ?? "";
  const pane = process.env.TMUX_PANE ?? "";
  if (old?.pane && old.pane !== pane && !p.force) {
    process.stderr.write(
      `flume: agent '${name}' is tied to pane ${old.pane}; use --force to take it over\n`,
    );
    return 1;
  }
  const now = new Date().toISOString();
  const entry: Entry = {
    ...old,
    name,
    project,
    role,
    pane,
    created: old?.created ?? now,
    last_launch: now,
  };
  writeEntry(entry);
  if (pane) tmux(["set-option", "-p", "-t", pane, "@flume_agent", name]);

  const claudeArgs = [
    "--append-system-prompt",
    await primeText(name, project, role),
    "--name",
    name,
    ...p.passthrough,
    "--",
    p.prompt ?? DEFAULT_PROMPT,
  ];
  const env: NodeJS.ProcessEnv = { ...process.env, AGENT_NAME: name };
  if (project) env.AGENT_PROJECT = project;
  const r = spawnSync("claude", claudeArgs, { stdio: "inherit", env });
  if (r.error) {
    process.stderr.write(`flume: cannot run claude: ${r.error.message}\n`);
    return 1;
  }
  return r.status ?? 1;
}
