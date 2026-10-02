"use client";

import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import { EYES_IMAGE } from "@/content/eyesImage";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import {
  GLYPH_RAMP,
  clearFrame,
  createThemeColorReader,
  levelForLuminance,
} from "@/lib/ascii/glyphStyle";
import { createImageSampler } from "@/lib/ascii/imageSampler";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import type { ConfigOf } from "@/lib/variantControls";
import type { ASCII_EYES_CONTROLS } from "./controls/asciiEyesControls";

type AsciiEyesConfig = ConfigOf<typeof ASCII_EYES_CONTROLS>;

const EYES_CENTER_WIDTH_SHARE = 0.50065;
const EYES_CENTER_HEIGHT_SHARE = 0.51095;
const HALF_EYE_SEPARATION_WIDTH_SHARE = 0.25625;
const IRIS_RADIUS_WIDTH_SHARE = 0.0417;
const IRIS_RADIUS_HEIGHT_SHARE = 0.1167;
const EYE_SIDES = [-1, 1] as const;

const sampleEyesImage = createImageSampler(EYES_IMAGE);

type ArtCell = { character: string; color: string; column: number; row: number };

type EyeCenter = { column: number; row: number };

type EyesScene = {
  artCells: ArtCell[];
  artLayer: HTMLCanvasElement | null;
  eyeCenters: EyeCenter[];
  gazeCenter: EyeCenter;
  irisRadiusColumns: number;
  irisRadiusRows: number;
  gazeOffsetColumns: number;
  gazeOffsetRows: number;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

function sampleCellLuminance(
  columnInArt: number,
  rowInArt: number,
  widthCells: number,
  heightCells: number,
  samplesPerCellAxis: number,
): number {
  let luminanceSum = 0;
  for (let sampleRow = 0; sampleRow < samplesPerCellAxis; sampleRow++) {
    for (let sampleColumn = 0; sampleColumn < samplesPerCellAxis; sampleColumn++) {
      luminanceSum += sampleEyesImage(
        (columnInArt + (sampleColumn + 0.5) / samplesPerCellAxis) / widthCells,
        (rowInArt + (sampleRow + 0.5) / samplesPerCellAxis) / heightCells,
      );
    }
  }
  return luminanceSum / (samplesPerCellAxis * samplesPerCellAxis);
}

function createScene(metrics: GlyphMetrics, config: AsciiEyesConfig): EyesScene {
  const { columns, rows, cellAspect, palette } = metrics;
  const imageAspect = EYES_IMAGE.columns / EYES_IMAGE.rows;
  const widthCells = Math.floor(
    Math.min(columns, rows * imageAspect * cellAspect) * config.imageFillShare,
  );
  const heightCells = Math.floor(widthCells / (imageAspect * cellAspect));
  const leftColumn = Math.floor((columns - widthCells) / 2);
  const topRow = Math.floor((rows - heightCells) / 2);

  const artCells: ArtCell[] = [];
  for (let row = topRow; row < topRow + heightCells; row++) {
    for (let column = leftColumn; column < leftColumn + widthCells; column++) {
      const luminance = sampleCellLuminance(
        column - leftColumn,
        row - topRow,
        widthCells,
        heightCells,
        config.samplesPerCellAxis,
      );
      const level = levelForLuminance(luminance);
      if (level > 0) {
        artCells.push({ character: GLYPH_RAMP[level], color: palette.levelColors[level], column, row });
      }
    }
  }

  const gazeCenter = {
    column: leftColumn + EYES_CENTER_WIDTH_SHARE * widthCells,
    row: topRow + EYES_CENTER_HEIGHT_SHARE * heightCells,
  };

  return {
    artCells,
    artLayer: null,
    eyeCenters: EYE_SIDES.map((side) => ({
      column: gazeCenter.column + side * HALF_EYE_SEPARATION_WIDTH_SHARE * widthCells,
      row: gazeCenter.row,
    })),
    gazeCenter,
    irisRadiusColumns: IRIS_RADIUS_WIDTH_SHARE * widthCells,
    irisRadiusRows: IRIS_RADIUS_HEIGHT_SHARE * heightCells,
    gazeOffsetColumns: 0,
    gazeOffsetRows: 0,
    readThemeColor: createThemeColorReader(),
  };
}

function renderArtLayer(artCells: ArtCell[], { context, metrics }: GlyphFrame): HTMLCanvasElement {
  const pixelRatio = context.getTransform().a;
  const layer = document.createElement("canvas");
  layer.width = Math.round(metrics.canvasWidth * pixelRatio);
  layer.height = Math.round(metrics.canvasHeight * pixelRatio);
  const layerContext = layer.getContext("2d");
  if (!layerContext) return layer;

  layerContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  layerContext.font = context.font;
  layerContext.textBaseline = "top";
  artCells.forEach(({ character, color, column, row }) => {
    drawGlyphCell(layerContext, metrics, character, column, row, color);
  });
  return layer;
}

function targetGazeOffset(
  scene: EyesScene,
  pointerColumn: number,
  pointerRow: number,
  travelColumns: number,
  travelRows: number,
  gazeRangeInTravels: number,
) {
  const deltaColumns = pointerColumn - scene.gazeCenter.column;
  const deltaRows = pointerRow - scene.gazeCenter.row;
  const ellipseDistance = Math.hypot(deltaColumns / travelColumns, deltaRows / travelRows);
  if (ellipseDistance === 0) return { columns: 0, rows: 0 };

  const deflectionShare = Math.min(1, ellipseDistance / gazeRangeInTravels);
  return {
    columns: (deltaColumns / ellipseDistance) * deflectionShare,
    rows: (deltaRows / ellipseDistance) * deflectionShare,
  };
}

function moveGaze(scene: EyesScene, frame: GlyphFrame, config: AsciiEyesConfig): void {
  const { pointer, metrics, deltaSeconds, prefersReducedMotion } = frame;
  const retinaWidthCells = config.retinaWidthBaseCells * config.artGrainFactor;
  const retinaHeightCells = config.retinaHeightBaseCells * config.artGrainFactor;
  const target = pointer
    ? targetGazeOffset(
        scene,
        pointer.x / metrics.cellWidth,
        pointer.y / metrics.cellHeight,
        Math.max(1, scene.irisRadiusColumns - retinaWidthCells / 2),
        Math.max(1, scene.irisRadiusRows - retinaHeightCells / 2),
        config.gazeRangeInTravels,
      )
    : { columns: 0, rows: 0 };
  const followShare = prefersReducedMotion
    ? 1
    : 1 - Math.exp(-deltaSeconds * config.retinaFollowRatePerSecond);
  scene.gazeOffsetColumns += (target.columns - scene.gazeOffsetColumns) * followShare;
  scene.gazeOffsetRows += (target.rows - scene.gazeOffsetRows) * followShare;
}

function drawRetina(
  scene: EyesScene,
  eyeCenter: EyeCenter,
  { context, metrics }: GlyphFrame,
  config: AsciiEyesConfig,
): void {
  const retinaWidthCells = config.retinaWidthBaseCells * config.artGrainFactor;
  const retinaHeightCells = config.retinaHeightBaseCells * config.artGrainFactor;
  const leftColumn = eyeCenter.column + scene.gazeOffsetColumns - retinaWidthCells / 2;
  const topRow = eyeCenter.row + scene.gazeOffsetRows - retinaHeightCells / 2;
  context.fillStyle = scene.readThemeColor(config.retinaColorName);
  context.fillRect(
    leftColumn * metrics.cellWidth,
    topRow * metrics.cellHeight,
    retinaWidthCells * metrics.cellWidth,
    retinaHeightCells * metrics.cellHeight,
  );
}

type AsciiEyesProps = {
  config: AsciiEyesConfig;
};

export function AsciiEyes({ config }: AsciiEyesProps) {
  const drawScene = (scene: EyesScene, frame: GlyphFrame) => {
    const { context, metrics } = frame;
    scene.artLayer ??= renderArtLayer(scene.artCells, frame);
    clearFrame(frame);
    context.drawImage(scene.artLayer, 0, 0, metrics.canvasWidth, metrics.canvasHeight);
    moveGaze(scene, frame, config);
    scene.eyeCenters.forEach((eyeCenter) => drawRetina(scene, eyeCenter, frame, config));
  };

  return (
    <GlyphCanvas
      key={`${config.imageFillShare}-${config.samplesPerCellAxis}`}
      createScene={(metrics) => createScene(metrics, config)}
      drawScene={drawScene}
      wideFontSizePixels={config.wideFontSizePixels / config.artGrainFactor}
      narrowFontSizePixels={config.narrowFontSizePixels / config.artGrainFactor}
    />
  );
}
