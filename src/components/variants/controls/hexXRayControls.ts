import { THEME_COLOR_NAMES } from "@/lib/ascii/glyphStyle";
import { BYTE_FORMAT_NAMES } from "@/lib/byteFormat";
import { defineControls, select, slider } from "@/lib/variantControls";

export const HEX_XRAY_CONTROLS = defineControls([
  select("byteFormatName", "Byte format", BYTE_FORMAT_NAMES, "hex"),
  select("byteColorName", "Byte color", THEME_COLOR_NAMES, "signal"),
  select("textColorName", "Text color", THEME_COLOR_NAMES, "light"),
  slider("lensRadiusPixels", "Lens radius (px)", 40, 400, 5, 140),
  slider("edgeSoftnessShare", "Edge softness", 0.05, 1, 0.05, 0.4),
]);
