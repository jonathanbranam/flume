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
