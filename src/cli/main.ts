import { Command, CommanderError, type CommandUnknownOpts } from "@commander-js/extra-typings";
import { agentCommand, guideCommand, primeCommand } from "./agent.ts";
import { bugCommand } from "./bug.ts";
import { checkCommand } from "./check.ts";
import { daemonCommands } from "./daemon.ts";
import { guideText, helpCommand, isCommandPath, topicList } from "./help.ts";
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
  const [serve, status, stop] = daemonCommands();
  const program = new Command("flume")
    .description(
      [
        "a workflow tool for agents",
        "",
        "Flume keeps work as tasks: folders of Markdown files in a git repo (the tasks repo). A task moves through five phases (proposal, design, specs, plan, implement), each writing one part that the next requires; the human controls the phases. A local daemon, which only the human starts with flume serve, owns the files and commits every change. Agents are Claude Code sessions launched with flume agent; they claim a task and work it with flume task commands.",
        "",
        "New here? Run flume help setup. flume help lists every guide.",
      ].join("\n"),
    )
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
    .addCommand(bugCommand())
    .addCommand(helpCommand() as unknown as Command);
  configure(program);
  if (args[0] === "help" && args.length > 1 && args[1] !== "--help" && args[1] !== "-h") {
    // flume help <topic> prints a guide; flume help <command> [<subcommand>] is --help.
    const rest = args.slice(1);
    const guide = rest.length === 1 ? guideText(rest[0] as string) : undefined;
    if (guide !== undefined) {
      process.stdout.write(guide);
      return 0;
    }
    if (!isCommandPath(program, rest) || rest[0] === "help") {
      process.stderr.write(`flume: no help topic or command: ${rest.join(" ")}\n${topicList()}`);
      return 1;
    }
    args = [...rest, "--help"];
  } else if (args[0] === "help" && args.length === 1) {
    process.stdout.write(topicList());
    return 0;
  }
  outcome.argv = args;
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
