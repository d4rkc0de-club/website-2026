import { GLYPH_SET_NAMES } from "@/lib/ascii/glyphSets";
import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { defineControls, select, slider } from "@/lib/variantControls";

export const CURSOR_TRAIL_CONTROLS = defineControls([
  select("glyphSetName", "Glyph set", GLYPH_SET_NAMES, "code"),
  select("colorName", "Color", THEME_COLOR_NAMES, "paper"),
  slider("trailPointLimit", "Trail points", 2, 80, 1, 28),
  slider("trailPointLifetimeSeconds", "Trail life (s)", 0.05, 1.5, 0.05, 0.3),
  slider("trailLineMaxOpacity", "Line opacity", 0, 1, 0.05, 0.55),
  slider("trailLineWidthPixels", "Line width (px)", 0, 4, 0.1, 0.8),
  slider("minimumMovePixels", "Min move (px)", 0, 10, 0.5, 0.5),
  slider("glyphSpawnIntervalSeconds", "Spawn interval (s)", 0.01, 0.5, 0.01, 0.04),
  slider("glyphSpawnJitterPixels", "Spawn jitter (px)", 0, 60, 1, 10),
  slider("glyphLifetimeSeconds", "Glyph life (s)", 0.1, 3, 0.05, 0.87),
  slider("glyphLifetimeSpreadSeconds", "Glyph life spread (s)", 0, 2, 0.05, 0.33),
  slider("glyphMinSizePixels", "Glyph min size (px)", 6, 40, 1, 12),
  slider("glyphSizeSpreadPixels", "Glyph size spread (px)", 0, 30, 1, 6),
  slider("glyphMaxRotationSpeed", "Glyph spin", 0, 10, 0.1, 2.4),
  slider("glyphFadeInShare", "Fade-in share", 0, 0.9, 0.05, 0.15),
  slider("glyphMaxOpacity", "Glyph opacity", 0.05, 1, 0.05, 0.8),
]);
