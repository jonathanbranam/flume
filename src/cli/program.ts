import type { Command } from "@commander-js/extra-typings";

/** The exit code of the command that ran; main() reads it after the parse. */
export const outcome = { code: 0, argv: [] as string[] };

/** Refuse with the usage after the message: exit 2 (main maps every usage error to 2). */
export function usageError(cmd: Pick<Command, "error">, message: string): never {
  return cmd.error(`${message}`, { exitCode: 2, code: "flume.usage" });
}

/** A command's own refusal of what it was given (exit 2, with the usage after the message). */
export class Usage extends Error {}

/** Run a command's logic as the action of `cmd`: its code becomes the exit code. */
export async function act(
  cmd: Pick<Command, "error">,
  fn: () => number | Promise<number>,
): Promise<void> {
  try {
    outcome.code = await fn();
  } catch (e) {
    if (e instanceof Usage) usageError(cmd, e.message);
    throw e;
  }
}
