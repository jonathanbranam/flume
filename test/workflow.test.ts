import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const env = {
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

interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}
const flume = (cwd: string, args: string[], input?: string, extra: NodeJS.ProcessEnv = {}): Run =>
  spawnSync("node", [bin, ...args], { cwd, encoding: "utf8", env: { ...env, ...extra }, input });

/** A repo with a real `flume serve` process (stopped by pid in afterAll). */
async function project(): Promise<string> {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-wf-")));
  dirs.push(d);
  const git = (...a: string[]) => execFileSync("git", a, { cwd: d, env });
  git("init", "-q", "-b", "main");
  writeFileSync(join(d, "README.md"), "x\n");
  git("add", "-A");
  git("commit", "-qm", "init");
  spawnSync("node", [bin, "init"], { cwd: d, env });
  const child = spawn("node", [bin, "serve"], { cwd: d, env });
  if (child.pid) pids.push(child.pid);
  await new Promise<void>((res, rej) => {
    child.stdout.once("data", () => res());
    child.once("exit", () => rej(new Error("serve exited")));
  });
  return d;
}

/** Create a task; returns its ID (task new prints the ID only). */
function mk(repo: string, title = "A task", ...args: string[]): string {
  const r = flume(repo, ["task", "new", title, ...args]);
  expect(r.status).toBe(0);
  return r.stdout.trim();
}
const show = (repo: string, id: string) =>
  JSON.parse(flume(repo, ["task", "show", id, "--json"]).stdout);
const yaml = (repo: string, id: string): string => {
  const p = show(repo, id).path as string;
  return readFileSync(join(repo, p, "task.yaml"), "utf8");
};
const as = (name: string): NodeJS.ProcessEnv => ({ AGENT_NAME: name });

describe("workflow fields and assignment", { timeout: 30_000 }, () => {
  it("s-c12c a new task has no holder", async () => {
    const repo = await project();
    const y = yaml(repo, mk(repo));
    expect(y).not.toMatch(/assignee|agent|phase/);
    flume(repo, ["stop"]);
  });

  it("s-8367 assign to an agent, then to the human", async () => {
    const repo = await project();
    const id = mk(repo);
    expect(flume(repo, ["task", "assign", id, "scout"]).status).toBe(0);
    expect(yaml(repo, id)).toMatch(/assignee: scout\n[\s\S]*agent: scout/);
    expect(flume(repo, ["task", "assign", id, "human"]).status).toBe(0);
    const y = yaml(repo, id);
    expect(y).toMatch(/assignee: human/);
    expect(y).toMatch(/agent: scout/);
    flume(repo, ["stop"]);
  });

  it("s-2bb8 assign with no name uses AGENT_NAME", async () => {
    const repo = await project();
    const id = mk(repo);
    expect(flume(repo, ["task", "assign", id], undefined, as("scout")).status).toBe(0);
    const t = show(repo, id);
    expect([t.assignee, t.agent]).toEqual(["scout", "scout"]);
    flume(repo, ["stop"]);
  });

  it("s-6f57 assign with no name and no AGENT_NAME", async () => {
    const repo = await project();
    const id = mk(repo);
    expect(flume(repo, ["task", "assign", id]).status).toBe(2);
    expect(show(repo, id).assignee).toBe("");
    flume(repo, ["stop"]);
  });

  it("s-b38b an unnamed agent acts under its own name", async () => {
    const repo = await project();
    const id = mk(repo);
    flume(repo, ["task", "assign", id, "scout"]);
    const cc = { CLAUDECODE: "1", CLAUDE_CODE_SESSION_ID: "abcdef0123456789" };
    const r = flume(repo, ["task", "claim", id], undefined, cc);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("AGENT_NAME");
    expect(show(repo, id).assignee).toBe("scout");
    const r2 = flume(repo, ["task", "assign", id, "rook"], undefined, cc);
    expect(r2.status).toBe(1);
    expect(r2.stderr).toContain("--force");
    expect(flume(repo, ["task", "assign", id, "rook", "--force"], undefined, cc).status).toBe(0);
    flume(repo, ["task", "comment", id, "--text", "hi"], undefined, cc);
    flume(repo, ["task", "write", id, "plan"], "## 1. G\n\n- [ ] 1.1 a\n", { CLAUDECODE: "1" });
    const h = JSON.parse(flume(repo, ["task", "history", id, "--json"]).stdout);
    const by = (a: string) =>
      h.filter((x: { action: string }) => x.action === a).map((x: { by: string }) => x.by);
    expect(by("assign")).toEqual(["human", "agent-abcdef01"]);
    expect(by("comment")).toEqual(["agent-abcdef01"]);
    expect(by("write")).toEqual(["agent-unknown"]);
    expect(
      show(repo, id).comments ?? flume(repo, ["task", "show", id, "comments"]).stdout,
    ).toContain("agent-abcdef01");
    flume(repo, ["stop"]);
  });

  it("s-55e0 an agent needs force to take a held task", async () => {
    const repo = await project();
    const id = mk(repo);
    flume(repo, ["task", "assign", id, "scout"]);
    const r = flume(repo, ["task", "assign", id], undefined, as("rook"));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("scout");
    expect(r.stderr).toContain("--force");
    expect(show(repo, id).assignee).toBe("scout");
    flume(repo, ["stop"]);
  });

  it("s-35b3 force takes it over", async () => {
    const repo = await project();
    const id = mk(repo);
    flume(repo, ["task", "assign", id, "scout"]);
    const r = flume(repo, ["task", "assign", id, "--force"], undefined, as("rook"));
    expect(r.status).toBe(0);
    const t = show(repo, id);
    expect([t.assignee, t.agent]).toEqual(["rook", "rook"]);
    flume(repo, ["stop"]);
  });

  it("s-56c8 the human re-assigns freely, the holder re-assigns to itself", async () => {
    const repo = await project();
    const id = mk(repo);
    flume(repo, ["task", "assign", id, "scout"]);
    expect(flume(repo, ["task", "assign", id, "rook"]).status).toBe(0);
    expect(flume(repo, ["task", "assign", id], undefined, as("rook")).status).toBe(0);
    expect(show(repo, id).assignee).toBe("rook");
    flume(repo, ["stop"]);
  });

  it("s-418e claim behaves like assign", async () => {
    const repo = await project();
    const id = mk(repo);
    flume(repo, ["task", "assign", id, "scout"]);
    const a = flume(repo, ["task", "claim", id], undefined, as("rook"));
    expect(a.status).toBe(1);
    expect(a.stderr).toContain("scout");
    expect(a.stderr).toContain("--force");
    expect(flume(repo, ["task", "claim", id, "--force"], undefined, as("rook")).status).toBe(0);
    expect(show(repo, id).assignee).toBe("rook");
    flume(repo, ["stop"]);
  });
});

describe("claim", { timeout: 30_000 }, () => {
  it("s-f13a claim only claims", async () => {
    const repo = await project();
    const id = mk(repo);
    const r = flume(repo, ["task", "claim", id], undefined, as("scout"));
    expect([r.status, r.stdout]).toEqual([0, ""]);
    const h = JSON.parse(flume(repo, ["task", "history", id, "--json"]).stdout);
    expect(h.map((x: { action: string }) => x.action)).toEqual(["create", "assign"]);
    flume(repo, ["stop"]);
  });
});

describe("old task fields", { timeout: 30_000 }, () => {
  it("s-2087 an old phase and guides are ignored", async () => {
    const repo = await project();
    const id = mk(repo);
    const path = join(repo, show(repo, id).path, "task.yaml");
    const old = "phase: implement\nguides:\n  implement:\n    - testing\n";
    writeFileSync(path, `${readFileSync(path, "utf8")}${old}`);
    expect(flume(repo, ["task", "list"]).stdout).not.toContain("implement");
    expect(Object.keys(show(repo, id))).not.toContain("phase");
    expect(Object.keys(show(repo, id))).not.toContain("guides");
    expect(flume(repo, ["task", "update", id, "title", "New"]).status).toBe(0);
    expect(readFileSync(path, "utf8")).toContain(old);
    flume(repo, ["stop"]);
  });
});

describe("task parts and templates", { timeout: 30_000 }, () => {
  it("s-47ca show lists the parts", async () => {
    const repo = await project();
    const id = mk(repo);
    const r = flume(repo, ["task", "show", id]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/\nparts: body\n$/);
    expect(r.stdout).not.toContain("flume/tasks");
    flume(repo, ["stop"]);
  });

  it("s-9260 a missing part", async () => {
    const repo = await project();
    const r = flume(repo, ["task", "show", mk(repo), "design"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("no design");
    expect(r.stderr).toContain("flume task template design");
    flume(repo, ["stop"]);
  });

  it("s-4bba write, read and remove a design", async () => {
    const repo = await project();
    const id = mk(repo);
    expect(flume(repo, ["task", "write", id, "design"], "## Context\nHi\n").status).toBe(0);
    expect(flume(repo, ["task", "show", id, "design"]).stdout).toBe("## Context\nHi\n");
    expect(flume(repo, ["task", "show", id]).stdout).toMatch(/parts: body, design\n$/);
    expect(flume(repo, ["task", "write", id, "design", "--remove"]).status).toBe(0);
    expect(flume(repo, ["task", "show", id]).stdout).toMatch(/parts: body\n$/);
    flume(repo, ["stop"]);
  });

  it("s-9b0f write from a file and refuse bad requests", async () => {
    const repo = await project();
    const id = mk(repo);
    const f = join(repo, "..", `spec-${id}.md`);
    writeFileSync(f, "## Requirements\n");
    dirs.push(f);
    expect(flume(repo, ["task", "write", id, "spec", "--file", f]).status).toBe(0);
    expect(flume(repo, ["task", "show", id, "spec"]).stdout).toBe("## Requirements\n");
    expect(flume(repo, ["task", "write", id, "comments"], "x").status).toBe(1);
    expect(flume(repo, ["task", "write", id, "body", "--remove"]).status).toBe(1);
    expect(flume(repo, ["task", "write", id, "plan", "--remove"]).status).toBe(1);
    flume(repo, ["stop"]);
  });

  it("s-6438 a part by any plain name", async () => {
    const repo = await project();
    const id = mk(repo);
    expect(flume(repo, ["task", "write", id, "release-notes"], "Notes\n").status).toBe(0);
    expect(flume(repo, ["task", "show", id, "release-notes"]).stdout).toBe("Notes\n");
    expect(flume(repo, ["task", "show", id]).stdout).toMatch(/parts: body, release-notes\n$/);
    expect(flume(repo, ["task", "write", id, "../escape"], "x").status).toBe(1);
    expect(flume(repo, ["task", "write", id, "Release-Notes"], "x").status).toBe(1);
    expect(flume(repo, ["task", "show", id, "release-notes"]).stdout).toBe("Notes\n");
    expect(show(repo, id).parts).toEqual(["body", "release-notes"]);
    flume(repo, ["stop"]);
  });

  it("s-2677 a part with no template, or one of its own", async () => {
    const repo = await project();
    const f = join(repo, "flume/base/templates/risks.md");
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, "# Risks\n\nRISKS\n");
    const t = (p: string) => flume(repo, ["task", "template", p]);
    expect([t("notes").status, t("notes").stdout]).toEqual([0, ""]);
    expect(t("risks").stdout).toContain("RISKS");
    expect(t("../escape").status).toBe(1);
    flume(repo, ["stop"]);
  });

  it("s-3a2d built-in templates", async () => {
    const repo = await project();
    const t = (p: string) => flume(repo, ["task", "template", p]).stdout;
    for (const p of ["body", "design", "spec", "plan"]) expect(t(p).trim()).not.toBe("");
    expect(t("spec")).toMatch(/#### Scenario[\s\S]*GIVEN[\s\S]*WHEN[\s\S]*THEN/);
    expect(t("plan")).toMatch(/^## 1\. .*\n[\s\S]*- \[ \] 1\.1 /m);
    // The template, title and all, is itself a plan that can be written.
    expect(flume(repo, ["task", "write", mk(repo), "plan"], t("plan")).status).toBe(0);
    flume(repo, ["stop"]);
  });

  it("s-dd9e template layers merge", async () => {
    const repo = await project();
    const w = (rel: string, text: string) => {
      const f = join(repo, "flume", rel);
      mkdirSync(dirname(f), { recursive: true });
      writeFileSync(f, text);
    };
    const t = (...a: string[]) => flume(repo, ["task", "template", ...a]).stdout;
    const builtin = t("spec");
    w("base/templates/design.md", "# Design\n\n## Context\n\nBASE\n");
    w("projects/web/templates/design.md", "# Design @replace\n\nWEB\n");
    expect(t("design")).toContain("## Context\n\nBASE\n\n## Goals / Non-goals\n");
    expect(t("design", "--project", "web")).toBe("# Design\n\nWEB\n");
    expect(t("spec", "--project", "web")).toBe(builtin);
    flume(repo, ["stop"]);
  });
});

const PLAN = `## 1. First

- [ ] 1.1 one
- [ ] 1.2 two

## 2. Second

- [ ] 2.1 three
`;
const plan = (repo: string, id: string) => flume(repo, ["task", "show", id, "plan"]).stdout;
const writePlan = (repo: string, id: string, text: string) =>
  flume(repo, ["task", "write", id, "plan"], text);

describe("the plan", { timeout: 30_000 }, () => {
  it("s-847c a good plan is accepted", async () => {
    const repo = await project();
    const id = mk(repo);
    const text = `## 1. First

- [x] 1.1 one
- [-] 1.2 two
  Skipped: not needed

## 2. Second

- [ ] 2.1 three
`;
    expect(writePlan(repo, id, text).status).toBe(0);
    expect(plan(repo, id)).toBe(text);
    flume(repo, ["stop"]);
  });

  it("s-bcce bad plans are refused", async () => {
    const repo = await project();
    const id = mk(repo);
    for (const bad of [
      "just words\n",
      "- [ ] 1.1 early\n",
      "## 1. G\n\n- [ ] 1.2 wrong number\n",
      "## 1. G\n",
      "## 2. G\n\n- [ ] 2.1 x\n",
      "## 1. G\n\n- [ ] 1.1 x\nsome prose\n",
    ]) {
      const r = writePlan(repo, id, bad);
      expect(r.status, bad).toBe(1);
      expect(r.stderr).toContain("plan form");
    }
    expect(flume(repo, ["task", "show", id]).stdout).toMatch(/parts: body\n$/);
    flume(repo, ["stop"]);
  });

  it("s-276f groups come in turn", async () => {
    const repo = await project();
    const id = mk(repo);
    writePlan(repo, id, PLAN);
    const next = () => flume(repo, ["task", "next", id]).stdout;
    expect(next()).toBe("## 1. First\n\n- [ ] 1.1 one\n- [ ] 1.2 two\n");
    flume(repo, ["task", "done", id, "1.1"]);
    expect(next()).toBe("## 1. First\n\n- [x] 1.1 one\n- [ ] 1.2 two\n");
    flume(repo, ["task", "done", id, "1.2"]);
    expect(next()).toBe("## 2. Second\n\n- [ ] 2.1 three\n");
    flume(repo, ["task", "done", id, "2.1"]);
    expect(next()).toMatch(/plan is complete/);
    const j = JSON.parse(flume(repo, ["task", "next", id, "--json"]).stdout);
    expect(j.complete).toBe(true);
    flume(repo, ["stop"]);
  });

  it("s-4a75 next with no plan", async () => {
    const repo = await project();
    const r = flume(repo, ["task", "next", mk(repo)]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("no plan");
    flume(repo, ["stop"]);
  });

  it("s-c986 done and skip", async () => {
    const repo = await project();
    const id = mk(repo);
    writePlan(repo, id, "## 1. G\n\n- [ ] 1.1 a\n- [ ] 1.2 b\n- [ ] 1.3 c\n");
    expect(flume(repo, ["task", "done", id, "1.1"]).status).toBe(0);
    expect(flume(repo, ["task", "skip", id, "1.2", "--reason", "not needed"]).status).toBe(0);
    expect(plan(repo, id)).toBe(
      "## 1. G\n\n- [x] 1.1 a\n- [-] 1.2 b\n  Skipped: not needed\n- [ ] 1.3 c\n",
    );
    flume(repo, ["stop"]);
  });

  it("s-7d6a refused marks change nothing", async () => {
    const repo = await project();
    const id = mk(repo);
    writePlan(repo, id, "## 1. G\n\n- [ ] 1.1 a\n\n## 2. H\n\n- [ ] 2.1 b\n");
    const before = plan(repo, id);
    expect(flume(repo, ["task", "done", id, "1.1", "2.1"]).status).toBe(1);
    expect(flume(repo, ["task", "done", id, "9.9"]).status).toBe(1);
    expect(flume(repo, ["task", "skip", id, "1.1"]).status).toBe(2);
    expect(plan(repo, id)).toBe(before);
    flume(repo, ["stop"]);
  });
});

describe("list", { timeout: 30_000 }, () => {
  it("s-4a30 filter by assignee", async () => {
    const repo = await project();
    const a = mk(repo, "A");
    const b = mk(repo, "B");
    mk(repo, "C");
    flume(repo, ["task", "assign", a, "scout"]);
    flume(repo, ["task", "assign", b, "human"]);
    const ids = (...f: string[]) =>
      flume(repo, ["task", "list", ...f])
        .stdout.trim()
        .split("\n")
        .filter(Boolean)
        .map((l) => l.split("\t")[0]);
    expect(ids("--assignee", "scout")).toEqual([a]);
    expect(ids("--assignee", "human")).toEqual([b]);
    expect(flume(repo, ["task", "list", "--phase", "design"]).status).toBe(2);
    const row = flume(repo, ["task", "list", "--assignee", "scout"]).stdout.trim().split("\t");
    expect(row).toEqual([a, "feature", "open", "scout", "A"]);
    for (const t of JSON.parse(flume(repo, ["task", "list", "--json"]).stdout)) {
      expect(Object.keys(t)).toEqual(expect.arrayContaining(["assignee", "agent"]));
      expect(Object.keys(t)).not.toContain("phase");
    }
    flume(repo, ["stop"]);
  });
});

describe("prime text", { timeout: 30_000 }, () => {
  it("s-0865 prime names the workflow commands and phases", () => {
    const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-wfprime-")));
    dirs.push(d);
    const r = flume(d, ["prime", "--name", "scout"]);
    expect(r.status).toBe(0);
    const base = /<workflow>([\s\S]*?)<\/workflow>/.exec(r.stdout)?.[1] ?? "";
    expect(r.stdout).toContain("You are agent scout, stored in $AGENT_NAME.");
    expect(base).not.toContain("You are agent scout");
    for (const c of [
      "flume task claim",
      "flume task show",
      "flume task template",
      "flume task write",
      "flume task next",
      "flume task done",
      "flume task skip",
      "flume task close",
      "flume task assign ID human",
      "flume task comment",
      "flume guide",
    ])
      expect(base).toContain(c);
    for (const p of ["Proposal", "Design", "Specs", "Plan", "Implement"])
      expect(base).toContain(`### ${p}\n`);
    for (const c of ["flume task instructions", "flume task phase", "flume task guide"])
      expect(base).not.toContain(c);
    for (const f of ["body.md", "design.md", "spec.md", "plan.md", "task.yaml"])
      expect(base).not.toContain(f);
  });
});
