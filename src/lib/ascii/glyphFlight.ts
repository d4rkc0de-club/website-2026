import { GLYPH_RAMP, clearFrame, pointerHeatLuminance } from "./glyphStyle";
import { clamp, progressBetween, smoothStep } from "./easing";
import type { SceneGrid } from "./sceneGrid";
import type { GlyphFrame } from "./types";

const HOLD_SHARE = 0.2;
const FLIGHT_SHARE = 0.55;
const SCATTER_COLUMNS = 14;
const SCATTER_ROWS = 7;
const LIFT_ROWS = 6;
const SWAP_THRESHOLD_MINIMUM = 0.35;
const SWAP_THRESHOLD_MAXIMUM = 0.65;
const HOVER_AMPLITUDE_ROWS = 0.2;
const HOVER_RADIANS_PER_SECOND = 0.7;
const POINTER_RADIUS_CELLS = 8;
const POINTER_HIGHLIGHT_THRESHOLD = 0.3;

export type GlyphFlightState = {
  columns: number;
  particleCount: number;
  cellIndexPerSection: Int32Array[];
  characterPerSection: string[][];
  colorPerSection: string[][];
  scatterColumns: Float32Array;
  scatterRows: Float32Array;
  flightDelays: Float32Array;
  swapThresholds: Float32Array;
  hoverPhases: Float32Array;
};

function shuffledLitCells(scene: SceneGrid): number[] {
  const litCells: number[] = [];
  scene.forEach((cell, cellIndex) => {
    if (cell) litCells.push(cellIndex);
  });
  for (let position = litCells.length - 1; position > 0; position--) {
    const swapPosition = Math.floor(Math.random() * (position + 1));
    [litCells[position], litCells[swapPosition]] = [
      litCells[swapPosition],
      litCells[position],
    ];
  }
  return litCells;
}

function randomBetween(
  particleCount: number,
  minimum: number,
  maximum: number,
): Float32Array {
  return Float32Array.from(
    { length: particleCount },
    () => minimum + Math.random() * (maximum - minimum),
  );
}

export function createGlyphFlightState(
  columns: number,
  scenes: SceneGrid[],
): GlyphFlightState {
  const litCellLists = scenes.map(shuffledLitCells);
  const particleCount = Math.max(...litCellLists.map((litCells) => litCells.length));
  const cellIndexPerSection = litCellLists.map((litCells) =>
    Int32Array.from(
      { length: particleCount },
      (_, particleIndex) => litCells[particleIndex % litCells.length],
    ),
  );

  return {
    columns,
    particleCount,
    cellIndexPerSection,
    characterPerSection: scenes.map((scene, sectionIndex) =>
      Array.from(cellIndexPerSection[sectionIndex], (cellIndex) => scene[cellIndex]?.character ?? " "),
    ),
    colorPerSection: scenes.map((scene, sectionIndex) =>
      Array.from(cellIndexPerSection[sectionIndex], (cellIndex) => scene[cellIndex]?.color ?? ""),
    ),
    scatterColumns: randomBetween(particleCount, -SCATTER_COLUMNS, SCATTER_COLUMNS),
    scatterRows: randomBetween(particleCount, -SCATTER_ROWS, SCATTER_ROWS),
    flightDelays: randomBetween(particleCount, 0, 1 - FLIGHT_SHARE),
    swapThresholds: randomBetween(particleCount, SWAP_THRESHOLD_MINIMUM, SWAP_THRESHOLD_MAXIMUM),
    hoverPhases: randomBetween(particleCount, -Math.PI, Math.PI),
  };
}

export function drawGlyphFlight(
  state: GlyphFlightState,
  frame: GlyphFrame,
  sectionPosition: number,
  isPointerHighlightEnabled = true,
): void {
  const { context, metrics, timeSeconds, prefersReducedMotion } = frame;
  const { columns, particleCount, cellIndexPerSection } = state;
  const lastSectionIndex = cellIndexPerSection.length - 1;
  const clampedPosition = clamp(sectionPosition, 0, lastSectionIndex);
  const fromSectionIndex = Math.floor(clampedPosition);
  const toSectionIndex = Math.min(fromSectionIndex + 1, lastSectionIndex);
  const segmentProgress = progressBetween(
    clampedPosition - fromSectionIndex,
    HOLD_SHARE,
    1 - HOLD_SHARE,
  );
  const fromCells = cellIndexPerSection[fromSectionIndex];
  const toCells = cellIndexPerSection[toSectionIndex];
  const highlightColor = metrics.palette.levelColors[GLYPH_RAMP.length - 1];
  let activeColor = "";

  clearFrame(frame);

  for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
    const flightDelay = state.flightDelays[particleIndex];
    const flightProgress = prefersReducedMotion
      ? Math.round(segmentProgress)
      : smoothStep(progressBetween(segmentProgress, flightDelay, flightDelay + FLIGHT_SHARE));
    const arc = Math.sin(Math.PI * flightProgress);
    const fromCell = fromCells[particleIndex];
    const toCell = toCells[particleIndex];
    const fromColumn = fromCell % columns;
    const toColumn = toCell % columns;
    const fromRow = Math.floor(fromCell / columns);
    const toRow = Math.floor(toCell / columns);
    const hoverRows = prefersReducedMotion
      ? 0
      : Math.sin(timeSeconds * HOVER_RADIANS_PER_SECOND + state.hoverPhases[particleIndex]) *
        HOVER_AMPLITUDE_ROWS;

    const column =
      fromColumn + (toColumn - fromColumn) * flightProgress + state.scatterColumns[particleIndex] * arc;
    const row =
      fromRow +
      (toRow - fromRow) * flightProgress +
      state.scatterRows[particleIndex] * arc -
      LIFT_ROWS * arc +
      hoverRows;

    const displaySectionIndex =
      flightProgress >= state.swapThresholds[particleIndex] ? toSectionIndex : fromSectionIndex;
    const isNearPointer =
      isPointerHighlightEnabled &&
      pointerHeatLuminance(frame, column, row, POINTER_RADIUS_CELLS) > POINTER_HIGHLIGHT_THRESHOLD;
    const color = isNearPointer
      ? highlightColor
      : state.colorPerSection[displaySectionIndex][particleIndex];

    if (color !== activeColor) {
      context.fillStyle = color;
      activeColor = color;
    }
    context.fillText(
      state.characterPerSection[displaySectionIndex][particleIndex],
      column * metrics.cellWidth,
      row * metrics.cellHeight,
    );
  }
}
