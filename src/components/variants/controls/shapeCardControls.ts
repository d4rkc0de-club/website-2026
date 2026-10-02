import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { defineControls, multiSelect, select, slider } from "@/lib/variantControls";

export const CORNERS = ["TL", "TR", "BL", "BR"] as const;

export type Corner = (typeof CORNERS)[number];

export const SHAPE_CARD_CONTROLS = defineControls([
  multiSelect("clippedCorners", "Clip corners", CORNERS, ["TL", "BR"]),
  slider("clipSizePixels", "Clip size (px)", 0, 120, 1, 32),
  multiSelect("roundedCorners", "Round corners", CORNERS, []),
  slider("roundRadiusPixels", "Round radius (px)", 0, 120, 1, 24),
  slider("borderWidthPixels", "Border (px)", 0, 12, 1, 1),
  slider("paddingPixels", "Padding (px)", 8, 80, 1, 24),
  slider("widthPixels", "Width (px)", 160, 640, 10, 360),
  slider("minHeightPixels", "Min height (px)", 0, 500, 10, 200),
  select("backgroundColorName", "Background", THEME_COLOR_NAMES, "panel"),
  select("borderColorName", "Border color", THEME_COLOR_NAMES, "light"),
]);
