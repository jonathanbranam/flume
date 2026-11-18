import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { agentsDir, type Entry, readEntry, writeEntry } from "../core/agents.ts";
import { findInitialized, findProject, readConfigRoot } from "../daemon/index.ts";

const USAGE = `Usage:
  flume agent [--name <name>] [--project <p>] [--force] [<prompt>] [-- <claude-arg>...]
  flume agent list [--json]
  flume agent show <name> [--json]
  flume prime [--name <name>] [--project <p>]

Launch Claude Code as a named agent. The name comes only from --name, else from the tmux
pane option @flume_agent. One bare argument is the prompt sent to the agent (quote it); with
none, flume sends a short default. Before "--" flume accepts only --name, --project, --force, -h/--help and the prompt;
any other option is an error (exit 2). Claude's options go after "--", which flume passes
to claude and checks only for conflicts (a second prompt, -n/--name, --append-system-prompt[-file], a repeated single-value
option, an option missing its value) and exits 2 on one. The prime text always goes to claude
with --append-system-prompt, and flume always passes --name <name>.
`;

const DEFAULT_BASE =
  "You are agent {name}, stored in $AGENT_NAME.\nUse the flume CLI to work with tasks; run flume --help to learn it.\nNever start flume serve yourself; only the human does. If flume says the server is not running, ask the human to start it.\n";
const DEFAULT_PROJECT =
  "You are working on the {project} project. Read that project's CLAUDE.md and follow its instructions.\n";
const DEFAULT_PROMPT = "Check your tickets and status, suggest next steps, and follow up.";
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

interface Parsed {
  name?: string;
  project?: string;
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
    if (!afterDash && (a === "--project" || a === "--name")) {
      const v = args[++i];
      if (v === undefined) return `${a} needs a value`;
      if (a === "--project") p.project = v;
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

/** The task root of the workspace the current folder is in, when it has a workflow/ folder; else undefined. */
function workflowRoot(): string | undefined {
  const ws = findInitialized(process.cwd());
  if (!ws) return undefined;
  const root = readConfigRoot(ws) ?? findProject(ws)?.mainCheckout;
  return root && existsSync(join(root, "workflow")) ? root : undefined;
}

function primeText(name: string, project: string): string {
  const vars = { name, project };
  let text = fill(DEFAULT_BASE, vars);
  if (project) text += `\n${fill(DEFAULT_PROJECT, vars)}`;
  const root = workflowRoot();
  if (root)
    text += `\nWorkflow: read the .md files in ${root}/workflow/base/, then in ${root}/workflow/, then in the project's workflow/ folder, then the project's CLAUDE.md, each in name order; where they conflict, later ones override earlier ones.\n`;
  return text;
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

/** `flume prime`: print the text the launcher would send. */
export function prime(args: string[]): number {
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
  process.stdout.write(primeText(name, p.project ?? readEntry(name)?.project ?? ""));
  return 0;
}

/** `flume agent ...`; returns the exit code (claude's, for a launch). */
export function agent(args: string[]): number {
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
    pane,
    created: old?.created ?? now,
    last_launch: now,
  };
  writeEntry(entry);
  if (pane) tmux(["set-option", "-p", "-t", pane, "@flume_agent", name]);

  const claudeArgs = [
    "--append-system-prompt",
    primeText(name, project),
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
