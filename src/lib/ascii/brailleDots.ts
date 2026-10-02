import type { GlyphMetrics } from "./types";

export const BRAILLE_BLOCK_START = 0x2800;
export const DOT_COLUMNS_PER_CELL = 2;
export const DOT_ROWS_PER_CELL = 4;
export const DOT_BIT_BY_POSITION = [
  [0, 3],
  [1, 4],
  [2, 5],
  [6, 7],
];

const BRAILLE_BLOCK_END = BRAILLE_BLOCK_START + 0xff;
const DOT_FILL_SHARE = 0.85;

const DOT_POSITIONS = DOT_BIT_BY_POSITION.flatMap((bits, dotRow) =>
  bits.map((bit, dotColumn) => ({ bit, dotRow, dotColumn })),
);

export function brailleMaskOf(character: string): number {
  const codePoint = character.codePointAt(0) ?? 0;
  const isBraille = codePoint > BRAILLE_BLOCK_START && codePoint <= BRAILLE_BLOCK_END;
  return isBraille ? codePoint - BRAILLE_BLOCK_START : 0;
}

export function drawBrailleDots(
  context: CanvasRenderingContext2D,
  { cellWidth, cellHeight }: GlyphMetrics,
  dotMask: number,
  left: number,
  top: number,
): void {
  const dotPitchX = cellWidth / DOT_COLUMNS_PER_CELL;
  const dotPitchY = cellHeight / DOT_ROWS_PER_CELL;
  const dotWidth = dotPitchX * DOT_FILL_SHARE;
  const dotHeight = dotPitchY * DOT_FILL_SHARE;
  for (const { bit, dotRow, dotColumn } of DOT_POSITIONS) {
    if (dotMask & (1 << bit)) {
      context.fillRect(
        left + dotColumn * dotPitchX + (dotPitchX - dotWidth) / 2,
        top + dotRow * dotPitchY + (dotPitchY - dotHeight) / 2,
        dotWidth,
        dotHeight,
      );
    }
  }
}
