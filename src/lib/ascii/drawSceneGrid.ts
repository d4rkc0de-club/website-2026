import { drawGlyphCell } from "./drawGlyphCell";
import type { SceneGrid } from "./sceneGrid";
import type { GlyphFrame } from "./types";

export function drawSceneGrid(frame: GlyphFrame, sceneGrid: SceneGrid): void {
  const { context, metrics } = frame;
  sceneGrid.forEach((cell, cellIndex) => {
    if (!cell) return;
    const column = cellIndex % metrics.columns;
    const row = Math.floor(cellIndex / metrics.columns);
    context.fillStyle = metrics.palette.backgroundColor;
    context.fillRect(
      column * metrics.cellWidth,
      row * metrics.cellHeight,
      metrics.cellWidth,
      metrics.cellHeight,
    );
    drawGlyphCell(context, metrics, cell.character, column, row, cell.color);
  });
}
