import { createCenterOutRanks } from "@/lib/ascii/centerOutRanks";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { drawGlyphText } from "@/lib/ascii/drawGlyphText";
import { clamp, progressBetween } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader } from "@/lib/ascii/glyphStyle";
import {
  flattenTaglineCharacters,
  layoutTaglineLines,
  type TaglineCharacter,
} from "@/lib/ascii/taglineLayout";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { createLoaderControls } from "./loaderControls";
import type { LoaderDefinition } from "./loaderDefinition";

type OverflowScene = {
  floodRanks: Float32Array;
  taglineCharacters: TaglineCharacter[];
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

const FILL_END_SHARE = 0.5;
const FLOOD_END_SHARE = 0.8;
const FLASH_WIDTH = 0.1;
const FLOOD_DISTANCE_WEIGHT = 0.9;
const BUFFER_MAX_COLUMNS = 40;
const BUFFER_DECORATION_COLUMNS = 7;
const BUFFER_MARGIN_COLUMNS = 2;
const FILL_CHARACTER = "A";
const EMPTY_CHARACTER = ".";

function createScene(metrics: GlyphMetrics): OverflowScene {
  return {
    floodRanks: createCenterOutRanks(metrics, FLOOD_DISTANCE_WEIGHT),
    taglineCharacters: flattenTaglineCharacters(layoutTaglineLines(metrics)),
    readThemeColor: createThemeColorReader(),
  };
}

function drawBuffer(scene: OverflowScene, frame: GlyphFrame, progress: number): void {
  const { context, metrics } = frame;
  const fillShare = progressBetween(progress, 0, FILL_END_SHARE);
  const bufferColumns = clamp(
    metrics.columns - BUFFER_DECORATION_COLUMNS - BUFFER_MARGIN_COLUMNS * 2,
    1,
    BUFFER_MAX_COLUMNS,
  );
  const filledColumns = Math.floor(fillShare * bufferColumns);
  const startColumn = Math.floor((metrics.columns - bufferColumns - BUFFER_DECORATION_COLUMNS) / 2);
  const row = Math.floor(metrics.rows / 2);
  const dimColor = scene.readThemeColor("mid");
  drawGlyphText(context, metrics, "[", startColumn, row, dimColor);
  drawGlyphText(context, metrics, FILL_CHARACTER.repeat(filledColumns), startColumn + 1, row, scene.readThemeColor("light"));
  drawGlyphText(context, metrics, EMPTY_CHARACTER.repeat(bufferColumns - filledColumns), startColumn + 1 + filledColumns, row, dimColor);
  drawGlyphText(context, metrics, `] ${Math.floor(fillShare * 100)}%`, startColumn + 1 + bufferColumns, row, dimColor);
}

function drawScene(scene: OverflowScene, frame: GlyphFrame, progress: number): void {
  const { context, metrics } = frame;
  const floodFront = progressBetween(progress, FILL_END_SHARE, FLOOD_END_SHARE) * (1 + FLASH_WIDTH);
  const clearFront = progressBetween(progress, FLOOD_END_SHARE, 1) * (1 + FLASH_WIDTH);
  const floodColor = scene.readThemeColor("mid");
  const flashColor = scene.readThemeColor("accent");
  clearFrame(frame);
  if (progress < FILL_END_SHARE) drawBuffer(scene, frame, progress);
  scene.floodRanks.forEach((floodRank, cellIndex) => {
    const isFlooded = floodFront > floodRank && clearFront <= floodRank;
    if (!isFlooded) return;
    drawGlyphCell(
      context,
      metrics,
      FILL_CHARACTER,
      cellIndex % metrics.columns,
      Math.floor(cellIndex / metrics.columns),
      floodFront - floodRank < FLASH_WIDTH ? flashColor : floodColor,
    );
  });
  scene.taglineCharacters.forEach(({ character, column, row, colorName }) => {
    if (clearFront > scene.floodRanks[row * metrics.columns + column]) {
      drawGlyphCell(context, metrics, character, column, row, scene.readThemeColor(colorName));
    }
  });
}

export const OVERFLOW_LOADER: LoaderDefinition<OverflowScene> = {
  controls: createLoaderControls(20),
  createScene,
  drawScene,
};
