import { checkRoadmap, formatProblem, ROADMAP_PATH, readRoadmap } from "../core/index.ts";
import { daemonUrl, NOT_RUNNING, request } from "../daemon/index.ts";
import { findRoot } from "./check.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);
const out = (s: string) => process.stdout.write(`${s}\n`);

const HELP = `usage: flume roadmap <command> [options]

Commands:
  show [--json]    print the roadmap with each task's state (needs the daemon)
  check            report links to no task and resolved tasks listed as upcoming

The roadmap is ${ROADMAP_PATH}. Every command takes --help.
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
  const usage = sub === "show" ? "flume roadmap show [--json]" : "flume roadmap check";
  if (rest.includes("--help") || rest.includes("-h")) {
    out(`usage: ${usage}`);
    return 0;
  }
  const json = sub === "show" && rest.includes("--json");
  const extra = rest.filter((a) => !(json && a === "--json"));
  if (extra.length > 0) {
    err(`flume: unexpected argument '${extra[0]}'\nusage: ${usage}`);
    return 2;
  }

  if (sub === "check") {
    const root = findRoot(cwd);
    if (readRoadmap(root) === undefined) {
      err(`flume: there is no ${ROADMAP_PATH}`);
      return 1;
    }
    const problems = checkRoadmap(root);
    for (const p of problems) out(formatProblem(p));
    return problems.length === 0 ? 0 : 1;
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
