import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Command } from "@commander-js/extra-typings";
import { checkProject, formatProblem, type Problem } from "../core/check.ts";
import { FLUME_YAML } from "../core/layout.ts";
import { act } from "./program.ts";

/** The nearest folder at or above `from` that holds flume.yaml or flume/tasks, else `from`. */
export function findRoot(from: string): string {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, FLUME_YAML)) || existsSync(join(dir, "flume", "tasks"))) return dir;
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
export function check(cwd: string, json: boolean): number {
  try {
    return printProblems(checkProject(findRoot(cwd)), json);
  } catch (e) {
    process.stderr.write(`flume: ${(e as Error).message}\n`);
    return 1;
  }
}

/** The `flume check` command. */
export function checkCommand(): Command {
  return new Command("check")
    .description("validate the task files; one line per problem, exit 1 if any")
    .option("--json", "print JSON")
    .action(function (o) {
      return act(this, () => check(process.cwd(), o.json === true));
    });
}
