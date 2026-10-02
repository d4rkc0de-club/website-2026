import { STRATA_SECTIONS } from "@/content/strataSections";
import { sampleText, sampleWordmark } from "./luminanceGrids";
import type { GlyphMetrics, LuminanceGrid } from "./types";

export function buildSectionGrids(metrics: GlyphMetrics): LuminanceGrid[] {
  return STRATA_SECTIONS.map((section) =>
    section.useWordmarkGrid
      ? sampleWordmark(metrics)
      : sampleText(metrics, [...section.gridLines]),
  );
}
