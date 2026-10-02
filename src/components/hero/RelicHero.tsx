"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RELIC_BRAND, RELIC_SECTIONS, type RelicSectionId } from "@/content/relicContent";
import { createCrawlState, drawCorruptionCrawl, type CrawlState } from "@/lib/ascii/corruptionCrawl";
import { clamp, progressBetween, smoothStep } from "@/lib/ascii/easing";
import {
  createGlyphFlightState,
  drawGlyphFlight,
  type GlyphFlightState,
} from "@/lib/ascii/glyphFlight";
import { mixHexColors } from "@/lib/ascii/mixHexColors";
import { buildRelicScenes, findArtRegion, readRelicTheme } from "@/lib/ascii/relicScenes";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";
import { RELIC_SECTION_BODIES } from "./relic/RelicSections";

const LAST_SECTION_INDEX = RELIC_SECTIONS.length - 1;
const SCROLL_FOLLOW_RATE_PER_SECOND = 8;
const LAYER_FADE_RATE = 2.4;
const JOIN_SECTION_INDEX = RELIC_SECTIONS.findIndex(({ id }) => id === "join");
const LAYER_INTERACTIVE_OPACITY = 0.5;
const BLEND_HOLD_SHARE = 0.2;
const WIDE_FONT_SIZE_PIXELS = 8;
const NARROW_FONT_SIZE_PIXELS = 7;

type RelicState = {
  flight: GlyphFlightState;
  backgrounds: string[];
  crawl: CrawlState | null;
  crawlColor: string;
};

function layerOpacity(position: number, layerIndex: number): number {
  return clamp(1 - Math.abs(position - layerIndex) * LAYER_FADE_RATE, 0, 1);
}

export function RelicHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLElement | null)[]>([]);
  const targetPositionRef = useRef(0);
  const shownPositionRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const createScene = useCallback((metrics: GlyphMetrics): RelicState => {
    const theme = readRelicTheme();
    const stageBounds = stageRef.current?.getBoundingClientRect() ?? new DOMRect();
    const scenes = buildRelicScenes(metrics, stageBounds, layerRefs.current, theme);
    const doorwayRegion = findArtRegion(layerRefs.current[JOIN_SECTION_INDEX], "doorway", stageBounds, metrics);
    return {
      flight: createGlyphFlightState(metrics.columns, scenes),
      backgrounds: RELIC_SECTIONS.map(({ tone }) => theme[tone].background),
      crawl: doorwayRegion ? createCrawlState(doorwayRegion) : null,
      crawlColor: theme.ink.glyphs.mid,
    };
  }, []);

  const drawScene = useCallback((scene: RelicState, frame: GlyphFrame) => {
    const followShare = frame.prefersReducedMotion
      ? 1
      : 1 - Math.exp(-frame.deltaSeconds * SCROLL_FOLLOW_RATE_PER_SECOND);
    shownPositionRef.current += (targetPositionRef.current - shownPositionRef.current) * followShare;
    const position = shownPositionRef.current;
    const fromIndex = Math.floor(clamp(position, 0, LAST_SECTION_INDEX));
    const toIndex = Math.min(fromIndex + 1, LAST_SECTION_INDEX);
    const blendShare = smoothStep(
      progressBetween(position - fromIndex, BLEND_HOLD_SHARE, 1 - BLEND_HOLD_SHARE),
    );
    const backgroundColor = mixHexColors(scene.backgrounds[fromIndex], scene.backgrounds[toIndex], blendShare);

    drawGlyphFlight(
      scene.flight,
      {
        ...frame,
        metrics: { ...frame.metrics, palette: { ...frame.metrics.palette, backgroundColor } },
      },
      position,
      false,
    );

    if (scene.crawl && !frame.prefersReducedMotion) {
      drawCorruptionCrawl(scene.crawl, frame, layerOpacity(position, JOIN_SECTION_INDEX), scene.crawlColor);
    }

    layerRefs.current.forEach((layer, layerIndex) => {
      if (!layer) return;
      const opacity = layerOpacity(position, layerIndex);
      layer.style.opacity = String(opacity);
      layer.inert = opacity < LAYER_INTERACTIVE_OPACITY;
    });
    setActiveIndex(Math.round(clamp(position, 0, LAST_SECTION_INDEX)));
  }, []);

  const scrollToIndex = useCallback((sectionIndex: number) => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: root.getBoundingClientRect().top + window.scrollY + sectionIndex * window.innerHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, []);

  const goTo = useCallback(
    (sectionId: RelicSectionId) =>
      scrollToIndex(RELIC_SECTIONS.findIndex(({ id }) => id === sectionId)),
    [scrollToIndex],
  );

  useEffect(() => {
    const updateTargetPosition = () => {
      const root = rootRef.current;
      if (!root) return;
      targetPositionRef.current = clamp(
        -root.getBoundingClientRect().top / window.innerHeight,
        0,
        LAST_SECTION_INDEX,
      );
    };
    updateTargetPosition();
    shownPositionRef.current = targetPositionRef.current;
    window.addEventListener("scroll", updateTargetPosition, { passive: true });
    window.addEventListener("resize", updateTargetPosition);
    document.documentElement.style.scrollSnapType = "y proximity";
    return () => {
      window.removeEventListener("scroll", updateTargetPosition);
      window.removeEventListener("resize", updateTargetPosition);
      document.documentElement.style.scrollSnapType = "";
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div ref={stageRef} className="sticky top-0 h-dvh overflow-hidden bg-void">
        <GlyphCanvas
          createScene={createScene}
          drawScene={drawScene}
          wideFontSizePixels={WIDE_FONT_SIZE_PIXELS}
          narrowFontSizePixels={NARROW_FONT_SIZE_PIXELS}
        />

        <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-5 pt-5 text-white mix-blend-difference md:px-10">
          <p className="font-mono text-xs leading-tight tracking-widest">
            <span className="font-display text-base">{RELIC_BRAND.name}</span>
            <span className="max-md:sr-only">
              <br />
              {RELIC_BRAND.lines.join(" / ")}
            </span>
          </p>
          <nav aria-label="Main">
            <ol className="flex gap-3 font-mono text-xs tracking-widest md:gap-5">
              {RELIC_SECTIONS.map(({ id, label }, sectionIndex) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => scrollToIndex(sectionIndex)}
                    aria-current={sectionIndex === activeIndex ? "true" : undefined}
                    className={`px-1 hover:text-accent ${sectionIndex === activeIndex ? "bg-white text-black" : ""}`}
                  >
                    {`[${String(sectionIndex + 1).padStart(2, "0")}]`}
                    <span className="max-md:sr-only">{` ${label}`}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        {RELIC_SECTIONS.map(({ id, label, tone }, sectionIndex) => {
          const SectionBody = RELIC_SECTION_BODIES[id];
          return (
            <section
              key={id}
              id={id}
              aria-label={label}
              ref={(element) => {
                layerRefs.current[sectionIndex] = element;
              }}
              style={{ opacity: sectionIndex === 0 ? 1 : 0 }}
              className={`absolute inset-0 ${tone === "ink" ? "text-paper" : "text-void"}`}
            >
              <SectionBody goTo={goTo} />
            </section>
          );
        })}
      </div>

      <div aria-hidden="true" className="pointer-events-none -mt-[100dvh]">
        {RELIC_SECTIONS.map(({ id }) => (
          <div key={id} className="h-dvh snap-start" />
        ))}
      </div>
    </div>
  );
}
