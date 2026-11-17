import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);

function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as {
    version: string;
  };
  return pkg.version;
}

/** The git commit of the checkout flume runs from, or "unknown" outside a git checkout. */
function gitCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

/** "<package version> (<git commit>)". */
export function version(): string {
  return `${packageVersion()} (${gitCommit()})`;
}
