"use client";

import { SHADOW_PUPPET_HINT, SHADOW_PUPPET_LINES } from "@/content/componentDemoContent";
import { createCellCursor, followPointer, stepCursor, type CellCursor } from "@/lib/ascii/cellCursor";
import { clampCellToRegion, type CellPosition } from "@/lib/ascii/cellGeometry";
import { clamp, lerp } from "@/lib/ascii/easing";
import { drawSceneGrid } from "@/lib/ascii/drawSceneGrid";
import { clearFrame } from "@/lib/ascii/glyphStyle";
import { arrowStepForKey, isSpaceKey } from "@/lib/ascii/keyboardInput";
import { createPressTracker, updatePressTracker, type PressTracker } from "@/lib/ascii/pressTracker";
import { createSceneGrid, writeText, type SceneGrid, type SceneRegion } from "@/lib/ascii/sceneGrid";
import { readStageColors, type StageColors } from "@/lib/ascii/stageColors";
import { sampleTextMask } from "@/lib/ascii/textMask";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphStage } from "./GlyphStage";

const SIDE_MARGIN_COLUMNS = 3;
const TOP_MARGIN_ROWS = 2;
const BOTTOM_RESERVED_ROWS = 3;
const SWEET_SPOT_COLUMN_SHARE = 0.16;
const SWEET_SPOT_ROW_SHARE = 0.12;
const INITIAL_LIGHT_OFFSET_COLUMNS = 8;
const INITIAL_LIGHT_OFFSET_ROWS = 3;
const SHARD_GRID_COLUMNS = 6;
const SHARD_GRID_ROWS = 3;
const SHARD_SEED_JITTER = 0.8;
const SHARD_MAGNIFICATIONS = [1.6, 2.4, 3.2] as const;
const DEFAULT_LIGHT_DISTANCE = 1.5;
const MINIMUM_LIGHT_DISTANCE = 0.8;
const MAXIMUM_LIGHT_DISTANCE = 3.2;
const LIGHT_KEY_STEP_COLUMNS = 2;
const RAY_SHARD_STEP = 4;
const RAY_DOT_SPACING_CELLS = 4;
const SHADOW_GLYPH = "#";
const SOURCE_GLYPH = "▓";
const RAY_GLYPH = ".";
const LIGHT_MARKER = "(o)";
const FROZEN_LIGHT_MARKER = "[o]";

type ShadowShard = {
  wordCells: CellPosition[];
  sourceCells: CellPosition[];
  parallaxGain: number;
  wordCentroid: CellPosition;
};

type ShadowScene = {
  shards: ShadowShard[];
  sweetSpot: CellPosition;
  light: CellCursor;
  lightBounds: SceneRegion;
  isFrozen: boolean;
  distanceFactor: number;
  pressTracker: PressTracker;
  colors: StageColors;
};

function pseudoRandom(seed: number): number {
  const rawValue = Math.sin(seed * 12.9898) * 43758.5453;
  return rawValue - Math.floor(rawValue);
}

function centroidOf(cells: CellPosition[]): CellPosition {
  const total = cells.reduce(
    (sum, cell) => ({ column: sum.column + cell.column, row: sum.row + cell.row }),
    { column: 0, row: 0 },
  );
  return { column: total.column / cells.length, row: total.row / cells.length };
}

function uniqueCells(cells: CellPosition[]): CellPosition[] {
  return [...new Map(cells.map((cell) => [`${cell.column},${cell.row}`, cell])).values()];
}

function buildShardSeeds(wordCells: CellPosition[]): CellPosition[] {
  const columns = wordCells.map((cell) => cell.column);
  const rows = wordCells.map((cell) => cell.row);
  const firstColumn = Math.min(...columns);
  const firstRow = Math.min(...rows);
  const widthColumns = Math.max(...columns) - firstColumn + 1;
  const heightRows = Math.max(...rows) - firstRow + 1;

  return Array.from({ length: SHARD_GRID_COLUMNS * SHARD_GRID_ROWS }, (_, seedIndex) => {
    const gridColumn = seedIndex % SHARD_GRID_COLUMNS;
    const gridRow = Math.floor(seedIndex / SHARD_GRID_COLUMNS);
    const columnJitter = (pseudoRandom(seedIndex * 2 + 1) - 0.5) * SHARD_SEED_JITTER;
    const rowJitter = (pseudoRandom(seedIndex * 2 + 2) - 0.5) * SHARD_SEED_JITTER;
    return {
      column: firstColumn + ((gridColumn + 0.5 + columnJitter) * widthColumns) / SHARD_GRID_COLUMNS,
      row: firstRow + ((gridRow + 0.5 + rowJitter) * heightRows) / SHARD_GRID_ROWS,
    };
  });
}

function buildShards(
  wordCells: CellPosition[],
  sweetSpot: CellPosition,
  cellAspect: number,
): ShadowShard[] {
  const seeds = buildShardSeeds(wordCells);
  const cellsPerSeed: CellPosition[][] = seeds.map(() => []);
  wordCells.forEach((cell) => {
    const distances = seeds.map((seed) =>
      Math.hypot(cell.column - seed.column, (cell.row - seed.row) * cellAspect),
    );
    cellsPerSeed[distances.indexOf(Math.min(...distances))].push(cell);
  });

  return cellsPerSeed
    .filter((cells) => cells.length > 0)
    .map((cells, shardIndex) => {
      const magnification = SHARD_MAGNIFICATIONS[shardIndex % SHARD_MAGNIFICATIONS.length];
      return {
        wordCells: cells,
        sourceCells: uniqueCells(
          cells.map((cell) => ({
            column: Math.round(sweetSpot.column + (cell.column - sweetSpot.column) / magnification),
            row: Math.round(sweetSpot.row + (cell.row - sweetSpot.row) / magnification),
          })),
        ),
        parallaxGain: magnification - 1,
        wordCentroid: centroidOf(cells),
      };
    });
}

function createScene(metrics: GlyphMetrics): ShadowScene {
  const region: SceneRegion = {
    column: SIDE_MARGIN_COLUMNS,
    row: TOP_MARGIN_ROWS,
    columns: Math.max(1, metrics.columns - 2 * SIDE_MARGIN_COLUMNS),
    rows: Math.max(1, metrics.rows - TOP_MARGIN_ROWS - BOTTOM_RESERVED_ROWS),
  };
  const mask = sampleTextMask(metrics, region, SHADOW_PUPPET_LINES);
  const wordCells: CellPosition[] = [];
  mask.forEach((bit, cellIndex) => {
    if (bit === 1) {
      wordCells.push({
        column: region.column + (cellIndex % region.columns),
        row: region.row + Math.floor(cellIndex / region.columns),
      });
    }
  });

  const sweetSpot: CellPosition = {
    column: region.column + Math.round(region.columns * SWEET_SPOT_COLUMN_SHARE),
    row: region.row + Math.round(region.rows * SWEET_SPOT_ROW_SHARE),
  };
  const lightBounds: SceneRegion = { column: 0, row: 0, columns: metrics.columns, rows: metrics.rows };
  const startCell = clampCellToRegion(
    lightBounds,
    sweetSpot.column + INITIAL_LIGHT_OFFSET_COLUMNS,
    sweetSpot.row + INITIAL_LIGHT_OFFSET_ROWS,
  );

  return {
    shards: wordCells.length > 0 ? buildShards(wordCells, sweetSpot, metrics.cellAspect) : [],
    sweetSpot,
    light: createCellCursor(startCell.column, startCell.row),
    lightBounds,
    isFrozen: false,
    distanceFactor: DEFAULT_LIGHT_DISTANCE,
    pressTracker: createPressTracker(),
    colors: readStageColors(),
  };
}

function updateInteraction(scene: ShadowScene, frame: GlyphFrame): void {
  const phase = updatePressTracker(scene.pressTracker, frame);
  const isAdjustingDistance = phase === "held" && scene.pressTracker.hasMoved;
  followPointer(scene.light, frame, scene.lightBounds, !scene.isFrozen && !isAdjustingDistance);

  if (isAdjustingDistance && frame.pointer) {
    scene.distanceFactor = lerp(
      MINIMUM_LIGHT_DISTANCE,
      MAXIMUM_LIGHT_DISTANCE,
      clamp(frame.pointer.y / frame.metrics.canvasHeight, 0, 1),
    );
  }
  if (phase === "tapped") scene.isFrozen = !scene.isFrozen;
}

function drawDottedLine(
  sceneGrid: SceneGrid,
  metrics: GlyphMetrics,
  startCell: CellPosition,
  endCell: CellPosition,
  color: string,
): void {
  const dotCount = Math.floor(
    Math.hypot(endCell.column - startCell.column, endCell.row - startCell.row) /
      RAY_DOT_SPACING_CELLS,
  );
  for (let dotIndex = 1; dotIndex <= dotCount; dotIndex++) {
    const share = dotIndex / dotCount;
    writeText(
      sceneGrid,
      metrics,
      RAY_GLYPH,
      Math.round(lerp(startCell.column, endCell.column, share)),
      Math.round(lerp(startCell.row, endCell.row, share)),
      color,
    );
  }
}

function drawScene(scene: ShadowScene, frame: GlyphFrame): void {
  const { metrics } = frame;
  const { light, sweetSpot, colors } = scene;
  updateInteraction(scene, frame);

  clearFrame(frame);
  const sceneGrid = createSceneGrid(metrics);
  const shadowShifts = scene.shards.map((shard) => {
    const shiftScale = shard.parallaxGain / scene.distanceFactor;
    return {
      column: Math.round(shiftScale * (sweetSpot.column - light.column)),
      row: Math.round(shiftScale * (sweetSpot.row - light.row)),
    };
  });

  scene.shards.forEach((shard, shardIndex) => {
    if (shardIndex % RAY_SHARD_STEP !== 0) return;
    const shift = shadowShifts[shardIndex];
    drawDottedLine(
      sceneGrid,
      metrics,
      light,
      { column: shard.wordCentroid.column + shift.column, row: shard.wordCentroid.row + shift.row },
      colors.dim,
    );
  });

  scene.shards.forEach((shard, shardIndex) => {
    const shift = shadowShifts[shardIndex];
    shard.wordCells.forEach((cell) => {
      writeText(sceneGrid, metrics, SHADOW_GLYPH, cell.column + shift.column, cell.row + shift.row, colors.mid);
    });
  });

  scene.shards.forEach((shard) => {
    shard.sourceCells.forEach((cell) => {
      writeText(sceneGrid, metrics, SOURCE_GLYPH, cell.column, cell.row, colors.bright);
    });
  });

  writeText(
    sceneGrid,
    metrics,
    scene.isFrozen ? FROZEN_LIGHT_MARKER : LIGHT_MARKER,
    light.column - 1,
    light.row,
    colors.accent,
  );
  drawSceneGrid(frame, sceneGrid);
}

function handleKeyDown(scene: ShadowScene, event: KeyboardEvent): void {
  const arrowStep = arrowStepForKey(event);
  if (arrowStep) {
    event.preventDefault();
    if (!scene.isFrozen) {
      stepCursor(
        scene.light,
        arrowStep.columns * LIGHT_KEY_STEP_COLUMNS,
        arrowStep.rows,
        scene.lightBounds,
      );
    }
    return;
  }
  if (isSpaceKey(event)) {
    event.preventDefault();
    scene.isFrozen = !scene.isFrozen;
  }
}

export function ShadowPuppetType() {
  return (
    <GlyphStage
      hintText={SHADOW_PUPPET_HINT}
      createScene={createScene}
      drawScene={drawScene}
      onKeyDown={handleKeyDown}
    />
  );
}
