import { bugTemplate } from "./bug.ts";
import { check } from "./check.ts";
import { serve, status, stop } from "./daemon.ts";
import { version } from "./version.ts";

const HELP = `flume - a workflow tool for agents

Usage: flume <command>

Commands:
  version    print the version and git commit
  serve      run the daemon in the foreground [--port N] [--root PATH]
  status     show whether the daemon runs, its address and root
  stop       ask the daemon to exit
  check      validate the task files; one line per problem, exit 1 if any
  bug        print a bug-report template to paste into an email
  --help     show this help
`;

/** Run the CLI with the given arguments; returns the exit code. */
export async function main(args: string[]): Promise<number> {
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
  if (command === "serve") return serve(process.cwd(), args.slice(1));
  if (command === "status" || command === "stop") {
    if (args.length > 1) {
      process.stderr.write(`flume: ${command} takes no arguments\n`);
      return 2;
    }
    return command === "status" ? status(process.cwd()) : stop(process.cwd());
  }
  if (command === "check") return check(process.cwd());
  process.stderr.write(`flume: unknown command '${command}'\n\n${HELP}`);
  return 2;
}
