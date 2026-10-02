import { GLYPH_SET_NAMES } from "@/lib/ascii/glyphSets";
import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { defineControls, select, slider } from "@/lib/variantControls";

export const REVEAL_CARD_CONTROLS = defineControls([
  select("glyphSetName", "Glyph set", GLYPH_SET_NAMES, "code"),
  select("quietColorName", "Cover color", THEME_COLOR_NAMES, "mid"),
  select("edgeColorName", "Edge color", THEME_COLOR_NAMES, "accent"),
  slider("revealDistanceViewportRatio", "Reveal distance", 0.1, 1.5, 0.05, 0.6),
  slider("flickerRatePerSecond", "Flicker rate", 0, 30, 1, 6),
  slider("edgeBandShare", "Edge band", 0, 0.4, 0.01, 0.08),
  slider("wideFontSizePixels", "Font wide (px)", 6, 24, 1, 10),
  slider("narrowFontSizePixels", "Font narrow (px)", 5, 16, 1, 8),
]);
