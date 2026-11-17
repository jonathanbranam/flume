import { readRecord } from "./record.ts";

export const NOT_RUNNING =
  "flume: the flume daemon is not running for this workspace.\nAsk the human to start it: flume serve (in its own pane).\n";

/** The daemon address: FLUME_URL if set, else the one in the nearest .flume/daemon.json above `cwd`. */
export function daemonUrl(cwd: string): string | undefined {
  const env = process.env.FLUME_URL;
  if (env) return env.replace(/\/+$/, "");
  return readRecord(cwd)?.url;
}

export interface Reply {
  status: number;
  // biome-ignore lint/suspicious/noExplicitAny: JSON from the daemon
  body: any;
}

/** One JSON request. Returns undefined when nothing answers at `url`. */
export async function request(
  url: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<Reply | undefined> {
  try {
    const res = await fetch(`${url}${path}`, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return undefined;
  }
}

/** The running daemon's address for `cwd`, verified by asking it; undefined when none answers. */
export async function liveDaemon(
  cwd: string,
): Promise<{ url: string; root: string; version: string } | undefined> {
  const url = daemonUrl(cwd);
  if (!url) return undefined;
  const r = await request(url, "GET", "/api/status");
  if (r?.status !== 200) return undefined;
  return { url, root: r.body.root, version: r.body.version };
}
