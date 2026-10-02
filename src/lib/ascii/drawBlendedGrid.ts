import { GLYPH_RAMP, clearFrame, levelForLuminance } from "./glyphStyle";
import type { GlyphFrame, LuminanceGrid } from "./types";

const POINTER_HEAT_RADIUS_CELLS = 10;
const POINTER_HEAT_STRENGTH = 0.8;
const FLICKER_RATE_PER_SECOND = 8;
const FLICKER_MIN_LUMINANCE = 0.15;
const FLICKER_LUMINANCE_SPREAD = 0.35;

export type BlendedGridOptions = {
  fromGrid: LuminanceGrid | null;
  toGrid: LuminanceGrid;
  cellThresholds: Float32Array;
  revealProgress: number;
  noiseDensity: number;
};

function flickerLuminance(
  cellIndex: number,
  timeSeconds: number,
  noiseDensity: number,
): number {
  const timeStep = Math.floor(timeSeconds * FLICKER_RATE_PER_SECOND);
  const hash = Math.sin(cellIndex * 12.9898 + timeStep * 78.233) * 43758.5453;
  const randomValue = hash - Math.floor(hash);
  if (randomValue >= noiseDensity) return 0;
  return FLICKER_MIN_LUMINANCE + (randomValue / noiseDensity) * FLICKER_LUMINANCE_SPREAD;
}

export function drawBlendedGrid(
  frame: GlyphFrame,
  options: BlendedGridOptions,
): void {
  const { context, metrics, timeSeconds, pointer, prefersReducedMotion } = frame;
  const { fromGrid, toGrid, cellThresholds, revealProgress, noiseDensity } = options;
  const { columns, rows, cellWidth, cellHeight, cellAspect, palette } = metrics;
  const flickerTimeSeconds = prefersReducedMotion ? 0 : timeSeconds;
  const pointerColumn = pointer ? pointer.x / cellWidth : 0;
  const pointerRow = pointer ? pointer.y / cellHeight : 0;
  let activeColor = "";

  clearFrame(frame);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cellIndex = row * columns + column;
      let luminance: number;

      if (revealProgress > cellThresholds[cellIndex]) {
        luminance = toGrid[cellIndex];
      } else if (fromGrid) {
        luminance = fromGrid[cellIndex];
      } else {
        luminance = flickerLuminance(cellIndex, flickerTimeSeconds, noiseDensity);
      }

      if (pointer) {
        const distanceCells = Math.hypot(
          column - pointerColumn,
          (row - pointerRow) * cellAspect,
        );
        const heat = Math.max(0, 1 - distanceCells / POINTER_HEAT_RADIUS_CELLS);
        luminance += heat * POINTER_HEAT_STRENGTH;
      }

      const level = levelForLuminance(luminance);
      if (level === 0) continue;

      const color = palette.levelColors[level];
      if (color !== activeColor) {
        context.fillStyle = color;
        activeColor = color;
      }
      context.fillText(GLYPH_RAMP[level], column * cellWidth, row * cellHeight);
    }
  }
}
