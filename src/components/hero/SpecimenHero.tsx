"use client";

import { useCallback, useRef } from "react";
import { sampleText, sampleWordmark } from "@/lib/ascii/luminanceGrids";
import {
  advanceClickMorphTransition,
  buildGridsForMetrics,
  createGridMorphState,
  drawGridMorphParticles,
  startGridMorphToIndex,
  type GridMorphState,
} from "@/lib/ascii/gridMorphParticles";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { HERO_DOMAINS, HERO_TAGLINE } from "@/content/heroContent";
import { GlyphCanvas } from "./GlyphCanvas";

type SpecimenScene = GridMorphState & {
  currentGridIndex: number;
  slideLabels: string[];
};

function buildSpecimenGrids(metrics: GlyphMetrics) {
  return buildGridsForMetrics(metrics, [
    (gridMetrics) => sampleWordmark(gridMetrics),
    (gridMetrics) => sampleText(gridMetrics, [...HERO_TAGLINE]),
    (gridMetrics) => sampleText(gridMetrics, [...HERO_DOMAINS.slice(0, 3)]),
    (gridMetrics) => sampleText(gridMetrics, ["JOIN", "CTF"]),
  ]);
}

function createScene(metrics: GlyphMetrics): SpecimenScene {
  const grids = buildSpecimenGrids(metrics);
  const morphState = createGridMorphState(metrics, grids);
  return {
    ...morphState,
    currentGridIndex: 0,
    slideLabels: ["WORDMARK", "CLUB", "DOMAINS", "JOIN"],
  };
}

function mergeSceneOnResize(previousScene: SpecimenScene, metrics: GlyphMetrics): SpecimenScene {
  const grids = buildSpecimenGrids(metrics);
  const morphState = createGridMorphState(metrics, grids);
  const activeIndex = previousScene.currentGridIndex;
  for (const particle of morphState.particles) {
    particle.targetLuminance = grids[activeIndex][particle.cellIndex];
    particle.luminance = particle.targetLuminance;
  }
  morphState.isTransitioning = false;
  morphState.transitionProgress = 1;
  return {
    ...morphState,
    currentGridIndex: activeIndex,
    slideLabels: previousScene.slideLabels,
  };
}

export function SpecimenHero() {
  const sceneRef = useRef<SpecimenScene | null>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const drawScene = useCallback((scene: SpecimenScene, frame: GlyphFrame) => {
    sceneRef.current = scene;
    if (scene.isTransitioning && !frame.prefersReducedMotion) {
      advanceClickMorphTransition(scene, frame.deltaSeconds);
    }
    if (labelRef.current) {
      labelRef.current.textContent = scene.slideLabels[scene.currentGridIndex] ?? "";
    }
    drawGridMorphParticles(scene, frame);
  }, []);

  const handleClick = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.currentGridIndex = (scene.currentGridIndex + 1) % scene.grids.length;
    startGridMorphToIndex(scene, scene.currentGridIndex);
  };

  return (
    <div
      className="absolute inset-0 outline-none select-none cursor-crosshair touch-none"
      onClick={handleClick}
    >
      <GlyphCanvas
        createScene={createScene}
        drawScene={drawScene}
        mergeSceneOnResize={mergeSceneOnResize}
      />
      <div className="absolute bottom-6 left-6 font-mono text-[11px] uppercase tracking-widest text-light">
        <span ref={labelRef}>WORDMARK</span>
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[11px] uppercase tracking-widest text-mid">
        Click to change slide
      </div>
    </div>
  );
}
