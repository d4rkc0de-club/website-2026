import { createCenterOutRanks } from "@/lib/ascii/centerOutRanks";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { smoothStep } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader } from "@/lib/ascii/glyphStyle";
import {
  flattenTaglineCharacters,
  layoutTaglineLines,
  type TaglineCharacter,
} from "@/lib/ascii/taglineLayout";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { createLoaderControls } from "./loaderControls";
import type { LoaderDefinition } from "./loaderDefinition";

type RedactionPeelScene = {
  barMask: Uint8Array;
  peelRanks: Float32Array;
  taglineCharacters: TaglineCharacter[];
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

const BAR_ROW_STEP = 2;
const BAR_MARGIN_COLUMNS = 2;
const MIN_BAR_LENGTH = 3;
const MAX_BAR_LENGTH = 14;
const MIN_GAP_LENGTH = 1;
const MAX_GAP_LENGTH = 2;
const PEEL_DISTANCE_WEIGHT = 0.75;
const FLASH_WIDTH = 0.08;
const BAR_CHARACTER = "█";
const FLASH_CHARACTER = "▒";

function randomIntegerBetween(minimum: number, maximum: number): number {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

function createBarMask({ columns, rows }: GlyphMetrics): Uint8Array {
  const barMask = new Uint8Array(columns * rows);
  const lastBarColumn = columns - BAR_MARGIN_COLUMNS;
  for (let row = 0; row < rows; row += BAR_ROW_STEP) {
    let column = BAR_MARGIN_COLUMNS;
    while (column < lastBarColumn) {
      const barLength = Math.min(
        randomIntegerBetween(MIN_BAR_LENGTH, MAX_BAR_LENGTH),
        lastBarColumn - column,
      );
      barMask.fill(1, row * columns + column, row * columns + column + barLength);
      column += barLength + randomIntegerBetween(MIN_GAP_LENGTH, MAX_GAP_LENGTH);
    }
  }
  return barMask;
}

function createScene(metrics: GlyphMetrics): RedactionPeelScene {
  const taglineCharacters = flattenTaglineCharacters(layoutTaglineLines(metrics));
  const barMask = createBarMask(metrics);
  taglineCharacters.forEach(({ column, row }) => {
    barMask[row * metrics.columns + column] = 1;
  });
  return {
    barMask,
    peelRanks: createCenterOutRanks(metrics, PEEL_DISTANCE_WEIGHT),
    taglineCharacters,
    readThemeColor: createThemeColorReader(),
  };
}

function drawScene(scene: RedactionPeelScene, frame: GlyphFrame, progress: number): void {
  const { context, metrics } = frame;
  const peelFront = smoothStep(progress) * (1 + FLASH_WIDTH);
  const barColor = scene.readThemeColor("mid");
  const flashColor = scene.readThemeColor("accent");
  clearFrame(frame);
  scene.barMask.forEach((hasBar, cellIndex) => {
    if (!hasBar) return;
    const peeledShare = peelFront - scene.peelRanks[cellIndex];
    if (peeledShare >= FLASH_WIDTH) return;
    const isCovered = peeledShare < 0;
    drawGlyphCell(
      context,
      metrics,
      isCovered ? BAR_CHARACTER : FLASH_CHARACTER,
      cellIndex % metrics.columns,
      Math.floor(cellIndex / metrics.columns),
      isCovered ? barColor : flashColor,
    );
  });
  scene.taglineCharacters.forEach(({ character, column, row, colorName }) => {
    const peeledShare = peelFront - scene.peelRanks[row * metrics.columns + column];
    if (peeledShare >= FLASH_WIDTH) {
      drawGlyphCell(context, metrics, character, column, row, scene.readThemeColor(colorName));
    }
  });
}

export const REDACTION_PEEL_LOADER: LoaderDefinition<RedactionPeelScene> = {
  controls: createLoaderControls(20),
  createScene,
  drawScene,
};
