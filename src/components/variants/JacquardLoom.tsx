"use client";

import { LOOM_HINT, LOOM_PROGRESS_LABEL, LOOM_WORD } from "@/content/componentDemoContent";
import { forEachCellInRegion, forEachCellOnLine, isCellInRegion, type CellPosition } from "@/lib/ascii/cellGeometry";
import { createCellCursor, followPointer, stepCursor, type CellCursor } from "@/lib/ascii/cellCursor";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { drawSceneGrid } from "@/lib/ascii/drawSceneGrid";
import { clearFrame } from "@/lib/ascii/glyphStyle";
import { arrowStepForKey, isSpaceKey } from "@/lib/ascii/keyboardInput";
import { createPressTracker, updatePressTracker, type PressTracker } from "@/lib/ascii/pressTracker";
import { createSceneGrid, writeText, type SceneRegion } from "@/lib/ascii/sceneGrid";
import { readStageColors, type StageColors } from "@/lib/ascii/stageColors";
import { sampleTextMask } from "@/lib/ascii/textMask";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphStage } from "./GlyphStage";

const MARGIN_COLUMNS = 2;
const HUD_ROWS = 2;
const BOTTOM_RESERVED_ROWS = 3;
const SHUTTLE_HALF_WIDTH_COLUMNS = 2;
const SHUTTLE_HALF_HEIGHT_ROWS = 1;
const TWILL_PERIOD = 4;
const HORIZONTAL_OVER_GLYPH = "═";
const VERTICAL_OVER_GLYPH = "║";
const FILLED_BAR_GLYPH = "━";
const EMPTY_BAR_GLYPH = "─";
const LEFT_ROW_MARKER = ">";
const RIGHT_ROW_MARKER = "<";

type LoomScene = {
  region: SceneRegion;
  targetBits: Uint8Array;
  weaveBits: Uint8Array;
  wovenFlags: Uint8Array;
  wovenCount: number;
  cursor: CellCursor;
  previousCell: CellPosition;
  pressTracker: PressTracker;
  colors: StageColors;
};

function createScene(metrics: GlyphMetrics): LoomScene {
  const region: SceneRegion = {
    column: MARGIN_COLUMNS,
    row: HUD_ROWS,
    columns: Math.max(1, metrics.columns - 2 * MARGIN_COLUMNS),
    rows: Math.max(1, metrics.rows - HUD_ROWS - BOTTOM_RESERVED_ROWS),
  };
  const targetBits = sampleTextMask(metrics, region, [LOOM_WORD]);
  const weaveBits = Uint8Array.from(targetBits, (_, cellIndex) => {
    const column = cellIndex % region.columns;
    const row = Math.floor(cellIndex / region.columns);
    return (column + row) % TWILL_PERIOD < TWILL_PERIOD / 2 ? 1 : 0;
  });
  const cursor = createCellCursor(
    region.column + Math.floor(region.columns / 2),
    region.row + Math.floor(region.rows / 2),
  );

  return {
    region,
    targetBits,
    weaveBits,
    wovenFlags: new Uint8Array(targetBits.length),
    wovenCount: 0,
    cursor,
    previousCell: { column: cursor.column, row: cursor.row },
    pressTracker: createPressTracker(),
    colors: readStageColors(),
  };
}

function shuttleAreaAt(column: number, row: number): SceneRegion {
  return {
    column: column - SHUTTLE_HALF_WIDTH_COLUMNS,
    row: row - SHUTTLE_HALF_HEIGHT_ROWS,
    columns: 2 * SHUTTLE_HALF_WIDTH_COLUMNS + 1,
    rows: 2 * SHUTTLE_HALF_HEIGHT_ROWS + 1,
  };
}

function weaveCell(scene: LoomScene, column: number, row: number): void {
  const { region } = scene;
  const cellIndex = (row - region.row) * region.columns + (column - region.column);
  if (scene.wovenFlags[cellIndex]) return;
  scene.wovenFlags[cellIndex] = 1;
  scene.wovenCount += 1;
  scene.weaveBits[cellIndex] = scene.targetBits[cellIndex];
}

function weaveArea(scene: LoomScene, area: SceneRegion): void {
  forEachCellInRegion(area, scene.region, (column, row) => weaveCell(scene, column, row));
}

function weaveRow(scene: LoomScene, row: number): void {
  weaveArea(scene, { column: scene.region.column, row, columns: scene.region.columns, rows: 1 });
}

function updateInteraction(scene: LoomScene, frame: GlyphFrame): void {
  const { cursor } = scene;
  const hasPointerMoved = followPointer(cursor, frame, scene.region);
  const phase = updatePressTracker(scene.pressTracker, frame);

  if (phase === "started") weaveRow(scene, cursor.row);
  if (phase === "held" && hasPointerMoved) {
    forEachCellOnLine(scene.previousCell, cursor, (column, row) =>
      weaveArea(scene, shuttleAreaAt(column, row)),
    );
  }
  scene.previousCell = { column: cursor.column, row: cursor.row };
}

function drawScene(scene: LoomScene, frame: GlyphFrame): void {
  const { context, metrics } = frame;
  const { region, cursor, colors } = scene;
  updateInteraction(scene, frame);

  clearFrame(frame);
  const isComplete = scene.wovenCount === scene.targetBits.length;
  const shuttleArea = shuttleAreaAt(cursor.column, cursor.row);

  for (let localRow = 0; localRow < region.rows; localRow++) {
    for (let localColumn = 0; localColumn < region.columns; localColumn++) {
      const column = region.column + localColumn;
      const row = region.row + localRow;
      const isHorizontalOver = scene.weaveBits[localRow * region.columns + localColumn] === 1;
      const isShuttleCell = cursor.isActive && isCellInRegion(shuttleArea, column, row);
      const color = isShuttleCell
        ? colors.accent
        : isHorizontalOver
          ? isComplete
            ? colors.accent
            : colors.bright
          : colors.dim;
      drawGlyphCell(
        context,
        metrics,
        isHorizontalOver ? HORIZONTAL_OVER_GLYPH : VERTICAL_OVER_GLYPH,
        column,
        row,
        color,
      );
    }
  }

  const overlayGrid = createSceneGrid(metrics);
  const wovenShare = scene.wovenCount / scene.targetBits.length;
  const filledColumns = Math.round(wovenShare * region.columns);
  const percentText = String(Math.floor(wovenShare * 100)).padStart(3, "0");
  writeText(overlayGrid, metrics, `${LOOM_PROGRESS_LABEL} ${percentText}%`, region.column, 0, colors.dim);
  writeText(overlayGrid, metrics, FILLED_BAR_GLYPH.repeat(filledColumns), region.column, 1, colors.bright);
  writeText(
    overlayGrid,
    metrics,
    EMPTY_BAR_GLYPH.repeat(region.columns - filledColumns),
    region.column + filledColumns,
    1,
    colors.faint,
  );
  if (cursor.isActive) {
    writeText(overlayGrid, metrics, LEFT_ROW_MARKER, region.column - 1, cursor.row, colors.accent);
    writeText(overlayGrid, metrics, RIGHT_ROW_MARKER, region.column + region.columns, cursor.row, colors.accent);
  }
  drawSceneGrid(frame, overlayGrid);
}

function handleKeyDown(scene: LoomScene, event: KeyboardEvent): void {
  const arrowStep = arrowStepForKey(event);
  if (arrowStep) {
    event.preventDefault();
    stepCursor(scene.cursor, arrowStep.columns, arrowStep.rows, scene.region);
    return;
  }
  if (isSpaceKey(event)) {
    event.preventDefault();
    scene.cursor.isActive = true;
    weaveRow(scene, scene.cursor.row);
  }
}

export function JacquardLoom() {
  return (
    <GlyphStage
      hintText={LOOM_HINT}
      createScene={createScene}
      drawScene={drawScene}
      onKeyDown={handleKeyDown}
    />
  );
}
