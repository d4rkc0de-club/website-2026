import type { GlyphMetrics, LuminanceGrid } from "./types";

const SUPERSAMPLE_FACTOR = 3;
const NARROW_LAYOUT_MAX_COLUMNS = 90;
const REFERENCE_FONT_SIZE = 100;
const LINE_HEIGHT_RATIO = 0.9;
const WIDTH_FILL_RATIO = 0.86;
const HEIGHT_FILL_RATIO = 0.6;
const WORDMARK_FONT_FAMILY =
  '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const RING_WAVE_FREQUENCY = 0.55;
const RING_FADE_RADIUS_RATIO = 0.42;
const RANDOM_SEED = 0x9e3779b9;
const RANDOM_RANGE = 4294967296;

function wordmarkLinesFor(columns: number): string[] {
  return columns <= NARROW_LAYOUT_MAX_COLUMNS ? ["d4rk", "c0de"] : ["d4rkc0de"];
}

export function sampleText(
  metrics: GlyphMetrics,
  lines: string[],
): LuminanceGrid {
  const { columns, rows, cellAspect } = metrics;
  const pixelWidth = columns * SUPERSAMPLE_FACTOR;
  const pixelHeight = rows * SUPERSAMPLE_FACTOR;
  const virtualHeight = pixelHeight * cellAspect;
  const luminanceGrid = new Float32Array(columns * rows);

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = pixelWidth;
  offscreenCanvas.height = pixelHeight;
  const context = offscreenCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return luminanceGrid;

  context.scale(1, 1 / cellAspect);
  context.fillStyle = "#000000";
  context.fillRect(0, 0, pixelWidth, virtualHeight);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.font = `900 ${REFERENCE_FONT_SIZE}px ${WORDMARK_FONT_FAMILY}`;
  const widestLineWidth = Math.max(
    ...lines.map((line) => context.measureText(line).width),
  );
  const fontSizeFittingWidth =
    (pixelWidth * WIDTH_FILL_RATIO * REFERENCE_FONT_SIZE) / widestLineWidth;
  const fontSizeFittingHeight =
    (virtualHeight * HEIGHT_FILL_RATIO) / (lines.length * LINE_HEIGHT_RATIO);
  const fontSize = Math.min(fontSizeFittingWidth, fontSizeFittingHeight);

  context.font = `900 ${fontSize}px ${WORDMARK_FONT_FAMILY}`;
  lines.forEach((line, lineIndex) => {
    const lineOffset = lineIndex - (lines.length - 1) / 2;
    context.fillText(
      line,
      pixelWidth / 2,
      virtualHeight / 2 + lineOffset * fontSize * LINE_HEIGHT_RATIO,
    );
  });

  const { data: pixelData } = context.getImageData(0, 0, pixelWidth, pixelHeight);
  const samplesPerCell = SUPERSAMPLE_FACTOR * SUPERSAMPLE_FACTOR;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      let brightnessSum = 0;
      for (let sampleRow = 0; sampleRow < SUPERSAMPLE_FACTOR; sampleRow++) {
        for (let sampleColumn = 0; sampleColumn < SUPERSAMPLE_FACTOR; sampleColumn++) {
          const pixelX = column * SUPERSAMPLE_FACTOR + sampleColumn;
          const pixelY = row * SUPERSAMPLE_FACTOR + sampleRow;
          brightnessSum += pixelData[(pixelY * pixelWidth + pixelX) * 4];
        }
      }
      luminanceGrid[row * columns + column] = brightnessSum / (samplesPerCell * 255);
    }
  }

  return luminanceGrid;
}

export function sampleWordmark(metrics: GlyphMetrics): LuminanceGrid {
  return sampleText(metrics, wordmarkLinesFor(metrics.columns));
}

export function createRingField(metrics: GlyphMetrics): LuminanceGrid {
  const { columns, rows, cellAspect } = metrics;
  const luminanceGrid = new Float32Array(columns * rows);
  const centerColumn = columns / 2;
  const centerRow = rows / 2;
  const fadeRadius = columns * RING_FADE_RADIUS_RATIO;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const distance = Math.hypot(
        column - centerColumn,
        (row - centerRow) * cellAspect,
      );
      const ringWave = 0.5 + 0.5 * Math.sin(distance * RING_WAVE_FREQUENCY);
      const fadeOut = Math.max(0, 1 - distance / fadeRadius);
      luminanceGrid[row * columns + column] = ringWave * fadeOut;
    }
  }

  return luminanceGrid;
}

export function createCellThresholds(cellCount: number): Float32Array {
  const thresholds = new Float32Array(cellCount);
  let seed = RANDOM_SEED;

  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    seed = (seed + 0x6d2b79f5) | 0;
    let mixed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    thresholds[cellIndex] = ((mixed ^ (mixed >>> 14)) >>> 0) / RANDOM_RANGE;
  }

  return thresholds;
}
