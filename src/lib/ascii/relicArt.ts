import { RELIC_BUST_IMAGE } from "@/content/relicBustImage";
import { RELIC_CAMPUS_IMAGE } from "@/content/relicCampusImage";
import { RELIC_DOORWAY_IMAGE } from "@/content/relicDoorwayImage";
import { RELIC_MOUNTAIN_IMAGE } from "@/content/relicMountainImage";
import {
  applyToneCurve,
  createDotImagePainter,
  type DotMasks,
  type DotTone,
  type ImageTone,
} from "./dotImage";
import { clamp, lerp, progressBetween, smoothStep } from "./easing";
import {
  boxSignedDistance,
  circleDistance,
  createLuminanceField,
  ellipseDistance,
  hashUnit,
  segmentDistance,
  strokeLuminance,
  type FieldSampler,
} from "./fieldArt";
import { createImageSampler, type LuminanceImage } from "./imageSampler";
import type { GlyphMetrics, LuminanceGrid } from "./types";

export type CodeZone = { startShare: number; endShare: number };

export type LuminanceArtEntry = {
  paint: (metrics: GlyphMetrics, index: number) => LuminanceGrid;
  ramp?: readonly string[];
  codeZone?: CodeZone;
};

export type DotArtEntry = {
  paintDots: (metrics: GlyphMetrics) => DotMasks;
};

export type ArtEntry = LuminanceArtEntry | DotArtEntry;

type Ellipsoid = { x: number; y: number; rx: number; ry: number; rz: number };
type FigureLook = {
  noseReach: number;
  hairHeight: number;
  lightX: number;
  headWidth: number;
  isHollow: boolean;
};
type Segment = [number, number, number, number];
type Distance = (x: number, y: number) => number;

const FINE_RAMP = [..." .'`,:;-~+=itlj1fr/xnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"];
const INK_IMAGE_RAMP = [..." .:;!|+=*#%@"];
const INK_SAMPLES_PER_CELL_AXIS = 3;
const BUST_CODE_ZONE: CodeZone = { startShare: 0.42, endShare: 0.58 };
const BUST_TONE: ImageTone = { blackLevel: 0.06, whiteRange: 0.8, gamma: 1.5 };
const BUST_GRAIN = 0.2;
const MOUNTAIN_TONE: ImageTone = { blackLevel: 0.2, whiteRange: 0.62, gamma: 0.85 };
const CAMPUS_TONE: DotTone = { blackLevel: 0.05, whiteRange: 0.9, gamma: 0.8, isInverted: true };
const DOORWAY_TONE: DotTone = { blackLevel: 0, whiteRange: 0.95, gamma: 1, isInverted: false };
const DOORWAY_CENTER_WIDTH_SHARE = 0.56;
const CODE_COLUMN_BASE_GAIN = 0.45;
const CODE_COLUMN_VARIATION = 0.55;
const CODE_STREAK_SCALE = 0.07;
const CODE_BOOST = 2.3;
const STIPPLE_STRENGTH = 0.9;
const PORTRAIT_SCALE = 1.7;
const FIGURE_OFFSET_Y = 0.25;
const FIGURE_SLOPE_STEP = 0.02;
const FIGURE_RIM_HEIGHT = 0.12;
const HAIR_LINE_Y = -0.38;
const LATTICE_STEP = 0.3;
const LATTICE_REACH = 2;
const WAVEFORM_BAR_SPACING = 0.1;
const WAVEFORM_BAR_HALF_WIDTH = 0.025;
const PLANET_RADIUS = 0.5;
const PLANET_RING_TILT = -0.35;

function stipple(density: number, column: number, row: number): number {
  return density > hashUnit(column, row) * STIPPLE_STRENGTH ? density : 0;
}

function valueNoise(x: number, y: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const shareX = smoothStep(x - cellX);
  const shareY = smoothStep(y - cellY);
  const topEdge = lerp(hashUnit(cellX, cellY), hashUnit(cellX + 1, cellY), shareX);
  const bottomEdge = lerp(hashUnit(cellX, cellY + 1), hashUnit(cellX + 1, cellY + 1), shareX);
  return lerp(topEdge, bottomEdge, shareY);
}

function ellipsoidHeight(x: number, y: number, ellipsoid: Ellipsoid): number {
  const normalizedX = (x - ellipsoid.x) / ellipsoid.rx;
  const normalizedY = (y - ellipsoid.y) / ellipsoid.ry;
  const remainder = 1 - normalizedX ** 2 - normalizedY ** 2;
  return remainder > 0 ? ellipsoid.rz * Math.sqrt(remainder) : 0;
}

function createFigureSampler(look: FigureLook, figureScale: number): FieldSampler {
  const { noseReach, hairHeight, headWidth } = look;
  const ellipsoids: Ellipsoid[] = [
    { x: 0, y: -0.2, rx: 0.46 * headWidth, ry: 0.6, rz: 0.5 },
    { x: 0.04 * noseReach, y: 0.2, rx: 0.3 * headWidth, ry: 0.3, rz: 0.35 },
    { x: 0.38 * noseReach * headWidth, y: -0.02, rx: 0.1, ry: 0.17, rz: 0.3 },
    { x: 0.3 * noseReach * headWidth, y: -0.3, rx: 0.2, ry: 0.06, rz: 0.28 },
    { x: 0, y: 0.62, rx: 0.24, ry: 0.45, rz: 0.3 },
    { x: 0, y: 1, rx: 0.9, ry: 0.32, rz: 0.45 },
    { x: 0, y: -0.45, rx: 0.5 * headWidth, ry: 0.35 * hairHeight, rz: 0.55 },
  ];
  const lightLength = Math.hypot(look.lightX, -0.6, 0.8);
  const light = [look.lightX / lightLength, -0.6 / lightLength, 0.8 / lightLength];
  const heightAt = (x: number, y: number) =>
    Math.max(...ellipsoids.map((ellipsoid) => ellipsoidHeight(x, y, ellipsoid)));

  return (x, y, _extent, column, row) => {
    const figureX = x / figureScale;
    const figureY = (y + FIGURE_OFFSET_Y) / figureScale;
    const height = heightAt(figureX, figureY);
    if (height <= 0) return 0;
    if (look.isHollow) return height < FIGURE_RIM_HEIGHT ? 0.6 : stipple(0.2, column, row);

    const slopeX =
      (heightAt(figureX + FIGURE_SLOPE_STEP, figureY) - heightAt(figureX - FIGURE_SLOPE_STEP, figureY)) /
      (2 * FIGURE_SLOPE_STEP);
    const slopeY =
      (heightAt(figureX, figureY + FIGURE_SLOPE_STEP) - heightAt(figureX, figureY - FIGURE_SLOPE_STEP)) /
      (2 * FIGURE_SLOPE_STEP);
    const normalLength = Math.hypot(slopeX, slopeY, 1);
    const lambert = Math.max(
      0,
      (-slopeX * light[0] - slopeY * light[1] + light[2]) / normalLength,
    );
    const hairTexture = figureY < HAIR_LINE_Y ? 0.6 + 0.8 * valueNoise(figureX * 14, figureY * 14) : 1;
    return stipple((0.3 + 0.7 * lambert ** 1.2) * hairTexture, column, row);
  };
}

function createPortraitLook(index: number, isHollow: boolean): FigureLook {
  return {
    noseReach: (hashUnit(index, 1) - 0.5) * 1.2,
    hairHeight: 0.5 + hashUnit(index, 2) * 0.9,
    lightX: hashUnit(index, 3) > 0.5 ? 0.8 : -0.8,
    headWidth: 0.85 + 0.3 * hashUnit(index, 4),
    isHollow,
  };
}

const sampleBustImage = createImageSampler(RELIC_BUST_IMAGE);

function paintBust(metrics: GlyphMetrics): LuminanceGrid {
  return createLuminanceField(metrics, (_x, _y, _extent, column, row) => {
    const widthShare = (column + 0.5) / metrics.columns;
    const heightShare = (row + 0.5) / metrics.rows;
    const brightness = applyToneCurve(sampleBustImage(widthShare, heightShare), BUST_TONE);
    const codeShare = progressBetween(widthShare, BUST_CODE_ZONE.startShare, BUST_CODE_ZONE.endShare);
    const columnGain = CODE_COLUMN_BASE_GAIN + CODE_COLUMN_VARIATION * hashUnit(column, 5);
    const streakGain = 0.4 + 0.6 * valueNoise(column * 0.9, row * CODE_STREAK_SCALE);
    const codeBrightness = Math.min(1, brightness * columnGain * streakGain * CODE_BOOST);
    const grain = 1 - BUST_GRAIN * hashUnit(column, row);
    return lerp(brightness, codeBrightness, codeShare) * grain;
  });
}

function createInkImagePainter(image: LuminanceImage, tone: ImageTone): LuminanceArtEntry["paint"] {
  const sampleImage = createImageSampler(image);
  const sampleOffsets = Array.from(
    { length: INK_SAMPLES_PER_CELL_AXIS },
    (_, offsetIndex) => (offsetIndex + 0.5) / INK_SAMPLES_PER_CELL_AXIS,
  );
  return (metrics) =>
    createLuminanceField(metrics, (_x, _y, _extent, column, row) => {
      let brightnessTotal = 0;
      for (const offsetY of sampleOffsets) {
        for (const offsetX of sampleOffsets) {
          brightnessTotal += sampleImage((column + offsetX) / metrics.columns, (row + offsetY) / metrics.rows);
        }
      }
      const meanBrightness = brightnessTotal / sampleOffsets.length ** 2;
      return 1 - applyToneCurve(meanBrightness, tone);
    });
}

function strokePainter(distanceAt: Distance): LuminanceArtEntry["paint"] {
  return (metrics) =>
    createLuminanceField(metrics, (x, y, { cellUnits }) =>
      strokeLuminance(distanceAt(x, y), cellUnits),
    );
}

function latticeDistance(x: number, y: number): number {
  const dotX = clamp(Math.round(x / LATTICE_STEP), -LATTICE_REACH, LATTICE_REACH) * LATTICE_STEP;
  const dotY = clamp(Math.round(y / LATTICE_STEP), -LATTICE_REACH, LATTICE_REACH) * LATTICE_STEP;
  return Math.min(
    Math.abs(boxSignedDistance(x, y, 0, 0, 0.95, 0.95)),
    Math.abs(boxSignedDistance(x, y, 0, 0, 0.55, 0.55)),
    Math.max(0, Math.hypot(x - dotX, y - dotY) - 0.06),
  );
}

function paintStar(metrics: GlyphMetrics): LuminanceGrid {
  return createLuminanceField(metrics, (x, y, { cellUnits }) => {
    const implicit = Math.abs(x) ** (2 / 3) + Math.abs(y) ** (2 / 3) - 1;
    const outline = strokeLuminance(Math.abs(implicit) * 0.3, cellUnits);
    const hatchPosition = Math.abs(((x - y) * 4) % 1);
    const hatch = implicit < 0
      ? 0.55 * strokeLuminance((Math.min(hatchPosition, 1 - hatchPosition) / 4) * 0.7, cellUnits)
      : 0;
    return Math.max(outline, hatch);
  });
}

function wireSphereDistance(x: number, y: number, centerX: number, centerY: number, radius: number): number {
  const localX = x - centerX;
  const localY = y - centerY;
  return Math.min(
    circleDistance(localX, localY, 0, 0, radius),
    ellipseDistance(localX, localY, radius * 0.33, radius),
    ellipseDistance(localX, localY, radius * 0.7, radius),
    ellipseDistance(localX, localY, radius, radius * 0.3),
  );
}

function sphereDistance(x: number, y: number): number {
  return Math.min(
    wireSphereDistance(x, y, -0.2, 0, 0.85),
    wireSphereDistance(x, y, 0.45, 0.1, 0.55),
  );
}

function createCubeSegments(
  rotationX: number,
  rotationY: number,
  size: number,
  centerX: number,
  centerY: number,
): Segment[] {
  const vertices = Array.from({ length: 8 }, (_, vertexIndex) => {
    const cornerX = (vertexIndex & 1 ? 1 : -1) * size;
    const cornerY = (vertexIndex & 2 ? 1 : -1) * size;
    const cornerZ = (vertexIndex & 4 ? 1 : -1) * size;
    const turnedX = cornerX * Math.cos(rotationY) + cornerZ * Math.sin(rotationY);
    const turnedZ = -cornerX * Math.sin(rotationY) + cornerZ * Math.cos(rotationY);
    const turnedY = cornerY * Math.cos(rotationX) - turnedZ * Math.sin(rotationX);
    return [centerX + turnedX, centerY + turnedY] as const;
  });
  const segments: Segment[] = [];
  for (let first = 0; first < 8; first++) {
    for (let second = first + 1; second < 8; second++) {
      if ([1, 2, 4].includes(first ^ second)) {
        segments.push([...vertices[first], ...vertices[second]]);
      }
    }
  }
  return segments;
}

const CUBE_SEGMENTS = [
  ...createCubeSegments(0.6, 0.5, 0.55, -0.1, 0),
  ...createCubeSegments(-0.4, 0.9, 0.5, 0.15, 0.05),
];

function cubeDistance(x: number, y: number): number {
  return Math.min(
    ...CUBE_SEGMENTS.map(([startX, startY, endX, endY]) =>
      segmentDistance(x, y, startX, startY, endX, endY),
    ),
  );
}

function paintWaveform(metrics: GlyphMetrics): LuminanceGrid {
  return createLuminanceField(metrics, (x, y, _extent, column, row) => {
    const envelope = Math.exp(-((x / 0.7) ** 2));
    const barIndex = Math.round(x / WAVEFORM_BAR_SPACING);
    const barHeight = 0.9 * envelope * (0.3 + 0.7 * hashUnit(barIndex, 3));
    const isInsideBar =
      Math.abs(x - barIndex * WAVEFORM_BAR_SPACING) < WAVEFORM_BAR_HALF_WIDTH && Math.abs(y) < barHeight;
    const scatter = hashUnit(column, row) < 0.05 * progressBetween(x, -0.2, 1) ? 0.4 : 0;
    return Math.max(isInsideBar ? 1 - 0.5 * (Math.abs(y) / barHeight) : 0, scatter);
  });
}

function paintPlanet(metrics: GlyphMetrics): LuminanceGrid {
  const tiltCosine = Math.cos(PLANET_RING_TILT);
  const tiltSine = Math.sin(PLANET_RING_TILT);
  return createLuminanceField(metrics, (x, y, { cellUnits }, column, row) => {
    const ringX = x * tiltCosine + y * tiltSine;
    const ringY = -x * tiltSine + y * tiltCosine;
    const isInsidePlanet = Math.hypot(x, y) < PLANET_RADIUS;
    const isRingVisible = !isInsidePlanet || ringY > 0;
    const ringStroke = isRingVisible
      ? strokeLuminance(ellipseDistance(ringX, ringY, 0.95, 0.26), cellUnits)
      : 0;
    if (!isInsidePlanet) {
      return Math.max(ringStroke, strokeLuminance(Math.abs(Math.hypot(x, y) - PLANET_RADIUS), cellUnits));
    }
    const normalX = x / PLANET_RADIUS;
    const normalY = y / PLANET_RADIUS;
    const normalZ = Math.sqrt(Math.max(0, 1 - normalX ** 2 - normalY ** 2));
    const lambert = clamp(-0.5 * normalX - 0.5 * normalY + 0.7 * normalZ, 0, 1);
    return Math.max(ringStroke, stipple(0.15 + 0.7 * lambert, column, row));
  });
}

export const RELIC_ARTS: Record<string, ArtEntry> = {
  bust: { paint: paintBust, ramp: FINE_RAMP, codeZone: BUST_CODE_ZONE },
  mountains: { paint: createInkImagePainter(RELIC_MOUNTAIN_IMAGE, MOUNTAIN_TONE), ramp: INK_IMAGE_RAMP },
  lattice: { paint: strokePainter(latticeDistance) },
  star: { paint: paintStar },
  spheres: { paint: strokePainter(sphereDistance) },
  cubes: { paint: strokePainter(cubeDistance) },
  waveform: { paint: paintWaveform },
  planet: { paint: paintPlanet },
  skyline: { paintDots: createDotImagePainter(RELIC_CAMPUS_IMAGE, CAMPUS_TONE) },
  silhouette: {
    paint: (metrics, index) =>
      createLuminanceField(metrics, createFigureSampler(createPortraitLook(index, true), PORTRAIT_SCALE)),
  },
  doorway: { paintDots: createDotImagePainter(RELIC_DOORWAY_IMAGE, DOORWAY_TONE, DOORWAY_CENTER_WIDTH_SHARE) },
};
