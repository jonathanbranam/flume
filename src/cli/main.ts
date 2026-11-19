import { Command, CommanderError, type CommandUnknownOpts } from "@commander-js/extra-typings";
import { agentCommand, guideCommand, primeCommand } from "./agent.ts";
import { bugCommand } from "./bug.ts";
import { checkCommand } from "./check.ts";
import { daemonCommands } from "./daemon.ts";
import { initCommand } from "./init.ts";
import { outcome } from "./program.ts";
import { cloneCommand, projectCommand } from "./project.ts";
import { roadmapCommand } from "./roadmap.ts";
import { taskCommand } from "./task.ts";
import { version } from "./version.ts";
import { workflowCommand } from "./workflow.ts";

/** The same settings on every command: usage after an error, errors thrown not exited. */
function configure(cmd: CommandUnknownOpts): void {
  cmd.enablePositionalOptions().showHelpAfterError(true).exitOverride();
  for (const c of cmd.commands) configure(c);
}

/** Run the CLI with the given arguments; returns the exit code. */
export async function main(args: string[]): Promise<number> {
  outcome.code = 0;
  // flume help [<command> [<subcommand>]] prints what --help prints.
  if (args[0] === "help") args = args.length === 1 ? ["--help"] : [...args.slice(1), "--help"];
  outcome.argv = args;
  const [serve, status, stop] = daemonCommands();
  const program = new Command("flume")
    .description("a workflow tool for agents")
    .usage("<command>")
    .version(
      args.includes("--version") ? version() : "",
      "--version",
      "print the version and git commit",
    )
    .addCommand(initCommand())
    .addCommand(cloneCommand())
    .addCommand(projectCommand())
    .addCommand(serve as Command)
    .addCommand(status as Command)
    .addCommand(stop as Command)
    .addCommand(taskCommand())
    .addCommand(workflowCommand())
    .addCommand(roadmapCommand())
    .addCommand(checkCommand())
    .addCommand(agentCommand())
    .addCommand(primeCommand())
    .addCommand(guideCommand())
    .addCommand(bugCommand());
  configure(program);
  try {
    await program.parseAsync(args.length === 0 ? ["--help"] : args, { from: "user" });
  } catch (e) {
    if (e instanceof CommanderError) {
      return e.code === "commander.helpDisplayed" || e.code === "commander.version" ? 0 : 2;
    }
    throw e;
  }
  return outcome.code;
}
