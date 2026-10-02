import { HERO_SLOGAN_LEAD, HERO_SLOGAN_TAIL, type HeroDomain } from "@/content/heroContent";
import { clamp, easeOutBack, easeOutCubic } from "./easing";
import { hashUnit } from "./fieldArt";
import {
  clearFrame,
  GLYPH_FONT_FAMILY,
  GLYPH_RAMP,
  levelForLuminance,
} from "./glyphStyle";
import {
  createShatterLayout,
  isInsideSlab,
  slabCenterCell,
  type CellPosition,
  type Shard,
  type ShatterLayout,
} from "./shatterLayout";
import type { GlyphFrame, GlyphMetrics, PointerPosition } from "./types";

const MAX_DELTA_SECONDS = 0.1;
const CRACK_SECONDS = 0.5;
const CRACK_HOLD_SECONDS = 0.15;
const SEPARATE_SECONDS = 0.9;
const FUSE_SECONDS = 0.52;
const PULSE_SECONDS = 0.4;
const PULSE_SCALE_GAIN = 0.3;
const HOLD_THRESHOLD_SECONDS = 0.5;
const PULL_SCALE_GAIN = 0.12;
const LIFT_ROWS = 1.5;
const LIFT_RATE_PER_SECOND = 20;
const PULL_RATE_PER_SECOND = 8;
const DRIFT_CELLS = 0.4;
const HOVER_CRACK_INTERVAL_SECONDS = 0.12;
const HOVER_CRACK_LIFE_SECONDS = 0.7;
const CRACK_MINIMUM_LENGTH = 6;
const CRACK_LENGTH_RANGE = 5;
const CRACK_LENGTH_SALT = 99;
const LEGALLY_DELAY_SECONDS = 2;
const LEGALLY_FADE_SECONDS = 0.6;
const LEGALLY_FONT_SIZE_PIXELS = 10;
const LEGALLY_RESTING_ALPHA = 0.7;
const LABEL_FONT_SIZE_PIXELS = 11;
const LABEL_DISTANCE_ROWS = 1.5;
const LIFTED_SHARE_THRESHOLD = 0.5;
const VISIBLE_LABEL_SHARE = 0.02;
const SHAPE_REVEAL_SPEED = 2;
const SLOGAN_BROKEN_REVEAL_SPEED = 2;
const SLOGAN_ENGRAVE_FADE_SPEED = 4;
const BODY_CHARACTERS = ["░", "▒"] as const;
const RIM_CHARACTER = "█";
const GRAIN_SHARD_STRIDE = 1000;
const STONE_COLOR = "#3d3d3d";
const LIFTED_STONE_COLOR = "#5c5c5c";
const OUTER_RIM_COLOR = "#8a8a8a";
const ENGRAVE_INSET_COLOR = "#0d0d0d";
const ENGRAVE_LIP_COLOR = "#7a7a7a";
const PAPER_LEVEL = 5;
const LIGHT_LEVEL = 3;
const WHITE_LEVEL = 7;

type ShardTheme = { rim: string; shape: string };

const SHARD_THEMES: Record<HeroDomain, ShardTheme> = {
  WEB: { rim: "#1f8f9e", shape: "#7eeaf7" },
  PWN: { rim: "#b53a22", shape: "#ff9a84" },
  REV: { rim: "#6a45c2", shape: "#c6acff" },
  CRYPTO: { rim: "#a97a12", shape: "#ffd873" },
  FORENSICS: { rim: "#5d9430", shape: "#c4f08f" },
  OSINT: { rim: "#b03a72", shape: "#ffabd0" },
};

const CRACK_STEPS = [
  { character: "/", columnStep: -1, rowStep: 1 },
  { character: "|", columnStep: 0, rowStep: 1 },
  { character: "\\", columnStep: 1, rowStep: 1 },
  { character: "_", columnStep: 1, rowStep: 0 },
] as const;

export type ShatterPhase = "intact" | "cracking" | "separating" | "broken" | "fusing";

export type ShatterInput = {
  fractureRequest: { origin: PointerPosition | null } | null;
  isFuseRequested: boolean;
  focusStep: number;
  isPointerHeld: boolean;
  isSpaceHeld: boolean;
  pressPosition: PointerPosition | null;
};

type CrackCell = CellPosition & { character: string };

type HoverCrack = {
  cells: CrackCell[];
  ageSeconds: number;
};

type ShardOffset = {
  columns: number;
  rows: number;
};

export type ShatterState = {
  layout: ShatterLayout;
  phase: ShatterPhase;
  phaseSeconds: number;
  fuseStartSpread: number;
  spread: number;
  crackOrigin: CellPosition;
  hoverCracks: HoverCrack[];
  secondsSinceCrackSpawn: number;
  crackSpawnCount: number;
  previousPointer: PointerPosition | null;
  liftShares: number[];
  pullShares: number[];
  focusedShardIndex: number | null;
  holdSeconds: number;
  legallyPulseSeconds: number | null;
  shardOffsets: ShardOffset[];
  isReducedMotion: boolean;
};

type TextLine = {
  text: string;
  x: number;
  y: number;
  fontSizePixels: number;
  fontWeight: number;
  color: string;
  alpha: number;
  align: CanvasTextAlign;
};

type ShardStyle = {
  rimMask: Uint8Array;
  rimColor: string;
  bodyColor: string;
  shapeColor: string;
  shapeReveal: number;
};

type ShardGlyph = {
  character: string;
  color: string;
};

export function createShatterInput(): ShatterInput {
  return {
    fractureRequest: null,
    isFuseRequested: false,
    focusStep: 0,
    isPointerHeld: false,
    isSpaceHeld: false,
    pressPosition: null,
  };
}

export function createShatterState(metrics: GlyphMetrics): ShatterState {
  const layout = createShatterLayout(metrics);
  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shardCount = layout.shards.length;

  return {
    layout,
    phase: isReducedMotion ? "broken" : "intact",
    phaseSeconds: 0,
    fuseStartSpread: 1,
    spread: isReducedMotion ? 1 : 0,
    crackOrigin: slabCenterCell(layout),
    hoverCracks: [],
    secondsSinceCrackSpawn: 0,
    crackSpawnCount: 0,
    previousPointer: null,
    liftShares: new Array<number>(shardCount).fill(0),
    pullShares: new Array<number>(shardCount).fill(0),
    focusedShardIndex: null,
    holdSeconds: 0,
    legallyPulseSeconds: null,
    shardOffsets: layout.shards.map(() => ({ columns: 0, rows: 0 })),
    isReducedMotion,
  };
}

export function rebuildShatterLayout(
  previousState: ShatterState,
  metrics: GlyphMetrics,
): ShatterState {
  const layout = createShatterLayout(metrics);
  return {
    ...previousState,
    layout,
    crackOrigin: slabCenterCell(layout),
    hoverCracks: [],
  };
}

function toCell(pixels: PointerPosition, metrics: GlyphMetrics): CellPosition {
  return {
    column: Math.floor(pixels.x / metrics.cellWidth),
    row: Math.floor(pixels.y / metrics.cellHeight),
  };
}

function startPhase(state: ShatterState, phase: ShatterPhase): void {
  state.phase = phase;
  state.phaseSeconds = 0;
}

function finishFuse(state: ShatterState): void {
  startPhase(state, "intact");
  state.focusedShardIndex = null;
  state.legallyPulseSeconds = state.isReducedMotion ? null : 0;
}

function applyInput(state: ShatterState, input: ShatterInput, metrics: GlyphMetrics): void {
  const { fractureRequest, isFuseRequested, focusStep } = input;
  input.fractureRequest = null;
  input.isFuseRequested = false;
  input.focusStep = 0;

  if (fractureRequest && state.phase === "intact") {
    state.crackOrigin = fractureRequest.origin
      ? toCell(fractureRequest.origin, metrics)
      : slabCenterCell(state.layout);
    state.hoverCracks = [];
    startPhase(state, state.isReducedMotion ? "broken" : "cracking");
  }

  if (isFuseRequested && state.phase !== "intact" && state.phase !== "fusing") {
    state.fuseStartSpread = state.spread;
    if (state.isReducedMotion) {
      finishFuse(state);
    } else {
      startPhase(state, "fusing");
    }
  }

  if (focusStep !== 0 && state.phase === "broken") {
    const shardCount = state.layout.shards.length;
    const startIndex = state.focusedShardIndex ?? (focusStep > 0 ? -1 : 0);
    state.focusedShardIndex = (startIndex + focusStep + shardCount) % shardCount;
  }
}

function advancePhase(state: ShatterState, deltaSeconds: number): void {
  state.phaseSeconds += deltaSeconds;
  if (state.phase === "cracking" && state.phaseSeconds >= CRACK_SECONDS + CRACK_HOLD_SECONDS) {
    startPhase(state, "separating");
  } else if (state.phase === "separating" && state.phaseSeconds >= SEPARATE_SECONDS) {
    startPhase(state, "broken");
  } else if (state.phase === "fusing" && state.phaseSeconds >= FUSE_SECONDS) {
    finishFuse(state);
  }
}

function computeSpread(state: ShatterState): number {
  switch (state.phase) {
    case "intact":
    case "cracking":
      return 0;
    case "separating":
      return easeOutCubic(clamp(state.phaseSeconds / SEPARATE_SECONDS, 0, 1));
    case "broken":
      return 1;
    case "fusing":
      return (
        state.fuseStartSpread * (1 - easeOutBack(clamp(state.phaseSeconds / FUSE_SECONDS, 0, 1)))
      );
  }
}

function advanceLegallyPulse(state: ShatterState, deltaSeconds: number): void {
  if (state.legallyPulseSeconds === null) return;
  const nextPulseSeconds = state.legallyPulseSeconds + deltaSeconds;
  state.legallyPulseSeconds = nextPulseSeconds >= PULSE_SECONDS ? null : nextPulseSeconds;
}

function createCrackPath(start: CellPosition, seed: number): CrackCell[] {
  const length =
    CRACK_MINIMUM_LENGTH + Math.floor(hashUnit(seed, CRACK_LENGTH_SALT) * CRACK_LENGTH_RANGE);
  let column = start.column;
  let row = start.row;
  return Array.from({ length }, (_, stepIndex) => {
    const step = CRACK_STEPS[Math.floor(hashUnit(seed, stepIndex) * CRACK_STEPS.length)];
    column += step.columnStep;
    row += step.rowStep;
    return { column, row, character: step.character };
  });
}

function updateHoverCracks(state: ShatterState, frame: GlyphFrame, deltaSeconds: number): void {
  const { pointer, metrics } = frame;
  const previousPointer = state.previousPointer;
  state.previousPointer = pointer;

  if (state.phase !== "intact" || state.isReducedMotion) {
    state.hoverCracks = [];
    return;
  }

  state.hoverCracks = state.hoverCracks
    .map((crack) => ({ ...crack, ageSeconds: crack.ageSeconds + deltaSeconds }))
    .filter((crack) => crack.ageSeconds < HOVER_CRACK_LIFE_SECONDS);
  state.secondsSinceCrackSpawn += deltaSeconds;

  if (!pointer || !previousPointer) return;
  const didPointerMove = pointer.x !== previousPointer.x || pointer.y !== previousPointer.y;
  if (!didPointerMove || state.secondsSinceCrackSpawn < HOVER_CRACK_INTERVAL_SECONDS) return;

  const cell = toCell(pointer, metrics);
  if (!isInsideSlab(state.layout, cell)) return;

  state.secondsSinceCrackSpawn = 0;
  state.crackSpawnCount += 1;
  state.hoverCracks.push({
    cells: createCrackPath(cell, state.crackSpawnCount),
    ageSeconds: 0,
  });
}

function findShardAtPixels(
  state: ShatterState,
  pixels: PointerPosition | null,
  metrics: GlyphMetrics,
): number | null {
  if (!pixels) return null;
  const cell = toCell(pixels, metrics);
  for (let shardIndex = state.layout.shards.length - 1; shardIndex >= 0; shardIndex--) {
    const shard = state.layout.shards[shardIndex];
    const offset = state.shardOffsets[shardIndex];
    const localColumn = cell.column - shard.originColumn - Math.round(offset.columns);
    const localRow = cell.row - shard.originRow - Math.round(offset.rows);
    const isInsideBox =
      localColumn >= 0 && localRow >= 0 && localColumn < shard.boxColumns && localRow < shard.boxRows;
    if (isInsideBox && shard.isInside[localRow * shard.boxColumns + localColumn]) {
      return shardIndex;
    }
  }
  return null;
}

function approachTarget(
  currentValue: number,
  targetValue: number,
  ratePerSecond: number,
  deltaSeconds: number,
  isReducedMotion: boolean,
): number {
  if (isReducedMotion) return targetValue;
  return currentValue + (targetValue - currentValue) * (1 - Math.exp(-ratePerSecond * deltaSeconds));
}

function updateShardShares(
  state: ShatterState,
  input: ShatterInput,
  frame: GlyphFrame,
  deltaSeconds: number,
): void {
  const isHolding = input.isPointerHeld || input.isSpaceHeld;
  state.holdSeconds = isHolding ? state.holdSeconds + deltaSeconds : 0;

  const activeShardIndex =
    state.phase === "broken"
      ? (findShardAtPixels(state, frame.pointer ?? input.pressPosition, frame.metrics) ??
        state.focusedShardIndex)
      : null;
  const isPulling = state.holdSeconds >= HOLD_THRESHOLD_SECONDS;

  state.liftShares = state.liftShares.map((share, shardIndex) =>
    approachTarget(
      share,
      shardIndex === activeShardIndex ? 1 : 0,
      LIFT_RATE_PER_SECOND,
      deltaSeconds,
      state.isReducedMotion,
    ),
  );
  state.pullShares = state.pullShares.map((share, shardIndex) =>
    approachTarget(
      share,
      shardIndex === activeShardIndex && isPulling ? 1 : 0,
      PULL_RATE_PER_SECOND,
      deltaSeconds,
      state.isReducedMotion,
    ),
  );
}

function computeShardOffsets(state: ShatterState, timeSeconds: number): ShardOffset[] {
  const driftCells = state.isReducedMotion ? 0 : clamp(state.spread, 0, 1) * DRIFT_CELLS;
  return state.layout.shards.map((shard, shardIndex) => {
    const driftRadians =
      (Math.PI * 2 * timeSeconds) / shard.driftPeriodSeconds + shard.driftPhaseRadians;
    return {
      columns: state.spread * shard.separationColumns + Math.sin(driftRadians) * driftCells,
      rows:
        state.spread * shard.separationRows +
        Math.cos(driftRadians) * driftCells -
        LIFT_ROWS * state.liftShares[shardIndex],
    };
  });
}

export function advanceShatter(state: ShatterState, input: ShatterInput, frame: GlyphFrame): void {
  const deltaSeconds = Math.min(frame.deltaSeconds, MAX_DELTA_SECONDS);
  applyInput(state, input, frame.metrics);
  advancePhase(state, deltaSeconds);
  state.spread = computeSpread(state);
  advanceLegallyPulse(state, deltaSeconds);
  updateHoverCracks(state, frame, deltaSeconds);
  updateShardShares(state, input, frame, deltaSeconds);
  state.shardOffsets = computeShardOffsets(state, frame.timeSeconds);
}

function drawTextLine(context: CanvasRenderingContext2D, line: TextLine): void {
  if (line.alpha <= 0) return;
  context.save();
  context.globalAlpha = clamp(line.alpha, 0, 1);
  context.font = `${line.fontWeight} ${line.fontSizePixels}px ${GLYPH_FONT_FAMILY}`;
  context.textAlign = line.align;
  context.textBaseline = "middle";
  context.fillStyle = line.color;
  context.fillText(line.text, line.x, line.y);
  context.restore();
}

function drawCrackGlyph(
  frame: GlyphFrame,
  cell: CrackCell,
  color: string,
  alpha: number,
): void {
  const { context, metrics } = frame;
  const x = cell.column * metrics.cellWidth;
  const y = cell.row * metrics.cellHeight;
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillText(cell.character, x, y);
  context.restore();
}

function createSloganLine(
  state: ShatterState,
  metrics: GlyphMetrics,
  color: string,
  alpha: number,
  offsetPixelsY: number,
): TextLine {
  const { layout } = state;
  return {
    text: HERO_SLOGAN_LEAD,
    x: (layout.slabColumn + layout.slabColumns / 2) * metrics.cellWidth,
    y: (layout.slabRow + layout.slabRows / 2) * metrics.cellHeight + offsetPixelsY,
    fontSizePixels: layout.sloganFontSizePixels,
    fontWeight: 700,
    color,
    alpha,
    align: "center",
  };
}

function drawBrokenSlogan(state: ShatterState, frame: GlyphFrame): void {
  const { context, metrics } = frame;
  const alpha = clamp(state.spread * SLOGAN_BROKEN_REVEAL_SPEED, 0, 1);
  drawTextLine(
    context,
    createSloganLine(state, metrics, metrics.palette.levelColors[PAPER_LEVEL], alpha, 0),
  );
}

function drawEngravedSlogan(state: ShatterState, frame: GlyphFrame): void {
  const { context, metrics } = frame;
  const alpha = 1 - clamp(state.spread * SLOGAN_ENGRAVE_FADE_SPEED, 0, 1);
  drawTextLine(context, createSloganLine(state, metrics, ENGRAVE_LIP_COLOR, alpha, 1));
  drawTextLine(context, createSloganLine(state, metrics, ENGRAVE_INSET_COLOR, alpha, 0));
}

function selectShardGlyph(
  shard: Shard,
  shardIndex: number,
  style: ShardStyle,
  cellIndex: number,
  sourceColumn: number,
  sourceRow: number,
): ShardGlyph {
  if (style.rimMask[cellIndex]) return { character: RIM_CHARACTER, color: style.rimColor };

  const shapeLevel = levelForLuminance(shard.shapeLuminance[cellIndex] * style.shapeReveal);
  if (shapeLevel > 0) return { character: GLYPH_RAMP[shapeLevel], color: style.shapeColor };

  const grain = hashUnit(sourceColumn + shardIndex * GRAIN_SHARD_STRIDE, sourceRow);
  return {
    character: BODY_CHARACTERS[Math.floor(grain * BODY_CHARACTERS.length)],
    color: style.bodyColor,
  };
}

function drawShard(state: ShatterState, frame: GlyphFrame, shardIndex: number): void {
  const { context, metrics } = frame;
  const shard = state.layout.shards[shardIndex];
  const offset = state.shardOffsets[shardIndex];
  const theme = SHARD_THEMES[shard.domain];
  const scale = 1 + PULL_SCALE_GAIN * state.pullShares[shardIndex];
  const isLifted = state.liftShares[shardIndex] > LIFTED_SHARE_THRESHOLD;
  const usesShardRim = state.phase !== "intact" && state.phase !== "cracking";
  const style: ShardStyle = {
    rimMask: usesShardRim ? shard.isShardRim : shard.isOuterRim,
    rimColor: isLifted ? theme.shape : usesShardRim ? theme.rim : OUTER_RIM_COLOR,
    bodyColor: isLifted ? LIFTED_STONE_COLOR : STONE_COLOR,
    shapeColor: theme.shape,
    shapeReveal: clamp(state.spread * SHAPE_REVEAL_SPEED, 0, 1),
  };
  const roundedColumns = Math.round(offset.columns);
  const roundedRows = Math.round(offset.rows);
  const residualX = (offset.columns - roundedColumns) * metrics.cellWidth;
  const residualY = (offset.rows - roundedRows) * metrics.cellHeight;
  const centerColumn = shard.boxColumns / 2;
  const centerRow = shard.boxRows / 2;
  const padColumns = Math.ceil((shard.boxColumns * (scale - 1)) / 2) + 1;
  const padRows = Math.ceil((shard.boxRows * (scale - 1)) / 2) + 1;

  for (let destRow = -padRows; destRow < shard.boxRows + padRows; destRow++) {
    const sourceRow = Math.floor(centerRow + (destRow + 0.5 - centerRow) / scale);
    const gridRow = shard.originRow + roundedRows + destRow;
    if (sourceRow < 0 || sourceRow >= shard.boxRows || gridRow < 0 || gridRow >= metrics.rows) {
      continue;
    }
    for (let destColumn = -padColumns; destColumn < shard.boxColumns + padColumns; destColumn++) {
      const sourceColumn = Math.floor(centerColumn + (destColumn + 0.5 - centerColumn) / scale);
      const gridColumn = shard.originColumn + roundedColumns + destColumn;
      if (
        sourceColumn < 0 ||
        sourceColumn >= shard.boxColumns ||
        gridColumn < 0 ||
        gridColumn >= metrics.columns
      ) {
        continue;
      }
      const cellIndex = sourceRow * shard.boxColumns + sourceColumn;
      if (!shard.isInside[cellIndex]) continue;

      const glyph = selectShardGlyph(shard, shardIndex, style, cellIndex, sourceColumn, sourceRow);
      context.fillStyle = glyph.color;
      context.fillText(
        glyph.character,
        gridColumn * metrics.cellWidth + residualX,
        gridRow * metrics.cellHeight + residualY,
      );
    }
  }
}

function drawShards(state: ShatterState, frame: GlyphFrame): void {
  const drawOrder = state.layout.shards
    .map((_, shardIndex) => shardIndex)
    .sort(
      (first, second) =>
        state.liftShares[first] + state.pullShares[first] -
        (state.liftShares[second] + state.pullShares[second]),
    );
  drawOrder.forEach((shardIndex) => drawShard(state, frame, shardIndex));
}

function drawSeams(state: ShatterState, frame: GlyphFrame): void {
  if (state.phase !== "cracking") return;
  const { metrics } = frame;
  const { layout, crackOrigin } = state;
  const revealShare = clamp(state.phaseSeconds / CRACK_SECONDS, 0, 1);
  const revealRadiusRows =
    revealShare * Math.hypot(layout.slabColumns / metrics.cellAspect, layout.slabRows);
  const seamColor = metrics.palette.levelColors[WHITE_LEVEL];

  layout.seamCells.forEach((seam) => {
    const distanceRows = Math.hypot(
      (seam.column - crackOrigin.column) / metrics.cellAspect,
      seam.row - crackOrigin.row,
    );
    if (distanceRows <= revealRadiusRows) drawCrackGlyph(frame, seam, seamColor, 1);
  });
}

function drawHoverCracks(state: ShatterState, frame: GlyphFrame): void {
  const crackColor = frame.metrics.palette.levelColors[LIGHT_LEVEL];
  state.hoverCracks.forEach((crack) => {
    const alpha = 1 - crack.ageSeconds / HOVER_CRACK_LIFE_SECONDS;
    crack.cells.forEach((cell) => {
      if (isInsideSlab(state.layout, cell)) drawCrackGlyph(frame, cell, crackColor, alpha);
    });
  });
}

function drawShardLabels(state: ShatterState, frame: GlyphFrame): void {
  const { context, metrics } = frame;
  state.layout.shards.forEach((shard, shardIndex) => {
    const liftShare = state.liftShares[shardIndex];
    if (liftShare < VISIBLE_LABEL_SHARE) return;
    const offset = state.shardOffsets[shardIndex];
    const labelRow = shard.isTopRow
      ? shard.originRow + offset.rows - LABEL_DISTANCE_ROWS
      : shard.originRow + shard.boxRows + offset.rows + LABEL_DISTANCE_ROWS;
    drawTextLine(context, {
      text: shard.domain,
      x: (shard.originColumn + shard.boxColumns / 2 + offset.columns) * metrics.cellWidth,
      y: clamp(
        labelRow * metrics.cellHeight,
        metrics.cellHeight,
        metrics.canvasHeight - metrics.cellHeight,
      ),
      fontSizePixels: LABEL_FONT_SIZE_PIXELS,
      fontWeight: 700,
      color: SHARD_THEMES[shard.domain].shape,
      alpha: liftShare,
      align: "center",
    });
  });
}

function drawLegally(state: ShatterState, frame: GlyphFrame): void {
  const { context, metrics, timeSeconds } = frame;
  const fadeShare = state.isReducedMotion
    ? 1
    : clamp((timeSeconds - LEGALLY_DELAY_SECONDS) / LEGALLY_FADE_SECONDS, 0, 1);
  const pulseShare =
    state.legallyPulseSeconds === null
      ? 0
      : Math.sin(Math.PI * clamp(state.legallyPulseSeconds / PULSE_SECONDS, 0, 1));

  drawTextLine(context, {
    text: HERO_SLOGAN_TAIL,
    x: state.layout.legallyRightColumn * metrics.cellWidth,
    y: state.layout.legallyRow * metrics.cellHeight,
    fontSizePixels: LEGALLY_FONT_SIZE_PIXELS * (1 + PULSE_SCALE_GAIN * pulseShare),
    fontWeight: 400,
    color: metrics.palette.levelColors[pulseShare > 0 ? WHITE_LEVEL : LIGHT_LEVEL],
    alpha: (LEGALLY_RESTING_ALPHA + (1 - LEGALLY_RESTING_ALPHA) * pulseShare) * fadeShare,
    align: "right",
  });
}

export function drawShatter(state: ShatterState, frame: GlyphFrame): void {
  clearFrame(frame);
  drawBrokenSlogan(state, frame);
  drawShards(state, frame);
  drawSeams(state, frame);
  drawHoverCracks(state, frame);
  drawEngravedSlogan(state, frame);
  drawShardLabels(state, frame);
  drawLegally(state, frame);
}
