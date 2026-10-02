import type { GlyphMetrics } from "./types";

export function drawGlyphCell(
  context: CanvasRenderingContext2D,
  metrics: GlyphMetrics,
  character: string,
  column: number,
  row: number,
  color: string,
): void {
  context.fillStyle = color;
  context.fillText(character, column * metrics.cellWidth, row * metrics.cellHeight);
}
