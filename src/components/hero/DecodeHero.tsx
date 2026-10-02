"use client";

import { useCallback, useRef } from "react";
import { drawBlendedGrid } from "@/lib/ascii/drawBlendedGrid";
import { createCellThresholds, sampleWordmark } from "@/lib/ascii/luminanceGrids";
import type { GlyphFrame, GlyphMetrics, LuminanceGrid } from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

type DecodeScene = {
  wordmarkGrid: LuminanceGrid;
  cellThresholds: Float32Array;
};

const INITIAL_SIGNAL_PERCENT = 12;
const SLIDER_MAX_PERCENT = 100;
const NOISE_DENSITY = 0.22;

function createScene(metrics: GlyphMetrics): DecodeScene {
  return {
    wordmarkGrid: sampleWordmark(metrics),
    cellThresholds: createCellThresholds(metrics.columns * metrics.rows),
  };
}

export function DecodeHero() {
  const signalSliderRef = useRef<HTMLInputElement>(null);

  const drawScene = useCallback((scene: DecodeScene, frame: GlyphFrame) => {
    const signalPercent =
      signalSliderRef.current?.valueAsNumber ?? INITIAL_SIGNAL_PERCENT;
    drawBlendedGrid(frame, {
      fromGrid: null,
      toGrid: scene.wordmarkGrid,
      cellThresholds: scene.cellThresholds,
      revealProgress: signalPercent / SLIDER_MAX_PERCENT,
      noiseDensity: NOISE_DENSITY,
    });
  }, []);

  return (
    <>
      <GlyphCanvas createScene={createScene} drawScene={drawScene} />
      <label className="absolute inset-x-0 bottom-6 mx-auto flex w-72 max-w-[80%] flex-col gap-2 font-mono text-[11px] uppercase tracking-widest text-light">
        <span className="flex justify-between">
          <span>Noise</span>
          <span>Signal</span>
        </span>
        <input
          ref={signalSliderRef}
          type="range"
          min={0}
          max={SLIDER_MAX_PERCENT}
          defaultValue={INITIAL_SIGNAL_PERCENT}
          aria-label="Signal level. Noise at the left. Signal at the right."
          className="w-full accent-white"
        />
      </label>
    </>
  );
}
