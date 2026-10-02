import { clamp, lerp } from "./easing";
import type { SceneRegion } from "./sceneGrid";

export type CellPosition = { column: number; row: number };

export function isCellInRegion(region: SceneRegion, column: number, row: number): boolean {
  return (
    column >= region.column &&
    row >= region.row &&
    column < region.column + region.columns &&
    row < region.row + region.rows
  );
}

export function clampCellToRegion(region: SceneRegion, column: number, row: number): CellPosition {
  return {
    column: clamp(column, region.column, region.column + region.columns - 1),
    row: clamp(row, region.row, region.row + region.rows - 1),
  };
}

export function forEachCellInRegion(
  area: SceneRegion,
  bounds: SceneRegion,
  visitCell: (column: number, row: number) => void,
): void {
  for (let row = area.row; row < area.row + area.rows; row++) {
    for (let column = area.column; column < area.column + area.columns; column++) {
      if (isCellInRegion(bounds, column, row)) visitCell(column, row);
    }
  }
}

export function forEachCellOnLine(
  startCell: CellPosition,
  endCell: CellPosition,
  visitCell: (column: number, row: number) => void,
): void {
  const stepCount = Math.max(
    Math.abs(endCell.column - startCell.column),
    Math.abs(endCell.row - startCell.row),
  );
  for (let step = 0; step <= stepCount; step++) {
    const share = stepCount === 0 ? 0 : step / stepCount;
    visitCell(
      Math.round(lerp(startCell.column, endCell.column, share)),
      Math.round(lerp(startCell.row, endCell.row, share)),
    );
  }
}
