import { execFile, execFileSync, spawn, spawnSync } from "node:child_process";
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
import { parse } from "yaml";
import { SHIPPED_DIR } from "../src/core/documents.ts";
import { type Daemon, startDaemon } from "../src/daemon/index.ts";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  FLUME_URL: "",
  AGENT_NAME: "",
  CLAUDECODE: "",
  CLAUDE_CODE_SESSION_ID: "",
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
  const p = join(root, state === "open" ? "flume/tasks" : "flume/archive/tasks");
  return existsSync(p) ? readdirSync(p) : [];
};
/** task.yaml, body.md and comments.md of a task folder, joined. */
const snap = (path: string) =>
  ["task.yaml", "body.md", "comments.md"]
    .map((f) => (existsSync(join(root, path, f)) ? readFileSync(join(root, path, f), "utf8") : "-"))
    .join("\n==\n");
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

describe("agent last_seen", () => {
  const oldHome = process.env.HOME;
  let home: string;
  const agentFile = (n: string) => join(home, ".flume", "agents", `${n}.yaml`);
  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "flume-home-"));
    dirs.push(home);
    process.env.HOME = home;
    mkdirSync(join(home, ".flume", "agents"), { recursive: true });
    writeFileSync(
      agentFile("alpha"),
      'name: alpha\nproject: web\npane: "%1"\ncreated: c1\nlast_launch: l1\n',
    );
  });
  afterEach(() => {
    process.env.HOME = oldHome;
  });

  it("s-e1c1 request from an agent sets last_seen", async () => {
    const r = await raw("GET", "/api/status", { "x-flume-agent": "alpha" });
    expect(r.status).toBe(200);
    const e = parse(readFileSync(agentFile("alpha"), "utf8"));
    expect(e).toMatchObject({ name: "alpha", project: "web", created: "c1", last_launch: "l1" });
    expect(e.last_seen).toMatch(/^\d{4}-\d\d-\d\dT[\d:.]+Z$/);
    expect(Date.now() - Date.parse(e.last_seen)).toBeLessThan(60_000);
  });

  it("s-e1c2 no name or unknown name changes nothing", async () => {
    const before = readFileSync(agentFile("alpha"), "utf8");
    await raw("GET", "/api/status", {});
    await raw("GET", "/api/status", { "x-flume-agent": "ghost" });
    expect(readFileSync(agentFile("alpha"), "utf8")).toBe(before);
    expect(existsSync(agentFile("ghost"))).toBe(false);
  });

  it("s-e1c3 a command sends AGENT_NAME", async () => {
    await new Promise<void>((done, fail) =>
      execFile(
        "node",
        [bin, "task", "list"],
        { cwd: root, env: { ...gitEnv, HOME: home, FLUME_URL: d?.url, AGENT_NAME: "alpha" } },
        (err) => (err ? fail(err) : done()),
      ),
    );
    expect(parse(readFileSync(agentFile("alpha"), "utf8")).last_seen).toBeTruthy();
  });

  it("s-c7d2 an unnamed Claude Code agent sends agent-<session>", async () => {
    writeFileSync(
      agentFile("agent-abcdef01"),
      'name: agent-abcdef01\nproject: web\npane: "%1"\ncreated: c1\nlast_launch: l1\n',
    );
    await new Promise<void>((done, fail) =>
      execFile(
        "node",
        [bin, "task", "list"],
        {
          cwd: root,
          env: {
            ...gitEnv,
            HOME: home,
            FLUME_URL: d?.url,
            CLAUDECODE: "1",
            CLAUDE_CODE_SESSION_ID: "abcdef0123456789",
          },
        },
        (err) => (err ? fail(err) : done()),
      ),
    );
    expect(parse(readFileSync(agentFile("agent-abcdef01"), "utf8")).last_seen).toBeTruthy();
  });
});

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
    expect(r.body.resolution).toBe("done");
  });

  it("s-510a close as dropped", async () => {
    const t = await create("Dropped thing");
    const bad = await call("POST", `/api/tasks/${t.id}/close`, { dropped: "  " });
    expect(bad.status).toBe(400);
    expect(files("open")).toHaveLength(1);
    const r = await call("POST", `/api/tasks/${t.id}/close`, { dropped: "Duplicate of abcd" });
    expect(r.status).toBe(200);
    expect(r.body.state).toBe("resolved");
    expect(r.body.resolution).toBe("dropped");
    expect(r.body.comments).toContain("Duplicate of abcd");
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
    const before = snap(t.path);
    const r = await call("PATCH", `/api/tasks/${t.id}`, { title: "New", kind: "idea" });
    expect(r.status).toBe(400);
    expect((await call("GET", `/api/tasks/${t.id}`)).body.title).toBe("Old");
    expect(snap(t.path)).toBe(before);
    // a rule broken only after applying (parent is not an epic) also leaves the file alone
    const other = await create("Other");
    const r2 = await call("PATCH", `/api/tasks/${t.id}`, { title: "New", parent: other.id });
    expect(r2.status).toBe(400);
    expect(snap(t.path)).toBe(before);
    expect((await call("PATCH", `/api/tasks/${t.id}`, { color: "red" })).status).toBe(400);
    expect((await call("PATCH", "/api/tasks/abcd", { title: "x" })).status).toBe(404);
  });

  it("s-adcc comment", async () => {
    const t = await create("Noted");
    const r = await call("POST", `/api/tasks/${t.id}/comments`, {
      text: "Found the cause",
      author: "scout",
    });
    expect(r.status).toBe(200);
    expect(r.body.comments).toMatch(/^### [^\n]*, scout\n\nFound the cause\n$/);
    expect(r.body.body).toBe("## The ask\n\n");
    expect((await call("POST", `/api/tasks/${t.id}/comments`, { text: " " })).status).toBe(400);
    expect((await call("POST", "/api/tasks/abcd/comments", { text: "x" })).status).toBe(404);
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
    const p = join(root, t.path, "task.yaml");
    writeFileSync(p, readFileSync(p, "utf8").replace(new RegExp(`id: "?${t.id}"?`), "id: zzzz"));
    const r = await call("GET", "/api/check");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(false);
    expect(r.body.problems.some((x: any) => x.path === t.path)).toBe(true);
  });

  const putFlume = (rel: string, text: string) => {
    const f = join(root, "flume", rel);
    mkdirSync(join(f, ".."), { recursive: true });
    writeFileSync(f, text);
  };

  it("s-1581 prime layers in order", async () => {
    putFlume("base/workflow.md", "# Flume workflow\n\n## Base @add\n\nBASE\n");
    putFlume("projects/web/workflow.md", "# Flume workflow\n\n## Web @add\n\nWEB\n");
    putFlume("base/roles/worker.md", "# Worker\n\nROLE\n");
    putFlume("projects/web/roles/worker.md", "# Worker @append\n\nWEBROLE\n");
    const r = await call("GET", "/api/prime?project=web&role=worker");
    expect(r.status).toBe(200);
    const { workflow, project, role } = r.body.parts;
    expect(workflow).toMatch(/^# Flume workflow\n[\s\S]*## Base\n\nBASE\n\n## Web\n\nWEB\n$/);
    expect(project).toBe(
      "# Project\n\nRead that project's CLAUDE.md and follow its instructions.\n",
    );
    expect(role).toBe("# Worker\n\nROLE\n\nWEBROLE\n");
    expect(r.body.text).toBe([workflow, project, role].join("\n"));
    expect(r.body.first_prompt).toBe(
      "Check your tickets and status, suggest next steps, and follow up.",
    );
  });

  it("s-3fa0 prime with no files in the flume root", async () => {
    const r = await call("GET", "/api/prime?role=worker");
    expect(r.status).toBe(200);
    expect(r.body.parts.workflow).toBe(readFileSync(join(SHIPPED_DIR, "workflow.md"), "utf8"));
    expect([r.body.parts.project, r.body.parts.role]).toEqual(["", ""]);
    expect(r.body.text).toBe(r.body.parts.workflow);
  });

  it("s-0f6e a broken layer answers 422", async () => {
    putFlume("base/workflow.md", "# Flume workflow\n\n## Nope\n\nx\n");
    const r = await call("GET", "/api/prime");
    expect(r.status).toBe(422);
    expect(r.body.error).toContain('flume/base/workflow.md: line 3: heading "## Nope"');
  });

  it("s-f8c8 a path-like name is refused", async () => {
    const r = await call("GET", "/api/prime?role=../x");
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
    expect((await call("GET", "/api/prime?project=a/b")).status).toBe(400);
  });

  it("s-000f prime lists guides", async () => {
    putFlume(
      "base/guides/deploy.md",
      "---\nname: deploy\ndescription: Ship it\nstage: build\n---\nB\n",
    );
    putFlume("projects/web/guides/deploy.md", "---\nname: deploy\ndescription: Ship web\n---\nW\n");
    putFlume("base/guides/bad.md", "no front matter\n");
    const r = await call("GET", "/api/prime?project=web");
    expect(r.status).toBe(200);
    expect(r.body.guides).toEqual([{ name: "deploy", description: "Ship web" }]);
    const b = await call("GET", "/api/prime");
    expect(b.body.guides).toEqual([{ name: "deploy", description: "Ship it", stage: "build" }]);
  });

  it("s-e610 read a guide", async () => {
    putFlume(
      "base/guides/deploy.md",
      "---\nname: deploy\ndescription: Ship it\n---\n# Deploy\n\nSTEPS\n",
    );
    const r = await call("GET", "/api/guides/deploy?project=web");
    expect(r.status).toBe(200);
    expect(r.body.body).toBe("# Deploy\n\nSTEPS\n");
    expect(r.body.name).toBe("deploy");
  });

  it("s-b6e2 unknown or broken guide", async () => {
    putFlume("base/guides/bad.md", "no front matter\n");
    const a = await call("GET", "/api/guides/nope");
    const b = await call("GET", "/api/guides/bad");
    expect([a.status, b.status]).toEqual([404, 400]);
    expect(a.body.error).toBeTruthy();
    expect(b.body.error).toBeTruthy();
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
    ).toEqual([
      expect.stringContaining(t.id),
      `${t.path}/body.md`,
      `${t.path}/history.jsonl`,
      `${t.path}/task.yaml`,
    ]);
    expect(clean()).toBe("");
  });

  it("s-fc8d a create with links is one commit", async () => {
    const a = await create("Blocker");
    const b = await create("Other");
    const before = head();
    const t = await create("Follow up", { blocked_by: [a.id], related: [b.id] });
    expect(commitsSince(before)).toHaveLength(1);
    expect(git(root, "show", "--name-only", "--format=", "HEAD").trim().split("\n")).toEqual([
      `${t.path}/body.md`,
      `${t.path}/history.jsonl`,
      `${t.path}/task.yaml`,
    ]);
    expect(t.blocked_by).toEqual([a.id]);
    expect(t.related).toEqual([b.id]);
    expect(clean()).toBe("");
  });

  it("s-88ac a create with an unknown link writes nothing", async () => {
    const before = head();
    const r = await call("POST", "/api/tasks", { title: "Follow up", blocked_by: ["zzzz"] });
    expect(r.status).toBe(400);
    expect(commitsSince(before)).toHaveLength(0);
    expect(clean()).toBe("");
    expect(files("open")).toHaveLength(0);
  });

  it("s-9a4e a close commits both paths", async () => {
    const t = await create("Closing");
    const before = head();
    await call("POST", `/api/tasks/${t.id}/close`);
    expect(commitsSince(before)).toHaveLength(1);
    const st = git(root, "show", "--no-renames", "--name-status", "--format=", "HEAD").split("\n");
    expect(st).toContain(`D\t${t.path}/task.yaml`);
    expect(st).toContain(`A\t${t.path.replace("flume/tasks/", "flume/archive/tasks/")}/task.yaml`);
    expect(clean()).toBe("");
  });

  it("s-6f12 a comment and an update commit", async () => {
    const t = await create("Noted");
    const before = head();
    await call("POST", `/api/tasks/${t.id}/comments`, { text: "hello" });
    await call("PATCH", `/api/tasks/${t.id}`, { title: "Renamed" });
    expect(commitsSince(before)).toHaveLength(2);
    for (const rev of ["HEAD", "HEAD~1"]) {
      const out = git(root, "show", "--name-only", "--format=%s", rev).split("\n").filter(Boolean);
      expect(out[0]).toContain(t.id);
      expect(out.slice(1).every((f) => f.startsWith(`${t.path}/`))).toBe(true);
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
    // serve needs a workspace made by init; --root belongs to init now.
    const ri = args.indexOf("--root");
    const serveArgs = ri < 0 ? args : args.filter((_, i) => i !== ri && i !== ri + 1);
    if (!existsSync(join(cwd, ".flume")))
      flume(cwd, "init", ...(ri < 0 ? [] : ["--root", args[ri + 1] as string]));
    const child = spawn("node", [bin, "serve", ...serveArgs], { cwd, env: gitEnv });
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

  it("s-458a status as JSON when running", async () => {
    const repo = tempRepo();
    const { url } = await serve(repo, "--port", "0");
    const r = flume(repo, "status", "--json");
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j).toEqual({ running: true, address: url, root: expect.any(String) });
    expect(flume(repo, "stop").status).toBe(0);
  });

  it("s-7007 status as JSON when stopped", () => {
    const repo = tempRepo();
    const r = flume(repo, "status", "--json");
    expect(r.status).toBe(1);
    expect(JSON.parse(r.stdout)).toEqual({ running: false, address: null, root: null });
    expect(r.stderr).toBe("");
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

  it("s-bdbc a folder inside the workspace reaches the daemon", async () => {
    const repo = tempRepo();
    mkdirSync(join(repo, "sub"));
    const { url } = await serve(repo);
    const s = flume(join(repo, "sub"), "status");
    expect(s.status).toBe(0);
    expect(s.stdout).toContain(url);
    expect(flume(join(repo, "sub"), "stop").status).toBe(0);
  });

  it("s-fe02 the flume folder is ignored", async () => {
    const repo = tempRepo();
    await serve(repo);
    expect(readFileSync(join(repo, ".flume/.gitignore"), "utf8")).toBe("*\n");
    expect(existsSync(join(repo, ".flume/daemon.json"))).toBe(true);
    expect(git(repo, "status", "--porcelain")).toBe("");
    flume(repo, "stop");
  });

  it("s-fe04 root is saved and reused", async () => {
    const ws = realpathSync(mkdtempSync(join(tmpdir(), "flume-ws-")));
    dirs.push(ws);
    const tasks = join(ws, "tasks");
    mkdirSync(tasks);
    git(tasks, "init", "-q", "-b", "main");
    writeFileSync(join(tasks, "r"), "x");
    git(tasks, "add", "-A");
    git(tasks, "commit", "-qm", "init");
    await serve(ws, "--root", "tasks");
    expect(readFileSync(join(ws, ".flume/config.yaml"), "utf8")).toContain("root: tasks");
    expect(existsSync(join(ws, ".git"))).toBe(false);
    flume(ws, "stop");
    await serve(ws);
    expect(flume(ws, "status").stdout).toContain(`root ${tasks}`);
    flume(ws, "stop");
  });

  it("s-bdb3 a bad flume.yaml stops serve", () => {
    const repo = tempRepo();
    expect(flume(repo, "init").status).toBe(0);
    writeFileSync(join(repo, "flume.yaml"), "dir: a/b\n");
    const r = flume(repo, "serve");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("dir must be . or one folder name");
  });

  it("s-fe06 no root and no repository", () => {
    const ws = realpathSync(mkdtempSync(join(tmpdir(), "flume-ws-")));
    dirs.push(ws);
    const r = flume(ws, "init");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("no task root");
    expect(existsSync(join(ws, ".git"))).toBe(false);
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

  it("s-fe01 FLUME_URL overrides the recorded address", async () => {
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

  it("s-1d01 serve without init", () => {
    const ws = realpathSync(mkdtempSync(join(tmpdir(), "flume-ws-")));
    dirs.push(ws);
    const r = flume(ws, "serve");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("run flume init first");
    expect(existsSync(join(ws, ".flume"))).toBe(false);
  });

  it("s-1d02 serve takes no root", () => {
    expect(flume(tempRepo(), "serve", "--root", "x").status).toBe(2);
  });

  it("serve refuses an unknown option with exit 2", () => {
    expect(flume(tempRepo(), "serve", "--bogus").status).toBe(2);
  });
});

describe("workflow endpoints", () => {
  const commits = () => git(root, "rev-list", "--count", "HEAD");
  it("s-1122 assign, parts and plan requests", async () => {
    const t = await create("W");
    const base = `/api/tasks/${t.id}`;
    expect(
      (await call("POST", `${base}/assign`, { assignee: "scout", actor: "rook" })).status,
    ).toBe(200);
    const before = commits();
    const refused = await call("POST", `${base}/assign`, { assignee: "rook", actor: "rook" });
    expect(refused.status).toBe(400);
    expect(commits()).toBe(before);
    expect(
      (await call("POST", `${base}/assign`, { assignee: "rook", actor: "rook", force: true }))
        .status,
    ).toBe(200);
    expect(
      (await call("PUT", `${base}/parts/plan`, { text: "## 1. G\n\n- [ ] 1.1 a\n" })).status,
    ).toBe(200);
    expect((await call("POST", `${base}/plan/done`, { items: ["1.1"] })).status).toBe(200);
    const next = await call("GET", `${base}/plan/next`);
    expect(next.body.complete).toBe(true);
    expect((await call("GET", `${base}/parts/plan`)).body.text).toContain("[x] 1.1");
    expect((await call("GET", `${base}/parts/design`)).status).toBe(404);
    expect(commits()).toBe(String(Number(before) + 3));
    expect(git(root, "log", "-1", "--format=%s")).toContain(t.id);
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  it("s-223e templates over HTTP", async () => {
    const tpl = await call("GET", "/api/templates/design");
    expect(tpl.status).toBe(200);
    expect(tpl.body.text.length).toBeGreaterThan(0);
    expect((await call("GET", "/api/templates/notes")).body).toEqual({ part: "notes", text: "" });
    expect((await call("GET", "/api/templates/.hidden")).status).toBe(400);
  });
});

describe("task history", () => {
  const as = (who: string) => ({ "x-flume-agent": who });
  const lines = (path: string) =>
    readFileSync(join(root, path, "history.jsonl"), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));

  it("s-054e each change is recorded with who and what", async () => {
    const t = (await raw("POST", "/api/tasks", as("scout"), { title: "H" })).body;
    const base = `/api/tasks/${t.id}`;
    const step = (m: string, p: string, b?: unknown, who = "scout") =>
      raw(m, `${base}${p}`, who ? as(who) : {}, b);
    await step("PATCH", "", { title: "H2" });
    await step("POST", "/assign", { assignee: "scout" });
    await step("PUT", "/parts/plan", { text: "## 1. G\n\n- [ ] 1.1 a\n" });
    await step("POST", "/plan/done", { items: ["1.1"] });
    await step("POST", "/comments", { text: "hi" });
    await step("POST", "/close");
    const re = await step("POST", "/reopen");
    await step("DELETE", "/parts/plan", undefined, "");
    const h = lines(re.body.path);
    expect(h.map((x) => x.action)).toEqual([
      "create",
      "update",
      "assign",
      "write",
      "plan_done",
      "comment",
      "close",
      "reopen",
      "remove",
    ]);
    for (const x of h) expect(x.time).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    expect(h.slice(0, 8).every((x) => x.by === "scout")).toBe(true);
    expect(h[8].by).toBe("human");
    expect(h[1]).toMatchObject({ field: "title", from: "H", to: "H2" });
    expect(h[3]).toMatchObject({ part: "plan" });
    expect(JSON.stringify(h[3])).not.toContain("1.1 a");
    expect(re.body.path).toContain("flume/tasks/");
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  it("s-4979 a refused or empty change records nothing", async () => {
    const t = (await raw("POST", "/api/tasks", as("scout"), { title: "H" })).body;
    await call("POST", `/api/tasks/${t.id}/assign`, { assignee: "scout" });
    await call("POST", `/api/tasks/${t.id}/assign`, { assignee: "scout" });
    expect((await call("PATCH", `/api/tasks/${t.id}`, { kind: "nonsense" })).status).toBe(400);
    expect(lines(t.path)).toHaveLength(2);
  });
});
