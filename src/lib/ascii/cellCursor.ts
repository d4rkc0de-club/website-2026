import { clampCellToRegion, type CellPosition } from "./cellGeometry";
import type { SceneRegion } from "./sceneGrid";
import type { GlyphFrame, PointerPosition } from "./types";

export type CellCursor = CellPosition & {
  isActive: boolean;
  lastPointer: PointerPosition | null;
};

export function createCellCursor(column: number, row: number): CellCursor {
  return { column, row, isActive: false, lastPointer: null };
}

export function followPointer(
  cursor: CellCursor,
  frame: GlyphFrame,
  region: SceneRegion,
  isEnabled = true,
): boolean {
  const { pointer, metrics } = frame;
  const { lastPointer } = cursor;
  const hasPointerMoved =
    pointer !== null &&
    (lastPointer === null || pointer.x !== lastPointer.x || pointer.y !== lastPointer.y);
  cursor.lastPointer = pointer;
  if (!pointer || !hasPointerMoved || !isEnabled) return false;

  const nextCell = clampCellToRegion(
    region,
    Math.floor(pointer.x / metrics.cellWidth),
    Math.floor(pointer.y / metrics.cellHeight),
  );
  cursor.column = nextCell.column;
  cursor.row = nextCell.row;
  cursor.isActive = true;
  return true;
}

export function stepCursor(
  cursor: CellCursor,
  columnStep: number,
  rowStep: number,
  region: SceneRegion,
): void {
  const nextCell = clampCellToRegion(region, cursor.column + columnStep, cursor.row + rowStep);
  cursor.column = nextCell.column;
  cursor.row = nextCell.row;
  cursor.isActive = true;
}
