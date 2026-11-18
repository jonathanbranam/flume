import { agent, guide, prime } from "./agent.ts";
import { bugTemplate } from "./bug.ts";
import { check } from "./check.ts";
import { serve, status, stop } from "./daemon.ts";
import { init } from "./init.ts";
import { cloneCmd, project } from "./project.ts";
import { roadmap } from "./roadmap.ts";
import { task } from "./task.ts";
import { version } from "./version.ts";
import { workflow } from "./workflow.ts";

const HELP = `flume - a workflow tool for agents

Usage: flume <command>

Commands:
  init       set up this workspace folder [--root PATH] [--dir NAME] [--clone]
  clone      clone a tasks repo and set up its workspace: <git-url> [<workspace>]
  project    list, add (flume project --help)
  serve      run the daemon in the foreground [--port N] (the human runs this; agents never do)
  status     show whether the daemon runs, its address and root [--json]
  stop       ask the daemon to exit
  task       new, show, list, update, comment, assign, claim, phase, write, template, next, done,
             skip, close, reopen (flume task --help)
  workflow   print the phases: what each writes and requires [--json]
  roadmap    show, check (flume roadmap --help)
  check      validate the task files; one line per problem, exit 1 if any [--json]
  agent      launch Claude as a named agent; list, show (flume agent --help)
  prime      print the prime text flume agent would send [--role R]
  guide      print a guide: flume guide <name> [--project P]
  bug        print a bug-report template to paste into an email

Options:
  --version  print the version and git commit
  --help     show this help
`;

/** Run the CLI with the given arguments; returns the exit code. */
export async function main(args: string[]): Promise<number> {
  const [command] = args;
  if (command === undefined || command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === "--version") {
    process.stdout.write(`${version()}\n`);
    return 0;
  }
  if (command === "bug") {
    process.stdout.write(bugTemplate());
    return 0;
  }
  if (command === "init") return init(process.cwd(), args.slice(1));
  if (command === "clone") return cloneCmd(process.cwd(), args.slice(1));
  if (command === "project") return project(process.cwd(), args.slice(1));
  if (command === "serve") return serve(process.cwd(), args.slice(1));
  if (command === "status") return status(process.cwd(), args.slice(1));
  if (command === "stop") {
    if (args.length > 1) {
      process.stderr.write("flume: stop takes no arguments\n");
      return 2;
    }
    return stop(process.cwd());
  }
  if (command === "task") return task(process.cwd(), args.slice(1));
  if (command === "workflow") return workflow(process.cwd(), args.slice(1));
  if (command === "roadmap") return roadmap(process.cwd(), args.slice(1));
  if (command === "agent") return await agent(args.slice(1));
  if (command === "prime") return await prime(args.slice(1));
  if (command === "guide") return await guide(args.slice(1));
  if (command === "check") return check(process.cwd(), args.slice(1));
  process.stderr.write(`flume: unknown command '${command}'\n\n${HELP}`);
  return 2;
}
