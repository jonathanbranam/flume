import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const base = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  FLUME_URL: "",
};
const dirs: string[] = [];
const pids: number[] = [];
afterAll(() => {
  for (const pid of pids) {
    try {
      process.kill(pid);
    } catch {}
  }
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

/** A git repo set up with flume init; a stub claude in bin/ logs its arguments. */
function workspace() {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-prime-")));
  dirs.push(d);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: d, env: base });
  mkdirSync(join(d, "bin"));
  writeFileSync(
    join(d, "bin/claude"),
    `#!/bin/sh\nfor a in "$@"; do printf '%s\\n' "$a"; done > "${d}/claude.log"\n`,
  );
  chmodSync(join(d, "bin/claude"), 0o755);
  mkdirSync(join(d, "home"));
  const env = { ...base, HOME: join(d, "home"), PATH: `${join(d, "bin")}:${process.env.PATH}` };
  spawnSync("node", [bin, "init"], { cwd: d, env });
  return { d, env };
}
const flume = (w: ReturnType<typeof workspace>, ...args: string[]) =>
  spawnSync("node", [bin, ...args], { cwd: w.d, encoding: "utf8", env: w.env });
const put = (w: ReturnType<typeof workspace>, rel: string, text: string) => {
  const f = join(w.d, "flume", rel);
  mkdirSync(join(f, ".."), { recursive: true });
  writeFileSync(f, text);
};
async function serve(w: ReturnType<typeof workspace>): Promise<void> {
  const child = spawn("node", [bin, "serve"], { cwd: w.d, env: w.env });
  if (child.pid) pids.push(child.pid);
  await new Promise<void>((res, rej) => {
    child.stdout.once("data", () => res());
    child.once("exit", () => rej(new Error("serve exited")));
  });
}

describe("prime prints the workflow", () => {
  it("s-1d08 layers in order", async () => {
    const w = workspace();
    put(w, "base/workflow.md", "BASE\n");
    put(w, "projects/web/workflow.md", "WEB\n");
    put(w, "base/roles/worker.md", "ROLE\n");
    put(w, "projects/web/roles/worker.md", "WEBROLE\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a", "--project", "web", "--role", "worker");
    expect(r.status).toBe(0);
    const order = ["You are agent a", "BASE", "WEB\n", "ROLE\n", "WEBROLE"].map((x) =>
      r.stdout.indexOf(x),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(r.stdout).not.toContain("read the .md files");
    flume(w, "stop");
  });

  it("s-141b no role gives no role part", async () => {
    const w = workspace();
    put(w, "base/workflow.md", "BASE\n");
    put(w, "base/roles/worker.md", "ROLE\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("BASE");
    expect(r.stdout).not.toContain("ROLE");
    flume(w, "stop");
  });

  it("s-3cd4 no daemon still prints the built-in text", () => {
    const w = workspace();
    put(w, "base/workflow.md", "BASE\n");
    const r = flume(w, "prime", "--name", "a");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("You are agent a");
    expect(r.stdout).toContain("workflow text is missing");
    expect(r.stdout).not.toContain("BASE");
    expect(existsSync(join(w.d, ".flume/daemon.json"))).toBe(false);
  });

  it("s-afe2 launch passes the role to prime", async () => {
    const w = workspace();
    put(w, "base/roles/worker.md", "ROLE\n");
    await serve(w);
    const r = flume(w, "agent", "--name", "a", "--role", "worker");
    expect(r.status).toBe(0);
    const log = readFileSync(join(w.d, "claude.log"), "utf8");
    expect(log).toContain("ROLE");
    flume(w, "stop");
  });
});
