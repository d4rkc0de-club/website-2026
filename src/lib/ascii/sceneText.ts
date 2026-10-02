import { progressBetween, smoothStep } from "./easing";
import { GLYPH_FONT_FAMILY } from "./glyphStyle";
import type { GlyphFrame } from "./types";

const FULL_VISIBILITY_DISTANCE = 0.2;
const HIDDEN_DISTANCE = 0.45;
const SLIDE_SCREENS = 0.3;
const TEXT_FONT_WEIGHT = 700;
const LATE_LINE_FADE_SECONDS = 1;

export type SceneTextLine = {
  text: string;
  column: number;
  centerRow: number;
  fontSizePixels: number;
  color: string;
  align: CanvasTextAlign;
  appearAfterSeconds?: number;
};

function visibilityAtDistance(distance: number, prefersReducedMotion: boolean): number {
  if (prefersReducedMotion) return distance < 0.5 ? 1 : 0;
  return 1 - smoothStep(progressBetween(distance, FULL_VISIBILITY_DISTANCE, HIDDEN_DISTANCE));
}

export function drawSceneText(
  frame: GlyphFrame,
  textLinesPerSection: SceneTextLine[][],
  sectionPosition: number,
): void {
  const { context, metrics, prefersReducedMotion } = frame;

  context.save();
  context.textBaseline = "alphabetic";

  textLinesPerSection.forEach((textLines, sectionIndex) => {
    const signedDistance = sectionIndex - sectionPosition;
    const visibility = visibilityAtDistance(Math.abs(signedDistance), prefersReducedMotion);
    if (visibility <= 0) return;

    const slidePixels = prefersReducedMotion
      ? 0
      : signedDistance * SLIDE_SCREENS * metrics.canvasHeight;

    textLines.forEach((line) => {
      const lateShare =
        line.appearAfterSeconds === undefined || prefersReducedMotion
          ? 1
          : progressBetween(
              frame.timeSeconds,
              line.appearAfterSeconds,
              line.appearAfterSeconds + LATE_LINE_FADE_SECONDS,
            );
      context.globalAlpha = visibility * lateShare;
      context.font = `${TEXT_FONT_WEIGHT} ${line.fontSizePixels}px ${GLYPH_FONT_FAMILY}`;
      context.textAlign = line.align;
      context.fillStyle = line.color;
      const ink = context.measureText(line.text);
      const inkCenterOffset = (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2;
      context.fillText(
        line.text,
        line.column * metrics.cellWidth,
        line.centerRow * metrics.cellHeight + inkCenterOffset + slidePixels,
      );
    });
  });

  context.restore();
}
