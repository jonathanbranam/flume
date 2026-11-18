/** The v1 workflow: five phases, linear, the same for every task. */
export const PHASES = ["proposal", "design", "specs", "plan", "implement"] as const;
export type Phase = (typeof PHASES)[number];

/** The parts an agent writes, in phase order (specs writes the part named spec). */
export const WRITABLE_PARTS = ["body", "design", "spec", "plan"] as const;
export type WritablePart = (typeof WRITABLE_PARTS)[number];

/** The part each phase writes; implement writes none (it works the plan). */
const PHASE_PART: Record<Phase, string | null> = {
  proposal: "body",
  design: "design",
  specs: "spec",
  plan: "plan",
  implement: null,
};

export interface WorkflowStep {
  phase: Phase;
  part: string | null;
  requires: Phase | null;
}

/** The whole workflow as a list: each phase, the part it writes, and the phase it requires. */
export function workflowSteps(): WorkflowStep[] {
  return PHASES.map((phase, i) => ({
    phase,
    part: PHASE_PART[phase],
    requires: i === 0 ? null : (PHASES[i - 1] as Phase),
  }));
}

export const isPhase = (v: string): v is Phase => (PHASES as readonly string[]).includes(v);

/** Every part a task can have, by the name agents use, and the file in the task folder. */
export const PART_FILES: Record<string, string> = {
  body: "body.md",
  design: "design.md",
  spec: "spec.md",
  plan: "plan.md",
  comments: "comments.md",
};
