import type { GlyphFrame, GlyphPalette } from "./types";

export const GLYPH_RAMP = [" ", ".", ":", "+", "*", "#", "%", "█"] as const;

export const GLYPH_FONT_FAMILY =
  'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

const BACKGROUND_COLOR_VARIABLE = "--color-void";

const LEVEL_COLOR_VARIABLES = [
  "--color-void",
  "--color-mid",
  "--color-mid",
  "--color-light",
  "--color-light",
  "--color-paper",
  "--color-paper",
  "--color-white",
] as const;

export const THEME_COLOR_NAMES = [
  "void",
  "ink",
  "panel",
  "line",
  "mid",
  "light",
  "paper",
  "white",
  "sheet",
  "accent",
  "wasp",
  "signal",
  "ice",
] as const;

export type ThemeColorName = (typeof THEME_COLOR_NAMES)[number];

export function themeColorCssValue(colorName: ThemeColorName): string {
  return `var(--color-${colorName})`;
}

export function readColorVariable(variableName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

export function createThemeColorReader(): (colorName: ThemeColorName) => string {
  const cachedColors = new Map<ThemeColorName, string>();
  return (colorName) => {
    const cachedColor = cachedColors.get(colorName);
    if (cachedColor !== undefined) return cachedColor;
    const color = readColorVariable(`--color-${colorName}`);
    cachedColors.set(colorName, color);
    return color;
  };
}

export function readGlyphPalette(): GlyphPalette {
  return {
    backgroundColor: readColorVariable(BACKGROUND_COLOR_VARIABLE),
    levelColors: LEVEL_COLOR_VARIABLES.map(readColorVariable),
  };
}

export function levelForLuminance(luminance: number): number {
  const rawLevel = Math.floor(luminance * GLYPH_RAMP.length);
  return Math.min(GLYPH_RAMP.length - 1, Math.max(0, rawLevel));
}

export function clearFrame({ context, metrics }: GlyphFrame): void {
  context.fillStyle = metrics.palette.backgroundColor;
  context.fillRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
}

export function pointerHeatLuminance(
  { pointer, metrics }: GlyphFrame,
  column: number,
  row: number,
  radiusCells: number,
): number {
  if (!pointer) return 0;
  const distance = Math.hypot(
    column - pointer.x / metrics.cellWidth,
    row - pointer.y / metrics.cellHeight,
  );
  return Math.max(0, 1 - distance / radiusCells);
}
