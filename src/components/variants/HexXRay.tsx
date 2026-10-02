"use client";

import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import { HEX_XRAY_PARAGRAPH } from "@/content/componentDemoContent";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { progressBetween, smoothStep } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader } from "@/lib/ascii/glyphStyle";
import { wrapText } from "@/lib/ascii/sceneGrid";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { byteDigitCount, formatByte, type ByteFormatName } from "@/lib/byteFormat";
import type { ConfigOf } from "@/lib/variantControls";
import type { HEX_XRAY_CONTROLS } from "./controls/hexXRayControls";

type HexXRayConfig = ConfigOf<typeof HEX_XRAY_CONTROLS>;

const TOP_MARGIN_ROWS = 3;
const SIDE_MARGIN_COLUMNS = 4;

type ByteSlot = {
  character: string;
  byteText: string;
  column: number;
  row: number;
};

type XRayScene = {
  slots: ByteSlot[];
  slotWidthCells: number;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

function createScene(metrics: GlyphMetrics, byteFormatName: ByteFormatName): XRayScene {
  const slotWidthCells = byteDigitCount(byteFormatName);
  const slotsPerLine = Math.max(
    1,
    Math.floor((metrics.columns - 2 * SIDE_MARGIN_COLUMNS) / slotWidthCells),
  );
  const lines = wrapText(HEX_XRAY_PARAGRAPH, slotsPerLine);
  const leftColumn = Math.max(
    0,
    Math.floor((metrics.columns - slotsPerLine * slotWidthCells) / 2),
  );

  const slots = lines.flatMap((line, lineIndex) =>
    [...line].map((character, slotIndex) => ({
      character,
      byteText: formatByte(character.charCodeAt(0), byteFormatName),
      column: leftColumn + slotIndex * slotWidthCells,
      row: TOP_MARGIN_ROWS + lineIndex,
    })),
  );

  return { slots, slotWidthCells, readThemeColor: createThemeColorReader() };
}

function lensShareAtDistance(distancePixels: number, config: HexXRayConfig): number {
  const innerRadiusPixels = config.lensRadiusPixels * (1 - config.edgeSoftnessShare);
  return 1 - smoothStep(progressBetween(distancePixels, innerRadiusPixels, config.lensRadiusPixels));
}

function drawParagraph(scene: XRayScene, { context, metrics, pointer }: GlyphFrame, config: HexXRayConfig): void {
  const textColor = scene.readThemeColor(config.textColorName);
  const byteColor = scene.readThemeColor(config.byteColorName);
  const characterOffsetColumns = (scene.slotWidthCells - 1) / 2;

  scene.slots.forEach(({ character, byteText, column, row }) => {
    const distancePixels = pointer
      ? Math.hypot(
          pointer.x - (column + scene.slotWidthCells / 2) * metrics.cellWidth,
          pointer.y - (row + 0.5) * metrics.cellHeight,
        )
      : Infinity;
    const lensShare = lensShareAtDistance(distancePixels, config);

    if (lensShare < 1) {
      context.globalAlpha = 1 - lensShare;
      drawGlyphCell(context, metrics, character, column + characterOffsetColumns, row, textColor);
    }
    if (lensShare > 0) {
      context.globalAlpha = lensShare;
      drawGlyphCell(context, metrics, byteText, column, row, byteColor);
    }
  });
  context.globalAlpha = 1;
}

type HexXRayProps = {
  config: HexXRayConfig;
};

export function HexXRay({ config }: HexXRayProps) {
  const drawScene = (scene: XRayScene, frame: GlyphFrame) => {
    clearFrame(frame);
    drawParagraph(scene, frame, config);
  };

  return (
    <GlyphCanvas
      key={config.byteFormatName}
      createScene={(metrics) => createScene(metrics, config.byteFormatName)}
      drawScene={drawScene}
    />
  );
}
