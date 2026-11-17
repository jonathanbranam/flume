import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { checkProject, formatProblem } from "../core/check.ts";

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

/** `flume check`: one line per problem on stdout; exit 1 when there are any. */
export function check(cwd: string): number {
  const problems = checkProject(findRoot(cwd));
  for (const p of problems) process.stdout.write(`${formatProblem(p)}\n`);
  return problems.length === 0 ? 0 : 1;
}
