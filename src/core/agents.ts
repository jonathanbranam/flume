import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseDocument, stringify } from "yaml";

/** One agent entry, ~/.flume/agents/<name>.yaml: a flat mapping of strings. */
export interface Entry {
  name: string;
  project: string;
  role: string;
  pane: string;
  created: string;
  last_launch: string;
  last_seen?: string;
}

export const flumeHome = () => join(process.env.HOME ?? homedir(), ".flume");
export const agentsDir = () => join(flumeHome(), "agents");
export const entryFile = (name: string) => join(agentsDir(), `${name}.yaml`);

/** The entry for `name`, or undefined when missing or unreadable. Failsafe schema: scalars stay strings. */
export function readEntry(name: string): Entry | undefined {
  try {
    const e = parseDocument(readFileSync(entryFile(name), "utf8"), { schema: "failsafe" }).toJS();
    return e && typeof e === "object" && !Array.isArray(e) ? (e as Entry) : undefined;
  } catch {
    return undefined;
  }
}

export function writeEntry(entry: Entry): void {
  mkdirSync(agentsDir(), { recursive: true });
  writeFileSync(entryFile(entry.name), stringify(entry));
}

/** Set last_seen to now on an existing entry, keeping its other fields; never creates one. */
export function touchSeen(name: string): void {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) return;
  const e = readEntry(name);
  if (e) writeEntry({ ...e, last_seen: new Date().toISOString() });
}
