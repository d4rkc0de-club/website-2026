"use client";

import {
  WOVEN_HINT,
  WOVEN_HORIZONTAL_THREAD_TEXT,
  WOVEN_VERTICAL_THREAD_TEXT,
  WOVEN_WORD,
} from "@/content/componentDemoContent";
import { createCellCursor, followPointer, stepCursor, type CellCursor } from "@/lib/ascii/cellCursor";
import type { CellPosition } from "@/lib/ascii/cellGeometry";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { clearFrame } from "@/lib/ascii/glyphStyle";
import { arrowStepForKey, isSpaceKey } from "@/lib/ascii/keyboardInput";
import { createPressTracker, updatePressTracker, type PressTracker } from "@/lib/ascii/pressTracker";
import type { SceneRegion } from "@/lib/ascii/sceneGrid";
import { readStageColors, type StageColors } from "@/lib/ascii/stageColors";
import { sampleTextMask } from "@/lib/ascii/textMask";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphStage } from "./GlyphStage";

const MARGIN_COLUMN_SHARE = 0.08;
const MINIMUM_MARGIN_COLUMNS = 2;
const TOP_MARGIN_ROWS = 3;
const BOTTOM_RESERVED_ROWS = 5;
const BREATH_AMPLITUDE = 0.6;
const BREATH_SPEED = 0.25;
const BREATH_PHASE_STEP = 1.3;

type Strand = { isRow: boolean; index: number };

type WovenScene = {
  region: SceneRegion;
  overBits: Uint8Array;
  rowOffsets: number[];
  columnOffsets: number[];
  cursor: CellCursor;
  pressTracker: PressTracker;
  pullAnchor: CellPosition;
  pulledStrand: Strand | null;
  colors: StageColors;
};

function createScene(metrics: GlyphMetrics): WovenScene {
  const marginColumns = Math.max(
    MINIMUM_MARGIN_COLUMNS,
    Math.round(metrics.columns * MARGIN_COLUMN_SHARE),
  );
  const region: SceneRegion = {
    column: marginColumns,
    row: TOP_MARGIN_ROWS,
    columns: Math.max(1, metrics.columns - 2 * marginColumns),
    rows: Math.max(1, metrics.rows - TOP_MARGIN_ROWS - BOTTOM_RESERVED_ROWS),
  };
  const cursor = createCellCursor(
    region.column + Math.floor(region.columns / 2),
    region.row + Math.floor(region.rows / 2),
  );

  return {
    region,
    overBits: sampleTextMask(metrics, region, [WOVEN_WORD]),
    rowOffsets: new Array<number>(region.rows).fill(0),
    columnOffsets: new Array<number>(region.columns).fill(0),
    cursor,
    pressTracker: createPressTracker(),
    pullAnchor: { column: cursor.column, row: cursor.row },
    pulledStrand: null,
    colors: readStageColors(),
  };
}

function threadCharacter(threadText: string, position: number): string {
  const length = threadText.length;
  return threadText[((position % length) + length) % length];
}

function breathingShift(strandIndex: number, timeSeconds: number): number {
  return Math.round(BREATH_AMPLITUDE * Math.sin(timeSeconds * BREATH_SPEED + strandIndex * BREATH_PHASE_STEP));
}

function horizontalCharacter(scene: WovenScene, localColumn: number, localRow: number, shift: number): string {
  return threadCharacter(WOVEN_HORIZONTAL_THREAD_TEXT, localColumn + scene.rowOffsets[localRow] + shift);
}

function verticalCharacter(scene: WovenScene, localColumn: number, localRow: number, shift: number): string {
  return threadCharacter(WOVEN_VERTICAL_THREAD_TEXT, localRow + scene.columnOffsets[localColumn] + shift);
}

function strandAt(scene: WovenScene, column: number, row: number): Strand {
  const localColumn = column - scene.region.column;
  const localRow = row - scene.region.row;
  const isHorizontalOver = scene.overBits[localRow * scene.region.columns + localColumn] === 1;
  return isHorizontalOver
    ? { isRow: true, index: localRow }
    : { isRow: false, index: localColumn };
}

function pullStrand(scene: WovenScene, strand: Strand, deltaCells: number): void {
  if (strand.isRow) scene.rowOffsets[strand.index] -= deltaCells;
  else scene.columnOffsets[strand.index] -= deltaCells;
}

function reverseCrossing(scene: WovenScene, column: number, row: number): void {
  const { region } = scene;
  scene.overBits[(row - region.row) * region.columns + (column - region.column)] ^= 1;
}

function updateInteraction(scene: WovenScene, frame: GlyphFrame): void {
  const { cursor } = scene;
  const hasPointerMoved = followPointer(cursor, frame, scene.region);
  const phase = updatePressTracker(scene.pressTracker, frame);

  if (phase === "started") {
    scene.pulledStrand = strandAt(scene, cursor.column, cursor.row);
    scene.pullAnchor = { column: cursor.column, row: cursor.row };
  }
  if (phase === "held" && scene.pulledStrand && hasPointerMoved) {
    const deltaCells = scene.pulledStrand.isRow
      ? cursor.column - scene.pullAnchor.column
      : cursor.row - scene.pullAnchor.row;
    pullStrand(scene, scene.pulledStrand, deltaCells);
    scene.pullAnchor = { column: cursor.column, row: cursor.row };
  }
  if (phase === "tapped") reverseCrossing(scene, cursor.column, cursor.row);
  if (phase === "tapped" || phase === "dragEnded") scene.pulledStrand = null;
}

function drawScene(scene: WovenScene, frame: GlyphFrame): void {
  const { context, metrics } = frame;
  const { region, cursor, colors } = scene;
  updateInteraction(scene, frame);

  clearFrame(frame);
  const breathScale = frame.prefersReducedMotion ? 0 : 1;
  const rowShifts = scene.rowOffsets.map((_, rowIndex) => breathScale * breathingShift(rowIndex, frame.timeSeconds));
  const columnShifts = scene.columnOffsets.map(
    (_, columnIndex) => breathScale * breathingShift(columnIndex + region.rows, frame.timeSeconds),
  );

  for (let localRow = 0; localRow < region.rows; localRow++) {
    for (let localColumn = 0; localColumn < region.columns; localColumn++) {
      const isHorizontalOver = scene.overBits[localRow * region.columns + localColumn] === 1;
      drawGlyphCell(
        context,
        metrics,
        isHorizontalOver
          ? horizontalCharacter(scene, localColumn, localRow, rowShifts[localRow])
          : verticalCharacter(scene, localColumn, localRow, columnShifts[localColumn]),
        region.column + localColumn,
        region.row + localRow,
        isHorizontalOver ? colors.bright : colors.dim,
      );
    }
  }

  if (!cursor.isActive) return;
  const liftedStrand = strandAt(scene, cursor.column, cursor.row);
  const liftedLength = liftedStrand.isRow ? region.columns : region.rows;
  for (let position = 0; position < liftedLength; position++) {
    const localColumn = liftedStrand.isRow ? position : liftedStrand.index;
    const localRow = liftedStrand.isRow ? liftedStrand.index : position;
    drawGlyphCell(
      context,
      metrics,
      liftedStrand.isRow
        ? horizontalCharacter(scene, localColumn, localRow, rowShifts[localRow])
        : verticalCharacter(scene, localColumn, localRow, columnShifts[localColumn]),
      region.column + localColumn,
      region.row + localRow,
      colors.accent,
    );
  }
}

function handleKeyDown(scene: WovenScene, event: KeyboardEvent): void {
  const { cursor } = scene;
  const arrowStep = arrowStepForKey(event);
  if (arrowStep) {
    event.preventDefault();
    if (event.shiftKey) {
      const strand = strandAt(scene, cursor.column, cursor.row);
      pullStrand(scene, strand, strand.isRow ? arrowStep.columns : arrowStep.rows);
    } else {
      stepCursor(cursor, arrowStep.columns, arrowStep.rows, scene.region);
    }
    return;
  }
  if (isSpaceKey(event)) {
    event.preventDefault();
    cursor.isActive = true;
    reverseCrossing(scene, cursor.column, cursor.row);
  }
}

export function WovenSentence() {
  return (
    <GlyphStage
      hintText={WOVEN_HINT}
      createScene={createScene}
      drawScene={drawScene}
      onKeyDown={handleKeyDown}
    />
  );
}
