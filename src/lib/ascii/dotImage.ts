import { clamp } from "./easing";
import { createImageSampler, type LuminanceImage } from "./imageSampler";
import type { GlyphMetrics } from "./types";

export type ImageTone = { blackLevel: number; whiteRange: number; gamma: number };
export type DotTone = ImageTone & { isInverted: boolean };
export type DotMasks = Uint8Array;

const DOT_COLUMNS_PER_CELL = 2;
const DOT_ROWS_PER_CELL = 4;
const DOT_SAMPLE_OFFSETS = [0.25, 0.75];
const DITHER_SIZE = 4;
const DITHER_LEVELS = DITHER_SIZE ** 2;
const DITHER_MATRIX = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const DOT_BIT_BY_POSITION = [
  [0, 3],
  [1, 4],
  [2, 5],
  [6, 7],
];

export function applyToneCurve(value: number, { blackLevel, whiteRange, gamma }: ImageTone): number {
  return clamp((value - blackLevel) / whiteRange, 0, 1) ** gamma;
}

export function createDotImagePainter(image: LuminanceImage, tone: DotTone, focusWidthShare = 0.5) {
  const sampleImage = createImageSampler(image);
  const imageAspect = image.columns / image.rows;

  return (metrics: GlyphMetrics): DotMasks => {
    const regionAspect = metrics.columns / (metrics.cellAspect * metrics.rows);
    const visibleWidthShare = Math.min(1, regionAspect / imageAspect);
    const visibleHeightShare = Math.min(1, imageAspect / regionAspect);
    const windowCenterShare = clamp(focusWidthShare, visibleWidthShare / 2, 1 - visibleWidthShare / 2);
    const dotColumns = metrics.columns * DOT_COLUMNS_PER_CELL;
    const dotRows = metrics.rows * DOT_ROWS_PER_CELL;
    const masks = new Uint8Array(metrics.columns * metrics.rows);

    for (let dotRow = 0; dotRow < dotRows; dotRow++) {
      for (let dotColumn = 0; dotColumn < dotColumns; dotColumn++) {
        let brightnessTotal = 0;
        for (const offsetY of DOT_SAMPLE_OFFSETS) {
          for (const offsetX of DOT_SAMPLE_OFFSETS) {
            brightnessTotal += sampleImage(
              windowCenterShare + ((dotColumn + offsetX) / dotColumns - 0.5) * visibleWidthShare,
              0.5 + ((dotRow + offsetY) / dotRows - 0.5) * visibleHeightShare,
            );
          }
        }
        const toneShare = applyToneCurve(brightnessTotal / DOT_SAMPLE_OFFSETS.length ** 2, tone);
        const density = tone.isInverted ? 1 - toneShare : toneShare;
        const threshold =
          (DITHER_MATRIX[dotRow % DITHER_SIZE][dotColumn % DITHER_SIZE] + 0.5) / DITHER_LEVELS;
        if (density > threshold) {
          const cellIndex =
            Math.floor(dotRow / DOT_ROWS_PER_CELL) * metrics.columns +
            Math.floor(dotColumn / DOT_COLUMNS_PER_CELL);
          masks[cellIndex] |=
            1 << DOT_BIT_BY_POSITION[dotRow % DOT_ROWS_PER_CELL][dotColumn % DOT_COLUMNS_PER_CELL];
        }
      }
    }
    return masks;
  };
}
