import {
  GLYPH_RAMP,
  clearFrame,
  levelForLuminance,
  pointerHeatLuminance,
} from "./glyphStyle";
import { smoothStep } from "./easing";
import type { GlyphFrame, GlyphMetrics, LuminanceGrid } from "./types";

export type GridMorphParticle = {
  cellIndex: number;
  x: number;
  y: number;
  luminance: number;
  targetLuminance: number;
  delay: number;
};

export type GridMorphState = {
  grids: LuminanceGrid[];
  particles: GridMorphParticle[];
  transitionProgress: number;
  isTransitioning: boolean;
  riseOffsetCells: number;
};

export function buildGridsForMetrics(
  metrics: GlyphMetrics,
  gridFactories: ((metrics: GlyphMetrics) => LuminanceGrid)[],
): LuminanceGrid[] {
  return gridFactories.map((factory) => factory(metrics));
}

export function createGridMorphState(
  metrics: GlyphMetrics,
  grids: LuminanceGrid[],
): GridMorphState {
  const particles: GridMorphParticle[] = [];
  const startGrid = grids[0];

  for (let rowIndex = 0; rowIndex < metrics.rows; rowIndex++) {
    for (let columnIndex = 0; columnIndex < metrics.columns; columnIndex++) {
      const cellIndex = rowIndex * metrics.columns + columnIndex;
      particles.push({
        cellIndex,
        x: columnIndex,
        y: rowIndex,
        luminance: 0,
        targetLuminance: startGrid[cellIndex],
        delay: (columnIndex / metrics.columns + rowIndex / metrics.rows) * 0.4,
      });
    }
  }

  return {
    grids,
    particles,
    transitionProgress: 1,
    isTransitioning: false,
    riseOffsetCells: 0,
  };
}

export function applyGridBlendTargets(
  state: GridMorphState,
  fromGrid: LuminanceGrid,
  toGrid: LuminanceGrid,
  blendProgress: number,
  riseCells: number,
): void {
  const easedProgress = smoothStep(blendProgress);
  state.riseOffsetCells = riseCells * easedProgress;
  state.isTransitioning = blendProgress > 0 && blendProgress < 1;
  state.transitionProgress = easedProgress;

  for (const particle of state.particles) {
    const fromLuminance = fromGrid[particle.cellIndex];
    const toLuminance = toGrid[particle.cellIndex];
    particle.targetLuminance =
      fromLuminance + (toLuminance - fromLuminance) * easedProgress;
  }
}

export function startGridMorphToIndex(state: GridMorphState, gridIndex: number): void {
  const nextGrid = state.grids[gridIndex];
  state.isTransitioning = true;
  state.transitionProgress = 0;
  for (const particle of state.particles) {
    particle.targetLuminance = nextGrid[particle.cellIndex];
    particle.luminance = 0;
  }
}

export function advanceClickMorphTransition(
  state: GridMorphState,
  deltaSeconds: number,
): void {
  if (!state.isTransitioning) return;
  state.transitionProgress += deltaSeconds * 0.8;
  if (state.transitionProgress >= 1) {
    state.isTransitioning = false;
    state.transitionProgress = 1;
  }
}

export function drawGridMorphParticles(
  state: GridMorphState,
  frame: GlyphFrame,
  options?: { pointerRadiusCells?: number },
): void {
  const { context, metrics, prefersReducedMotion } = frame;
  const pointerRadiusCells = options?.pointerRadiusCells ?? 10;

  clearFrame(frame);

  let activeColor = "";

  for (const particle of state.particles) {
    const columnIndex = particle.cellIndex % metrics.columns;
    const rowIndex = Math.floor(particle.cellIndex / metrics.columns);

    if (prefersReducedMotion) {
      particle.luminance = particle.targetLuminance;
      particle.x = columnIndex;
      particle.y = rowIndex - state.riseOffsetCells;
    } else if (state.isTransitioning) {
      const localProgress = Math.max(
        0,
        Math.min(1, state.transitionProgress * 2 - particle.delay),
      );
      const ease = smoothStep(localProgress);
      particle.luminance += (particle.targetLuminance * ease - particle.luminance) * 0.12;
      const noiseX = (Math.random() - 0.5) * (1 - ease) * 6;
      const noiseY = (Math.random() - 0.5) * (1 - ease) * 6;
      particle.x = columnIndex + noiseX;
      particle.y = rowIndex - state.riseOffsetCells + noiseY;
    } else {
      particle.luminance += (particle.targetLuminance - particle.luminance) * 0.15;
      particle.x = columnIndex;
      particle.y = rowIndex - state.riseOffsetCells;
    }

    const drawLuminance = Math.max(
      particle.luminance,
      pointerHeatLuminance(frame, particle.x, particle.y, pointerRadiusCells),
    );

    if (drawLuminance < 0.04) continue;

    const level = levelForLuminance(drawLuminance);
    const color = metrics.palette.levelColors[level];
    if (color !== activeColor) {
      context.fillStyle = color;
      activeColor = color;
    }
    context.fillText(
      GLYPH_RAMP[level],
      particle.x * metrics.cellWidth,
      particle.y * metrics.cellHeight,
    );
  }
}
