import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const USAGE = `Usage:
  flume agent [<name>] [--project <p>] [--force] [--system] ["<one-off prompt>"] [claude args] [-- claude args]
  flume agent list
  flume agent show <name>
  flume prime [<name>] [--project <p>]

Launch Claude Code as a named agent. Flags flume knows (--project, --force, --system) are
consumed; other arguments pass to claude unchanged; "--" passes everything after it to claude.
With no name, the name comes from the tmux pane option @flume_agent.
`;

const DEFAULT_BASE = "You are agent {name}, stored in $AGENT_NAME.\n";
const DEFAULT_PROJECT = "You are working on project {project}.\n";
const KICKOFF = "Read your instructions in the system prompt and start.";
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

interface Entry {
  name: string;
  project: string;
  pane: string;
  created: string;
  last_launch: string;
}

interface Parsed {
  name?: string;
  project?: string;
  force: boolean;
  system: boolean;
  prompt?: string;
  passthrough: string[];
}

const flumeHome = () => join(process.env.HOME ?? homedir(), ".flume");
const entryFile = (name: string) => join(flumeHome(), "agents", `${name}.json`);

function readEntry(name: string): Entry | undefined {
  try {
    return JSON.parse(readFileSync(entryFile(name), "utf8")) as Entry;
  } catch {
    return undefined;
  }
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

/** claude flags that take a separate value; the value passes through with the flag. */
const VALUE_FLAGS = new Set([
  "--model",
  "--permission-mode",
  "--resume",
  "-r",
  "--add-dir",
  "--settings",
  "--allowedTools",
  "--disallowedTools",
  "--mcp-config",
  "--fallback-model",
  "--session-id",
  "--agents",
  "--append-system-prompt",
  "--system-prompt",
]);

function parse(args: string[]): Parsed | string {
  const p: Parsed = { force: false, system: false, passthrough: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (a === "--") {
      p.passthrough.push(...args.slice(i + 1));
      break;
    }
    if (a === "--force") p.force = true;
    else if (a === "--system") p.system = true;
    else if (a === "--project") {
      const v = args[++i];
      if (v === undefined) return "--project needs a value";
      p.project = v;
    } else if (a.startsWith("-")) {
      p.passthrough.push(a);
      const v = args[i + 1];
      if (VALUE_FLAGS.has(a) && v !== undefined) {
        p.passthrough.push(v);
        i++;
      }
    } else if (NAME_RE.test(a) && p.name === undefined) p.name = a;
    else if (p.prompt === undefined) p.prompt = a;
    else p.passthrough.push(a);
  }
  return p;
}

function template(file: string, fallback: string, vars: Record<string, string>): string {
  let text: string;
  try {
    text = readFileSync(join(flumeHome(), "templates", file), "utf8");
  } catch {
    text = fallback;
  }
  return text.replace(/\{(name|project)\}/g, (_, k: string) => vars[k] ?? "");
}

function primeText(name: string, project: string): string {
  const vars = { name, project };
  let text = template("base.md", DEFAULT_BASE, vars);
  if (project) text += `\n${template("project.md", DEFAULT_PROJECT, vars)}`;
  return text;
}

function paneName(): string | undefined {
  const pane = process.env.TMUX_PANE;
  if (!pane) return undefined;
  const v = tmux(["show-options", "-p", "-q", "-v", "-t", pane, "@flume_agent"])?.trim();
  return v || undefined;
}

function list(): number {
  const dir = join(flumeHome(), "agents");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {}
  const panes = livePanes();
  const rows = [["NAME", "PANE", "PROJECT", "LIVE", "LAST-LAUNCH"]];
  for (const f of files.sort()) {
    const e = readEntry(f.slice(0, -5));
    if (!e) continue;
    const cmd = e.pane ? panes.get(e.pane) : undefined;
    const live = cmd === undefined ? "-" : cmd === "claude" ? "yes" : "pane";
    rows.push([e.name, e.pane || "-", e.project || "-", live, e.last_launch]);
  }
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

function show(name: string | undefined): number {
  if (!name) {
    process.stderr.write(`flume: agent show needs a name\n\n${USAGE}`);
    return 2;
  }
  const e = readEntry(name);
  if (!e) {
    process.stderr.write(`flume: no agent '${name}'\n`);
    return 1;
  }
  process.stdout.write(`${JSON.stringify(e, null, 2)}\n`);
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
    process.stderr.write(`flume: no agent name given and none in the tmux pane\n\n${USAGE}`);
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
  if (first === "list") return list();
  if (first === "show") return show(args[1]);
  const p = parse(args);
  if (typeof p === "string") {
    process.stderr.write(`flume: ${p}\n`);
    return 2;
  }
  const name = p.name ?? paneName();
  if (!name) {
    process.stderr.write(`flume: no agent name given and none in the tmux pane\n\n${USAGE}`);
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
  const entry: Entry = { name, project, pane, created: old?.created ?? now, last_launch: now };
  mkdirSync(join(flumeHome(), "agents"), { recursive: true });
  writeFileSync(entryFile(name), `${JSON.stringify(entry, null, 2)}\n`);
  if (pane) tmux(["set-option", "-p", "-t", pane, "@flume_agent", name]);

  const prime = primeText(name, project);
  const claudeArgs = [...p.passthrough];
  if (p.system) {
    claudeArgs.push("--append-system-prompt", prime, p.prompt ?? KICKOFF);
  } else {
    claudeArgs.push(p.prompt ? `${prime}\n${p.prompt}` : prime);
  }
  const env: NodeJS.ProcessEnv = { ...process.env, AGENT_NAME: name };
  if (project) env.AGENT_PROJECT = project;
  const r = spawnSync("claude", claudeArgs, { stdio: "inherit", env });
  if (r.error) {
    process.stderr.write(`flume: cannot run claude: ${r.error.message}\n`);
    return 1;
  }
  return r.status ?? 1;
}
