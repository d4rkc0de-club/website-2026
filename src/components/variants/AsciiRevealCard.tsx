"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import { progressBetween } from "@/lib/ascii/easing";
import { hashUnit } from "@/lib/ascii/fieldArt";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { GLYPH_SETS } from "@/lib/ascii/glyphSets";
import { createThemeColorReader } from "@/lib/ascii/glyphStyle";
import { createCellThresholds } from "@/lib/ascii/luminanceGrids";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import type { ConfigOf } from "@/lib/variantControls";
import type { REVEAL_CARD_CONTROLS } from "./controls/revealCardControls";

export type RevealCardConfig = ConfigOf<typeof REVEAL_CARD_CONTROLS>;

type RevealScene = {
  cellThresholds: Float32Array;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

type AsciiRevealCardProps = {
  config: RevealCardConfig;
  children: ReactNode;
};

function createScene(metrics: GlyphMetrics): RevealScene {
  return {
    cellThresholds: createCellThresholds(metrics.columns * metrics.rows),
    readThemeColor: createThemeColorReader(),
  };
}

function cellSpan(cellIndex: number, cellCount: number, cellSize: number, totalSize: number): number {
  return cellIndex === cellCount - 1 ? totalSize - cellIndex * cellSize : cellSize;
}

export function AsciiRevealCard({ config, children }: AsciiRevealCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const drawScene = useCallback((scene: RevealScene, frame: GlyphFrame) => {
    const card = cardRef.current;
    if (!card) return;

    const { context, metrics, timeSeconds, prefersReducedMotion } = frame;
    const { columns, rows, cellWidth, cellHeight, canvasWidth, canvasHeight, palette } = metrics;
    const cardBounds = card.getBoundingClientRect();
    if (cardBounds.top >= window.innerHeight || cardBounds.bottom <= 0) return;

    const revealDistance = Math.min(cardBounds.height, window.innerHeight * config.revealDistanceViewportRatio);
    const revealProgress = progressBetween(window.innerHeight - cardBounds.top, 0, revealDistance);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    if (revealProgress >= 1) return;

    context.fillStyle = palette.backgroundColor;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    const coverGlyphs = GLYPH_SETS[config.glyphSetName];
    const quietColor = scene.readThemeColor(config.quietColorName);
    const edgeColor = scene.readThemeColor(config.edgeColorName);
    const flickerStep = prefersReducedMotion ? 0 : Math.floor(timeSeconds * config.flickerRatePerSecond);

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const cellIndex = row * columns + column;
        const revealThreshold = scene.cellThresholds[cellIndex];

        if (revealProgress > revealThreshold) {
          context.clearRect(
            column * cellWidth,
            row * cellHeight,
            cellSpan(column, columns, cellWidth, canvasWidth),
            cellSpan(row, rows, cellHeight, canvasHeight),
          );
          continue;
        }

        const glyph = coverGlyphs[Math.floor(hashUnit(cellIndex, flickerStep) * coverGlyphs.length)];
        const isEdgeCell = revealThreshold - revealProgress < config.edgeBandShare;
        drawGlyphCell(context, metrics, glyph, column, row, isEdgeCell ? edgeColor : quietColor);
      }
    }
  }, [config]);

  return (
    <div ref={cardRef} className="relative grid [&>canvas]:pointer-events-none">
      {children}
      <GlyphCanvas
        createScene={createScene}
        drawScene={drawScene}
        wideFontSizePixels={config.wideFontSizePixels}
        narrowFontSizePixels={config.narrowFontSizePixels}
      />
    </div>
  );
}
