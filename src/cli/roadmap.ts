import { Command } from "@commander-js/extra-typings";
import { checkRoadmap, readRoadmap, roadmapPath } from "../core/index.ts";
import { daemonUrl, NOT_RUNNING, request } from "../daemon/index.ts";
import { findRoot, printProblems } from "./check.ts";
import { act } from "./program.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);
const out = (s: string) => process.stdout.write(`${s}\n`);

/** `flume roadmap show|check [--json]`; returns the exit code. */
async function roadmapRun(cwd: string, sub: "show" | "check", json: boolean): Promise<number> {
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

/** The `flume roadmap` group. */
export function roadmapCommand(): Command {
  const group = new Command("roadmap")
    .description("show, check")
    .addHelpText(
      "after",
      "\nThe roadmap is roadmap.md in the flume-root folder (flume.yaml names it).",
    );
  group
    .command("show")
    .description("print the roadmap with each task's state (needs the daemon)")
    .option("--json", "print JSON")
    .action(function (o) {
      return act(this, () => roadmapRun(process.cwd(), "show", o.json === true));
    });
  group
    .command("check")
    .description("report links to no task and resolved tasks listed as upcoming")
    .option("--json", "print JSON")
    .action(function (o) {
      return act(this, () => roadmapRun(process.cwd(), "check", o.json === true));
    });
  return group;
}
