export type GlyphPalette = {
  backgroundColor: string;
  levelColors: string[];
};

export type GlyphMetrics = {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  cellAspect: number;
  canvasWidth: number;
  canvasHeight: number;
  palette: GlyphPalette;
};

export type LuminanceGrid = Float32Array;

export type PointerPosition = {
  x: number;
  y: number;
};

export type GlyphFrame = {
  context: CanvasRenderingContext2D;
  metrics: GlyphMetrics;
  timeSeconds: number;
  deltaSeconds: number;
  pointer: PointerPosition | null;
  isPointerDown: boolean;
  prefersReducedMotion: boolean;
};
