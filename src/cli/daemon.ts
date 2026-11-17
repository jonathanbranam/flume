import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
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

const err = (s: string) => process.stderr.write(`${s}\n`);

/** The line every serve usage text carries: agents must not start the server. */
const HUMAN_ONLY = "Only the human runs flume serve, in its own pane. Agents never start it.";

function usage(msg: string): number {
  err(`flume: ${msg}\nusage: flume serve [--port N] | flume status | flume stop\n${HUMAN_ONLY}`);
  return 2;
}

/** `flume serve`: run the daemon in the foreground until stopped. */
export async function serve(cwd: string, args: string[]): Promise<number> {
  let port = 0;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help") {
      process.stdout.write(`usage: flume serve [--port N]\n${HUMAN_ONLY}\n`);
      return 0;
    }
    if (a === "--port") {
      const v = args[++i];
      if (v === undefined || !/^\d+$/.test(v) || Number(v) > 65535)
        return usage("--port needs a port number");
      port = Number(v);
    } else return usage(`unknown option '${a}'`);
  }
  // The workspace is the folder serve runs in; its .flume/ holds daemon.json and config.toml.
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

/** `flume status`. */
export async function status(cwd: string): Promise<number> {
  const d = await liveDaemon(cwd);
  if (!d) {
    process.stdout.write("not running\n");
    return 1;
  }
  process.stdout.write(`running at ${d.url}\nroot ${d.root}\n`);
  return 0;
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
