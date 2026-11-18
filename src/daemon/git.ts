import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

export interface Project {
  /** The main checkout: the first entry of the worktree list. */
  mainCheckout: string;
  /** The shared git folder, the same from every worktree. */
  commonDir: string;
}

/** The project that `cwd` is in (main checkout, a worktree of it, or a folder inside), or undefined. */
export function findProject(cwd: string): Project | undefined {
  try {
    const commonDir = git(cwd, ["rev-parse", "--path-format=absolute", "--git-common-dir"]).trim();
    const list = git(cwd, ["worktree", "list", "--porcelain"]);
    const first = list.split("\n").find((l) => l.startsWith("worktree "));
    if (!first) return undefined;
    return { mainCheckout: resolve(first.slice("worktree ".length)), commonDir };
  } catch {
    return undefined;
  }
}

/** Is `dir` inside a git work tree? */
export function inRepo(dir: string): boolean {
  try {
    return git(dir, ["rev-parse", "--is-inside-work-tree"]).trim() === "true";
  } catch {
    return false;
  }
}

/** Commit exactly `paths` (relative to `dir`, including removed ones) as one commit. Never pushes. */
export function commitPaths(dir: string, paths: string[], message: string): void {
  git(dir, ["add", "-A", "--", ...paths]);
  git(dir, ["commit", "-m", message, "--", ...paths]);
}

/** Does `path` (relative to `dir`) have uncommitted changes or untracked files? */
export function hasChanges(dir: string, path: string): boolean {
  return git(dir, ["status", "--porcelain", "--", path]).trim() !== "";
}

/** `git clone [--branch B] URL DEST`; returns undefined on success, else git's error text. Never pushes. */
export function cloneRepo(url: string, dest: string, branch?: string): string | undefined {
  const args = ["clone", "-q", ...(branch ? ["--branch", branch] : []), "--", url, dest];
  try {
    execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return undefined;
  } catch (e) {
    const x = e as { stderr?: string; message: string };
    return (x.stderr || x.message).trim();
  }
}

/** The URL of remote `origin` in `dir`, or undefined. */
export function originUrl(dir: string): string | undefined {
  try {
    return git(dir, ["config", "--get", "remote.origin.url"]).trim() || undefined;
  } catch {
    return undefined;
  }
}
