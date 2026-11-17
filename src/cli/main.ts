import { bugTemplate } from "./bug.ts";
import { version } from "./version.ts";

const HELP = `flume - a workflow tool for agents

Usage: flume <command>

Commands:
  version    print the version and git commit
  bug        print a bug-report template to paste into an email
  --help     show this help
`;

/** Run the CLI with the given arguments; returns the exit code. */
export function main(args: string[]): number {
  const [command] = args;
  if (command === undefined || command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === "version") {
    process.stdout.write(`${version()}\n`);
    return 0;
  }
  if (command === "bug") {
    process.stdout.write(bugTemplate());
    return 0;
  }
  process.stderr.write(`flume: unknown command '${command}'\n\n${HELP}`);
  return 2;
}
