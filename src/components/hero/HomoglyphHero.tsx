"use client";

import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";
import { HERO_SLOGAN_LEAD, HERO_SLOGAN_TAIL } from "@/content/heroContent";
import { progressBetween } from "@/lib/ascii/easing";
import { GLYPH_FONT_FAMILY, clearFrame } from "@/lib/ascii/glyphStyle";
import {
  applyAction,
  codePointLabel,
  createHomoglyphScene,
  displayedGlyph,
  holdLetterRestored,
  isSpaceLetter,
  updateMutations,
} from "@/lib/ascii/homoglyphScene";
import type { HomoglyphAction, HomoglyphScene } from "@/lib/ascii/homoglyphScene";
import type {
  GlyphFrame,
  GlyphMetrics,
  PointerPosition,
} from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

type SloganLayout = {
  fontSizePixels: number;
  letterAdvancePixels: number;
  leftPixels: number;
  centerYPixels: number;
};

type SmallText = {
  text: string;
  x: number;
  y: number;
  color: string;
  align: CanvasTextAlign;
  alpha?: number;
  fontSizePixels?: number;
  haloColor?: string;
};

const HINT_TEXT = "Click to restore.";
const SLOGAN_FONT_WEIGHT = 700;
const MAX_SLOGAN_FONT_SIZE_PIXELS = 120;
const SLOGAN_WIDTH_SHARE = 0.9;
const SLOGAN_HEIGHT_SHARE = 0.3;
const SLOGAN_CENTER_SHARE = 0.45;
const GLYPH_ADVANCE_EM = 0.6;
const BAND_HALF_HEIGHT_EM = 0.6;
const SMALL_FONT_SIZE_PIXELS = 11;
const SMALL_LINE_PIXELS = 16;
const HINT_BOTTOM_ROWS = 2;
const TAGLINE_START_SECONDS = 4;
const TAGLINE_FADE_SECONDS = 1.5;
const DIM_LEVEL_INDEX = 1;
const SOFT_LEVEL_INDEX = 3;
const POINTER_MARKER = "+";
const POINTER_MARKER_FONT_SIZE_PIXELS = 22;
const HALO_WIDTH_PIXELS = 4;
const LETTER_MARKER = "\u25BC";

const KEY_ACTIONS: Readonly<Partial<Record<string, HomoglyphAction>>> = {
  arrowleft: "focusPrevious",
  a: "focusPrevious",
  arrowright: "focusNext",
  d: "focusNext",
  " ": "restoreAll",
  enter: "restoreAll",
  escape: "reset",
};

function keepScene(previousScene: HomoglyphScene): HomoglyphScene {
  return previousScene;
}

function measureSloganLayout(
  context: CanvasRenderingContext2D,
  metrics: GlyphMetrics,
  letterCount: number,
): SloganLayout {
  const fontSizePixels = Math.min(
    MAX_SLOGAN_FONT_SIZE_PIXELS,
    (metrics.canvasWidth * SLOGAN_WIDTH_SHARE) / (letterCount * GLYPH_ADVANCE_EM),
    metrics.canvasHeight * SLOGAN_HEIGHT_SHARE,
  );
  context.font = `${SLOGAN_FONT_WEIGHT} ${fontSizePixels}px ${GLYPH_FONT_FAMILY}`;
  const letterAdvancePixels = context.measureText("M").width;

  return {
    fontSizePixels,
    letterAdvancePixels,
    leftPixels: (metrics.canvasWidth - letterCount * letterAdvancePixels) / 2,
    centerYPixels: metrics.canvasHeight * SLOGAN_CENTER_SHARE,
  };
}

function letterIndexAtPointer(
  pointer: PointerPosition,
  layout: SloganLayout,
  letterCount: number,
): number | null {
  const isInsideBand =
    Math.abs(pointer.y - layout.centerYPixels) <=
    layout.fontSizePixels * BAND_HALF_HEIGHT_EM;
  const letterIndex = Math.floor(
    (pointer.x - layout.leftPixels) / layout.letterAdvancePixels,
  );
  const isInsideSlogan = letterIndex >= 0 && letterIndex < letterCount;
  return isInsideBand && isInsideSlogan ? letterIndex : null;
}

function letterCenterX(layout: SloganLayout, letterIndex: number): number {
  return layout.leftPixels + (letterIndex + 0.5) * layout.letterAdvancePixels;
}

function drawSmallText(
  context: CanvasRenderingContext2D,
  {
    text,
    x,
    y,
    color,
    align,
    alpha = 1,
    fontSizePixels = SMALL_FONT_SIZE_PIXELS,
    haloColor,
  }: SmallText,
): void {
  context.font = `${fontSizePixels}px ${GLYPH_FONT_FAMILY}`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.globalAlpha = alpha;
  if (haloColor) {
    context.lineWidth = HALO_WIDTH_PIXELS;
    context.strokeStyle = haloColor;
    context.strokeText(text, x, y);
  }
  context.fillStyle = color;
  context.fillText(text, x, y);
}

function drawSloganLetters(
  frame: GlyphFrame,
  scene: HomoglyphScene,
  layout: SloganLayout,
): void {
  const { context, metrics, timeSeconds } = frame;
  const restoredColor = metrics.palette.levelColors[metrics.palette.levelColors.length - 1];

  context.textAlign = "center";
  context.textBaseline = "middle";

  scene.letters.forEach((letter, letterIndex) => {
    if (isSpaceLetter(letter)) return;
    const glyph = displayedGlyph(letter, timeSeconds);
    context.fillStyle = glyph === letter.original ? restoredColor : scene.accentColor;
    context.fillText(glyph, letterCenterX(layout, letterIndex), layout.centerYPixels);
  });
}

function drawCues(
  frame: GlyphFrame,
  scene: HomoglyphScene,
  layout: SloganLayout,
  activeLetterIndex: number | null,
): void {
  const { context, metrics, pointer, timeSeconds, prefersReducedMotion } = frame;
  const { levelColors } = metrics.palette;
  const bandHalfHeight = layout.fontSizePixels * BAND_HALF_HEIGHT_EM;
  const taglineAlpha = prefersReducedMotion
    ? 1
    : progressBetween(
        timeSeconds,
        TAGLINE_START_SECONDS,
        TAGLINE_START_SECONDS + TAGLINE_FADE_SECONDS,
      );

  drawSmallText(context, {
    text: HERO_SLOGAN_TAIL,
    x: layout.leftPixels + scene.letters.length * layout.letterAdvancePixels,
    y: layout.centerYPixels + bandHalfHeight + SMALL_LINE_PIXELS,
    color: levelColors[SOFT_LEVEL_INDEX],
    align: "right",
    alpha: taglineAlpha,
  });

  drawSmallText(context, {
    text: HINT_TEXT,
    x: metrics.canvasWidth / 2,
    y: (metrics.rows - HINT_BOTTOM_ROWS) * metrics.cellHeight,
    color: levelColors[DIM_LEVEL_INDEX],
    align: "center",
  });

  const activeLetter =
    activeLetterIndex === null ? undefined : scene.letters[activeLetterIndex];
  if (activeLetterIndex !== null && activeLetter && !isSpaceLetter(activeLetter)) {
    const letterX = letterCenterX(layout, activeLetterIndex);
    drawSmallText(context, {
      text: LETTER_MARKER,
      x: letterX,
      y: layout.centerYPixels - bandHalfHeight - SMALL_LINE_PIXELS / 2,
      color: scene.accentColor,
      align: "center",
    });
    drawSmallText(context, {
      text: codePointLabel(activeLetter.disguise),
      x: letterX,
      y: layout.centerYPixels + bandHalfHeight + SMALL_LINE_PIXELS * 2,
      color: scene.accentColor,
      align: "center",
    });
  }

  if (pointer) {
    drawSmallText(context, {
      text: POINTER_MARKER,
      x: (Math.floor(pointer.x / metrics.cellWidth) + 0.5) * metrics.cellWidth,
      y: (Math.floor(pointer.y / metrics.cellHeight) + 0.5) * metrics.cellHeight,
      color: scene.accentColor,
      align: "center",
      fontSizePixels: POINTER_MARKER_FONT_SIZE_PIXELS,
      haloColor: metrics.palette.backgroundColor,
    });
  }
}

export function HomoglyphHero() {
  const pendingActionsRef = useRef<HomoglyphAction[]>([]);

  const queueAction = (action: HomoglyphAction) => {
    pendingActionsRef.current.push(action);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = KEY_ACTIONS[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    queueAction(action);
  };

  const drawScene = useCallback((scene: HomoglyphScene, frame: GlyphFrame) => {
    const { context, metrics, timeSeconds, pointer, prefersReducedMotion } = frame;

    pendingActionsRef.current
      .splice(0)
      .forEach((action) => applyAction(scene, action, timeSeconds, prefersReducedMotion));

    context.save();
    const layout = measureSloganLayout(context, metrics, scene.letters.length);
    const pointerLetterIndex = pointer
      ? letterIndexAtPointer(pointer, layout, scene.letters.length)
      : null;
    const activeLetterIndex = pointerLetterIndex ?? scene.keyboardLetterIndex;

    if (activeLetterIndex !== null) {
      holdLetterRestored(scene, activeLetterIndex, timeSeconds);
    }
    if (!prefersReducedMotion) updateMutations(scene, timeSeconds);

    clearFrame(frame);
    drawSloganLetters(frame, scene, layout);
    drawCues(frame, scene, layout, activeLetterIndex);
    context.restore();
  }, []);

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label="Slogan with look-alike letters. Click or press Space to restore the letters. Use the arrow keys to pick a letter. Press Escape to reset."
      onClick={() => queueAction("restoreAll")}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 cursor-crosshair focus-visible:outline-offset-[-3px]"
    >
      <p className="sr-only">
        {HERO_SLOGAN_LEAD} {HERO_SLOGAN_TAIL}
      </p>
      <GlyphCanvas
        createScene={createHomoglyphScene}
        drawScene={drawScene}
        mergeSceneOnResize={keepScene}
      />
    </div>
  );
}
