"use client";

import { useCallback, useRef } from "react";
import { STRATA_SECTIONS } from "@/content/strataSections";
import { buildDescentScenes } from "@/lib/ascii/descentScenes";
import {
  createGlyphFlightState,
  drawGlyphFlight,
  type GlyphFlightState,
} from "@/lib/ascii/glyphFlight";
import { drawSceneText, type SceneTextLine } from "@/lib/ascii/sceneText";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";
import { SectionCopy } from "./SectionParts";

const SCROLL_FOLLOW_RATE_PER_SECOND = 8;

type DescentState = {
  flight: GlyphFlightState;
  textLinesPerSection: SceneTextLine[][];
};

function createScene(metrics: GlyphMetrics): DescentState {
  const scenes = buildDescentScenes(metrics);
  return {
    flight: createGlyphFlightState(
      metrics.columns,
      scenes.map((scene) => scene.cells),
    ),
    textLinesPerSection: scenes.map((scene) => scene.textLines),
  };
}

export function DescentHero() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetSectionPositionRef = useRef(0);
  const shownSectionPositionRef = useRef(0);

  const drawScene = useCallback((scene: DescentState, frame: GlyphFrame) => {
    const followShare = frame.prefersReducedMotion
      ? 1
      : 1 - Math.exp(-frame.deltaSeconds * SCROLL_FOLLOW_RATE_PER_SECOND);
    shownSectionPositionRef.current +=
      (targetSectionPositionRef.current - shownSectionPositionRef.current) * followShare;
    drawGlyphFlight(scene.flight, frame, shownSectionPositionRef.current);
    drawSceneText(frame, scene.textLinesPerSection, shownSectionPositionRef.current);
  }, []);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || container.clientHeight === 0) return;
    targetSectionPositionRef.current = container.scrollTop / container.clientHeight;
  };

  return (
    <div className="absolute inset-0 bg-void">
      <GlyphCanvas createScene={createScene} drawScene={drawScene} />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        tabIndex={0}
        className="absolute inset-0 overflow-y-auto overscroll-contain"
      >
        {STRATA_SECTIONS.map((section) => (
          <section key={section.id} className="h-full">
            <div className="sr-only">
              <SectionCopy section={section} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
