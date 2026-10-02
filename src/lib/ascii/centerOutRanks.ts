import { createCellThresholds } from "./luminanceGrids";
import type { GlyphMetrics } from "./types";

export function createCenterOutRanks(
  { columns, rows }: GlyphMetrics,
  distanceWeight: number,
): Float32Array {
  const randomShares = createCellThresholds(columns * rows);
  const centerColumn = (columns - 1) / 2;
  const centerRow = (rows - 1) / 2;
  return randomShares.map((randomShare, cellIndex) => {
    const columnShare = ((cellIndex % columns) - centerColumn) / centerColumn;
    const rowShare = (Math.floor(cellIndex / columns) - centerRow) / centerRow;
    const distanceShare = Math.hypot(columnShare, rowShare) / Math.SQRT2;
    return distanceWeight * distanceShare + (1 - distanceWeight) * randomShare;
  });
}
