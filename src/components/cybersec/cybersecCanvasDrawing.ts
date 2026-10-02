import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { drawGlyphText } from "@/lib/ascii/drawGlyphText";
import type { createThemeColorReader, ThemeColorName } from "@/lib/ascii/glyphStyle";
import type { GlyphFrame } from "@/lib/ascii/types";

export type ThemedScene = {
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

export type ColoredGlyph = {
  character: string;
  colorName: ThemeColorName;
};

export function drawThemedText(
  scene: ThemedScene,
  frame: GlyphFrame,
  text: string,
  column: number,
  row: number,
  colorName: ThemeColorName,
): void {
  drawGlyphText(frame.context, frame.metrics, text, column, row, scene.readThemeColor(colorName));
}

export function drawThemedCell(
  scene: ThemedScene,
  frame: GlyphFrame,
  character: string,
  column: number,
  row: number,
  colorName: ThemeColorName,
): void {
  drawGlyphCell(frame.context, frame.metrics, character, column, row, scene.readThemeColor(colorName));
}

export function drawWrappedColoredGlyphs(
  scene: ThemedScene,
  frame: GlyphFrame,
  glyphs: readonly ColoredGlyph[],
  firstColumn: number,
  topRow: number,
  sideMarginColumns: number,
): number {
  const columnCount = Math.max(1, frame.metrics.columns - firstColumn - sideMarginColumns);
  glyphs.forEach(({ character, colorName }, glyphIndex) => {
    drawThemedCell(
      scene,
      frame,
      character,
      firstColumn + (glyphIndex % columnCount),
      topRow + Math.floor(glyphIndex / columnCount),
      colorName,
    );
  });
  return Math.ceil(glyphs.length / columnCount);
}
