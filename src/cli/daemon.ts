import { resolve } from "node:path";
import {
  daemonUrl,
  findProject,
  liveDaemon,
  removeRecord,
  request,
  startDaemon,
  writeRecord,
} from "../daemon/index.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);

function usage(msg: string): number {
  err(`flume: ${msg}\nusage: flume serve [--port N] [--root PATH] | flume status | flume stop`);
  return 2;
}

/** `flume serve`: run the daemon in the foreground until stopped. */
export async function serve(cwd: string, args: string[]): Promise<number> {
  let port = 0;
  let root: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--port") {
      const v = args[++i];
      if (v === undefined || !/^\d+$/.test(v) || Number(v) > 65535)
        return usage("--port needs a port number");
      port = Number(v);
    } else if (a === "--root") {
      const v = args[++i];
      if (v === undefined) return usage("--root needs a path");
      root = resolve(cwd, v);
    } else return usage(`unknown option '${a}'`);
  }
  const project = findProject(cwd);
  if (!project) {
    err("flume: not inside a git repository");
    return 1;
  }
  const running = await liveDaemon(cwd);
  if (running) {
    err(`flume: a daemon is already running at ${running.url}`);
    return 1;
  }
  let stopped: () => void = () => {};
  const done = new Promise<void>((r) => {
    stopped = r;
  });
  const taskRoot = root ?? project.mainCheckout;
  const daemon = await startDaemon({ root: taskRoot, port, onStop: () => stopped() });
  writeRecord(cwd, { url: daemon.url, pid: process.pid, root: taskRoot });
  process.stdout.write(`${daemon.url}\n`);
  const onSignal = () => stopped();
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  await done;
  removeRecord(cwd, process.pid);
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
