import { BIT_GLYPH_SET_NAMES } from "@/lib/ascii/glyphSets";
import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { HASH_ALGORITHM_NAMES } from "@/lib/hashBits";
import { defineControls, select, slider } from "@/lib/variantControls";

export const HASH_AVALANCHE_CONTROLS = defineControls([
  select("algorithmName", "Algorithm", HASH_ALGORITHM_NAMES, "SHA-256"),
  slider("gridColumnCount", "Grid columns", 8, 64, 8, 16),
  slider("fontSizePixels", "Font size (px)", 8, 28, 1, 14),
  slider("waveStepMilliseconds", "Wave step (ms)", 1, 80, 1, 12),
  slider("flashDurationSeconds", "Flash time (s)", 0.1, 2, 0.1, 0.6),
  select("bitGlyphSetName", "Bit glyphs", BIT_GLYPH_SET_NAMES, "binary"),
  select("bitColorName", "Bit color", THEME_COLOR_NAMES, "mid"),
  select("flipColorName", "Flip color", THEME_COLOR_NAMES, "accent"),
]);
