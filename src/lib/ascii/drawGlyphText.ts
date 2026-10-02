import { drawGlyphCell } from "./drawGlyphCell";
import type { GlyphMetrics } from "./types";

export function drawGlyphText(
  context: CanvasRenderingContext2D,
  metrics: GlyphMetrics,
  text: string,
  column: number,
  row: number,
  color: string,
): void {
  [...text].forEach((character, characterOffset) => {
    if (character !== " ") drawGlyphCell(context, metrics, character, column + characterOffset, row, color);
  });
}
