import { daemonUrl, NOT_RUNNING, request } from "../daemon/index.ts";

const HELP = `usage: flume workflow [--json]

Print the whole workflow: each phase in order, the part it writes and the phase it requires.
`;

/** `flume workflow [--json]`; returns the exit code. */
export async function workflow(cwd: string, args: string[]): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(HELP);
    return 0;
  }
  const bad = args.find((a) => a !== "--json");
  if (bad !== undefined) {
    process.stderr.write(`flume: unexpected argument '${bad}'\n${HELP}`);
    return 2;
  }
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
  if (args.includes("--json")) {
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
