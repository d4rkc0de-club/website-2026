import { HERO_DOMAINS, HERO_SLOGAN_LEAD, type HeroDomain } from "@/content/heroContent";
import { createDomainShapeField } from "./descentArt";
import { lerp } from "./easing";
import { hashUnit } from "./fieldArt";
import type { GlyphMetrics, LuminanceGrid } from "./types";

const SLAB_COLUMN_SHARE = 0.38;
const SLAB_ROW_SHARE = 0.56;
const MINIMUM_SHARD_COLUMNS = 6;
const MINIMUM_SHARD_ROWS = 4;
const SHARD_COLUMN_COUNT = 3;
const SHARD_ROW_COUNT = 2;
const CUT_JITTER_SHARE = 0.1;
const LAYOUT_SEED = 7;
const VERTICAL_CUT_SALT = 0;
const HORIZONTAL_CUT_SALT = 10;
const SEPARATION_SALT = 20;
const DRIFT_PERIOD_SALT = 40;
const DRIFT_PHASE_SALT = 50;
const SEPARATION_COLUMN_SHARE = 0.08;
const SEPARATION_ROW_SHARE = 0.14;
const MINIMUM_SEPARATION_ROWS = 2;
const SEPARATION_JITTER_CELLS = 1;
const MINIMUM_DRIFT_PERIOD_SECONDS = 5;
const DRIFT_PERIOD_RANGE_SECONDS = 3;
const SLOGAN_WIDTH_SHARE = 0.8;
const SLOGAN_GAP_SHARE = 0.55;
const MONOSPACE_ADVANCE_EMS = 0.6;
const LEGALLY_GAP_ROWS = 4;
const OUTSIDE_SLAB = -1;
const NEIGHBOR_OFFSETS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

type CutLine = readonly [startShare: number, endShare: number];

type CutLines = {
  vertical: CutLine[];
  horizontal: CutLine;
};

type ShardIndexGrid = {
  indices: Int8Array;
  columns: number;
  rows: number;
};

type ShardBounds = {
  minColumn: number;
  maxColumn: number;
  minRow: number;
  maxRow: number;
};

export type CellPosition = {
  column: number;
  row: number;
};

export type SeamCell = CellPosition & {
  character: "|" | "_";
};

export type Shard = {
  domain: HeroDomain;
  isTopRow: boolean;
  originColumn: number;
  originRow: number;
  boxColumns: number;
  boxRows: number;
  isInside: Uint8Array;
  isOuterRim: Uint8Array;
  isShardRim: Uint8Array;
  shapeLuminance: LuminanceGrid;
  separationColumns: number;
  separationRows: number;
  driftPeriodSeconds: number;
  driftPhaseRadians: number;
};

export type ShatterLayout = {
  slabColumn: number;
  slabRow: number;
  slabColumns: number;
  slabRows: number;
  shards: Shard[];
  seamCells: SeamCell[];
  sloganFontSizePixels: number;
  legallyRow: number;
  legallyRightColumn: number;
};

function layoutHash(salt: number): number {
  return hashUnit(LAYOUT_SEED, salt);
}

function createJitteredCut(baseShare: number, salt: number): CutLine {
  return [
    baseShare + (layoutHash(salt) - 0.5) * CUT_JITTER_SHARE,
    baseShare + (layoutHash(salt + 1) - 0.5) * CUT_JITTER_SHARE,
  ];
}

function createCutLines(): CutLines {
  return {
    vertical: Array.from({ length: SHARD_COLUMN_COUNT - 1 }, (_, cutIndex) =>
      createJitteredCut((cutIndex + 1) / SHARD_COLUMN_COUNT, VERTICAL_CUT_SALT + cutIndex * 2),
    ),
    horizontal: createJitteredCut(1 / SHARD_ROW_COUNT, HORIZONTAL_CUT_SALT),
  };
}

function shardIndexAt(columnShare: number, rowShare: number, cutLines: CutLines): number {
  const columnIndex = cutLines.vertical.filter(
    ([startShare, endShare]) => columnShare > lerp(startShare, endShare, rowShare),
  ).length;
  const [horizontalStart, horizontalEnd] = cutLines.horizontal;
  const rowIndex = rowShare > lerp(horizontalStart, horizontalEnd, columnShare) ? 1 : 0;
  return rowIndex * SHARD_COLUMN_COUNT + columnIndex;
}

function createShardIndexGrid(columns: number, rows: number): ShardIndexGrid {
  const cutLines = createCutLines();
  const indices = new Int8Array(columns * rows);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      indices[row * columns + column] = shardIndexAt(
        (column + 0.5) / columns,
        (row + 0.5) / rows,
        cutLines,
      );
    }
  }
  return { indices, columns, rows };
}

function readShardIndex(grid: ShardIndexGrid, column: number, row: number): number {
  if (column < 0 || row < 0 || column >= grid.columns || row >= grid.rows) return OUTSIDE_SLAB;
  return grid.indices[row * grid.columns + column];
}

function findShardBounds(grid: ShardIndexGrid, shardIndex: number): ShardBounds {
  const bounds: ShardBounds = {
    minColumn: grid.columns,
    maxColumn: -1,
    minRow: grid.rows,
    maxRow: -1,
  };
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      if (readShardIndex(grid, column, row) !== shardIndex) continue;
      bounds.minColumn = Math.min(bounds.minColumn, column);
      bounds.maxColumn = Math.max(bounds.maxColumn, column);
      bounds.minRow = Math.min(bounds.minRow, row);
      bounds.maxRow = Math.max(bounds.maxRow, row);
    }
  }
  return bounds;
}

function createShard(
  metrics: GlyphMetrics,
  grid: ShardIndexGrid,
  shardIndex: number,
  slabOrigin: CellPosition,
  baseSeparation: { columns: number; rows: number },
): Shard {
  const domain = HERO_DOMAINS[shardIndex];
  const bounds = findShardBounds(grid, shardIndex);
  const boxColumns = bounds.maxColumn - bounds.minColumn + 1;
  const boxRows = bounds.maxRow - bounds.minRow + 1;
  const isInside = new Uint8Array(boxColumns * boxRows);
  const isOuterRim = new Uint8Array(boxColumns * boxRows);
  const isShardRim = new Uint8Array(boxColumns * boxRows);

  for (let localRow = 0; localRow < boxRows; localRow++) {
    for (let localColumn = 0; localColumn < boxColumns; localColumn++) {
      const slabColumnIndex = bounds.minColumn + localColumn;
      const slabRowIndex = bounds.minRow + localRow;
      if (readShardIndex(grid, slabColumnIndex, slabRowIndex) !== shardIndex) continue;

      const cellIndex = localRow * boxColumns + localColumn;
      const neighborIndices = NEIGHBOR_OFFSETS.map(([columnStep, rowStep]) =>
        readShardIndex(grid, slabColumnIndex + columnStep, slabRowIndex + rowStep),
      );
      isInside[cellIndex] = 1;
      isOuterRim[cellIndex] = neighborIndices.includes(OUTSIDE_SLAB) ? 1 : 0;
      isShardRim[cellIndex] = neighborIndices.some((index) => index !== shardIndex) ? 1 : 0;
    }
  }

  const shardColumnIndex = shardIndex % SHARD_COLUMN_COUNT;
  const isTopRow = shardIndex < SHARD_COLUMN_COUNT;
  const columnSign = shardColumnIndex - (SHARD_COLUMN_COUNT - 1) / 2;
  const rowSign = isTopRow ? -1 : 1;
  const separationJitter = (salt: number) =>
    (layoutHash(SEPARATION_SALT + shardIndex * 2 + salt) - 0.5) * 2 * SEPARATION_JITTER_CELLS;

  return {
    domain,
    isTopRow,
    originColumn: slabOrigin.column + bounds.minColumn,
    originRow: slabOrigin.row + bounds.minRow,
    boxColumns,
    boxRows,
    isInside,
    isOuterRim,
    isShardRim,
    shapeLuminance: createDomainShapeField(
      { ...metrics, columns: boxColumns, rows: boxRows },
      domain,
    ),
    separationColumns: columnSign * baseSeparation.columns + separationJitter(0),
    separationRows: rowSign * baseSeparation.rows + separationJitter(1),
    driftPeriodSeconds:
      MINIMUM_DRIFT_PERIOD_SECONDS + layoutHash(DRIFT_PERIOD_SALT + shardIndex) * DRIFT_PERIOD_RANGE_SECONDS,
    driftPhaseRadians: layoutHash(DRIFT_PHASE_SALT + shardIndex) * Math.PI * 2,
  };
}

function createSeamCells(grid: ShardIndexGrid, slabOrigin: CellPosition): SeamCell[] {
  const seamCells: SeamCell[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      const shardIndex = readShardIndex(grid, column, row);
      const rightIndex = readShardIndex(grid, column + 1, row);
      const belowIndex = readShardIndex(grid, column, row + 1);
      const position = { column: slabOrigin.column + column, row: slabOrigin.row + row };
      if (rightIndex !== OUTSIDE_SLAB && rightIndex !== shardIndex) {
        seamCells.push({ ...position, character: "|" });
      } else if (belowIndex !== OUTSIDE_SLAB && belowIndex !== shardIndex) {
        seamCells.push({ ...position, character: "_" });
      }
    }
  }
  return seamCells;
}

export function isInsideSlab(layout: ShatterLayout, cell: CellPosition): boolean {
  return (
    cell.column >= layout.slabColumn &&
    cell.column < layout.slabColumn + layout.slabColumns &&
    cell.row >= layout.slabRow &&
    cell.row < layout.slabRow + layout.slabRows
  );
}

export function slabCenterCell(layout: ShatterLayout): CellPosition {
  return {
    column: layout.slabColumn + Math.floor(layout.slabColumns / 2),
    row: layout.slabRow + Math.floor(layout.slabRows / 2),
  };
}

export function createShatterLayout(metrics: GlyphMetrics): ShatterLayout {
  const { columns, rows, cellWidth, cellHeight } = metrics;
  const slabColumns = Math.max(
    SHARD_COLUMN_COUNT * MINIMUM_SHARD_COLUMNS,
    Math.floor(columns * SLAB_COLUMN_SHARE),
  );
  const slabRows = Math.max(
    SHARD_ROW_COUNT * MINIMUM_SHARD_ROWS,
    Math.floor(rows * SLAB_ROW_SHARE),
  );
  const slabOrigin = {
    column: Math.floor((columns - slabColumns) / 2),
    row: Math.floor((rows - slabRows) / 2),
  };
  const baseSeparation = {
    columns: Math.round(slabColumns * SEPARATION_COLUMN_SHARE),
    rows: Math.max(MINIMUM_SEPARATION_ROWS, Math.round(slabRows * SEPARATION_ROW_SHARE)),
  };
  const grid = createShardIndexGrid(slabColumns, slabRows);
  const gapPixels = 2 * baseSeparation.rows * cellHeight;
  const slabWidthPixels = slabColumns * cellWidth;

  return {
    slabColumn: slabOrigin.column,
    slabRow: slabOrigin.row,
    slabColumns,
    slabRows,
    shards: HERO_DOMAINS.map((_, shardIndex) =>
      createShard(metrics, grid, shardIndex, slabOrigin, baseSeparation),
    ),
    seamCells: createSeamCells(grid, slabOrigin),
    sloganFontSizePixels: Math.min(
      gapPixels * SLOGAN_GAP_SHARE,
      (slabWidthPixels * SLOGAN_WIDTH_SHARE) / (HERO_SLOGAN_LEAD.length * MONOSPACE_ADVANCE_EMS),
    ),
    legallyRow: Math.min(
      rows - 2,
      slabOrigin.row + slabRows + baseSeparation.rows + LEGALLY_GAP_ROWS,
    ),
    legallyRightColumn: slabOrigin.column + slabColumns,
  };
}
