import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { checkProject, formatProblem, type Problem } from "../core/check.ts";

/** The nearest folder at or above `from` that holds flume/tasks, else `from`. */
export function findRoot(from: string): string {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, "flume", "tasks"))) return dir;
    const up = dirname(dir);
    if (up === dir) return resolve(from);
    dir = up;
  }
}

/** Print the problems: one line each, or with --json one JSON array of {path, message}. */
export function printProblems(problems: Problem[], json: boolean): number {
  if (json) process.stdout.write(`${JSON.stringify(problems)}\n`);
  else for (const p of problems) process.stdout.write(`${formatProblem(p)}\n`);
  return problems.length === 0 ? 0 : 1;
}

/** `flume check [--json]`: one line per problem on stdout (or a JSON array); exit 1 when there are any. */
export function check(cwd: string, args: string[] = []): number {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write("usage: flume check [--json]\n");
    return 0;
  }
  const extra = args.filter((a) => a !== "--json");
  if (extra.length > 0) {
    process.stderr.write(`flume: unexpected argument '${extra[0]}'\nusage: flume check [--json]\n`);
    return 2;
  }
  return printProblems(checkProject(findRoot(cwd)), args.includes("--json"));
}
