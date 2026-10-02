import { GLYPH_RAMP } from "./glyphStyle";
import type { GlyphMetrics, LuminanceGrid } from "./types";

const BRIGHT_LEVEL_SHARE_MINIMUM = 0.75;
const MID_LEVEL_SHARE_MINIMUM = 0.375;
const FADE_BAR_CHARACTERS = ["░", "▒", "▓", "█"] as const;
const BRAILLE_BLOCK_START = 0x2800;

export type SceneCell = { character: string; color: string };
export type SceneGrid = (SceneCell | null)[];
export type SceneRegion = {
  column: number;
  row: number;
  columns: number;
  rows: number;
};
export type SceneTheme = { dim: string; mid: string; bright: string };

function levelColor(levelShare: number, theme: SceneTheme): string {
  if (levelShare >= BRIGHT_LEVEL_SHARE_MINIMUM) return theme.bright;
  return levelShare >= MID_LEVEL_SHARE_MINIMUM ? theme.mid : theme.dim;
}

export function createSceneGrid(metrics: GlyphMetrics): SceneGrid {
  return new Array<SceneCell | null>(metrics.columns * metrics.rows).fill(null);
}

export function regionMetrics(
  metrics: GlyphMetrics,
  region: SceneRegion,
): GlyphMetrics {
  return { ...metrics, columns: region.columns, rows: region.rows };
}

export function hasArea(region: SceneRegion): boolean {
  return region.columns > 0 && region.rows > 0;
}

function placeCell(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  column: number,
  row: number,
  cell: SceneCell,
): void {
  const isInside =
    column >= 0 && row >= 0 && column < metrics.columns && row < metrics.rows;
  if (isInside) scene[row * metrics.columns + column] = cell;
}

export function writeText(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  text: string,
  column: number,
  row: number,
  color: string,
): void {
  [...text].forEach((character, characterIndex) => {
    if (character !== " ") {
      placeCell(scene, metrics, column + characterIndex, row, { character, color });
    }
  });
}

export function writeCenteredText(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  text: string,
  region: SceneRegion,
  row: number,
  color: string,
): void {
  const startColumn = region.column + Math.floor((region.columns - text.length) / 2);
  writeText(scene, metrics, text, startColumn, row, color);
}

export function wrapText(text: string, columns: number): string[] {
  const lines: string[] = [];
  let currentLine = "";
  for (const word of text.split(" ")) {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (candidateLine.length > columns && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidateLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

export function writeWrappedText(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  text: string,
  region: SceneRegion,
  color: string,
): number {
  const lines = wrapText(text, region.columns).slice(0, region.rows);
  lines.forEach((line, lineIndex) => {
    writeText(scene, metrics, line, region.column, region.row + lineIndex, color);
  });
  return lines.length;
}

export function writeFadeBar(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  column: number,
  row: number,
  length: number,
  color: string,
): void {
  for (let offset = 0; offset < length; offset++) {
    const level = Math.min(
      FADE_BAR_CHARACTERS.length - 1,
      Math.floor((1 - offset / length) * FADE_BAR_CHARACTERS.length),
    );
    placeCell(scene, metrics, column + offset, row, {
      character: FADE_BAR_CHARACTERS[level],
      color,
    });
  }
}

export function drawHorizontalRule(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  row: number,
  color: string,
): void {
  writeText(scene, metrics, "─".repeat(metrics.columns), 0, row, color);
}

export function drawFrame(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  region: SceneRegion,
  color: string,
): void {
  const lastColumn = region.column + region.columns - 1;
  const lastRow = region.row + region.rows - 1;
  writeText(scene, metrics, `┌${"─".repeat(region.columns - 2)}┐`, region.column, region.row, color);
  writeText(scene, metrics, `└${"─".repeat(region.columns - 2)}┘`, region.column, lastRow, color);
  for (let row = region.row + 1; row < lastRow; row++) {
    writeText(scene, metrics, "│", region.column, row, color);
    writeText(scene, metrics, "│", lastColumn, row, color);
  }
}

export function clearSpan(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  column: number,
  row: number,
  length: number,
): void {
  for (let offset = 0; offset < length; offset++) {
    const cellColumn = column + offset;
    const isInside =
      cellColumn >= 0 && row >= 0 && cellColumn < metrics.columns && row < metrics.rows;
    if (isInside) scene[row * metrics.columns + cellColumn] = null;
  }
}

export function clearRegion(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  region: SceneRegion,
): void {
  for (let row = region.row; row < region.row + region.rows; row++) {
    clearSpan(scene, metrics, region.column, row, region.columns);
  }
}

export function slantRowsForContentRows(contentRows: number): number {
  return Math.ceil((contentRows + 1) / 2);
}

export function drawHexFrame(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  left: number,
  top: number,
  slantRows: number,
  contentColumns: number,
  color: string,
): SceneRegion {
  const totalColumns = contentColumns + 2 * slantRows;
  const lastRowOffset = 2 * slantRows;
  const edgeText = "_".repeat(contentColumns);

  clearSpan(scene, metrics, left + slantRows, top, contentColumns);
  writeText(scene, metrics, edgeText, left + slantRows, top, color);

  for (let rowOffset = 1; rowOffset <= lastRowOffset; rowOffset++) {
    const isUpperHalf = rowOffset <= slantRows;
    const inset = isUpperHalf ? slantRows - rowOffset : rowOffset - slantRows - 1;
    const leftColumn = left + inset;
    const rightColumn = left + totalColumns - 1 - inset;
    clearSpan(scene, metrics, leftColumn, top + rowOffset, rightColumn - leftColumn + 1);
    writeText(scene, metrics, isUpperHalf ? "/" : "\\", leftColumn, top + rowOffset, color);
    writeText(scene, metrics, isUpperHalf ? "\\" : "/", rightColumn, top + rowOffset, color);
  }

  writeText(scene, metrics, edgeText, left + slantRows, top + lastRowOffset, color);

  return {
    column: left + slantRows,
    row: top + 1,
    columns: contentColumns,
    rows: lastRowOffset - 1,
  };
}

export function blitLuminance(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  luminanceGrid: LuminanceGrid,
  region: SceneRegion,
  theme: SceneTheme,
  ramp: readonly string[] = GLYPH_RAMP,
): void {
  for (let row = 0; row < region.rows; row++) {
    for (let column = 0; column < region.columns; column++) {
      const luminance = luminanceGrid[row * region.columns + column];
      const level = Math.min(ramp.length - 1, Math.max(0, Math.floor(luminance * ramp.length)));
      if (level === 0) continue;
      placeCell(scene, metrics, region.column + column, region.row + row, {
        character: ramp[level],
        color: levelColor(level / ramp.length, theme),
      });
    }
  }
}

export function blitDotMasks(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  dotMasks: Uint8Array,
  region: SceneRegion,
  theme: SceneTheme,
): void {
  for (let row = 0; row < region.rows; row++) {
    for (let column = 0; column < region.columns; column++) {
      const dotMask = dotMasks[row * region.columns + column];
      if (dotMask === 0) continue;
      placeCell(scene, metrics, region.column + column, region.row + row, {
        character: String.fromCodePoint(BRAILLE_BLOCK_START + dotMask),
        color: theme.bright,
      });
    }
  }
}
