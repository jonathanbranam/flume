import { Command } from "@commander-js/extra-typings";
import { version } from "./version.ts";

/** A bug-report template, ready to paste into an email. */
export function bugTemplate(): string {
  return `Flume bug report

Version: ${version()}

## Command

(the exact command you ran)

## Expected

(what you expected to happen)

## Actual

(what happened instead; paste the output)
`;
}

/** The `flume bug` command. */
export function bugCommand(): Command {
  return new Command("bug")
    .description("print a bug-report template to paste into an email")
    .action(() => {
      process.stdout.write(bugTemplate());
    });
}
