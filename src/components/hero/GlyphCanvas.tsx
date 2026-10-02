"use client";

import { useEffect, useRef } from "react";
import { GLYPH_FONT_FAMILY, readGlyphPalette } from "@/lib/ascii/glyphStyle";
import type {
  GlyphFrame,
  GlyphMetrics,
  PointerPosition,
} from "@/lib/ascii/types";

const NARROW_CANVAS_MAX_WIDTH_PIXELS = 700;
const NARROW_FONT_SIZE_PIXELS = 9;
const WIDE_FONT_SIZE_PIXELS = 12;
const CELL_HEIGHT_RATIO = 1.15;
const MAX_DEVICE_PIXEL_RATIO = 2;

export type CanvasPress = PointerPosition & { isSecondaryButton: boolean };

export type GlyphCanvasProps<Scene> = {
  createScene: (metrics: GlyphMetrics) => Scene;
  drawScene: (scene: Scene, frame: GlyphFrame) => void;
  mergeSceneOnResize?: (previousScene: Scene, metrics: GlyphMetrics) => Scene;
  onPress?: (scene: Scene, press: CanvasPress, metrics: GlyphMetrics) => void;
  onKeyDown?: (scene: Scene, event: KeyboardEvent, metrics: GlyphMetrics) => void;
  wideFontSizePixels?: number;
  narrowFontSizePixels?: number;
};

export function GlyphCanvas<Scene>({
  createScene,
  drawScene,
  mergeSceneOnResize,
  onPress,
  onKeyDown,
  wideFontSizePixels = WIDE_FONT_SIZE_PIXELS,
  narrowFontSizePixels = NARROW_FONT_SIZE_PIXELS,
}: GlyphCanvasProps<Scene>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const createSceneRef = useRef(createScene);
  const drawSceneRef = useRef(drawScene);
  const mergeSceneOnResizeRef = useRef(mergeSceneOnResize);
  const onPressRef = useRef(onPress);
  const onKeyDownRef = useRef(onKeyDown);

  createSceneRef.current = createScene;
  drawSceneRef.current = drawScene;
  mergeSceneOnResizeRef.current = mergeSceneOnResize;
  onPressRef.current = onPress;
  onKeyDownRef.current = onKeyDown;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const startTimestamp = performance.now();
    let previousTimestamp = startTimestamp;
    let metrics: GlyphMetrics | null = null;
    let scene: Scene | null = null;
    let pointer: PointerPosition | null = null;
    let isPointerDown = false;
    let animationFrameId = 0;
    let lastColumnCount = 0;
    let lastRowCount = 0;

    const handleResize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;

      const devicePixelRatio = Math.min(
        window.devicePixelRatio || 1,
        MAX_DEVICE_PIXEL_RATIO,
      );
      canvas.width = Math.round(bounds.width * devicePixelRatio);
      canvas.height = Math.round(bounds.height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      const fontSizePixels =
        bounds.width <= NARROW_CANVAS_MAX_WIDTH_PIXELS
          ? narrowFontSizePixels
          : wideFontSizePixels;
      context.font = `${fontSizePixels}px ${GLYPH_FONT_FAMILY}`;
      context.textBaseline = "top";

      const cellWidth = context.measureText("M").width;
      const cellHeight = fontSizePixels * CELL_HEIGHT_RATIO;
      const nextMetrics: GlyphMetrics = {
        columns: Math.floor(bounds.width / cellWidth),
        rows: Math.floor(bounds.height / cellHeight),
        cellWidth,
        cellHeight,
        cellAspect: cellHeight / cellWidth,
        canvasWidth: bounds.width,
        canvasHeight: bounds.height,
        palette: readGlyphPalette(),
      };

      const gridSizeChanged =
        nextMetrics.columns !== lastColumnCount || nextMetrics.rows !== lastRowCount;

      metrics = nextMetrics;
      lastColumnCount = nextMetrics.columns;
      lastRowCount = nextMetrics.rows;

      if (!scene || gridSizeChanged) {
        if (scene && mergeSceneOnResizeRef.current) {
          scene = mergeSceneOnResizeRef.current(scene, nextMetrics);
        } else {
          scene = createSceneRef.current(nextMetrics);
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const isInsideCanvas = x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height;
      pointer = isInsideCanvas ? { x, y } : null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      isPointerDown = true;
      if (!onPressRef.current || !scene || !metrics) return;
      onPressRef.current(
        scene,
        {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
          isSecondaryButton: event.button === 2 || event.ctrlKey,
        },
        metrics,
      );
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (onPressRef.current) event.preventDefault();
    };

    const handlePointerRelease = (event: PointerEvent) => {
      isPointerDown = false;
      if (event.pointerType !== "mouse") pointer = null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!onKeyDownRef.current || !scene || !metrics) return;
      const { target } = event;
      const isTypingTarget =
        target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
      if (!isTypingTarget) onKeyDownRef.current(scene, event, metrics);
    };

    const handlePointerLeave = () => {
      pointer = null;
    };

    const renderLoop = (timestamp: number) => {
      if (metrics && scene) {
        drawSceneRef.current(scene, {
          context,
          metrics,
          timeSeconds: Math.max(0, timestamp - startTimestamp) / 1000,
          deltaSeconds: Math.max(0, timestamp - previousTimestamp) / 1000,
          pointer,
          isPointerDown,
          prefersReducedMotion: reducedMotionQuery.matches,
        });
      }
      previousTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerRelease);
    window.addEventListener("pointercancel", handlePointerRelease);
    window.addEventListener("keydown", handleKeyDown);
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    handleResize();
    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerRelease);
      window.removeEventListener("pointercancel", handlePointerRelease);
      window.removeEventListener("keydown", handleKeyDown);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [wideFontSizePixels, narrowFontSizePixels]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
