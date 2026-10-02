import { HERO_SLOGAN_LEAD, HERO_SLOGAN_TAIL } from "@/content/heroContent";
import type { ThemeColorName } from "./glyphStyle";
import type { GlyphMetrics } from "./types";

const ROWS_PER_LINE_STEP = 2;

export const TAGLINE_LINES: readonly { text: string; colorName: ThemeColorName }[] = [
  { text: HERO_SLOGAN_LEAD, colorName: "paper" },
  { text: HERO_SLOGAN_TAIL, colorName: "accent" },
];

export const TAGLINE_TEXTS: string[] = TAGLINE_LINES.map(({ text }) => text);

export type TaglineLine = {
  text: string;
  column: number;
  row: number;
  colorName: ThemeColorName;
};

export type TaglineCharacter = {
  character: string;
  column: number;
  row: number;
  colorName: ThemeColorName;
};

export function layoutTaglineLines(metrics: GlyphMetrics): TaglineLine[] {
  const lastLineRowOffset = (TAGLINE_LINES.length - 1) * ROWS_PER_LINE_STEP;
  const firstRow = Math.floor((metrics.rows - lastLineRowOffset - 1) / 2);
  return TAGLINE_LINES.map(({ text, colorName }, lineIndex) => ({
    text,
    colorName,
    column: Math.floor((metrics.columns - text.length) / 2),
    row: firstRow + lineIndex * ROWS_PER_LINE_STEP,
  }));
}

export function flattenTaglineCharacters(lines: readonly TaglineLine[]): TaglineCharacter[] {
  return lines.flatMap(({ text, column, row, colorName }) =>
    [...text].map((character, characterOffset) => ({
      character,
      column: column + characterOffset,
      row,
      colorName,
    })),
  );
}
