export const GLYPH_SETS = {
  code: "$@#%&*+?!01{}<>/\\;=",
  binary: "01",
  hex: "0123456789abcdef",
  symbols: "$@#%&*+?!",
  brackets: "{}<>[]()/\\",
  blocks: "░▒▓█",
} as const;

export const GLYPH_SET_NAMES = ["code", "binary", "hex", "symbols", "brackets", "blocks"] as const;

export const BIT_GLYPH_SET_NAMES = ["binary", "blocks", "dots", "slashes"] as const;

export const BIT_GLYPH_PAIRS: Record<(typeof BIT_GLYPH_SET_NAMES)[number], readonly [string, string]> = {
  binary: ["0", "1"],
  blocks: ["░", "█"],
  dots: [".", "#"],
  slashes: ["\\", "/"],
};
