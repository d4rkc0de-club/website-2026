import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { defineControls, select, slider } from "@/lib/variantControls";

export const WORM_SPREAD_CONTROLS = defineControls([
  slider("nodeCount", "Node count", 6, 60, 1, 24),
  slider("linksPerNode", "Links per node", 1, 4, 1, 2),
  slider("infectionChance", "Infection chance", 0.05, 1, 0.05, 0.6),
  slider("spreadSpeedCellsPerSecond", "Spread speed (cells/s)", 2, 60, 1, 14),
  slider("healTimeSeconds", "Heal time (s)", 0.5, 10, 0.5, 3),
  select("healthyColorName", "Healthy color", THEME_COLOR_NAMES, "light"),
  select("infectedColorName", "Infected color", THEME_COLOR_NAMES, "accent"),
  select("patchedColorName", "Patched color", THEME_COLOR_NAMES, "signal"),
  select("packetColorName", "Packet color", THEME_COLOR_NAMES, "wasp"),
]);
