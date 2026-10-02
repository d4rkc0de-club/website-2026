"use client";

import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import { GLYPH_SETS } from "@/lib/ascii/glyphSets";
import { createThemeColorReader, GLYPH_FONT_FAMILY } from "@/lib/ascii/glyphStyle";
import type { GlyphFrame, PointerPosition } from "@/lib/ascii/types";
import type { ConfigOf } from "@/lib/variantControls";
import type { CURSOR_TRAIL_CONTROLS } from "./controls/cursorTrailControls";

type CursorTrailConfig = ConfigOf<typeof CURSOR_TRAIL_CONTROLS>;

type TrailPoint = PointerPosition & { bornSeconds: number };

type FloatingGlyph = PointerPosition & {
  character: string;
  sizePixels: number;
  startRotationRadians: number;
  rotationSpeedRadiansPerSecond: number;
  bornSeconds: number;
  lifetimeSeconds: number;
};

type TrailScene = {
  trailPoints: TrailPoint[];
  floatingGlyphs: FloatingGlyph[];
  lastPointer: PointerPosition | null;
  lastSpawnSeconds: number;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

function createScene(): TrailScene {
  return {
    trailPoints: [],
    floatingGlyphs: [],
    lastPointer: null,
    lastSpawnSeconds: 0,
    readThemeColor: createThemeColorReader(),
  };
}

function pickRandom<Item>(items: ArrayLike<Item>): Item {
  return items[Math.floor(Math.random() * items.length)];
}

function createFloatingGlyph(
  pointer: PointerPosition,
  timeSeconds: number,
  config: CursorTrailConfig,
): FloatingGlyph {
  return {
    x: pointer.x + (Math.random() - 0.5) * config.glyphSpawnJitterPixels,
    y: pointer.y + (Math.random() - 0.5) * config.glyphSpawnJitterPixels,
    character: pickRandom(GLYPH_SETS[config.glyphSetName]),
    sizePixels: config.glyphMinSizePixels + Math.random() * config.glyphSizeSpreadPixels,
    startRotationRadians: Math.random() * Math.PI * 2,
    rotationSpeedRadiansPerSecond: (Math.random() - 0.5) * 2 * config.glyphMaxRotationSpeed,
    bornSeconds: timeSeconds,
    lifetimeSeconds: config.glyphLifetimeSeconds + Math.random() * config.glyphLifetimeSpreadSeconds,
  };
}

function updateScene(
  scene: TrailScene,
  { pointer, timeSeconds, prefersReducedMotion }: GlyphFrame,
  config: CursorTrailConfig,
): void {
  const hasMoved =
    pointer !== null &&
    (scene.lastPointer === null ||
      Math.abs(pointer.x - scene.lastPointer.x) > config.minimumMovePixels ||
      Math.abs(pointer.y - scene.lastPointer.y) > config.minimumMovePixels);

  if (pointer && hasMoved && !prefersReducedMotion) {
    scene.trailPoints.unshift({ ...pointer, bornSeconds: timeSeconds });
    scene.trailPoints.length = Math.min(scene.trailPoints.length, config.trailPointLimit);
    scene.lastPointer = pointer;

    if (timeSeconds - scene.lastSpawnSeconds >= config.glyphSpawnIntervalSeconds) {
      scene.floatingGlyphs.push(createFloatingGlyph(pointer, timeSeconds, config));
      scene.lastSpawnSeconds = timeSeconds;
    }
  }

  scene.trailPoints = scene.trailPoints.filter(
    ({ bornSeconds }) => timeSeconds - bornSeconds < config.trailPointLifetimeSeconds,
  );
  scene.floatingGlyphs = scene.floatingGlyphs.filter(
    ({ bornSeconds, lifetimeSeconds }) => timeSeconds - bornSeconds < lifetimeSeconds,
  );
}

function drawTrailLine(scene: TrailScene, { context, timeSeconds }: GlyphFrame, config: CursorTrailConfig): void {
  const { trailPoints } = scene;
  context.strokeStyle = scene.readThemeColor(config.colorName);
  context.lineWidth = config.trailLineWidthPixels;
  context.lineCap = "round";

  for (let pointIndex = 0; pointIndex < trailPoints.length - 1; pointIndex++) {
    const point = trailPoints[pointIndex];
    const nextPoint = trailPoints[pointIndex + 1];
    const positionFade = 1 - pointIndex / (trailPoints.length - 1);
    const ageFade = 1 - (timeSeconds - point.bornSeconds) / config.trailPointLifetimeSeconds;
    context.globalAlpha = positionFade * ageFade * config.trailLineMaxOpacity;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
  }
}

function drawFloatingGlyphs(
  scene: TrailScene,
  { context, timeSeconds }: GlyphFrame,
  config: CursorTrailConfig,
): void {
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = scene.readThemeColor(config.colorName);

  scene.floatingGlyphs.forEach((glyph) => {
    const ageSeconds = timeSeconds - glyph.bornSeconds;
    const lifeShare = ageSeconds / glyph.lifetimeSeconds;
    const opacityShare =
      lifeShare < config.glyphFadeInShare ? lifeShare / config.glyphFadeInShare : 1 - lifeShare;

    context.save();
    context.translate(glyph.x, glyph.y);
    context.rotate(glyph.startRotationRadians + glyph.rotationSpeedRadiansPerSecond * ageSeconds);
    context.globalAlpha = opacityShare * config.glyphMaxOpacity;
    context.font = `${glyph.sizePixels}px ${GLYPH_FONT_FAMILY}`;
    context.fillText(glyph.character, 0, 0);
    context.restore();
  });
}

type CursorTrailProps = {
  config: CursorTrailConfig;
};

export function CursorTrail({ config }: CursorTrailProps) {
  const drawScene = (scene: TrailScene, frame: GlyphFrame) => {
    const { context, metrics } = frame;
    updateScene(scene, frame, config);
    context.clearRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
    drawTrailLine(scene, frame, config);
    drawFloatingGlyphs(scene, frame, config);
    context.globalAlpha = 1;
  };

  return <GlyphCanvas createScene={createScene} drawScene={drawScene} />;
}
