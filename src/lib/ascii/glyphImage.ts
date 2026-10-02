import { clamp } from "./easing";
import { createImageSampler, type LuminanceImage } from "./imageSampler";
import type { GlyphMetrics } from "./types";

export type ImageTone = { blackLevel: number; whiteRange: number; gamma: number };
export type GlyphTone = ImageTone & { isInverted: boolean };

const SAMPLES_PER_AXIS = 3;
const SAMPLE_SPAN_CELLS = 1;
const SAMPLE_OFFSETS = Array.from(
  { length: SAMPLES_PER_AXIS },
  (_, offsetIndex) =>
    ((offsetIndex + 0.5) / SAMPLES_PER_AXIS) * SAMPLE_SPAN_CELLS - (SAMPLE_SPAN_CELLS - 1) / 2,
);
const EDGE_BOOST = 1;
const NEIGHBOR_OFFSETS = [-1, 0, 1];

export function applyToneCurve(value: number, { blackLevel, whiteRange, gamma }: ImageTone): number {
  return clamp((value - blackLevel) / whiteRange, 0, 1) ** gamma;
}

function sampleInkGrid(
  image: LuminanceImage,
  tone: GlyphTone,
  focusWidthShare: number,
  { columns, rows, cellAspect }: GlyphMetrics,
): Float32Array {
  const sampleImage = createImageSampler(image);
  const regionAspect = columns / (cellAspect * rows);
  const imageAspect = image.columns / image.rows;
  const visibleWidthShare = Math.min(1, regionAspect / imageAspect);
  const visibleHeightShare = Math.min(1, imageAspect / regionAspect);
  const windowCenterShare = clamp(focusWidthShare, visibleWidthShare / 2, 1 - visibleWidthShare / 2);
  const inkGrid = new Float32Array(columns * rows);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      let brightnessTotal = 0;
      for (const offsetY of SAMPLE_OFFSETS) {
        for (const offsetX of SAMPLE_OFFSETS) {
          brightnessTotal += sampleImage(
            windowCenterShare + ((column + offsetX) / columns - 0.5) * visibleWidthShare,
            0.5 + ((row + offsetY) / rows - 0.5) * visibleHeightShare,
          );
        }
      }
      const toneShare = applyToneCurve(brightnessTotal / SAMPLE_OFFSETS.length ** 2, tone);
      inkGrid[row * columns + column] = tone.isInverted ? 1 - toneShare : toneShare;
    }
  }
  return inkGrid;
}

function sharpenEdges(inkGrid: Float32Array, { columns, rows }: GlyphMetrics): Float32Array {
  return inkGrid.map((ink, cellIndex) => {
    const column = cellIndex % columns;
    const row = Math.floor(cellIndex / columns);
    let neighborTotal = 0;
    for (const offsetRow of NEIGHBOR_OFFSETS) {
      for (const offsetColumn of NEIGHBOR_OFFSETS) {
        neighborTotal +=
          inkGrid[clamp(row + offsetRow, 0, rows - 1) * columns + clamp(column + offsetColumn, 0, columns - 1)];
      }
    }
    const neighborMean = neighborTotal / NEIGHBOR_OFFSETS.length ** 2;
    return clamp(ink + EDGE_BOOST * (ink - neighborMean), 0, 1);
  });
}

export function createGlyphImagePainter(
  image: LuminanceImage,
  tone: GlyphTone,
  ramp: readonly string[],
  focusWidthShare = 0.5,
) {
  return (metrics: GlyphMetrics): string[] => {
    const inkGrid = sharpenEdges(sampleInkGrid(image, tone, focusWidthShare, metrics), metrics);
    return Array.from(inkGrid, (ink) => ramp[Math.min(ramp.length - 1, Math.floor(ink * ramp.length))]);
  };
}
