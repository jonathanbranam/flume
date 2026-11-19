import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "@commander-js/extra-typings";
import { readDir } from "../core/index.ts";
import {
  daemonUrl,
  findProject,
  findWorkspace,
  inRepo,
  liveDaemon,
  readConfigRoot,
  removeRecord,
  request,
  startDaemon,
  writeRecord,
} from "../daemon/index.ts";
import { act, Usage } from "./program.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);

/** The line every serve help carries: agents must not start the server. */
const HUMAN_ONLY = "Only the human runs flume serve, in its own pane. Agents never start it.";

/** `flume serve`: run the daemon in the foreground until stopped. */
export async function serve(cwd: string, port: number): Promise<number> {
  // The workspace is the folder serve runs in; its .flume/ holds daemon.json and config.yaml.
  const ws = resolve(cwd);
  if (!existsSync(join(ws, ".flume"))) {
    err("flume: no flume workspace here; run flume init first");
    return 1;
  }
  const running = findWorkspace(ws) === ws ? await liveDaemon(ws) : undefined;
  if (running) {
    err(`flume: a daemon is already running at ${running.url}`);
    return 1;
  }
  const taskRoot = readConfigRoot(ws) ?? findProject(ws)?.mainCheckout;
  if (!taskRoot) {
    err(
      "flume: no task root: run flume init --root PATH, or run flume init inside a git repository",
    );
    return 1;
  }
  if (!inRepo(taskRoot)) {
    err(`flume: the task root is not a git repository: ${taskRoot}`);
    return 1;
  }
  try {
    readDir(taskRoot);
  } catch (e) {
    err(`flume: ${(e as Error).message}`);
    return 1;
  }
  let stopped: () => void = () => {};
  const done = new Promise<void>((r) => {
    stopped = r;
  });
  const daemon = await startDaemon({ root: taskRoot, port, onStop: () => stopped() });
  writeRecord(ws, { url: daemon.url, pid: process.pid, root: taskRoot });
  process.stdout.write(`${daemon.url}\n`);
  const onSignal = () => stopped();
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  await done;
  removeRecord(ws, process.pid);
  await daemon.close();
  return 0;
}

/** `flume status [--json]`: running or not, the address and the root; exit 1 when not running. */
export async function status(cwd: string, json: boolean): Promise<number> {
  const d = await liveDaemon(cwd);
  if (json) {
    const j = d
      ? { running: true, address: d.url, root: d.root }
      : { running: false, address: null, root: null };
    process.stdout.write(`${JSON.stringify(j)}\n`);
  } else if (!d) process.stdout.write("not running\n");
  else process.stdout.write(`running at ${d.url}\nroot ${d.root}\n`);
  return d ? 0 : 1;
}

/** `flume stop`: ask the daemon to exit and wait until it has. */
export async function stop(cwd: string): Promise<number> {
  const url = daemonUrl(cwd);
  const r = url ? await request(url, "POST", "/api/stop") : undefined;
  if (!url || !r) {
    process.stdout.write("not running\n");
    return 1;
  }
  for (let i = 0; i < 100; i++) {
    if (!(await request(url, "GET", "/api/status"))) return 0;
    await new Promise((r) => setTimeout(r, 50));
  }
  err("flume: the daemon did not exit");
  return 1;
}

/** The `flume serve`, `flume status` and `flume stop` commands. */
export function daemonCommands(): Command[] {
  const serveCmd = new Command("serve")
    .description("run the daemon in the foreground (the human runs this; agents never do)")
    .option("--port <n>", "the port to listen on (default: any free port)")
    .addHelpText("after", `\n${HUMAN_ONLY}`)
    .action(function (o) {
      return act(this, () => {
        if (o.port !== undefined && (!/^\d+$/.test(o.port) || Number(o.port) > 65535))
          throw new Usage("--port needs a port number");
        return serve(process.cwd(), o.port === undefined ? 0 : Number(o.port));
      });
    });
  const statusCmd = new Command("status")
    .description("show whether the daemon runs, its address and root")
    .option("--json", "print JSON")
    .action(function (o) {
      return act(this, () => status(process.cwd(), o.json === true));
    });
  const stopCmd = new Command("stop").description("ask the daemon to exit").action(function () {
    return act(this, () => stop(process.cwd()));
  });
  return [serveCmd, statusCmd, stopCmd];
}
