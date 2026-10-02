export type ArrowStep = { columns: number; rows: number };

const ARROW_STEPS: Record<string, ArrowStep> = {
  ArrowLeft: { columns: -1, rows: 0 },
  ArrowRight: { columns: 1, rows: 0 },
  ArrowUp: { columns: 0, rows: -1 },
  ArrowDown: { columns: 0, rows: 1 },
};

export function arrowStepForKey(event: KeyboardEvent): ArrowStep | undefined {
  return ARROW_STEPS[event.key];
}

export function isSpaceKey(event: KeyboardEvent): boolean {
  return event.key === " ";
}
