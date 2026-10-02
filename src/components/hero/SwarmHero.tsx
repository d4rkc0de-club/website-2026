"use client";

import { useEffect, useRef, useState } from "react";
import {
  GLYPH_RAMP,
  clearFrame,
  levelForLuminance,
} from "@/lib/ascii/glyphStyle";
import { sampleText, sampleWordmark } from "@/lib/ascii/luminanceGrids";
import type {
  GlyphFrame,
  GlyphMetrics,
  LuminanceGrid,
  PointerPosition,
} from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

type Boid = {
  homeX: number;
  homeY: number;
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
  phase: number;
  restColor: string;
};

type SwarmScene = {
  boids: Boid[];
  formations: LuminanceGrid[];
  currentFormationIndex: number;
  accentColor: string;
};

const MIN_LUMINANCE = 0.3;
const SPRING_STRENGTH = 0.08;
const VELOCITY_DAMPING = 0.82;
const FLAP_FREQUENCY = 15;
const IDLE_FIGURE_EIGHT_SCALE_X = 80;
const IDLE_FIGURE_EIGHT_SCALE_Y = 40;
const IDLE_FIGURE_EIGHT_SPEED = 0.8;
const POINTER_ORBIT_RADIUS = 60;
const POINTER_ORBIT_SPEED = 2;
const MAX_DELTA_SECONDS = 0.05;
const REFERENCE_FRAMES_PER_SECOND = 60;

function createFormationTargets(
  metrics: GlyphMetrics,
  grid: LuminanceGrid,
): { x: number; y: number; color: string }[] {
  const targets: { x: number; y: number; color: string }[] = [];
  grid.forEach((luminance, cellIndex) => {
    if (luminance >= MIN_LUMINANCE) {
      const level = levelForLuminance(luminance);
      targets.push({
        x: (cellIndex % metrics.columns) * metrics.cellWidth,
        y: Math.floor(cellIndex / metrics.columns) * metrics.cellHeight,
        color: metrics.palette.levelColors[level],
      });
    }
  });
  return targets;
}

function createScene(metrics: GlyphMetrics): SwarmScene {
  const wordmarkGrid = sampleWordmark(metrics);
  const waspGrid = sampleText(metrics, ["OWASP"]);
  const meganeuraGrid = sampleText(metrics, ["MEGANEURA"]);

  const formations = [wordmarkGrid, waspGrid, meganeuraGrid];
  const initialTargets = createFormationTargets(metrics, wordmarkGrid);

  const boids: Boid[] = initialTargets.map((target) => ({
    homeX: target.x,
    homeY: target.y,
    positionX: Math.random() * metrics.canvasWidth,
    positionY: Math.random() * metrics.canvasHeight,
    velocityX: (Math.random() - 0.5) * 20,
    velocityY: (Math.random() - 0.5) * 20,
    phase: Math.random() * Math.PI * 2,
    restColor: target.color,
  }));

  const accentColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim() || "#ff3333";

  return {
    boids,
    formations,
    currentFormationIndex: 0,
    accentColor,
  };
}

function updateBoid(
  boid: Boid,
  frame: GlyphFrame,
  targetX: number,
  targetY: number,
  stepScale: number,
) {
  const { pointer } = frame;

  let currentTargetX = targetX;
  let currentTargetY = targetY;

  if (pointer) {
    const orbitAngle = frame.timeSeconds * POINTER_ORBIT_SPEED + boid.phase;
    currentTargetX = pointer.x + Math.cos(orbitAngle) * POINTER_ORBIT_RADIUS;
    currentTargetY = pointer.y + Math.sin(orbitAngle) * POINTER_ORBIT_RADIUS;
  } else {
    const idleAngle =
      frame.timeSeconds * IDLE_FIGURE_EIGHT_SPEED + boid.phase * 0.1;
    currentTargetX += Math.sin(idleAngle) * IDLE_FIGURE_EIGHT_SCALE_X;
    currentTargetY += Math.sin(idleAngle * 2) * IDLE_FIGURE_EIGHT_SCALE_Y;
  }

  boid.velocityX +=
    (currentTargetX - boid.positionX) * SPRING_STRENGTH * stepScale;
  boid.velocityY +=
    (currentTargetY - boid.positionY) * SPRING_STRENGTH * stepScale;

  const damping = VELOCITY_DAMPING ** stepScale;
  boid.velocityX *= damping;
  boid.velocityY *= damping;

  boid.positionX += boid.velocityX * stepScale;
  boid.positionY += boid.velocityY * stepScale;
}

export function SwarmHero() {
  const sceneRef = useRef<SwarmScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawScene = (scene: SwarmScene, frame: GlyphFrame) => {
    sceneRef.current = scene;
    const { context, deltaSeconds, prefersReducedMotion } = frame;
    const stepScale =
      Math.min(deltaSeconds, MAX_DELTA_SECONDS) * REFERENCE_FRAMES_PER_SECOND;

    clearFrame(frame);

    let activeColor = "";

    for (const boid of scene.boids) {
      if (prefersReducedMotion) {
        boid.positionX = boid.homeX;
        boid.positionY = boid.homeY;
      } else {
        updateBoid(boid, frame, boid.homeX, boid.homeY, stepScale);
      }

      if (boid.restColor !== activeColor) {
        context.fillStyle = boid.restColor;
        activeColor = boid.restColor;
      }

      const flapState = Math.sin(
        frame.timeSeconds * FLAP_FREQUENCY + boid.phase,
      );
      let glyph = flapState > 0 ? "v" : "^";

      const speed = Math.hypot(boid.velocityX, boid.velocityY);
      if (speed > 15) {
        glyph = Math.abs(boid.velocityX) > Math.abs(boid.velocityY) ? "-" : "|";
      }

      context.fillText(glyph, boid.positionX, boid.positionY);
    }
  };

  const handlePointerDown = () => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    scene.currentFormationIndex =
      (scene.currentFormationIndex + 1) % scene.formations.length;

    const container = containerRef.current;
    if (!container) return;
    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const fontSize = parseInt(context.font, 10);
    const cellWidth = context.measureText("M").width;
    const cellHeight = fontSize * 1.15;

    const metrics: GlyphMetrics = {
      columns: Math.floor(canvas.width / window.devicePixelRatio / cellWidth),
      rows: Math.floor(canvas.height / window.devicePixelRatio / cellHeight),
      cellWidth,
      cellHeight,
      cellAspect: cellHeight / cellWidth,
      canvasWidth: canvas.width / window.devicePixelRatio,
      canvasHeight: canvas.height / window.devicePixelRatio,
      palette: {
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue("--color-void")
          .trim(),
        levelColors: [
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-void")
            .trim(),
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-mid")
            .trim(),
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-mid")
            .trim(),
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-light")
            .trim(),
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-light")
            .trim(),
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-paper")
            .trim(),
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-paper")
            .trim(),
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-white")
            .trim(),
        ],
      },
    };

    let nextGrid = scene.formations[scene.currentFormationIndex];

    if (
      metrics.columns !== Math.floor(nextGrid.length / metrics.rows) &&
      scene.currentFormationIndex === 0
    ) {
      nextGrid = sampleWordmark(metrics);
      scene.formations[0] = nextGrid;
    }

    const newTargets = createFormationTargets(metrics, nextGrid);

    scene.boids.forEach((boid, index) => {
      const target = newTargets[index % newTargets.length];
      boid.homeX = target.x;
      boid.homeY = target.y;
      boid.restColor = target.color;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      handlePointerDown();
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 outline-none"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    >
      <GlyphCanvas createScene={createScene} drawScene={drawScene} />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-widest text-light">
        Click / Space to cycle formations
      </div>
    </div>
  );
}
