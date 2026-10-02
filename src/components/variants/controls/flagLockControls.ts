import { FLAG_LOCK_BODY } from "@/content/componentDemoContent";
import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { defineControls, select, slider } from "@/lib/variantControls";

export const FLAG_LOCK_CONTROLS = defineControls([
  slider("slotCount", "Slot count", 3, FLAG_LOCK_BODY.length, 1, FLAG_LOCK_BODY.length),
  slider("spinSpeedPerSecond", "Spin speed (changes/s)", 2, 60, 1, 20),
  slider("lockStaggerMilliseconds", "Lock stagger (ms)", 0, 600, 10, 120),
  slider("shakeStrengthPixels", "Wrong-shake strength (px)", 0, 40, 1, 12),
  select("spinColorName", "Spin color", THEME_COLOR_NAMES, "light"),
  select("lockedColorName", "Locked color", THEME_COLOR_NAMES, "signal"),
]);
