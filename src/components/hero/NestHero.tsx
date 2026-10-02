"use client";

import { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { HERO_SLOGAN_LEAD, HERO_SLOGAN_TAIL, HERO_TAGLINE } from "@/content/heroContent";
import {
  NEST_ABOUT_FACTS,
  NEST_ABOUT_HEADING,
  NEST_ABOUT_PARAGRAPHS,
  NEST_COORDINATORS,
  NEST_COORDINATORS_HEADING,
  NEST_EVENTS,
  NEST_EVENTS_HEADING,
  NEST_JOIN_BUTTON_LABEL,
  NEST_JOIN_HEADING,
  NEST_JOIN_TEXT,
  NEST_STING_LABEL,
} from "@/content/nestContent";
import { progressBetween } from "@/lib/ascii/easing";
import {
  createGlyphFlightState,
  drawGlyphFlight,
  type GlyphFlightState,
} from "@/lib/ascii/glyphFlight";
import { buildNestScenes, readNestTheme, type NestTheme } from "@/lib/ascii/nestScenes";
import { createWaspState, drawWasp, startSting, type WaspState } from "@/lib/ascii/nestWasp";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

const SCROLL_FOLLOW_RATE_PER_SECOND = 8;
const WASP_FADE_END_SECTION_POSITION = 0.6;
const FOCUS_REVEAL_CLASS =
  "sr-only focus:not-sr-only focus:bg-wasp focus:px-4 focus:py-2 focus:text-void";

type NestState = {
  flight: GlyphFlightState;
  wasp: WaspState;
  theme: NestTheme;
};

function createScene(metrics: GlyphMetrics): NestState {
  const theme = readNestTheme();
  const scenes = buildNestScenes(metrics, theme);
  return {
    flight: createGlyphFlightState(metrics.columns, scenes),
    wasp: createWaspState(metrics),
    theme,
  };
}

function NestSection({
  children,
  onPointerDown,
}: {
  children: ReactNode;
  onPointerDown?: () => void;
}) {
  return (
    <section className="h-full" onPointerDown={onPointerDown}>
      {children}
    </section>
  );
}

export function NestHero() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetSectionPositionRef = useRef(0);
  const shownSectionPositionRef = useRef(0);
  const stingRequestedRef = useRef(false);

  const drawScene = useCallback((scene: NestState, frame: GlyphFrame) => {
    const followShare = frame.prefersReducedMotion
      ? 1
      : 1 - Math.exp(-frame.deltaSeconds * SCROLL_FOLLOW_RATE_PER_SECOND);
    shownSectionPositionRef.current +=
      (targetSectionPositionRef.current - shownSectionPositionRef.current) * followShare;
    if (stingRequestedRef.current) {
      startSting(scene.wasp, frame.timeSeconds);
      stingRequestedRef.current = false;
    }
    drawGlyphFlight(scene.flight, frame, shownSectionPositionRef.current);
    drawWasp(
      scene.wasp,
      frame,
      scene.theme,
      1 - progressBetween(shownSectionPositionRef.current, 0, WASP_FADE_END_SECTION_POSITION),
    );
  }, []);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || container.clientHeight === 0) return;
    targetSectionPositionRef.current = container.scrollTop / container.clientHeight;
  };

  const requestSting = () => {
    stingRequestedRef.current = true;
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
        <NestSection onPointerDown={requestSting}>
          <div className="sr-only">
            <p>{HERO_TAGLINE.join(", ")}</p>
            <h2>{HERO_SLOGAN_LEAD}</h2>
            <p>{HERO_SLOGAN_TAIL}</p>
          </div>
          <button type="button" onClick={requestSting} className={FOCUS_REVEAL_CLASS}>
            {NEST_STING_LABEL}
          </button>
        </NestSection>

        <NestSection>
          <div className="sr-only">
            <h2>{NEST_ABOUT_HEADING}</h2>
            {NEST_ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <dl>
              {NEST_ABOUT_FACTS.map(({ value, label }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </NestSection>

        <NestSection>
          <div className="sr-only">
            <h2>{NEST_EVENTS_HEADING}</h2>
            <ul>
              {NEST_EVENTS.map(({ year, name, result }) => (
                <li key={`${year}-${name}`}>{`${year} ${name}, ${result}`}</li>
              ))}
            </ul>
          </div>
        </NestSection>

        <NestSection>
          <div className="sr-only">
            <h2>{NEST_COORDINATORS_HEADING}</h2>
            <ul>
              {NEST_COORDINATORS.map(({ name, role }) => (
                <li key={name}>{`${name}, ${role}`}</li>
              ))}
            </ul>
          </div>
        </NestSection>

        <NestSection>
          <div className="sr-only">
            <h2>{NEST_JOIN_HEADING}</h2>
            <p>{NEST_JOIN_TEXT}</p>
          </div>
          <button type="button" className={FOCUS_REVEAL_CLASS}>
            {NEST_JOIN_BUTTON_LABEL}
          </button>
        </NestSection>
      </div>
    </div>
  );
}
