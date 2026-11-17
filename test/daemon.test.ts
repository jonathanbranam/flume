import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { request } from "node:http";
import { networkInterfaces, tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { type Daemon, startDaemon } from "../src/daemon/index.ts";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  FLUME_URL: "",
};
const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8", env: gitEnv }).trim();

const dirs: string[] = [];
function tempRepo(): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-daemon-")));
  dirs.push(d);
  git(d, "init", "-q", "-b", "main");
  writeFileSync(join(d, "README.md"), "x\n");
  git(d, "add", "-A");
  git(d, "commit", "-qm", "init");
  return d;
}
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

// Commits made by the in-process daemon need an author.
Object.assign(process.env, {
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
});

let root: string;
let d: Daemon | undefined;
beforeEach(async () => {
  root = tempRepo();
  d = await startDaemon({ root });
});
afterEach(async () => {
  await d?.close();
  d = undefined;
});

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${d?.url}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as any };
}
const create = async (title: string, extra: object = {}) => {
  const r = await call("POST", "/api/tasks", { title, ...extra });
  expect(r.status).toBe(201);
  return r.body;
};
const files = (state: string) => {
  const p = join(root, "flume/tasks", state);
  return existsSync(p) ? readdirSync(p) : [];
};
const head = () => git(root, "rev-parse", "HEAD");
const commitsSince = (sha: string) =>
  git(root, "rev-list", `${sha}..HEAD`).split("\n").filter(Boolean);
const clean = () => git(root, "status", "--porcelain");

function raw(method: string, path: string, headers: Record<string, string>, body?: unknown) {
  const u = new URL(d?.url ?? "");
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const text = body === undefined ? undefined : JSON.stringify(body);
    const req = request(
      {
        host: u.hostname,
        port: u.port,
        method,
        path,
        headers: { ...headers, "content-type": "application/json" },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) }));
      },
    );
    req.on("error", reject);
    req.end(text);
  });
}

describe("daemon api", () => {
  it("s-7c20 foreign Host refused", async () => {
    const r = await raw("GET", "/api/status", { host: "evil.example" });
    expect(r.status).toBe(403);
    expect(r.body.error).toBeTruthy();
  });

  it("s-d4a9 foreign Origin on a write refused", async () => {
    const r = await raw("POST", "/api/tasks", { origin: "http://evil.example" }, { title: "x" });
    expect(r.status).toBe(403);
    expect(r.body.error).toBeTruthy();
    expect(files("open")).toEqual([]);
  });

  it("s-0b63 request without Origin accepted", async () => {
    const r = await raw("POST", "/api/tasks", {}, { title: "x" });
    expect(r.status).toBe(201);
  });

  it("s-92a8 not reachable from other addresses", async () => {
    const other = Object.values(networkInterfaces())
      .flat()
      .find((i) => i && i.family === "IPv4" && !i.internal);
    if (!other) return; // no non-loopback address on this machine
    const port = new URL(d?.url ?? "").port;
    await expect(fetch(`http://${other.address}:${port}/api/status`)).rejects.toThrow();
  });

  it("s-b4ce status", async () => {
    const r = await call("GET", "/api/status");
    expect(r.status).toBe(200);
    expect(r.body.version).not.toBe("");
    expect(r.body.root).toBe(root);
  });

  it("s-301e create", async () => {
    const t = await create("Fix redirect", { kind: "bug" });
    expect(t.id).toMatch(/^[a-z0-9]{4}$/);
    expect(t.state).toBe("open");
    expect(t.kind).toBe("bug");
    expect(existsSync(join(root, t.path))).toBe(true);
  });

  it("s-ec04 missing title", async () => {
    const r = await call("POST", "/api/tasks", { kind: "bug" });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
    expect(files("open")).toEqual([]);
  });

  it("s-89d3 unknown kind", async () => {
    const r = await call("POST", "/api/tasks", { title: "X", kind: "idea" });
    expect(r.status).toBe(400);
    expect(files("open")).toEqual([]);
  });

  it("s-34d3 read a resolved task", async () => {
    const t = await create("Done thing");
    await call("POST", `/api/tasks/${t.id}/close`);
    const r = await call("GET", `/api/tasks/${t.id}`);
    expect(r.status).toBe(200);
    expect(r.body.state).toBe("resolved");
    expect(r.body.resolved).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  });

  it("s-063c unknown id", async () => {
    const r = await call("GET", "/api/tasks/abcd");
    expect(r.status).toBe(404);
    expect(r.body.error).toBeTruthy();
  });

  it("s-a3ca list with filters", async () => {
    const epic = await create("Epic", { kind: "epic" });
    const c1 = await create("Child one", { parent: epic.id });
    const c2 = await create("Child two", { parent: epic.id });
    await create("Other");
    const done = await create("Finished");
    await call("POST", `/api/tasks/${done.id}/close`);
    const kids = await call("GET", `/api/tasks?parent=${epic.id}`);
    expect(kids.body.map((t: any) => t.id).sort()).toEqual([c1.id, c2.id].sort());
    expect(kids.body[0]).not.toHaveProperty("body");
    const all = await call("GET", "/api/tasks?state=all");
    expect(all.body).toHaveLength(5);
    const byKind = await call("GET", "/api/tasks?kind=epic");
    expect(byKind.body).toHaveLength(1);
  });

  it("s-1711 bad state value", async () => {
    expect((await call("GET", "/api/tasks?state=sideways")).status).toBe(400);
  });

  it("s-7abb retitle", async () => {
    const t = await create("Old");
    const r = await call("PATCH", `/api/tasks/${t.id}`, { title: "New title" });
    expect(r.status).toBe(200);
    expect(r.body.title).toBe("New title");
    expect(r.body.path).toBe(t.path);
  });

  it("s-90c8 all or none", async () => {
    const t = await create("Old");
    const before = readFileSync(join(root, t.path), "utf8");
    const r = await call("PATCH", `/api/tasks/${t.id}`, { title: "New", kind: "idea" });
    expect(r.status).toBe(400);
    expect((await call("GET", `/api/tasks/${t.id}`)).body.title).toBe("Old");
    expect(readFileSync(join(root, t.path), "utf8")).toBe(before);
    // a rule broken only after applying (parent is not an epic) also leaves the file alone
    const other = await create("Other");
    const r2 = await call("PATCH", `/api/tasks/${t.id}`, { title: "New", parent: other.id });
    expect(r2.status).toBe(400);
    expect(readFileSync(join(root, t.path), "utf8")).toBe(before);
    expect((await call("PATCH", `/api/tasks/${t.id}`, { color: "red" })).status).toBe(400);
    expect((await call("PATCH", "/api/tasks/abcd", { title: "x" })).status).toBe(404);
  });

  it("s-adcc note", async () => {
    const t = await create("Noted");
    const r = await call("POST", `/api/tasks/${t.id}/notes`, { text: "Found the cause" });
    expect(r.status).toBe(200);
    expect(r.body.body).toBe("## The ask\n\nFound the cause\n");
    expect((await call("POST", `/api/tasks/${t.id}/notes`, { text: " " })).status).toBe(400);
    expect((await call("POST", "/api/tasks/abcd/notes", { text: "x" })).status).toBe(404);
  });

  it("s-3131 close twice", async () => {
    const t = await create("Closing");
    const a = await call("POST", `/api/tasks/${t.id}/close`);
    expect(a.status).toBe(200);
    expect(a.body.state).toBe("resolved");
    expect((await call("POST", `/api/tasks/${t.id}/close`)).status).toBe(409);
    expect((await call("POST", `/api/tasks/${t.id}/reopen`)).status).toBe(200);
    expect((await call("POST", `/api/tasks/${t.id}/reopen`)).status).toBe(409);
  });

  it("s-9f87 check finds a problem", async () => {
    const t = await create("Fine");
    const p = join(root, t.path);
    writeFileSync(p, readFileSync(p, "utf8").replace(`id: ${t.id}`, "id: zzzz"));
    const r = await call("GET", "/api/check");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(false);
    expect(r.body.problems.some((x: any) => x.path === t.path)).toBe(true);
  });

  it("s-0e75 stop", async () => {
    let stopped = false;
    await d?.close();
    d = await startDaemon({
      root,
      onStop: () => {
        stopped = true;
      },
    });
    const r = await call("POST", "/api/stop");
    expect(r.status).toBe(200);
    await new Promise((res) => setTimeout(res, 50));
    expect(stopped).toBe(true);
    await d.close();
    await expect(call("GET", "/api/status")).rejects.toThrow();
  });

  it("s-3377 unknown path", async () => {
    const r = await call("GET", "/api/nothing");
    expect(r.status).toBe(404);
    expect(r.body.error).toBeTruthy();
  });

  it("s-5d0e wrong method", async () => {
    const r = await call("DELETE", "/api/status");
    expect(r.status).toBe(405);
    expect(r.body.error).toBeTruthy();
  });

  it("s-3304 ten creates at once", async () => {
    const rs = await Promise.all(
      Array.from({ length: 10 }, (_, i) => call("POST", "/api/tasks", { title: `Task ${i}` })),
    );
    expect(rs.every((r) => r.status === 201)).toBe(true);
    expect(new Set(rs.map((r) => r.body.id)).size).toBe(10);
    expect(files("open")).toHaveLength(10);
    expect(clean()).toBe("");
  });

  it("s-1c86 a create commits", async () => {
    const before = head();
    const t = await create("Fix redirect");
    const shas = commitsSince(before);
    expect(shas).toHaveLength(1);
    expect(
      git(root, "show", "--name-only", "--format=%s", "HEAD").split("\n").filter(Boolean),
    ).toEqual([expect.stringContaining(t.id), t.path]);
    expect(clean()).toBe("");
  });

  it("s-9a4e a close commits both paths", async () => {
    const t = await create("Closing");
    const before = head();
    await call("POST", `/api/tasks/${t.id}/close`);
    expect(commitsSince(before)).toHaveLength(1);
    const st = git(root, "show", "--no-renames", "--name-status", "--format=", "HEAD").split("\n");
    expect(st).toContain(`D\t${t.path}`);
    expect(st).toContain(`A\t${t.path.replace("/open/", "/resolved/")}`);
    expect(clean()).toBe("");
  });

  it("s-6f12 a note and an update commit", async () => {
    const t = await create("Noted");
    const before = head();
    await call("POST", `/api/tasks/${t.id}/notes`, { text: "hello" });
    await call("PATCH", `/api/tasks/${t.id}`, { title: "Renamed" });
    expect(commitsSince(before)).toHaveLength(2);
    for (const rev of ["HEAD", "HEAD~1"]) {
      const out = git(root, "show", "--name-only", "--format=%s", rev).split("\n").filter(Boolean);
      expect(out[0]).toContain(t.id);
      expect(out.slice(1)).toEqual([t.path]);
    }
    expect(clean()).toBe("");
  });

  it("an unrelated staged file is not swept into a task commit", async () => {
    writeFileSync(join(root, "other.txt"), "x");
    git(root, "add", "other.txt");
    await create("Mine");
    expect(git(root, "show", "--name-only", "--format=", "HEAD")).not.toContain("other.txt");
  });
});

// The CLI: a real `flume serve` process per test, stopped by pid.
describe("flume serve, status and stop", () => {
  const started: number[] = [];
  afterAll(() => {
    for (const pid of started) {
      try {
        process.kill(pid);
      } catch {}
    }
  });
  const flume = (cwd: string, ...args: string[]) =>
    spawnSync("node", [bin, ...args], { cwd, encoding: "utf8", env: gitEnv });
  function serve(cwd: string, ...args: string[]): Promise<{ url: string; pid: number }> {
    const child = spawn("node", [bin, "serve", ...args], { cwd, env: gitEnv });
    if (child.pid) started.push(child.pid);
    return new Promise((res, rej) => {
      child.stdout.once("data", (b: Buffer) =>
        res({ url: b.toString().split("\n")[0] ?? "", pid: child.pid ?? 0 }),
      );
      child.once("exit", () => rej(new Error("serve exited")));
    });
  }

  it("s-a4db serve prints its address", async () => {
    const repo = tempRepo();
    const { url } = await serve(repo, "--port", "0");
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(flume(repo, "status").status).toBe(0);
    expect(flume(repo, "stop").status).toBe(0);
  });

  it("s-7e28 two serves", async () => {
    const repo = tempRepo();
    const { url } = await serve(repo);
    const second = flume(repo, "serve");
    expect(second.status).toBe(1);
    expect(second.stderr).toContain(url);
    flume(repo, "stop");
  });

  it("s-62cc status when stopped", () => {
    const repo = tempRepo();
    const r = flume(repo, "status");
    expect(r.stdout).toContain("not running");
    expect(r.status).toBe(1);
  });

  it("s-8ee4 stop then status", async () => {
    const repo = tempRepo();
    await serve(repo);
    expect(flume(repo, "stop").status).toBe(0);
    const r = flume(repo, "status");
    expect(r.stdout).toContain("not running");
    expect(r.status).toBe(1);
    expect(flume(repo, "stop").status).toBe(1);
  });

  it("s-bdbc a worktree reaches the same daemon", async () => {
    const repo = tempRepo();
    const wt = join(repo, "..", `${repo.split("/").pop()}-wt`);
    dirs.push(wt);
    git(repo, "worktree", "add", "-q", "-b", "side", wt);
    mkdirSync(join(wt, "sub"));
    const { url } = await serve(repo);
    const s = flume(join(wt, "sub"), "status");
    expect(s.status).toBe(0);
    expect(s.stdout).toContain(url);
    const created = await fetch(`${url}/api/tasks`, {
      method: "POST",
      body: JSON.stringify({ title: "From anywhere" }),
    });
    expect(created.status).toBe(201);
    // the task file and commit land in the main checkout, not in the worktree
    expect(readdirSync(join(repo, "flume/tasks/open"))).toHaveLength(1);
    expect(existsSync(join(wt, "flume/tasks/open"))).toBe(false);
    expect(flume(wt, "stop").status).toBe(0);
  });

  it("serve --root uses a separate task repository", async () => {
    const repo = tempRepo();
    const tasks = tempRepo();
    const { url } = await serve(repo, "--root", tasks);
    const r = await fetch(`${url}/api/tasks`, {
      method: "POST",
      body: JSON.stringify({ title: "T" }),
    });
    expect(r.status).toBe(201);
    expect(git(tasks, "log", "--oneline")).toContain("task ");
    expect(git(repo, "log", "--oneline").split("\n")).toHaveLength(1);
    flume(repo, "stop");
  });

  it("FLUME_URL overrides the recorded address", async () => {
    const repo = tempRepo();
    const other = tempRepo();
    const { url } = await serve(repo);
    const r = spawnSync("node", [bin, "status"], {
      cwd: other,
      encoding: "utf8",
      env: { ...gitEnv, FLUME_URL: url },
    });
    expect(r.status).toBe(0);
    flume(repo, "stop");
  });

  it("serve refuses an unknown option with exit 2", () => {
    expect(flume(tempRepo(), "serve", "--bogus").status).toBe(2);
  });
});
