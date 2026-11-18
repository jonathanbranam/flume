/**
 * Who is running this command (fl-6hkt): $AGENT_NAME, else an unnamed Claude Code agent
 * ("agent-<first 8 of CLAUDE_CODE_SESSION_ID>", "agent-unknown" without one), else the human.
 * The one client-side check; every command that records or decides by actor goes through it.
 */
export function actorName(env: NodeJS.ProcessEnv = process.env): string {
  if (env.AGENT_NAME) return env.AGENT_NAME;
  if (env.CLAUDECODE) {
    const id = (env.CLAUDE_CODE_SESSION_ID ?? "").slice(0, 8);
    return `agent-${id === "" ? "unknown" : id}`;
  }
  return "human";
}

/** True when the actor is an agent (named or not), so the human's rights do not apply. */
export const isAgent = (env: NodeJS.ProcessEnv = process.env): boolean =>
  actorName(env) !== "human";
