import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { defineControls, select, slider, toggle } from "@/lib/variantControls";

export const TERMINAL_TONES = [
  "prompt",
  "command",
  "output",
  "success",
  "warning",
  "error",
  "info",
  "muted",
] as const;

export const TERMINAL_CARD_CONTROLS = defineControls([
  slider("fontSizePixels", "Font size (px)", 10, 24, 1, 14),
  slider("lineHeight", "Line height", 1, 2.5, 0.05, 1.625),
  slider("paddingPixels", "Padding (px)", 4, 48, 1, 16),
  slider("borderWidthPixels", "Border (px)", 0, 6, 1, 1),
  select("backgroundColorName", "Background", THEME_COLOR_NAMES, "ink"),
  select("borderColorName", "Border color", THEME_COLOR_NAMES, "line"),
  toggle("showTitleBar", "Title bar", true),
  toggle("showTitleDots", "Title dots", true),
  slider("titleDotSizePixels", "Dot size (px)", 4, 20, 1, 10),
  toggle("showCursor", "Cursor", true),
  slider("cursorBlinkSeconds", "Blink period (s)", 0.2, 3, 0.1, 1),
  select("cursorColorName", "Cursor color", THEME_COLOR_NAMES, "paper"),
  select("promptColorName", "Prompt color", THEME_COLOR_NAMES, "signal"),
  select("commandColorName", "Command color", THEME_COLOR_NAMES, "paper"),
  select("outputColorName", "Output color", THEME_COLOR_NAMES, "light"),
  select("successColorName", "Success color", THEME_COLOR_NAMES, "signal"),
  select("warningColorName", "Warning color", THEME_COLOR_NAMES, "wasp"),
  select("errorColorName", "Error color", THEME_COLOR_NAMES, "accent"),
  select("infoColorName", "Info color", THEME_COLOR_NAMES, "ice"),
  select("mutedColorName", "Muted color", THEME_COLOR_NAMES, "mid"),
]);
