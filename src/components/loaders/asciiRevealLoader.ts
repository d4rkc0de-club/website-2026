import { progressBetween, smoothStep } from "@/lib/ascii/easing";
import { drawBlendedGrid } from "@/lib/ascii/drawBlendedGrid";
import {
  createCellThresholds,
  sampleText,
} from "@/lib/ascii/luminanceGrids";
import { TAGLINE_TEXTS } from "@/lib/ascii/taglineLayout";
import type { GlyphFrame, GlyphMetrics, LuminanceGrid } from "@/lib/ascii/types";
import { createLoaderControls } from "./loaderControls";
import type { LoaderDefinition } from "./loaderDefinition";

type AsciiRevealScene = {
  taglineGrid: LuminanceGrid;
  cellThresholds: Float32Array;
};

const NOISE_ONLY_SHARE = 0.2;
const NOISE_DENSITY_START = 0.03;
const NOISE_DENSITY_GROWTH = 0.25;

function createScene(metrics: GlyphMetrics): AsciiRevealScene {
  return {
    taglineGrid: sampleText(metrics, TAGLINE_TEXTS),
    cellThresholds: createCellThresholds(metrics.columns * metrics.rows),
  };
}

function drawScene(scene: AsciiRevealScene, frame: GlyphFrame, progress: number): void {
  drawBlendedGrid(frame, {
    fromGrid: null,
    toGrid: scene.taglineGrid,
    cellThresholds: scene.cellThresholds,
    revealProgress: smoothStep(progressBetween(progress, NOISE_ONLY_SHARE, 1)),
    noiseDensity: NOISE_DENSITY_START + NOISE_DENSITY_GROWTH * progress,
  });
}

export const ASCII_REVEAL_LOADER: LoaderDefinition<AsciiRevealScene> = {
  controls: createLoaderControls(12),
  createScene,
  drawScene,
};
