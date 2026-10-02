import { defineControls, slider, toggle } from "@/lib/variantControls";

export const RING_CLIMB_CONTROLS = defineControls([
  toggle("isGatePatched", "Patch the gate bug", false),
  slider("stepDelayMilliseconds", "Step delay (ms)", 200, 2000, 100, 800),
]);
