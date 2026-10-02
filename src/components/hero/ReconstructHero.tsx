"use client";

import { progressBetween, smoothStep } from "@/lib/ascii/easing";
import { drawBlendedGrid } from "@/lib/ascii/drawBlendedGrid";
import {
  createCellThresholds,
  createRingField,
  sampleWordmark,
} from "@/lib/ascii/luminanceGrids";
import type {
  GlyphFrame,
  GlyphMetrics,
  LuminanceGrid,
} from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

type ReconstructScene = {
  fieldGrid: LuminanceGrid;
  wordmarkGrid: LuminanceGrid;
  cellThresholds: Float32Array;
};

const TIMELINE_SECONDS = {
  noiseEnd: 0.825,
  fieldRevealEnd: 2.475,
  holdEnd: 3.57,
  wordmarkRevealEnd: 5,
} as const;
const NOISE_DENSITY_START = 0.03;
const NOISE_DENSITY_GROWTH = 0.2;

function createScene(metrics: GlyphMetrics): ReconstructScene {
  return {
    fieldGrid: createRingField(metrics),
    wordmarkGrid: sampleWordmark(metrics),
    cellThresholds: createCellThresholds(metrics.columns * metrics.rows),
  };
}

function drawScene(scene: ReconstructScene, frame: GlyphFrame): void {
  const elapsedSeconds = frame.prefersReducedMotion
    ? Infinity
    : frame.timeSeconds;
  const { noiseEnd, fieldRevealEnd, holdEnd, wordmarkRevealEnd } =
    TIMELINE_SECONDS;

  const stage =
    elapsedSeconds < holdEnd
      ? {
          fromGrid: null,
          toGrid: scene.fieldGrid,
          revealProgress: smoothStep(
            progressBetween(elapsedSeconds, noiseEnd, fieldRevealEnd),
          ),
          noiseDensity:
            NOISE_DENSITY_START +
            NOISE_DENSITY_GROWTH * progressBetween(elapsedSeconds, 0, noiseEnd),
        }
      : {
          fromGrid: scene.fieldGrid,
          toGrid: scene.wordmarkGrid,
          revealProgress: smoothStep(
            progressBetween(elapsedSeconds, holdEnd, wordmarkRevealEnd),
          ),
          noiseDensity: 0,
        };

  drawBlendedGrid(frame, { ...stage, cellThresholds: scene.cellThresholds });
}

export function ReconstructHero() {
  return <GlyphCanvas createScene={createScene} drawScene={drawScene} />;
}
