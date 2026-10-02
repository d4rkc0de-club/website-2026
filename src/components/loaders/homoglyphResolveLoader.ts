import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { progressBetween } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader } from "@/lib/ascii/glyphStyle";
import { HOMOGLYPH_SUBSTITUTES } from "@/lib/ascii/homoglyphScene";
import {
  flattenTaglineCharacters,
  layoutTaglineLines,
  type TaglineCharacter,
} from "@/lib/ascii/taglineLayout";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { createLoaderControls } from "./loaderControls";
import type { LoaderDefinition } from "./loaderDefinition";

type HomoglyphResolveScene = {
  taglineCharacters: TaglineCharacter[];
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

const RESOLVE_END_SHARE = 0.85;
const DISGUISE_CYCLES_PER_SECOND = 14;

function createScene(metrics: GlyphMetrics): HomoglyphResolveScene {
  return {
    taglineCharacters: flattenTaglineCharacters(layoutTaglineLines(metrics)),
    readThemeColor: createThemeColorReader(),
  };
}

function disguiseCharacter(character: string, characterIndex: number, timeSeconds: number): string {
  const substitutes = HOMOGLYPH_SUBSTITUTES[character];
  if (!substitutes) return character;
  const candidates = [character, ...substitutes];
  const cycleStep = Math.floor(timeSeconds * DISGUISE_CYCLES_PER_SECOND) + characterIndex;
  return candidates[cycleStep % candidates.length];
}

function drawScene(scene: HomoglyphResolveScene, frame: GlyphFrame, progress: number): void {
  const { context, metrics, timeSeconds } = frame;
  const resolvedCharacterCount = Math.floor(
    progressBetween(progress, 0, RESOLVE_END_SHARE) * scene.taglineCharacters.length,
  );
  clearFrame(frame);
  scene.taglineCharacters.forEach(({ character, column, row, colorName }, characterIndex) => {
    if (characterIndex < resolvedCharacterCount) {
      drawGlyphCell(context, metrics, character, column, row, scene.readThemeColor(colorName));
      return;
    }
    const disguisedCharacter = disguiseCharacter(character, characterIndex, timeSeconds);
    const disguiseColorName = disguisedCharacter === character ? "mid" : "accent";
    drawGlyphCell(context, metrics, disguisedCharacter, column, row, scene.readThemeColor(disguiseColorName));
  });
}

export const HOMOGLYPH_RESOLVE_LOADER: LoaderDefinition<HomoglyphResolveScene> = {
  controls: createLoaderControls(28),
  createScene,
  drawScene,
};
