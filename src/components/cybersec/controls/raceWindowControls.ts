import { RACE_SCENARIOS, RACE_SCENARIO_NAMES } from "@/content/cybersecContent";
import { THREAD_INTERLEAVINGS } from "@/lib/threadInterleavings";
import { defineControls, select, slider, toggle } from "@/lib/variantControls";

export const RACE_WINDOW_CONTROLS = defineControls([
  select("scenario", "Scenario", RACE_SCENARIO_NAMES, RACE_SCENARIOS.race),
  slider("customOrderNumber", "Custom order number", 0, THREAD_INTERLEAVINGS.length - 1, 1, 0),
  slider("startingBalance", "Starting balance", 50, 200, 10, 100),
  slider("withdrawalAmount", "Each thread takes", 10, 100, 10, 100),
  slider("stepSeconds", "Step time (s)", 0.3, 3, 0.1, 1),
  toggle("isPaused", "Pause", false),
]);
