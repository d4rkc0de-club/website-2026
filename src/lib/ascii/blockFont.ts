import { writeText, type SceneGrid } from "./sceneGrid";
import type { GlyphMetrics } from "./types";

const GLYPH_PIXEL_COLUMNS = 3;
const GLYPH_PIXEL_ROWS = 5;
const SPACE_PIXELS = 2;
const SHADOW_OFFSET_CELLS = 1;
const MAXIMUM_PIXEL_COLUMNS = 8;
const FILLED_PIXEL = "#";
const FILL_CHARACTER = "█";
const SHADOW_CHARACTER = "░";
const EN_DASH = "–";

const GLYPH_PIXELS: Record<string, readonly string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
  N: ["##.", "#.#", "#.#", "#.#", "#.#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#.#", "#.#", "###", "###", "#.#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  "-": ["...", "...", "###", "...", "..."],
  ".": ["...", "...", "...", "...", ".#."],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
};

export type BlockScale = {
  pixelColumns: number;
  pixelRows: number;
};

function findGlyph(character: string): readonly string[] | undefined {
  const normalizedCharacter = character === EN_DASH ? "-" : character.toUpperCase();
  return GLYPH_PIXELS[normalizedCharacter];
}

function gapColumns(scale: BlockScale): number {
  return Math.max(1, scale.pixelColumns - 1);
}

function advanceColumns(character: string, scale: BlockScale): number {
  return findGlyph(character)
    ? GLYPH_PIXEL_COLUMNS * scale.pixelColumns + gapColumns(scale)
    : SPACE_PIXELS * scale.pixelColumns;
}

function textColumns(text: string, scale: BlockScale): number {
  return (
    [...text].reduce((total, character) => total + advanceColumns(character, scale), 0) -
    gapColumns(scale)
  );
}

function scaleForPixelColumns(pixelColumns: number, cellAspect: number): BlockScale {
  return { pixelColumns, pixelRows: Math.max(1, Math.round(pixelColumns / cellAspect)) };
}

export function blockTextColumns(text: string, scale: BlockScale): number {
  return textColumns(text, scale) + SHADOW_OFFSET_CELLS;
}

export function blockTextRows(scale: BlockScale): number {
  return GLYPH_PIXEL_ROWS * scale.pixelRows + SHADOW_OFFSET_CELLS;
}

export function fitBlockScale(
  lines: readonly string[],
  maximumColumns: number,
  maximumRows: number,
  cellAspect: number,
  lineGapRows: number,
): BlockScale {
  for (let pixelColumns = MAXIMUM_PIXEL_COLUMNS; pixelColumns > 1; pixelColumns--) {
    const scale = scaleForPixelColumns(pixelColumns, cellAspect);
    const widestColumns = Math.max(...lines.map((line) => blockTextColumns(line, scale)));
    const totalRows = lines.length * blockTextRows(scale) + (lines.length - 1) * lineGapRows;
    if (widestColumns <= maximumColumns && totalRows <= maximumRows) return scale;
  }
  return scaleForPixelColumns(1, cellAspect);
}

function forEachFilledCell(
  text: string,
  scale: BlockScale,
  visitCell: (columnOffset: number, rowOffset: number) => void,
): void {
  let columnCursor = 0;
  [...text].forEach((character) => {
    const glyph = findGlyph(character);
    if (glyph) {
      glyph.forEach((glyphRow, glyphRowIndex) => {
        [...glyphRow].forEach((pixel, glyphColumnIndex) => {
          if (pixel !== FILLED_PIXEL) return;
          for (let rowStep = 0; rowStep < scale.pixelRows; rowStep++) {
            for (let columnStep = 0; columnStep < scale.pixelColumns; columnStep++) {
              visitCell(
                columnCursor + glyphColumnIndex * scale.pixelColumns + columnStep,
                glyphRowIndex * scale.pixelRows + rowStep,
              );
            }
          }
        });
      });
    }
    columnCursor += advanceColumns(character, scale);
  });
}

export function drawBlockText(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  text: string,
  column: number,
  row: number,
  scale: BlockScale,
  fillColor: string,
  shadowColor: string,
): void {
  forEachFilledCell(text, scale, (columnOffset, rowOffset) => {
    writeText(
      scene,
      metrics,
      SHADOW_CHARACTER,
      column + columnOffset + SHADOW_OFFSET_CELLS,
      row + rowOffset + SHADOW_OFFSET_CELLS,
      shadowColor,
    );
  });
  forEachFilledCell(text, scale, (columnOffset, rowOffset) => {
    writeText(scene, metrics, FILL_CHARACTER, column + columnOffset, row + rowOffset, fillColor);
  });
}
