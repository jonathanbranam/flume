import { checkRoadmap, readRoadmap, roadmapPath } from "../core/index.ts";
import { daemonUrl, NOT_RUNNING, request } from "../daemon/index.ts";
import { findRoot, printProblems } from "./check.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);
const out = (s: string) => process.stdout.write(`${s}\n`);

const HELP = `usage: flume roadmap <command> [options]

Commands:
  show [--json]    print the roadmap with each task's state (needs the daemon)
  check [--json]   report links to no task and resolved tasks listed as upcoming

The roadmap is roadmap.md in the flume-root folder (flume.yaml names it). Every command takes --help.
`;

/** `flume roadmap ...`; returns the exit code. */
export async function roadmap(cwd: string, args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  if (sub === undefined || sub === "--help" || sub === "-h" || sub === "help") {
    (sub === undefined ? process.stderr : process.stdout).write(HELP);
    return sub === undefined ? 2 : 0;
  }
  if (sub !== "show" && sub !== "check") {
    err(`flume: unknown roadmap command '${sub}'\n\n${HELP.trimEnd()}`);
    return 2;
  }
  const usage = `flume roadmap ${sub} [--json]`;
  if (rest.includes("--help") || rest.includes("-h")) {
    out(`usage: ${usage}`);
    return 0;
  }
  const json = rest.includes("--json");
  const extra = rest.filter((a) => a !== "--json");
  if (extra.length > 0) {
    err(`flume: unexpected argument '${extra[0]}'\nusage: ${usage}`);
    return 2;
  }

  if (sub === "check") {
    const root = findRoot(cwd);
    if (readRoadmap(root) === undefined) {
      err(`flume: there is no ${roadmapPath(root)}`);
      return 1;
    }
    return printProblems(checkRoadmap(root), json);
  }

  const url = daemonUrl(cwd);
  const r = url ? await request(url, "GET", "/api/roadmap") : undefined;
  if (!r) {
    err(NOT_RUNNING.trimEnd());
    return 1;
  }
  if (r.status >= 400) {
    err(`flume: ${r.body?.error ?? `request failed (${r.status})`}`);
    return 1;
  }
  if (json) {
    out(JSON.stringify(r.body));
    return 0;
  }
  // biome-ignore lint/suspicious/noExplicitAny: JSON from the daemon
  for (const s of r.body.sections as any[]) {
    out(s.heading);
    for (const e of s.entries) {
      const cols = e.state === null ? ["-", "missing", `[[${e.link}]]`] : [e.id, e.state, e.title];
      if (e.note !== null) cols.push(e.note);
      out(cols.join("\t"));
    }
  }
  return 0;
}
