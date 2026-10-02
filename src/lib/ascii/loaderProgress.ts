import { clamp } from "@/lib/ascii/easing";
import type { GlyphFrame } from "@/lib/ascii/types";
import { MILLISECONDS_PER_SECOND } from "@/lib/timeUnits";

export function loaderProgress(
  { timeSeconds, prefersReducedMotion }: GlyphFrame,
  durationMilliseconds: number,
): number {
  if (prefersReducedMotion) return 1;
  return clamp((timeSeconds * MILLISECONDS_PER_SECOND) / durationMilliseconds, 0, 1);
}
