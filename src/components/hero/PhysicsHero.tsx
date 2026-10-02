"use client";

import {
  GLYPH_RAMP,
  clearFrame,
  levelForLuminance,
} from "@/lib/ascii/glyphStyle";
import { sampleWordmark } from "@/lib/ascii/luminanceGrids";
import type { GlyphFrame, GlyphMetrics, PointerPosition } from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

type Particle = {
  glyph: string;
  restColor: string;
  homeX: number;
  homeY: number;
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
};

type PhysicsScene = {
  particles: Particle[];
};

const MIN_PARTICLE_LUMINANCE = 0.3;
const SPRING_STRENGTH = 0.02;
const VELOCITY_DAMPING = 0.86;
const REPULSION_RADIUS_PIXELS = 110;
const REPULSION_STRENGTH = 2.2;
const MOVING_SPEED_THRESHOLD = 0.6;
const MAX_DELTA_SECONDS = 0.05;
const REFERENCE_FRAMES_PER_SECOND = 60;

function createScene(metrics: GlyphMetrics): PhysicsScene {
  const wordmarkGrid = sampleWordmark(metrics);
  const particles: Particle[] = [];

  wordmarkGrid.forEach((luminance, cellIndex) => {
    if (luminance < MIN_PARTICLE_LUMINANCE) return;

    const level = levelForLuminance(luminance);
    particles.push({
      glyph: GLYPH_RAMP[level],
      restColor: metrics.palette.levelColors[level],
      homeX: (cellIndex % metrics.columns) * metrics.cellWidth,
      homeY: Math.floor(cellIndex / metrics.columns) * metrics.cellHeight,
      positionX: Math.random() * metrics.canvasWidth,
      positionY: Math.random() * metrics.canvasHeight,
      velocityX: 0,
      velocityY: 0,
    });
  });

  return { particles };
}

function updateParticle(
  particle: Particle,
  pointer: PointerPosition | null,
  stepScale: number,
): void {
  particle.velocityX += (particle.homeX - particle.positionX) * SPRING_STRENGTH * stepScale;
  particle.velocityY += (particle.homeY - particle.positionY) * SPRING_STRENGTH * stepScale;

  if (pointer) {
    const offsetX = particle.positionX - pointer.x;
    const offsetY = particle.positionY - pointer.y;
    const distance = Math.hypot(offsetX, offsetY);
    if (distance > 0 && distance < REPULSION_RADIUS_PIXELS) {
      const push = (1 - distance / REPULSION_RADIUS_PIXELS) * REPULSION_STRENGTH * stepScale;
      particle.velocityX += (offsetX / distance) * push;
      particle.velocityY += (offsetY / distance) * push;
    }
  }

  const damping = VELOCITY_DAMPING ** stepScale;
  particle.velocityX *= damping;
  particle.velocityY *= damping;
  particle.positionX += particle.velocityX * stepScale;
  particle.positionY += particle.velocityY * stepScale;
}

function drawScene(scene: PhysicsScene, frame: GlyphFrame): void {
  const { context, metrics, deltaSeconds, pointer, prefersReducedMotion } = frame;
  const stepScale =
    Math.min(deltaSeconds, MAX_DELTA_SECONDS) * REFERENCE_FRAMES_PER_SECOND;
  const movingColor = metrics.palette.levelColors[metrics.palette.levelColors.length - 1];
  let activeColor = "";

  clearFrame(frame);

  for (const particle of scene.particles) {
    if (prefersReducedMotion) {
      particle.positionX = particle.homeX;
      particle.positionY = particle.homeY;
    } else {
      updateParticle(particle, pointer, stepScale);
    }

    const speed = Math.hypot(particle.velocityX, particle.velocityY);
    const color = speed > MOVING_SPEED_THRESHOLD ? movingColor : particle.restColor;
    if (color !== activeColor) {
      context.fillStyle = color;
      activeColor = color;
    }
    context.fillText(particle.glyph, particle.positionX, particle.positionY);
  }
}

export function PhysicsHero() {
  return <GlyphCanvas createScene={createScene} drawScene={drawScene} />;
}
