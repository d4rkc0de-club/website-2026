import { RELIC_SECTIONS } from "@/content/relicContent";
import { progressBetween } from "./easing";
import { hashUnit } from "./fieldArt";
import { readColorVariable } from "./glyphStyle";
import { RELIC_ARTS, type CodeZone } from "./relicArt";
import {
  blitDotMasks,
  blitLuminance,
  createSceneGrid,
  hasArea,
  regionMetrics,
  type SceneGrid,
  type SceneRegion,
  type SceneTheme,
} from "./sceneGrid";
import type { GlyphMetrics } from "./types";

const CODE_GLYPHS = "01{}<>/\\;=+*#$%&?!";

type RelicTone = (typeof RELIC_SECTIONS)[number]["tone"];
export type RelicTheme = Record<RelicTone, { background: string; glyphs: SceneTheme }>;

export function readRelicTheme(): RelicTheme {
  const ink = readColorVariable("--color-void");
  const sheet = readColorVariable("--color-sheet");
  const [paper, light, mid] = ["--color-paper", "--color-light", "--color-mid"].map(readColorVariable);
  return {
    ink: { background: ink, glyphs: { dim: mid, mid: light, bright: paper } },
    sheet: { background: sheet, glyphs: { dim: light, mid, bright: ink } },
  };
}

function measureRegion(slot: HTMLElement, stageBounds: DOMRect, metrics: GlyphMetrics): SceneRegion {
  const slotBounds = slot.getBoundingClientRect();
  return {
    column: Math.round((slotBounds.left - stageBounds.left) / metrics.cellWidth),
    row: Math.round((slotBounds.top - stageBounds.top) / metrics.cellHeight),
    columns: Math.floor(slotBounds.width / metrics.cellWidth),
    rows: Math.floor(slotBounds.height / metrics.cellHeight),
  };
}

function swapToCodeGlyphs(
  scene: SceneGrid,
  metrics: GlyphMetrics,
  region: SceneRegion,
  codeZone: CodeZone,
): void {
  for (let row = region.row; row < region.row + region.rows; row++) {
    for (let column = region.column; column < Math.min(region.column + region.columns, metrics.columns); column++) {
      const cell = scene[row * metrics.columns + column];
      const widthShare = (column - region.column) / region.columns;
      const codeShare = progressBetween(widthShare, codeZone.startShare, codeZone.endShare);
      if (cell && hashUnit(column, row) < codeShare) {
        cell.character = CODE_GLYPHS[Math.floor(hashUnit(row, column) * CODE_GLYPHS.length)];
      }
    }
  }
}

export function findArtRegion(
  layer: HTMLElement | null,
  artName: string,
  stageBounds: DOMRect,
  metrics: GlyphMetrics,
): SceneRegion | null {
  const slot = layer?.querySelector<HTMLElement>(`[data-art="${artName}"]`);
  if (!slot) return null;
  const region = measureRegion(slot, stageBounds, metrics);
  return hasArea(region) ? region : null;
}

export function buildRelicScenes(
  metrics: GlyphMetrics,
  stageBounds: DOMRect,
  layers: (HTMLElement | null)[],
  theme: RelicTheme,
): SceneGrid[] {
  return RELIC_SECTIONS.map(({ tone }, sectionIndex) => {
    const scene = createSceneGrid(metrics);
    const slots = layers[sectionIndex]?.querySelectorAll<HTMLElement>("[data-art]") ?? [];

    slots.forEach((slot) => {
      const art = RELIC_ARTS[slot.dataset.art ?? ""];
      const region = measureRegion(slot, stageBounds, metrics);
      if (!art || !hasArea(region)) return;
      const artMetrics = regionMetrics(metrics, region);
      if ("paintDots" in art) {
        blitDotMasks(scene, metrics, art.paintDots(artMetrics), region, theme[tone].glyphs);
        return;
      }
      const luminance = art.paint(artMetrics, Number(slot.dataset.artIndex ?? 0));
      blitLuminance(scene, metrics, luminance, region, theme[tone].glyphs, art.ramp);
      if (art.codeZone) swapToCodeGlyphs(scene, metrics, region, art.codeZone);
    });
    return scene;
  });
}
