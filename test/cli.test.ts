import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { topics } from "../src/cli/help.ts";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const run = (...args: string[]) => execFileSync("node", [bin, ...args], { encoding: "utf8" });

describe("flume cli", () => {
  it("prints help", () => {
    expect(run("--help")).toContain("Usage: flume <command>");
  });
  it("s-7eb6 top-level help says agents never run serve", () => {
    expect(run("--help").replace(/\s+/g, " ")).toContain("the human runs this; agents never do");
  });
  it("s-0396 serve --help prints the serve usage and the human-only line, exit 0", () => {
    const r = spawnSync("node", [bin, "serve", "--help"], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Usage: flume serve [options]");
    expect(r.stdout).toContain(
      "Only the human runs flume serve, in its own pane. Agents never start it.",
    );
  });
  it("s-f885 serve usage error carries the human-only line, exit 2", () => {
    const r = spawnSync("node", [bin, "serve", "--bogus"], { encoding: "utf8" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain(
      "Only the human runs flume serve, in its own pane. Agents never start it.",
    );
  });
  it("prints the package version and a git commit", () => {
    expect(run("--version")).toMatch(/^0\.0\.1 \(([0-9a-f]{7,40}|unknown)\)\n$/);
  });
});

describe("flume releases specs", () => {
  const versionLine = /^0\.0\.1 \(([0-9a-f]{7,40}|unknown)\)$/;

  it("s-9b9e version in a git checkout", () => {
    expect(run("--version").trimEnd()).toMatch(versionLine);
  });

  it("s-90c6 version outside a git checkout", () => {
    const dir = mkdtempSync(join(tmpdir(), "flume-nogit-"));
    try {
      const root = new URL("..", import.meta.url).pathname;
      for (const p of ["bin", "src", "package.json"])
        cpSync(join(root, p), join(dir, p), { recursive: true });
      symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
      const out = execFileSync("node", [join(dir, "bin/flume.js"), "--version"], {
        encoding: "utf8",
      });
      expect(out).toBe("0.0.1 (unknown)\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("s-129b version offline: one line, exit 0, no daemon", () => {
    const dir = mkdtempSync(join(tmpdir(), "flume-offline-"));
    try {
      const env = { ...process.env };
      delete env.FLUME_URL;
      const out = execFileSync("node", [bin, "--version"], { encoding: "utf8", cwd: dir, env });
      const lines = out.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).not.toBe("");
      expect(lines[1]).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("s-e49f bug template has the version line", () => {
    const line = run("--version").trimEnd();
    expect(run("bug")).toContain(`Version: ${line}\n`);
  });

  it("s-7662 version as a command is unknown", () => {
    const dir = mkdtempSync(join(tmpdir(), "flume-unknown-"));
    try {
      const env = { ...process.env };
      delete env.FLUME_URL;
      const r = spawnSync("node", [bin, "version"], { encoding: "utf8", cwd: dir, env });
      expect(r.status).toBe(2);
      expect(r.stderr).toMatch(/unknown command 'version'/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("s-31d3 bug template has sections to fill in", () => {
    const out = run("bug");
    const at = ["## Command", "## Expected", "## Actual"].map((h) => out.indexOf(h));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at).toEqual([...at].sort((a, b) => a - b));
  });
});

describe("flume help everywhere", () => {
  const go = (...args: string[]) => spawnSync("node", [bin, ...args], { encoding: "utf8" });

  /** The command names a help text lists under "Commands:" (the help command itself excluded). */
  function listed(help: string): string[] {
    const lines = help.split("\n");
    const at = lines.indexOf("Commands:");
    if (at < 0) return [];
    const names: string[] = [];
    for (const l of lines.slice(at + 1)) {
      const m = /^ {2}(\S+)/.exec(l);
      if (l === "") break;
      if (m && m[1] !== "help") names.push(m[1] as string);
    }
    return names;
  }

  /** Every command path reachable from the top-level help and each group's help. */
  function walk(path: string[] = []): string[][] {
    const out: string[][] = [];
    for (const name of listed(go(...path, "--help").stdout)) {
      out.push([...path, name], ...walk([...path, name]));
    }
    return out;
  }

  it("s-1df5 --help and help work on every listed command and subcommand", () => {
    const paths = walk();
    expect(paths.length).toBeGreaterThan(30);
    expect(paths).toContainEqual(["task", "show"]);
    expect(paths).toContainEqual(["roadmap", "check"]);
    for (const path of [[], ...paths]) {
      const h = go(...path, "--help");
      expect(h.status, path.join(" ")).toBe(0);
      expect(h.stdout, path.join(" ")).toMatch(/^Usage: flume/);
      expect(h.stderr, path.join(" ")).toBe("");
      if (path.length > 0) {
        const viaHelp = go("help", ...path);
        expect(viaHelp.status, path.join(" ")).toBe(0);
        expect(viaHelp.stdout, path.join(" ")).toBe(h.stdout);
      }
    }
  }, 120_000);
});

describe("flume help guides", () => {
  const go = (...args: string[]) => spawnSync("node", [bin, ...args], { encoding: "utf8" });

  it("s-b8ca help lists the topics", () => {
    const r = go("help");
    expect(r.status).toBe(0);
    for (const [name] of topics) expect(r.stdout).toMatch(new RegExp(`^ +${name} +\\S`, "m"));
  });
  it("s-71b0 each topic prints a guide", () => {
    expect(topics.map(([n]) => n)).toEqual(["install", "setup", "usage"]);
    for (const [name] of topics) {
      const r = go("help", name);
      expect(r.status, name).toBe(0);
      expect(r.stdout.length, name).toBeGreaterThan(200);
      expect(r.stderr, name).toBe("");
    }
  });
  it("s-56a4 an unknown topic lists the topics on stderr, exit 1", () => {
    const r = go("help", "frobnicate");
    expect(r.status).toBe(1);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("install");
    expect(r.stderr).toContain("usage");
  });
  it("s-3e8e no topic is a command", () => {
    const text = go("--help").stdout;
    const cmds = text
      .slice(text.indexOf("Commands:"))
      .split("\n")
      .map((l) => /^ {2}(\S+)/.exec(l)?.[1]);
    expect(cmds).toContain("task");
    for (const [name] of topics) expect(cmds).not.toContain(name);
  });
  it("s-6710 top-level help lists help and points at setup", () => {
    const r = go("--help");
    expect(r.status).toBe(0);
    const text = r.stdout;
    expect(text).toMatch(/^ {2}help /m);
    expect(text.indexOf("flume help setup")).toBeGreaterThan(-1);
    expect(text.indexOf("flume help setup")).toBeLessThan(text.indexOf("Commands:"));
  });
});
