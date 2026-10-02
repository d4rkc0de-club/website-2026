import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { defineControls, select, slider } from "@/lib/variantControls";

export const ASCII_EYES_CONTROLS = defineControls([
  slider("artGrainFactor", "Art grain", 1, 4, 1, 3),
  slider("samplesPerCellAxis", "Samples per cell", 1, 4, 1, 2),
  slider("imageFillShare", "Image fill", 0.3, 1, 0.01, 0.92),
  slider("wideFontSizePixels", "Base font wide (px)", 4, 16, 1, 9),
  slider("narrowFontSizePixels", "Base font narrow (px)", 3, 12, 1, 6),
  slider("retinaWidthBaseCells", "Retina width (base cells)", 1, 10, 0.5, 4),
  slider("retinaHeightBaseCells", "Retina height (base cells)", 1, 10, 0.5, 4),
  slider("retinaFollowRatePerSecond", "Follow rate", 1, 40, 1, 10),
  slider("gazeRangeInTravels", "Gaze range", 1, 20, 0.5, 5),
  select("retinaColorName", "Retina color", THEME_COLOR_NAMES, "accent"),
]);
