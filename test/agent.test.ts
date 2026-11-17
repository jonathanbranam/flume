import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "flume-agent-"));
  mkdirSync(join(dir, "bin"));
  mkdirSync(join(dir, "home"));
  const claude = `#!/bin/sh
{ echo "AGENT_NAME=$AGENT_NAME"; echo "AGENT_PROJECT=$AGENT_PROJECT"; for a in "$@"; do printf 'ARG:%s\\n' "$(printf %s "$a" | tr '\\n' '\\036')"; done; echo END; } >> "${dir}/claude.log"
exit \${FAKE_CLAUDE_EXIT:-0}
`;
  const tmux = `#!/bin/sh
case "$1" in
  show-options) printf '%s\\n' "$FAKE_PANE_OPT" ;;
  set-option) echo "$@" >> "${dir}/tmux.log" ;;
  list-panes) cat "${dir}/panes" 2>/dev/null ;;
esac
exit 0
`;
  for (const [n, s] of [
    ["claude", claude],
    ["tmux", tmux],
  ] as const) {
    writeFileSync(join(dir, "bin", n), s);
    chmodSync(join(dir, "bin", n), 0o755);
  }
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function flume(args: string[], env: Record<string, string> = {}) {
  const e: Record<string, string> = {
    PATH: `${join(dir, "bin")}:${process.env.PATH}`,
    HOME: join(dir, "home"),
    ...env,
  };
  const r = spawnSync("node", [bin, ...args], { encoding: "utf8", env: e });
  return { out: r.stdout, err: r.stderr, code: r.status };
}
const claudeRuns = () => {
  try {
    return readFileSync(join(dir, "claude.log"), "utf8")
      .split("END\n")
      .filter(Boolean)
      .map((r) => r.split("\n").filter(Boolean));
  } catch {
    return [];
  }
};
const args = (run: string[]) =>
  run.filter((l) => l.startsWith("ARG:")).map((l) => l.slice(4).replaceAll("\u001e", "\n"));
const entry = (n: string) =>
  JSON.parse(readFileSync(join(dir, "home", ".flume", "agents", `${n}.json`), "utf8"));
const writeEntry = (n: string, e: Record<string, string>) => {
  mkdirSync(join(dir, "home", ".flume", "agents"), { recursive: true });
  writeFileSync(join(dir, "home", ".flume", "agents", `${n}.json`), JSON.stringify(e));
};

describe("flume agent specs", () => {
  it("s-a1c1 launch by name", () => {
    const r = flume(["agent", "alpha"], { FAKE_CLAUDE_EXIT: "3" });
    expect(r.code).toBe(3);
    expect(claudeRuns()).toHaveLength(1);
    expect(claudeRuns()[0]).toContain("AGENT_NAME=alpha");
    expect(entry("alpha").name).toBe("alpha");
  });

  it("s-a2c1 options before the name", () => {
    flume(["agent", "--project", "web", "alpha"]);
    expect(claudeRuns()[0]).toContain("AGENT_NAME=alpha");
    expect(claudeRuns()[0]).toContain("AGENT_PROJECT=web");
  });

  it("s-a2c2 unrecognized arguments and double dash", () => {
    flume(["agent", "alpha", "--model=opus", "--", "--force", "-p"]);
    expect(args(claudeRuns()[0] as string[]).slice(0, 3)).toEqual([
      "--model=opus",
      "--force",
      "-p",
    ]);
  });

  it("s-a3c1 project saved and reused", () => {
    flume(["agent", "alpha", "--project", "web"]);
    flume(["agent", "alpha"]);
    expect(claudeRuns()[1]).toContain("AGENT_PROJECT=web");
    expect(entry("alpha").project).toBe("web");
  });

  it("s-a4c1 name read from the pane", () => {
    flume(["agent"], { TMUX_PANE: "%1", FAKE_PANE_OPT: "alpha" });
    expect(claudeRuns()[0]).toContain("AGENT_NAME=alpha");
  });

  it("s-a4c2 no name anywhere", () => {
    const r = flume(["agent"]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("Usage");
  });

  it("s-a5c1 refused when tied to another pane", () => {
    writeEntry("alpha", { name: "alpha", project: "", pane: "%7", created: "", last_launch: "" });
    const r = flume(["agent", "alpha"], { TMUX_PANE: "%1" });
    expect(r.code).toBe(1);
    expect(r.err).toContain("%7");
    expect(claudeRuns()).toHaveLength(0);
  });

  it("s-a5c2 forced", () => {
    writeEntry("alpha", { name: "alpha", project: "", pane: "%7", created: "", last_launch: "" });
    const r = flume(["agent", "alpha", "--force"], { TMUX_PANE: "%1" });
    expect(r.code).toBe(0);
    expect(claudeRuns()).toHaveLength(1);
    expect(entry("alpha").pane).toBe("%1");
    expect(readFileSync(join(dir, "tmux.log"), "utf8")).toContain("@flume_agent alpha");
  });

  it("s-a6c1 default prompt contents", () => {
    flume(["agent", "alpha", "--project", "web", "pick up xyz"]);
    const last = args(claudeRuns()[0] as string[]).at(-1) as string;
    expect(last).toContain("You are agent alpha");
    expect(last).toContain("You are working on project web");
    expect(last).toContain("pick up xyz");
  });

  it("s-a7c1 system mode", () => {
    flume(["agent", "alpha", "--system"]);
    const a = args(claudeRuns()[0] as string[]);
    const i = a.indexOf("--append-system-prompt");
    expect(a[i + 1]).toContain("You are agent alpha");
    const last = a.at(-1) as string;
    expect(last).not.toBe("");
    expect(last).not.toContain("You are agent alpha");
  });

  it("s-a8c1 template override", () => {
    mkdirSync(join(dir, "home", ".flume", "templates"), { recursive: true });
    writeFileSync(join(dir, "home", ".flume", "templates", "base.md"), "Hello {name}");
    expect(flume(["prime", "alpha"]).out).toContain("Hello alpha");
  });

  it("s-a9c1 prime with a project", () => {
    const r = flume(["prime", "alpha", "--project", "web"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("You are agent alpha");
    expect(r.out).toContain("You are working on project web");
  });

  it("s-b1c1 list live column", () => {
    for (const [n, p] of [
      ["a", "%1"],
      ["b", "%2"],
      ["c", "%3"],
    ] as const)
      writeEntry(n, { name: n, project: "", pane: p, created: "", last_launch: "t" });
    writeFileSync(join(dir, "panes"), "%1 claude\n%2 zsh\n");
    const r = flume(["agent", "list"]);
    const row = (n: string) =>
      (r.out.split("\n").find((l) => l.startsWith(`${n} `)) ?? "").split(/\s+/);
    expect(r.out).toMatch(/^NAME\s+PANE\s+PROJECT\s+LIVE\s+LAST-LAUNCH/);
    expect(row("a")[3]).toBe("yes");
    expect(row("b")[3]).toBe("pane");
    expect(row("c")[3]).toBe("-");
  });

  it("s-b2c1 show", () => {
    flume(["agent", "alpha", "--project", "web"]);
    const r = flume(["agent", "show", "alpha"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain('"project": "web"');
    expect(flume(["agent", "show", "nope"]).code).toBe(1);
  });
});
