import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const run = (...args: string[]) => execFileSync("node", [bin, ...args], { encoding: "utf8" });

describe("flume cli", () => {
  it("prints help", () => {
    expect(run("--help")).toContain("Usage: flume");
  });
  it("prints the package version and a git commit", () => {
    expect(run("version")).toMatch(/^0\.0\.1 \(([0-9a-f]{7,40}|unknown)\)\n$/);
  });
});

describe("flume releases specs", () => {
  const versionLine = /^0\.0\.1 \(([0-9a-f]{7,40}|unknown)\)$/;

  it("s-9b9e version in a git checkout", () => {
    expect(run("version").trimEnd()).toMatch(versionLine);
  });

  it("s-90c6 version outside a git checkout", () => {
    const dir = mkdtempSync(join(tmpdir(), "flume-nogit-"));
    try {
      const root = new URL("..", import.meta.url).pathname;
      for (const p of ["bin", "src", "package.json"])
        cpSync(join(root, p), join(dir, p), { recursive: true });
      symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
      const out = execFileSync("node", [join(dir, "bin/flume.js"), "version"], {
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
      const out = execFileSync("node", [bin, "version"], { encoding: "utf8", cwd: dir, env });
      const lines = out.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).not.toBe("");
      expect(lines[1]).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("s-e49f bug template has the version line", () => {
    const line = run("version").trimEnd();
    expect(run("bug")).toContain(`Version: ${line}\n`);
  });

  it("s-31d3 bug template has sections to fill in", () => {
    const out = run("bug");
    const at = ["## Command", "## Expected", "## Actual"].map((h) => out.indexOf(h));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at).toEqual([...at].sort((a, b) => a - b));
  });
});
