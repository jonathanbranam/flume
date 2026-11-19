import { Command } from "@commander-js/extra-typings";
import { daemonUrl, NOT_RUNNING, request } from "../daemon/index.ts";
import { act } from "./program.ts";

/** `flume workflow [--json]`; returns the exit code. */
export async function workflow(cwd: string, json: boolean): Promise<number> {
  const url = daemonUrl(cwd);
  const r = url ? await request(url, "GET", "/api/workflow") : undefined;
  if (!r) {
    process.stderr.write(NOT_RUNNING);
    return 1;
  }
  if (r.status >= 400) {
    process.stderr.write(`flume: ${r.body?.error ?? `request failed (${r.status})`}\n`);
    return 1;
  }
  if (json) {
    process.stdout.write(`${JSON.stringify(r.body)}\n`);
    return 0;
  }
  const steps = r.body as { phase: string; part: string | null; requires: string | null }[];
  steps.forEach((s, i) => {
    process.stdout.write(
      `${i + 1}. ${s.phase}: writes ${s.part ?? "(none: works the plan)"}; requires ${s.requires ?? "nothing"}\n`,
    );
  });
  return 0;
}

/** The `flume workflow` command. */
export function workflowCommand(): Command {
  return new Command("workflow")
    .description("print the phases: what each writes and requires")
    .option("--json", "print JSON")
    .addHelpText(
      "after",
      "\nPrint the whole workflow: each phase in order, the part it writes and the phase it requires.",
    )
    .action(function (o) {
      return act(this, () => workflow(process.cwd(), o.json === true));
    });
}
