import { clamp } from "./easing";
import type { GlyphMetrics, LuminanceGrid } from "./types";

const STROKE_REACH_CELLS = 0.8;
const STROKE_GAIN = 1.25;
const HASH_MULTIPLIER_A = 374761393;
const HASH_MULTIPLIER_B = 668265263;
const HASH_MULTIPLIER_C = 1274126177;
const HASH_RANGE = 4294967296;

export type FieldExtent = {
  cellUnits: number;
  halfWidth: number;
  halfHeight: number;
};

export type FieldSampler = (
  x: number,
  y: number,
  extent: FieldExtent,
  column: number,
  row: number,
) => number;

export function createLuminanceField(
  metrics: GlyphMetrics,
  sampleLuminance: FieldSampler,
): LuminanceGrid {
  const { columns, rows, cellAspect } = metrics;
  const halfHeightRows = rows / 2;
  const halfWidthRows = columns / (2 * cellAspect);
  const unitRows = Math.min(halfHeightRows, halfWidthRows);
  const extent: FieldExtent = {
    cellUnits: 1 / unitRows,
    halfWidth: halfWidthRows / unitRows,
    halfHeight: halfHeightRows / unitRows,
  };
  const luminanceGrid = new Float32Array(columns * rows);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column + 0.5 - columns / 2) / cellAspect / unitRows;
      const y = (row + 0.5 - rows / 2) / unitRows;
      luminanceGrid[row * columns + column] = clamp(sampleLuminance(x, y, extent, column, row), 0, 1);
    }
  }

  return luminanceGrid;
}

export function strokeLuminance(distance: number, cellUnits: number): number {
  return clamp((1 - distance / (cellUnits * STROKE_REACH_CELLS)) * STROKE_GAIN, 0, 1);
}

export function circleDistance(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radius: number,
): number {
  return Math.abs(Math.hypot(x - centerX, y - centerY) - radius);
}

export function diskDistance(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radius: number,
): number {
  return Math.max(0, Math.hypot(x - centerX, y - centerY) - radius);
}

export function ellipseDistance(
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
): number {
  return Math.abs(Math.hypot(x / halfWidth, y / halfHeight) - 1) * Math.min(halfWidth, halfHeight);
}

export function segmentDistance(
  x: number,
  y: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const directionX = endX - startX;
  const directionY = endY - startY;
  const alongShare = clamp(
    ((x - startX) * directionX + (y - startY) * directionY) /
      (directionX * directionX + directionY * directionY),
    0,
    1,
  );
  return Math.hypot(x - startX - alongShare * directionX, y - startY - alongShare * directionY);
}

export function boxSignedDistance(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number,
): number {
  const overflowX = Math.abs(x - centerX) - halfWidth;
  const overflowY = Math.abs(y - centerY) - halfHeight;
  return Math.hypot(Math.max(overflowX, 0), Math.max(overflowY, 0)) + Math.min(Math.max(overflowX, overflowY), 0);
}

export function hashUnit(seedA: number, seedB: number): number {
  let mixed = Math.imul(seedA, HASH_MULTIPLIER_A) ^ Math.imul(seedB, HASH_MULTIPLIER_B);
  mixed = Math.imul(mixed ^ (mixed >>> 13), HASH_MULTIPLIER_C);
  return ((mixed ^ (mixed >>> 16)) >>> 0) / HASH_RANGE;
}
