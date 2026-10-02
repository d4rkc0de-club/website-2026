"use client";

import { useEffect, useState } from "react";
import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import { HASH_AVALANCHE_DEFAULT_TEXT, HASH_AVALANCHE_INPUT_LABEL } from "@/content/componentDemoContent";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { BIT_GLYPH_PAIRS } from "@/lib/ascii/glyphSets";
import { clearFrame, createThemeColorReader } from "@/lib/ascii/glyphStyle";
import { mixHexColors } from "@/lib/ascii/mixHexColors";
import type { GlyphFrame } from "@/lib/ascii/types";
import { digestToBits } from "@/lib/hashBits";
import { MILLISECONDS_PER_SECOND } from "@/lib/timeUnits";
import type { ConfigOf } from "@/lib/variantControls";
import type { HASH_AVALANCHE_CONTROLS } from "./controls/hashAvalancheControls";

type HashAvalancheConfig = ConfigOf<typeof HASH_AVALANCHE_CONTROLS>;

type AvalancheScene = {
  sourceBits: readonly number[] | null;
  displayedBits: number[];
  pendingBits: number[];
  flipDueSeconds: number[];
  flashStartSeconds: number[];
  lastFlipCount: number;
  gridColumnCount: number;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

const GRID_TOP_OFFSET_PIXELS = 130;
const HUD_ROWS_ABOVE_GRID = 2;
const COLUMNS_PER_BIT = 2;
const NEVER_SECONDS = Infinity;

function createScene(gridColumnCount: number): AvalancheScene {
  return {
    sourceBits: null,
    displayedBits: [],
    pendingBits: [],
    flipDueSeconds: [],
    flashStartSeconds: [],
    lastFlipCount: 0,
    gridColumnCount,
    readThemeColor: createThemeColorReader(),
  };
}

function resetToDigest(scene: AvalancheScene, digestBits: readonly number[]): void {
  scene.displayedBits = [...digestBits];
  scene.pendingBits = [...digestBits];
  scene.flipDueSeconds = digestBits.map(() => NEVER_SECONDS);
  scene.flashStartSeconds = digestBits.map(() => -NEVER_SECONDS);
  scene.lastFlipCount = 0;
}

function scheduleFlips(
  scene: AvalancheScene,
  digestBits: readonly number[],
  timeSeconds: number,
  config: HashAvalancheConfig,
): void {
  scene.lastFlipCount = 0;
  digestBits.forEach((bit, bitIndex) => {
    if (bit === scene.pendingBits[bitIndex]) return;
    const waveStep = (bitIndex % scene.gridColumnCount) + Math.floor(bitIndex / scene.gridColumnCount);
    scene.pendingBits[bitIndex] = bit;
    scene.flipDueSeconds[bitIndex] = timeSeconds + (waveStep * config.waveStepMilliseconds) / MILLISECONDS_PER_SECOND;
    scene.lastFlipCount += 1;
  });
}

function applyDueFlips(scene: AvalancheScene, timeSeconds: number): void {
  scene.pendingBits.forEach((pendingBit, bitIndex) => {
    if (scene.flipDueSeconds[bitIndex] > timeSeconds) return;
    scene.flipDueSeconds[bitIndex] = NEVER_SECONDS;
    if (scene.displayedBits[bitIndex] === pendingBit) return;
    scene.displayedBits[bitIndex] = pendingBit;
    scene.flashStartSeconds[bitIndex] = timeSeconds;
  });
}

function updateScene(
  scene: AvalancheScene,
  digestBits: readonly number[] | null,
  { timeSeconds }: GlyphFrame,
  config: HashAvalancheConfig,
): void {
  if (digestBits && digestBits !== scene.sourceBits) {
    const hasSameLength = digestBits.length === scene.displayedBits.length;
    scene.sourceBits = digestBits;
    if (hasSameLength) scheduleFlips(scene, digestBits, timeSeconds, config);
    else resetToDigest(scene, digestBits);
  }
  applyDueFlips(scene, timeSeconds);
}

function drawBits(scene: AvalancheScene, frame: GlyphFrame, config: HashAvalancheConfig): void {
  const { context, metrics, timeSeconds } = frame;
  const bitGlyphs = BIT_GLYPH_PAIRS[config.bitGlyphSetName];
  const bitColor = scene.readThemeColor(config.bitColorName);
  const flipColor = scene.readThemeColor(config.flipColorName);
  const gridWidthColumns = scene.gridColumnCount * COLUMNS_PER_BIT - 1;
  const leftColumn = Math.max(0, Math.floor((metrics.columns - gridWidthColumns) / 2));
  const topRow = Math.ceil(GRID_TOP_OFFSET_PIXELS / metrics.cellHeight);

  scene.displayedBits.forEach((bit, bitIndex) => {
    const row = topRow + Math.floor(bitIndex / scene.gridColumnCount);
    if (row >= metrics.rows) return;
    const flashShare = Math.min(1, (timeSeconds - scene.flashStartSeconds[bitIndex]) / config.flashDurationSeconds);
    const color = flashShare < 1 ? mixHexColors(flipColor, bitColor, flashShare) : bitColor;
    const column = leftColumn + (bitIndex % scene.gridColumnCount) * COLUMNS_PER_BIT;
    drawGlyphCell(context, metrics, bitGlyphs[bit], column, row, color);
  });

  const bitCount = scene.displayedBits.length;
  const flipPercent = bitCount === 0 ? 0 : (100 * scene.lastFlipCount) / bitCount;
  const statusLine = `${config.algorithmName}  ${bitCount} BITS  FLIPPED ${scene.lastFlipCount} (${flipPercent.toFixed(1)}%)`;
  drawGlyphCell(context, metrics, statusLine, leftColumn, topRow - HUD_ROWS_ABOVE_GRID, flipColor);
}

type HashAvalancheProps = {
  config: HashAvalancheConfig;
};

export function HashAvalanche({ config }: HashAvalancheProps) {
  const [inputText, setInputText] = useState(HASH_AVALANCHE_DEFAULT_TEXT);
  const [digestBits, setDigestBits] = useState<readonly number[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    digestToBits(config.algorithmName, inputText).then((bits) => {
      if (isCurrent) setDigestBits(bits);
    });
    return () => {
      isCurrent = false;
    };
  }, [config.algorithmName, inputText]);

  const drawScene = (scene: AvalancheScene, frame: GlyphFrame) => {
    updateScene(scene, digestBits, frame, config);
    clearFrame(frame);
    drawBits(scene, frame, config);
  };

  return (
    <>
      <GlyphCanvas
        key={config.gridColumnCount}
        createScene={() => createScene(config.gridColumnCount)}
        drawScene={drawScene}
        wideFontSizePixels={config.fontSizePixels}
        narrowFontSizePixels={config.fontSizePixels}
      />
      <label className="absolute top-6 left-1/2 flex w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-mid">
          {HASH_AVALANCHE_INPUT_LABEL}
        </span>
        <input
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.currentTarget.value)}
          spellCheck={false}
          className="border border-line bg-void px-2 py-1 font-mono text-sm"
        />
      </label>
    </>
  );
}
