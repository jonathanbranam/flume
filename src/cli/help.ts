import { readFileSync } from "node:fs";
import { Command, type CommandUnknownOpts } from "@commander-js/extra-typings";

/** The guides `flume help` prints, in order: name and one-line summary. Files are docs/help/<name>.md. */
export const topics: [name: string, summary: string][] = [
  ["install", "clone, install and update flume"],
  ["setup", "adopt flume for a project; workspace layouts; run the daemon"],
  ["usage", "what to run where and when; the order of a task's life"],
];

const dir = new URL("../../docs/help/", import.meta.url);

/** The topic list printed by `flume help`. */
export function topicList(): string {
  const width = Math.max(...topics.map(([n]) => n.length));
  return [
    "flume help topics:",
    "",
    ...topics.map(([n, s]) => `  ${n.padEnd(width)}  ${s}`),
    "",
    "flume help <topic> prints a guide; flume help <command> is flume <command> --help.",
    "",
  ].join("\n");
}

/** The text of one guide, or undefined when `name` is not a topic. */
export function guideText(name: string): string | undefined {
  if (!topics.some(([n]) => n === name)) return undefined;
  return readFileSync(new URL(`${name}.md`, dir), "utf8");
}

/** Whether `names` is a command (and subcommand) path of `program`. */
export function isCommandPath(program: CommandUnknownOpts, names: string[]): boolean {
  let cmd = program;
  for (const name of names) {
    const next = cmd.commands.find((c) => c.name() === name || c.aliases().includes(name));
    if (!next) return false;
    cmd = next;
  }
  return true;
}

/** The help command, so it is listed; main() answers `flume help ...` before it parses. */
export function helpCommand(): Command<[string[]]> {
  return new Command("help")
    .description(
      "detailed help on using flume: install, setup, usage; flume help <command> is flume <command> --help",
    )
    .argument("[topic-or-command...]");
}
