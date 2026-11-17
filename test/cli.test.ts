import { execFileSync } from "node:child_process";
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
