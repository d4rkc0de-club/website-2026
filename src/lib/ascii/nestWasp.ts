import { lerp } from "./easing";
import type { SceneTheme } from "./sceneGrid";
import type { GlyphFrame, GlyphMetrics } from "./types";

const WASP_FRAMES_FACING_RIGHT: readonly (readonly string[])[] = [
  ["   \\  /  ", "<=#=#=(@)", "         "],
  ["         ", "<=#=#=(@)", "   /  \\  "],
];
const MIRRORED_CHARACTERS: Record<string, string> = {
  "/": "\\",
  "\\": "/",
  "<": ">",
  ">": "<",
  "(": ")",
  ")": "(",
};
const WING_CHARACTERS = new Set(["/", "\\"]);
const FOLLOW_RATE_PER_SECOND = 2.2;
const WANDER_RADIANS_PER_SECOND_X = 0.45;
const WANDER_RADIANS_PER_SECOND_Y = 0.7;
const WANDER_SPAN_SHARE_X = 0.32;
const WANDER_SPAN_SHARE_Y = 0.25;
const WANDER_CENTER_ROW_SHARE = 0.4;
const FLAP_FRAMES_PER_SECOND = 14;
const BUZZ_ROWS = 0.35;
const BUZZ_RADIANS_PER_SECOND = 40;
const FACING_DEADZONE_COLUMNS = 2;
const TRAIL_LENGTH = 12;
const TRAIL_SPACING_SECONDS = 0.05;
const TRAIL_CHARACTER = ".";
const STING_SECONDS = 0.6;
const STING_RADIUS_COLUMNS = 14;
const STING_CHARACTER = "*";
const STING_POINTS_PER_COLUMN = 6;

type Facing = 1 | -1;

type TrailPoint = { column: number; row: number };

export type WaspState = {
  column: number;
  row: number;
  facing: Facing;
  trail: TrailPoint[];
  lastTrailSeconds: number;
  stingStartSeconds: number | null;
  stingOrigin: TrailPoint;
};

function mirrorLine(line: string): string {
  return [...line]
    .reverse()
    .map((character) => MIRRORED_CHARACTERS[character] ?? character)
    .join("");
}

const WASP_SPRITES: Record<Facing, readonly (readonly string[])[]> = {
  1: WASP_FRAMES_FACING_RIGHT,
  [-1]: WASP_FRAMES_FACING_RIGHT.map((frame) => frame.map(mirrorLine)),
};

export function createWaspState(metrics: GlyphMetrics): WaspState {
  const start = { column: metrics.columns / 2, row: metrics.rows * WANDER_CENTER_ROW_SHARE };
  return {
    ...start,
    facing: 1,
    trail: [],
    lastTrailSeconds: 0,
    stingStartSeconds: null,
    stingOrigin: start,
  };
}

export function startSting(wasp: WaspState, timeSeconds: number): void {
  wasp.stingStartSeconds = timeSeconds;
  wasp.stingOrigin = { column: wasp.column, row: wasp.row };
}

function findTarget({ metrics, pointer, timeSeconds, prefersReducedMotion }: GlyphFrame): TrailPoint {
  if (pointer) {
    return { column: pointer.x / metrics.cellWidth, row: pointer.y / metrics.cellHeight };
  }
  const wanderSeconds = prefersReducedMotion ? 0 : timeSeconds;
  return {
    column:
      metrics.columns / 2 +
      Math.cos(wanderSeconds * WANDER_RADIANS_PER_SECOND_X) * metrics.columns * WANDER_SPAN_SHARE_X,
    row:
      metrics.rows * WANDER_CENTER_ROW_SHARE +
      Math.sin(wanderSeconds * WANDER_RADIANS_PER_SECOND_Y) * metrics.rows * WANDER_SPAN_SHARE_Y,
  };
}

function moveWasp(wasp: WaspState, frame: GlyphFrame): void {
  const target = findTarget(frame);
  const followShare = frame.prefersReducedMotion
    ? 1
    : 1 - Math.exp(-frame.deltaSeconds * FOLLOW_RATE_PER_SECOND);
  const distanceColumns = target.column - wasp.column;
  if (Math.abs(distanceColumns) > FACING_DEADZONE_COLUMNS) {
    wasp.facing = distanceColumns > 0 ? 1 : -1;
  }
  wasp.column = lerp(wasp.column, target.column, followShare);
  wasp.row = lerp(wasp.row, target.row, followShare);
}

function recordTrail(wasp: WaspState, timeSeconds: number): void {
  if (timeSeconds - wasp.lastTrailSeconds < TRAIL_SPACING_SECONDS) return;
  wasp.trail.push({ column: wasp.column, row: wasp.row });
  if (wasp.trail.length > TRAIL_LENGTH) wasp.trail.shift();
  wasp.lastTrailSeconds = timeSeconds;
}

function drawTrail(wasp: WaspState, frame: GlyphFrame, theme: SceneTheme, visibility: number): void {
  const { context, metrics } = frame;
  context.fillStyle = theme.mid;
  wasp.trail.forEach((point, pointIndex) => {
    context.globalAlpha = (visibility * (pointIndex + 1)) / (wasp.trail.length + 1);
    context.fillText(
      TRAIL_CHARACTER,
      Math.round(point.column) * metrics.cellWidth,
      Math.round(point.row) * metrics.cellHeight,
    );
  });
}

function drawSprite(wasp: WaspState, frame: GlyphFrame, theme: SceneTheme, visibility: number): void {
  const { context, metrics, timeSeconds, prefersReducedMotion } = frame;
  const animationSeconds = prefersReducedMotion ? 0 : timeSeconds;
  const sprite = WASP_SPRITES[wasp.facing][Math.floor(animationSeconds * FLAP_FRAMES_PER_SECOND) % 2];
  const buzzRows = Math.sin(animationSeconds * BUZZ_RADIANS_PER_SECOND) * BUZZ_ROWS;
  const left = Math.round(wasp.column - sprite[0].length / 2);
  const top = Math.round(wasp.row - sprite.length / 2);
  context.globalAlpha = visibility;
  sprite.forEach((line, lineIndex) => {
    [...line].forEach((character, characterIndex) => {
      if (character === " ") return;
      context.fillStyle = WING_CHARACTERS.has(character) ? theme.mid : theme.bright;
      context.fillText(
        character,
        (left + characterIndex) * metrics.cellWidth,
        (top + lineIndex + buzzRows) * metrics.cellHeight,
      );
    });
  });
}

function drawSting(wasp: WaspState, frame: GlyphFrame, theme: SceneTheme): void {
  if (wasp.stingStartSeconds === null) return;
  const { context, metrics, timeSeconds, prefersReducedMotion } = frame;
  const ageShare = (timeSeconds - wasp.stingStartSeconds) / STING_SECONDS;
  if (ageShare >= 1) {
    wasp.stingStartSeconds = null;
    return;
  }
  const radiusColumns = STING_RADIUS_COLUMNS * (prefersReducedMotion ? 0.5 : ageShare);
  const pointCount = Math.max(1, Math.round(radiusColumns * STING_POINTS_PER_COLUMN));
  context.globalAlpha = 1 - ageShare;
  context.fillStyle = theme.bright;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const angle = (pointIndex / pointCount) * 2 * Math.PI;
    context.fillText(
      STING_CHARACTER,
      Math.round(wasp.stingOrigin.column + Math.cos(angle) * radiusColumns) * metrics.cellWidth,
      Math.round(wasp.stingOrigin.row + (Math.sin(angle) * radiusColumns) / metrics.cellAspect) *
        metrics.cellHeight,
    );
  }
}

export function drawWasp(
  wasp: WaspState,
  frame: GlyphFrame,
  theme: SceneTheme,
  visibility: number,
): void {
  if (visibility <= 0) return;
  moveWasp(wasp, frame);
  if (!frame.prefersReducedMotion) recordTrail(wasp, frame.timeSeconds);
  frame.context.save();
  if (!frame.prefersReducedMotion) drawTrail(wasp, frame, theme, visibility);
  drawSprite(wasp, frame, theme, visibility);
  drawSting(wasp, frame, theme);
  frame.context.restore();
}
