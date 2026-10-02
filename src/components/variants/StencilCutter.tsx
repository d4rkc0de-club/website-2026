"use client";

import { STENCIL_HINT, STENCIL_LINES } from "@/content/componentDemoContent";
import { createCellCursor, followPointer, stepCursor, type CellCursor } from "@/lib/ascii/cellCursor";
import { forEachCellInRegion, forEachCellOnLine, type CellPosition } from "@/lib/ascii/cellGeometry";
import { clamp } from "@/lib/ascii/easing";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { drawSceneGrid } from "@/lib/ascii/drawSceneGrid";
import { clearFrame } from "@/lib/ascii/glyphStyle";
import { arrowStepForKey, isSpaceKey } from "@/lib/ascii/keyboardInput";
import { createRingField, sampleText } from "@/lib/ascii/luminanceGrids";
import { createPressTracker, updatePressTracker, type PressTracker } from "@/lib/ascii/pressTracker";
import { createSceneGrid, drawFrame, regionMetrics, writeText, type SceneRegion } from "@/lib/ascii/sceneGrid";
import { readStageColors, type StageColors } from "@/lib/ascii/stageColors";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphStage } from "./GlyphStage";

const MARGIN_COLUMNS = 2;
const TOP_MARGIN_ROWS = 2;
const BOTTOM_RESERVED_ROWS = 3;
const NIB_COLUMNS = 4;
const NIB_ROWS = 2;
const KEY_STEP_COLUMNS = 2;
const LOWER_BASE_LUMINANCE = 0.2;
const LOWER_TEXT_LEVEL_MINIMUM = 5;
const TOP_RAMP = ["░", "▒", "▓", "█"] as const;
const LOWER_RAMP = [" ", ".", ":", "-", "=", "+", "*", "#"] as const;

type StencilScene = {
  region: SceneRegion;
  topLuminance: Float32Array;
  lowerLuminance: Float32Array;
  cutMask: Uint8Array;
  cutCount: number;
  cursor: CellCursor;
  previousCell: CellPosition;
  pressTracker: PressTracker;
  colors: StageColors;
};

function createScene(metrics: GlyphMetrics): StencilScene {
  const region: SceneRegion = {
    column: MARGIN_COLUMNS,
    row: TOP_MARGIN_ROWS,
    columns: Math.max(1, metrics.columns - 2 * MARGIN_COLUMNS),
    rows: Math.max(1, metrics.rows - TOP_MARGIN_ROWS - BOTTOM_RESERVED_ROWS),
  };
  const stencilMetrics = regionMetrics(metrics, region);
  const cursor = createCellCursor(
    region.column + Math.floor(region.columns / 2),
    region.row + Math.floor(region.rows / 2),
  );

  return {
    region,
    topLuminance: createRingField(stencilMetrics),
    lowerLuminance: sampleText(stencilMetrics, STENCIL_LINES).map(
      (textLuminance) => LOWER_BASE_LUMINANCE + (1 - LOWER_BASE_LUMINANCE) * textLuminance,
    ),
    cutMask: new Uint8Array(region.columns * region.rows),
    cutCount: 0,
    cursor,
    previousCell: { column: cursor.column, row: cursor.row },
    pressTracker: createPressTracker(),
    colors: readStageColors(),
  };
}

function rampLevel(luminance: number, rampLength: number): number {
  return clamp(Math.floor(luminance * rampLength), 0, rampLength - 1);
}

function nibAreaAt(column: number, row: number): SceneRegion {
  return {
    column: column - NIB_COLUMNS / 2,
    row: row - NIB_ROWS / 2,
    columns: NIB_COLUMNS,
    rows: NIB_ROWS,
  };
}

function cutCell(scene: StencilScene, column: number, row: number): void {
  const { region } = scene;
  const cellIndex = (row - region.row) * region.columns + (column - region.column);
  if (scene.cutMask[cellIndex] === 1) return;
  scene.cutMask[cellIndex] = 1;
  scene.cutCount += 1;
}

function cutNib(scene: StencilScene, column: number, row: number): void {
  forEachCellInRegion(nibAreaAt(column, row), scene.region, (cellColumn, cellRow) =>
    cutCell(scene, cellColumn, cellRow),
  );
}

function cutLine(scene: StencilScene, startCell: CellPosition, endCell: CellPosition): void {
  forEachCellOnLine(startCell, endCell, (column, row) => cutNib(scene, column, row));
}

function updateInteraction(scene: StencilScene, frame: GlyphFrame): void {
  const { cursor } = scene;
  const hasPointerMoved = followPointer(cursor, frame, scene.region);
  const phase = updatePressTracker(scene.pressTracker, frame);

  if (phase === "started") cutNib(scene, cursor.column, cursor.row);
  if (phase === "held" && hasPointerMoved) cutLine(scene, scene.previousCell, cursor);
  scene.previousCell = { column: cursor.column, row: cursor.row };
}

function drawScene(scene: StencilScene, frame: GlyphFrame): void {
  const { context, metrics } = frame;
  const { region, cursor, colors } = scene;
  updateInteraction(scene, frame);

  clearFrame(frame);
  const topColors = [colors.dim, colors.mid, colors.mid, colors.bright];

  for (let localRow = 0; localRow < region.rows; localRow++) {
    for (let localColumn = 0; localColumn < region.columns; localColumn++) {
      const cellIndex = localRow * region.columns + localColumn;
      const isCut = scene.cutMask[cellIndex] === 1;
      const level = rampLevel(
        isCut ? scene.lowerLuminance[cellIndex] : scene.topLuminance[cellIndex],
        isCut ? LOWER_RAMP.length : TOP_RAMP.length,
      );
      drawGlyphCell(
        context,
        metrics,
        isCut ? LOWER_RAMP[level] : TOP_RAMP[level],
        region.column + localColumn,
        region.row + localRow,
        isCut ? (level >= LOWER_TEXT_LEVEL_MINIMUM ? colors.bright : colors.dim) : topColors[level],
      );
    }
  }

  const overlayGrid = createSceneGrid(metrics);
  const cutPercentText = String(Math.floor((scene.cutCount * 100) / scene.cutMask.length)).padStart(3, "0");
  const coordinateText = cursor.isActive
    ? `X${String(cursor.column - region.column).padStart(3, "0")} Y${String(cursor.row - region.row).padStart(3, "0")}  `
    : "";
  writeText(overlayGrid, metrics, `${coordinateText}CUT ${cutPercentText}%`, region.column, 0, colors.dim);
  if (cursor.isActive) {
    const nibArea = nibAreaAt(cursor.column, cursor.row);
    drawFrame(
      overlayGrid,
      metrics,
      {
        column: nibArea.column - 1,
        row: nibArea.row - 1,
        columns: nibArea.columns + 2,
        rows: nibArea.rows + 2,
      },
      colors.accent,
    );
  }
  drawSceneGrid(frame, overlayGrid);
}

function handleKeyDown(scene: StencilScene, event: KeyboardEvent): void {
  const { cursor } = scene;
  const arrowStep = arrowStepForKey(event);
  if (arrowStep) {
    event.preventDefault();
    const startCell = { column: cursor.column, row: cursor.row };
    stepCursor(cursor, arrowStep.columns * KEY_STEP_COLUMNS, arrowStep.rows, scene.region);
    if (event.shiftKey) cutLine(scene, startCell, cursor);
    return;
  }
  if (isSpaceKey(event)) {
    event.preventDefault();
    cursor.isActive = true;
    cutNib(scene, cursor.column, cursor.row);
    return;
  }
  if (event.key.toLowerCase() === "r") {
    scene.cutMask.fill(0);
    scene.cutCount = 0;
  }
}

export function StencilCutter() {
  return (
    <GlyphStage
      hintText={STENCIL_HINT}
      createScene={createScene}
      drawScene={drawScene}
      onKeyDown={handleKeyDown}
    />
  );
}
