"use client";

import { useCallback, useRef } from "react";
import { GLYPH_RAMP, clearFrame, levelForLuminance } from "@/lib/ascii/glyphStyle";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

type Vec3 = [number, number, number];

type Point = {
  position: Vec3;
  normal: Vec3;
};

type SolidGeometry = {
  points: Point[];
};

type SolidsScene = {
  geometry: SolidGeometry;
  solidIndex: number;
  rotationX: number;
  rotationY: number;
  lightDir: Vec3;
  zoom: number;
};

const POINT_DENSITY = 40;

function createCube(): SolidGeometry {
  const points: Point[] = [];
  const step = 2 / POINT_DENSITY;

  for (let u = -1; u <= 1; u += step) {
    for (let v = -1; v <= 1; v += step) {
      points.push({ position: [u, v, 1], normal: [0, 0, 1] });
      points.push({ position: [u, v, -1], normal: [0, 0, -1] });
      points.push({ position: [u, 1, v], normal: [0, 1, 0] });
      points.push({ position: [u, -1, v], normal: [0, -1, 0] });
      points.push({ position: [1, u, v], normal: [1, 0, 0] });
      points.push({ position: [-1, u, v], normal: [-1, 0, 0] });
    }
  }
  return { points };
}

function createTorus(): SolidGeometry {
  const points: Point[] = [];
  const majorRadius = 0.8;
  const minorRadius = 0.3;
  const stepsU = POINT_DENSITY * 2;
  const stepsV = POINT_DENSITY;

  for (let stepIndexU = 0; stepIndexU < stepsU; stepIndexU++) {
    const angleU = (stepIndexU / stepsU) * Math.PI * 2;
    for (let stepIndexV = 0; stepIndexV < stepsV; stepIndexV++) {
      const angleV = (stepIndexV / stepsV) * Math.PI * 2;
      const x = (majorRadius + minorRadius * Math.cos(angleV)) * Math.cos(angleU);
      const y = (majorRadius + minorRadius * Math.cos(angleV)) * Math.sin(angleU);
      const z = minorRadius * Math.sin(angleV);

      const normalX = Math.cos(angleV) * Math.cos(angleU);
      const normalY = Math.cos(angleV) * Math.sin(angleU);
      const normalZ = Math.sin(angleV);

      points.push({ position: [x, y, z], normal: [normalX, normalY, normalZ] });
    }
  }
  return { points };
}

function createSineSurface(): SolidGeometry {
  const points: Point[] = [];
  const step = 2 / POINT_DENSITY;

  for (let x = -2; x <= 2; x += step) {
    for (let y = -2; y <= 2; y += step) {
      const distance = Math.hypot(x, y) * 3;
      const z = distance === 0 ? 1 : Math.sin(distance) / distance;

      const delta = 0.01;
      const distanceX = Math.hypot(x + delta, y) * 3;
      const distanceY = Math.hypot(x, y + delta) * 3;
      const zAtX = distanceX === 0 ? 1 : Math.sin(distanceX) / distanceX;
      const zAtY = distanceY === 0 ? 1 : Math.sin(distanceY) / distanceY;

      const normalX = z - zAtX;
      const normalY = z - zAtY;
      const normalZ = delta;

      const normalLength = Math.hypot(normalX, normalY, normalZ);
      points.push({
        position: [x * 0.5, y * 0.5, z * 0.5],
        normal: [normalX / normalLength, normalY / normalLength, normalZ / normalLength],
      });
    }
  }
  return { points };
}

const SOLIDS = [createCube, createTorus, createSineSurface];

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length === 0) return [0, 0, 1];
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function rotateX(point: Vec3, angle: number): Vec3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [point[0], point[1] * cosine - point[2] * sine, point[1] * sine + point[2] * cosine];
}

function rotateY(point: Vec3, angle: number): Vec3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [point[0] * cosine + point[2] * sine, point[1], -point[0] * sine + point[2] * cosine];
}

function createInitialScene(): SolidsScene {
  return {
    geometry: SOLIDS[0](),
    solidIndex: 0,
    rotationX: Math.PI / 6,
    rotationY: -Math.PI / 4,
    lightDir: normalize([1, -1, 1]),
    zoom: 1.0,
  };
}

function createScene(_metrics: GlyphMetrics): SolidsScene {
  return createInitialScene();
}

function mergeSceneOnResize(previousScene: SolidsScene, _metrics: GlyphMetrics): SolidsScene {
  return {
    geometry: SOLIDS[previousScene.solidIndex](),
    solidIndex: previousScene.solidIndex,
    rotationX: previousScene.rotationX,
    rotationY: previousScene.rotationY,
    lightDir: previousScene.lightDir,
    zoom: previousScene.zoom,
  };
}

export function SolidsHero() {
  const sceneRef = useRef<SolidsScene | null>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const readoutFrameCounterRef = useRef(0);

  const drawScene = useCallback((scene: SolidsScene, frame: GlyphFrame) => {
    sceneRef.current = scene;
    const { context, metrics, pointer, deltaSeconds, prefersReducedMotion } = frame;
    const { columns, rows, cellAspect } = metrics;

    if (!prefersReducedMotion && !isDraggingRef.current) {
      scene.rotationY += 0.1 * deltaSeconds;
      scene.rotationX += 0.05 * deltaSeconds;
    }

    if (isDraggingRef.current && pointer && lastPointerRef.current) {
      const deltaX = pointer.x - lastPointerRef.current.x;
      const deltaY = pointer.y - lastPointerRef.current.y;
      scene.rotationY += deltaX * 0.01;
      scene.rotationX += deltaY * 0.01;
    }

    if (pointer) {
      lastPointerRef.current = { x: pointer.x, y: pointer.y };
    }

    readoutFrameCounterRef.current += 1;
    if (readoutRef.current && readoutFrameCounterRef.current % 4 === 0) {
      readoutRef.current.textContent = `X ${(scene.rotationX % (Math.PI * 2)).toFixed(2)} Y ${(scene.rotationY % (Math.PI * 2)).toFixed(2)} Z ${scene.zoom.toFixed(2)}`;
    }

    clearFrame(frame);

    const zBuffer = new Float32Array(columns * rows).fill(-Infinity);
    const lumBuffer = new Float32Array(columns * rows).fill(0);

    const scale = Math.min(columns, rows) * 0.4 * scene.zoom;
    const centerX = columns / 2;
    const centerY = rows / 2;

    for (const point of scene.geometry.points) {
      let transformed = rotateX(point.position, scene.rotationX);
      transformed = rotateY(transformed, scene.rotationY);

      let transformedNormal = rotateX(point.normal, scene.rotationX);
      transformedNormal = rotateY(transformedNormal, scene.rotationY);

      const x = Math.floor(centerX + transformed[0] * scale);
      const y = Math.floor(centerY + transformed[1] * scale / cellAspect);
      const z = transformed[2];

      if (x >= 0 && x < columns && y >= 0 && y < rows) {
        const cellIndex = y * columns + x;
        if (z > zBuffer[cellIndex]) {
          zBuffer[cellIndex] = z;
          const dot =
            transformedNormal[0] * scene.lightDir[0] +
            transformedNormal[1] * scene.lightDir[1] +
            transformedNormal[2] * scene.lightDir[2];
          lumBuffer[cellIndex] = Math.max(0.1, dot);
        }
      }
    }

    context.textBaseline = "top";
    let activeColor = "";

    for (let cellIndex = 0; cellIndex < columns * rows; cellIndex++) {
      if (zBuffer[cellIndex] === -Infinity) continue;
      const x = (cellIndex % columns) * metrics.cellWidth;
      const y = Math.floor(cellIndex / columns) * metrics.cellHeight;
      const level = levelForLuminance(lumBuffer[cellIndex]);
      const color = metrics.palette.levelColors[level];
      if (color !== activeColor) {
        context.fillStyle = color;
        activeColor = color;
      }
      context.fillText(GLYPH_RAMP[level], x, y);
    }
  }, []);

  const handlePointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    (event.target as Element).releasePointerCapture(event.pointerId);
    isDraggingRef.current = false;
    lastPointerRef.current = null;
  };

  const handleClick = () => {
    if (!sceneRef.current || isDraggingRef.current) return;
    const scene = sceneRef.current;
    scene.solidIndex = (scene.solidIndex + 1) % SOLIDS.length;
    scene.geometry = SOLIDS[scene.solidIndex]();
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!sceneRef.current) return;
    const zoomDelta = event.deltaY * -0.001;
    sceneRef.current.zoom = Math.max(0.6, Math.min(1.8, sceneRef.current.zoom + zoomDelta));
  };

  return (
    <div
      className="absolute inset-0 outline-none select-none cursor-crosshair touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <GlyphCanvas
        createScene={createScene}
        drawScene={drawScene}
        mergeSceneOnResize={mergeSceneOnResize}
      />
      <div className="absolute bottom-6 left-6 font-mono text-[11px] uppercase tracking-widest text-light">
        <span ref={readoutRef}>X 0.00 Y 0.00 Z 0.00</span>
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[11px] uppercase tracking-widest text-mid">
        Drag to rotate · Scroll to zoom · Click to change solid
      </div>
    </div>
  );
}
