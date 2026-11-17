// Runs bridle's spec checks. `spec check --require-ids` fails the check; `spec coverage` only reports.
// Without bridle on PATH (or without design/specs/), the part is skipped with a message.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync("design/specs")) {
  console.log("spec: no design/specs/ yet, skipping");
  process.exit(0);
}
if (spawnSync("bridle", ["--version"], { stdio: "ignore" }).status !== 0) {
  console.log("spec: bridle not on PATH, skipping spec checks");
  process.exit(0);
}
const check = spawnSync("bridle", ["spec", "check", "--require-ids"], { stdio: "inherit" });
spawnSync("bridle", ["spec", "coverage"], { stdio: "inherit" }); // report-only for now
process.exit(check.status ?? 1);
