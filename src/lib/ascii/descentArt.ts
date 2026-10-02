import type { HeroDomain } from "@/content/heroContent";
import { clamp, progressBetween, smoothStep } from "./easing";
import {
  boxSignedDistance,
  circleDistance,
  createLuminanceField,
  diskDistance,
  ellipseDistance,
  segmentDistance,
  strokeLuminance,
} from "./fieldArt";
import type { GlyphMetrics, LuminanceGrid } from "./types";

type ShapeDistance = (x: number, y: number) => number;

const FULL_TURN = Math.PI * 2;
const STACK_BAR_CENTERS_Y = [-0.72, -0.24, 0.24, 0.72];
const RETURN_ADDRESS_BAR_INDEX = 2;
const GEAR_TOOTH_COUNT = 8;
const GEAR_EDGE_SLOPE_FACTOR = 0.6;
const EYE_HALF_WIDTH = 0.95;
const EYE_HALF_HEIGHT = 0.55;
const SONAR_RING_SPACING = 0.25;
const SONAR_RING_COUNT = 4;
const SONAR_BLIPS = [
  [0.45, -0.52],
  [-0.62, 0.3],
  [0.2, 0.68],
  [-0.3, -0.6],
] as const;
const SONAR_RING_LUMINANCE = 0.7;
const SONAR_GAP_THRESHOLD = 0.8;
const SONAR_CROSSHAIR_LUMINANCE = 0.3;
const SONAR_SWEEP_ANGLE = -0.8;
const SONAR_SWEEP_SPAN = 1.1;
const SONAR_SWEEP_LUMINANCE = 0.55;
const TUNNEL_SCALE_PER_FRAME = 0.78;
const TUNNEL_MINIMUM_SHARE = 0.0001;
const TUNNEL_CORE_SHARE = 0.14;

function eyeOutlineDistance(x: number, y: number): number {
  if (Math.abs(x) > EYE_HALF_WIDTH) {
    return Math.hypot(Math.abs(x) - EYE_HALF_WIDTH, y);
  }
  const lidHeight = EYE_HALF_HEIGHT * (1 - (x / EYE_HALF_WIDTH) ** 2);
  const lidSlope = (-2 * EYE_HALF_HEIGHT * x) / EYE_HALF_WIDTH ** 2;
  return Math.abs(Math.abs(y) - lidHeight) / Math.hypot(1, lidSlope);
}

function gearOutlineDistance(x: number, y: number): number {
  const radius = Math.hypot(x, y);
  const toothShare = smoothStep(
    progressBetween(Math.sin(Math.atan2(y, x) * GEAR_TOOTH_COUNT), -0.25, 0.25),
  );
  const outlineRadius = 0.62 + 0.26 * toothShare;
  return Math.min(Math.abs(radius - outlineRadius) * GEAR_EDGE_SLOPE_FACTOR, Math.abs(radius - 0.22));
}

const DOMAIN_SHAPES: Record<HeroDomain, ShapeDistance> = {
  WEB: (x, y) =>
    Math.min(
      circleDistance(x, y, 0, 0, 0.9),
      ellipseDistance(x, y, 0.42, 0.9),
      segmentDistance(x, y, 0, -0.9, 0, 0.9),
      segmentDistance(x, y, -0.9, 0, 0.9, 0),
      segmentDistance(x, y, -0.78, -0.45, 0.78, -0.45),
      segmentDistance(x, y, -0.78, 0.45, 0.78, 0.45),
    ),
  PWN: (x, y) =>
    Math.min(
      ...STACK_BAR_CENTERS_Y.map((barCenterY, barIndex) => {
        const signedDistance = boxSignedDistance(x, y, 0, barCenterY, 0.75, 0.12);
        return barIndex === RETURN_ADDRESS_BAR_INDEX
          ? Math.max(0, signedDistance)
          : Math.abs(signedDistance);
      }),
    ),
  REV: gearOutlineDistance,
  CRYPTO: (x, y) =>
    Math.min(
      circleDistance(x, y, -0.55, 0, 0.3),
      diskDistance(x, y, -0.55, 0, 0.1),
      segmentDistance(x, y, -0.25, 0, 0.9, 0),
      segmentDistance(x, y, 0.5, 0, 0.5, 0.32),
      segmentDistance(x, y, 0.72, 0, 0.72, 0.22),
      segmentDistance(x, y, 0.9, 0, 0.9, 0.32),
    ),
  FORENSICS: (x, y) =>
    Math.min(
      circleDistance(x, y, -0.2, -0.2, 0.6),
      circleDistance(x, y, -0.2, -0.2, 0.44),
      segmentDistance(x, y, 0.25, 0.25, 0.88, 0.88),
    ),
  OSINT: (x, y) =>
    Math.min(
      eyeOutlineDistance(x, y),
      circleDistance(x, y, 0, 0, 0.3),
      diskDistance(x, y, 0, 0, 0.13),
    ),
};

function wrapAngle(angle: number): number {
  return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

export function createDomainShapeField(
  metrics: GlyphMetrics,
  domain: HeroDomain,
): LuminanceGrid {
  const shapeDistance = DOMAIN_SHAPES[domain];
  return createLuminanceField(metrics, (x, y, { cellUnits }) =>
    strokeLuminance(shapeDistance(x, y), cellUnits),
  );
}

export function createSonarField(metrics: GlyphMetrics): LuminanceGrid {
  return createLuminanceField(metrics, (x, y, { cellUnits }) => {
    const radius = Math.hypot(x, y);
    if (radius > 1 + cellUnits) return 0;

    const angle = Math.atan2(y, x);
    const ringIndex = clamp(Math.round(radius / SONAR_RING_SPACING), 1, SONAR_RING_COUNT);
    const isInsideRingGap = Math.sin(angle * (10 + ringIndex * 6)) >= SONAR_GAP_THRESHOLD;
    const ringLuminance = isInsideRingGap
      ? 0
      : SONAR_RING_LUMINANCE *
        strokeLuminance(Math.abs(radius - ringIndex * SONAR_RING_SPACING), cellUnits);
    const crosshairLuminance =
      SONAR_CROSSHAIR_LUMINANCE * strokeLuminance(Math.min(Math.abs(x), Math.abs(y)), cellUnits);
    const sweepBehind = wrapAngle(SONAR_SWEEP_ANGLE - angle);
    const sweepLuminance =
      sweepBehind < SONAR_SWEEP_SPAN
        ? SONAR_SWEEP_LUMINANCE * (1 - sweepBehind / SONAR_SWEEP_SPAN) * (1 - 0.5 * radius)
        : 0;
    const blipLuminance = Math.max(
      strokeLuminance(diskDistance(x, y, 0, 0, 0.05), cellUnits),
      ...SONAR_BLIPS.map(([blipX, blipY]) =>
        strokeLuminance(diskDistance(x, y, blipX, blipY, 0.05), cellUnits),
      ),
    );

    return Math.max(ringLuminance, crosshairLuminance, sweepLuminance, blipLuminance);
  });
}

export function createTunnelField(metrics: GlyphMetrics): LuminanceGrid {
  return createLuminanceField(metrics, (x, y, { cellUnits, halfWidth, halfHeight }) => {
    const widthShare = Math.abs(x) / halfWidth;
    const heightShare = Math.abs(y) / halfHeight;
    const frameShare = Math.max(widthShare, heightShare, TUNNEL_MINIMUM_SHARE);
    const frameIndex = Math.round(Math.log(frameShare) / Math.log(TUNNEL_SCALE_PER_FRAME));
    const nearestFrameShare = TUNNEL_SCALE_PER_FRAME ** frameIndex;
    const frameDistance =
      widthShare >= heightShare
        ? Math.abs(widthShare - nearestFrameShare) * halfWidth
        : Math.abs(heightShare - nearestFrameShare) * halfHeight;
    const frameLuminance =
      strokeLuminance(frameDistance, cellUnits) * (0.35 + 0.65 * nearestFrameShare);
    const cornerLineDistance =
      Math.abs(widthShare - heightShare) * Math.min(halfWidth, halfHeight) * 0.7;
    const cornerLineLuminance = 0.5 * strokeLuminance(cornerLineDistance, cellUnits);
    const coreLuminance = clamp(1 - frameShare / TUNNEL_CORE_SHARE, 0, 1);

    return Math.max(frameLuminance, cornerLineLuminance, coreLuminance);
  });
}
