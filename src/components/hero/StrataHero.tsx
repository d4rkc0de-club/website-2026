"use client";

import { useCallback, useRef } from "react";
import { buildSectionGrids } from "@/lib/ascii/sectionGrids";
import {
  applyGridBlendTargets,
  buildGridsForMetrics,
  createGridMorphState,
  drawGridMorphParticles,
  type GridMorphState,
} from "@/lib/ascii/gridMorphParticles";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { STRATA_SECTIONS } from "@/content/strataSections";
import { GlyphCanvas } from "./GlyphCanvas";
import { ScrollHint, SectionCopy } from "./SectionParts";

type StrataScene = GridMorphState;

function createScene(metrics: GlyphMetrics): StrataScene {
  const grids = buildSectionGrids(metrics);
  return createGridMorphState(metrics, grids);
}

function mergeSceneOnResize(previousScene: StrataScene, metrics: GlyphMetrics): StrataScene {
  const grids = buildSectionGrids(metrics);
  const nextScene = createGridMorphState(metrics, grids);
  nextScene.riseOffsetCells = previousScene.riseOffsetCells;
  nextScene.transitionProgress = previousScene.transitionProgress;
  nextScene.isTransitioning = previousScene.isTransitioning;
  return nextScene;
}

export function StrataHero() {
  const sceneRef = useRef<StrataScene | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);

  const syncScrollBlend = (scene: StrataScene) => {
    const sectionCount = STRATA_SECTIONS.length;
    const maxSectionIndex = sectionCount - 1;
    const scaledProgress = scrollProgressRef.current * maxSectionIndex;
    const fromSectionIndex = Math.floor(scaledProgress);
    const toSectionIndex = Math.min(fromSectionIndex + 1, maxSectionIndex);
    const segmentProgress = scaledProgress - fromSectionIndex;
    applyGridBlendTargets(
      scene,
      scene.grids[fromSectionIndex],
      scene.grids[toSectionIndex],
      segmentProgress,
      4,
    );
  };

  const drawScene = useCallback((scene: StrataScene, frame: GlyphFrame) => {
    sceneRef.current = scene;
    syncScrollBlend(scene);
    drawGridMorphParticles(scene, frame);
  }, []);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollRange = container.scrollHeight - container.clientHeight;
    scrollProgressRef.current =
      scrollRange > 0 ? container.scrollTop / scrollRange : 0;
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-void">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="sticky top-0 z-10 h-[min(52dvh,28rem)] border-b border-line bg-void">
          <div className="relative h-full">
            <GlyphCanvas
              createScene={createScene}
              drawScene={drawScene}
              mergeSceneOnResize={mergeSceneOnResize}
            />
          </div>
        </div>

        {STRATA_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="flex min-h-[70dvh] flex-col justify-center border-b border-line px-6 py-16 md:px-12"
          >
            <SectionCopy section={section} />
          </section>
        ))}
      </div>
      <ScrollHint />
    </div>
  );
}
