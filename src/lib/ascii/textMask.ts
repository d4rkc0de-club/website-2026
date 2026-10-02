import { sampleText } from "./luminanceGrids";
import { regionMetrics, type SceneRegion } from "./sceneGrid";
import type { GlyphMetrics } from "./types";

const MASK_LUMINANCE_THRESHOLD = 0.5;

export function sampleTextMask(
  metrics: GlyphMetrics,
  region: SceneRegion,
  lines: string[],
): Uint8Array {
  const luminanceGrid = sampleText(regionMetrics(metrics, region), lines);
  return Uint8Array.from(luminanceGrid, (luminance) =>
    luminance >= MASK_LUMINANCE_THRESHOLD ? 1 : 0,
  );
}
