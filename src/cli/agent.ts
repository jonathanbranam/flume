import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { Command, type CommandUnknownOpts } from "@commander-js/extra-typings";
import { stringify } from "yaml";
import { agentsDir, type Entry, flumeHome, readEntry, writeEntry } from "../core/agents.ts";
import {
  documentText,
  joinedText,
  type PrimeDocuments,
  primeDocuments,
} from "../core/documents.ts";
import { xmlBlock, xmlOpen, xmlText } from "../core/prime.ts";
import { daemonUrl, findFlumeFolder, request } from "../daemon/index.ts";
import { act, outcome, Usage } from "./program.ts";

const NOTE = `Launch Claude Code as a named agent. The name comes only from --name, else from the tmux
pane option @flume_agent. One bare argument is the prompt sent to the agent (quote it); with
none, flume sends a short default. Before "--" flume accepts only --name, --project, --role,
--force, -h/--help and the prompt; any other option is an error (exit 2). Claude's options go
after "--", which flume passes to claude in order and checks only for conflicts (a second
prompt, -n/--name, --append-system-prompt[-file], a repeated single-value option, an option
missing its value) and exits 2 on one. The prime text always goes to claude with
--append-system-prompt, and flume always passes --name <name>.
`;
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

/**
 * The lines that tell an agent who it is and which project it is on. flume builds them itself, not
 * in any layered document, so no workflow or project layer can replace or remove them. The project
 * line is left out when there is no project.
 */
function identityLines(name: string, project: string): string {
  const lines = [`You are agent ${name}, stored in $AGENT_NAME.`];
  if (project) lines.push(`You are working on project ${project}, stored in $AGENT_PROJECT.`);
  return lines.join("\n\n");
}

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(name|project)\}/g, (_, k: string) => vars[k] ?? "");
}

function serverNotRunning(ws: string): string {
  return `Flume looks set up in ${ws}, but its server is not running, so the workflow text is missing.
Ask the human to run: flume serve (in ${ws}, in its own pane). Do not start it yourself.`;
}

const NOT_SET_UP = `The workflow text is missing, and no flume workspace was found here (no .flume folder in this folder or above it).

Flume manages agents' work with tasks and workflows. Tasks live in a tasks repo; agents work them through flume commands. "flume serve" is the server that agents and the web UI talk to; the human starts it.

To set up a new workspace, tell the human to do this:
1. In the workspace folder (a folder of related repos): flume init
2. For each project: flume project add <git-url>. Or, to set up a whole workspace from an existing tasks repo: flume clone <tasks-repo-url>, then flume project clone for the projects it already lists.
3. flume serve, run by the human in its own pane.

Do not run these commands yourself without the human, and never start the server yourself.`;

/** The prime text and the first prompt to launch with when the human gives none. */
interface Prime {
  text: string;
  firstPrompt: string;
}

/**
 * The prime text: one flume_prime element holding the identity lines (built here, first, outside
 * every layer) and then a workflow element (the merged workflow.md,
 * project.md and role, which the daemon builds from flume's shipped files and the flume-root's),
 * then the guides. With no daemon (or a refusal) the workflow element holds the shipped documents
 * alone, followed by a server_not_running element (a workspace was found), a flume_not_set_up
 * element (none was) or a workflow_missing element (refused) saying why the rest is missing.
 * Throws when a layered file has an error.
 */
async function primeText(name: string, project: string, role: string): Promise<Prime> {
  const vars = { name, project };
  const url = daemonUrl(process.cwd());
  const q = new URLSearchParams({ project, role });
  const r = url ? await request(url, "GET", `/api/prime?${q}`) : undefined;
  if (r?.status === 422) throw new Error(r.body?.error ?? "a workflow file has an error");
  let docs: PrimeDocuments;
  const after: string[] = [];
  if (r?.status === 200) {
    docs = { ...r.body.parts, first_prompt: r.body.first_prompt };
    const guides = (r.body.guides ?? []) as { name: string; description: string }[];
    if (guides.length > 0) {
      let g = "<guides>\n<!-- Print one with: flume guide <name> -->\n";
      for (const x of guides)
        g += `${xmlOpen("guide", { name: x.name })}${xmlText(x.description)}</guide>\n`;
      after.push(`${g}</guides>\n`);
    }
  } else {
    // Shipped files only: no project name goes into a path.
    docs = primeDocuments(undefined, "", "");
    if (project) docs.project = documentText(undefined, "", "project.md");
    if (r) {
      const why = r.body?.error ?? `request failed (${r.status})`;
      after.push(xmlBlock("workflow_missing", {}, `The workflow text is missing: ${why}`));
    } else {
      const ws = findFlumeFolder(process.cwd(), flumeHome());
      if (ws) after.push(xmlBlock("server_not_running", {}, serverNotRunning(ws)));
      else after.push(xmlBlock("flume_not_set_up", {}, NOT_SET_UP));
    }
  }
  const body = joinedText({
    ...docs,
    workflow: fill(docs.workflow, vars),
    project: fill(docs.project, vars),
  });
  const parts = [...(body ? [xmlBlock("workflow", {}, body)] : []), ...after];
  const root = xmlOpen("flume_prime", { agent: name, project, role });
  return {
    text: `${root}\n\n${identityLines(name, project)}\n\n${parts.join("\n")}\n</flume_prime>\n`,
    firstPrompt: fill(docs.first_prompt, vars),
  };
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
function list(json: boolean): number {
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
  if (json) {
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
function show(name: string, json: boolean): number {
  const e = readEntry(name);
  if (!e) {
    process.stderr.write(`flume: no agent '${name}'\n`);
    return 1;
  }
  process.stdout.write(json ? `${JSON.stringify(e, null, 2)}\n` : stringify(e));
  return 0;
}

/** `flume guide <name> [--name N] [--project P]`: print a guide's text, via the daemon like prime. */
export async function guide(
  name: string | undefined,
  o: { name?: string; project?: string; json?: boolean },
): Promise<number> {
  const json = o.json === true;
  const bare = name === undefined ? [] : [name];
  if (json && bare.length === 1)
    throw new Usage("--json only with no guide name (a guide's text is not JSON)");
  const opts = o;
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
    const list = (l.body.guides ?? []) as { name: string; description: string }[];
    if (json) process.stdout.write(`${JSON.stringify(list)}\n`);
    else
      for (const g of list)
        process.stdout.write(`${g.name}\t${g.description.replace(/\s+/g, " ")}\n`);
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
  process.stdout.write(xmlBlock("guide", { name: r.body.name as string }, r.body.body as string));
  return 0;
}

/** `flume prime`: print the text the launcher would send. */
export async function prime(p: {
  name?: string;
  project?: string;
  role?: string;
}): Promise<number> {
  const name = p.name ?? paneName();
  if (!name) throw new Usage("no agent name given (use --name <name>) and none in the tmux pane");
  const bad = badName(name);
  if (bad) throw new Usage(bad);
  const old = readEntry(name);
  try {
    const r = await primeText(name, p.project ?? old?.project ?? "", p.role ?? old?.role ?? "");
    process.stdout.write(r.text);
    return 0;
  } catch (e) {
    process.stderr.write(`flume: ${(e as Error).message}\n`);
    return 1;
  }
}

/** `flume agent ...`; returns the exit code (claude's, for a launch). */
export async function agent(args: string[]): Promise<number> {
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
  let primed: Prime;
  try {
    primed = await primeText(name, project, role);
  } catch (e) {
    process.stderr.write(`flume: ${(e as Error).message}\n`);
    return 1;
  }
  if (pane) tmux(["set-option", "-p", "-t", pane, "@flume_agent", name]);

  const claudeArgs = [
    "--append-system-prompt",
    primed.text,
    "--name",
    name,
    ...p.passthrough,
    "--",
    p.prompt ?? primed.firstPrompt,
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

/** The `flume agent` group: Commander routes and prints the help; the launch reads its own words. */
export function agentCommand(): CommandUnknownOpts {
  const group = new Command("agent")
    .description("launch Claude as a named agent; list, show")
    .usage("[--name <name>] [--project <p>] [--role <r>] [--force] [<prompt>] [-- <claude-arg>...]")
    .addHelpText("after", `\n${NOTE}`)
    .helpOption(false)
    .allowUnknownOption()
    .allowExcessArguments()
    .argument("[words...]")
    .action(function () {
      // Raw words after "agent", as typed: Commander would lose where -- was.
      const words = outcome.argv.slice(outcome.argv.indexOf("agent") + 1);
      if (words[0] === "--help" || words[0] === "-h") {
        this.outputHelp();
        return;
      }
      return act(this, async () => agent(words));
    });
  group
    .command("list")
    .helpOption("-h, --help")
    .description("one line per agent entry; with --json an array of entries plus live")
    .option("--json", "print JSON")
    .action(function (o) {
      return act(this, () => list(o.json === true));
    });
  group
    .command("show")
    .helpOption("-h, --help")
    .description("one agent's entry as YAML, or as a JSON object with --json")
    .argument("<name>")
    .option("--json", "print JSON")
    .action(function (name, o) {
      return act(this, () => show(name, o.json === true));
    });
  return group;
}

/** The `flume prime` command. */
export function primeCommand(): Command {
  return new Command("prime")
    .description("print the prime text flume agent would send")
    .option("--name <name>", "the agent name (else the tmux pane's)")
    .option("--project <p>", "project")
    .option("--role <r>", "role")
    .action(function (o) {
      return act(this, () => prime(o));
    });
}

/** The `flume guide` command. */
export function guideCommand(): CommandUnknownOpts {
  return new Command("guide")
    .description("list the guides, or print one")
    .argument("[guide-name]")
    .option("--name <agent>", "the agent name")
    .option("--project <p>", "project")
    .option("--json", "with no guide name, print the list as JSON")
    .action(function (name, o) {
      return act(this, () => guide(name, o));
    });
}
