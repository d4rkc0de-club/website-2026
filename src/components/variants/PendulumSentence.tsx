"use client";

import { PENDULUM_HINT, PENDULUM_SENTENCE_LINES } from "@/content/componentDemoContent";
import {
  blockTextColumns,
  blockTextRows,
  drawBlockText,
  fitBlockScale,
  type BlockScale,
} from "@/lib/ascii/blockFont";
import { clamp } from "@/lib/ascii/easing";
import { drawSceneGrid } from "@/lib/ascii/drawSceneGrid";
import { clearFrame } from "@/lib/ascii/glyphStyle";
import { arrowStepForKey, isSpaceKey, type ArrowStep } from "@/lib/ascii/keyboardInput";
import {
  createPressTracker,
  updatePressTracker,
  type PressTracker,
} from "@/lib/ascii/pressTracker";
import { createSceneGrid, writeText, type SceneGrid } from "@/lib/ascii/sceneGrid";
import { readStageColors, type StageColors } from "@/lib/ascii/stageColors";
import type { GlyphFrame, GlyphMetrics, PointerPosition } from "@/lib/ascii/types";
import { GlyphStage } from "./GlyphStage";

const SIDE_MARGIN_COLUMNS = 3;
const BOTTOM_RESERVED_ROWS = 3;
const MINIMUM_ROPE_ROWS = 2;
const MAXIMUM_ROPE_ROWS = 6;
const PENDULUM_GRAVITY = 14;
const BREEZE_ACCELERATION = 0.35;
const BREEZE_FREQUENCY = 0.5;
const BREEZE_PHASE_STEP = 1.9;
const INITIAL_ANGLE_RADIANS = 0.12;
const MAXIMUM_ANGLE_RADIANS = 1.1;
const SUBSTEP_COUNT = 4;
const MAXIMUM_DELTA_SECONDS = 0.033;
const MINIMUM_DELTA_SECONDS = 0.001;
const MINIMUM_WORD_GAP_COLUMNS = 1;
const COLLISION_STIFFNESS = 30;
const HOVER_COUPLING = 0.12;
const HOVER_MINIMUM_SHIFT_COLUMNS = 0.5;
const HOVER_MAXIMUM_SHIFT_COLUMNS = 12;
const PUSH_IMPULSE = 2.4;
const MAXIMUM_GRAB_SPEED = 10;
const DISTURBED_SECONDS = 2.5;
const GRAB_PADDING_COLUMNS = 1;
const ROPE_SLANT_THRESHOLD = 0.7;
const ANCHOR_GLYPH = "+";

type PendulumWord = {
  text: string;
  lineIndex: number;
  anchorColumn: number;
  anchorRow: number;
  ropeRows: number;
  widthColumns: number;
  mass: number;
  dampingPerSecond: number;
  breezePhase: number;
  angleRadians: number;
  angularVelocity: number;
  disturbedUntilSeconds: number;
};

type WordLocation = { left: number; top: number; centerColumn: number };

type PendulumScene = {
  words: PendulumWord[];
  blockScale: BlockScale;
  wordHeightRows: number;
  cellAspect: number;
  colors: StageColors;
  pressTracker: PressTracker;
  previousPointer: PointerPosition | null;
  grabbedWordIndex: number | null;
  selectedWordIndex: number | null;
  timeSeconds: number;
};

function createScene(metrics: GlyphMetrics): PendulumScene {
  const joinedLines = PENDULUM_SENTENCE_LINES.map((lineWords) => lineWords.join(" "));
  const lineGapRows = MAXIMUM_ROPE_ROWS + 1;
  const blockScale = fitBlockScale(
    joinedLines,
    metrics.columns - 2 * SIDE_MARGIN_COLUMNS,
    metrics.rows - BOTTOM_RESERVED_ROWS - lineGapRows,
    metrics.cellAspect,
    lineGapRows,
  );
  const wordHeightRows = blockTextRows(blockScale);
  const linePitchRows = wordHeightRows + lineGapRows;
  const widestLineColumns = Math.max(
    ...joinedLines.map((line) => blockTextColumns(line, blockScale)),
  );
  const leftColumn = Math.floor((metrics.columns - widestLineColumns) / 2);
  const topRow = Math.max(
    0,
    Math.floor(
      (metrics.rows - BOTTOM_RESERVED_ROWS - PENDULUM_SENTENCE_LINES.length * linePitchRows) / 2,
    ),
  );
  const ropeVariety = MAXIMUM_ROPE_ROWS - MINIMUM_ROPE_ROWS + 1;

  const words = PENDULUM_SENTENCE_LINES.flatMap((lineWords, lineIndex) =>
    lineWords.map((text, positionInLine) => ({
      text,
      lineIndex,
      textUpToWord: lineWords.slice(0, positionInLine + 1).join(" "),
    })),
  ).map(({ text, lineIndex, textUpToWord }, wordIndex): PendulumWord => {
    const widthColumns = blockTextColumns(text, blockScale);
    const offsetColumns = blockTextColumns(textUpToWord, blockScale) - widthColumns;
    return {
      text,
      lineIndex,
      anchorColumn: leftColumn + offsetColumns + widthColumns / 2,
      anchorRow: topRow + lineIndex * linePitchRows,
      ropeRows: MINIMUM_ROPE_ROWS + ((wordIndex * 3 + 1) % ropeVariety),
      widthColumns,
      mass: 1 + text.length * 0.2,
      dampingPerSecond: 0.3 + ((wordIndex * 2) % 3) * 0.1,
      breezePhase: wordIndex * BREEZE_PHASE_STEP,
      angleRadians: INITIAL_ANGLE_RADIANS * Math.sin(wordIndex * 1.7),
      angularVelocity: 0,
      disturbedUntilSeconds: 0,
    };
  });

  return {
    words,
    blockScale,
    wordHeightRows,
    cellAspect: metrics.cellAspect,
    colors: readStageColors(),
    pressTracker: createPressTracker(),
    previousPointer: null,
    grabbedWordIndex: null,
    selectedWordIndex: null,
    timeSeconds: 0,
  };
}

function locateWord(scene: PendulumScene, word: PendulumWord): WordLocation {
  const centerColumn =
    word.anchorColumn + word.ropeRows * scene.cellAspect * Math.sin(word.angleRadians);
  return {
    left: centerColumn - word.widthColumns / 2,
    top: word.anchorRow + word.ropeRows * Math.cos(word.angleRadians),
    centerColumn,
  };
}

function findWordIndexAt(scene: PendulumScene, column: number, row: number): number {
  return scene.words.findIndex((word) => {
    const { left, top } = locateWord(scene, word);
    return (
      column >= left - GRAB_PADDING_COLUMNS &&
      column <= left + word.widthColumns + GRAB_PADDING_COLUMNS &&
      row >= top &&
      row <= top + scene.wordHeightRows
    );
  });
}

function disturbWord(scene: PendulumScene, word: PendulumWord): void {
  word.disturbedUntilSeconds = scene.timeSeconds + DISTURBED_SECONDS;
}

function pushWord(scene: PendulumScene, word: PendulumWord, direction: number): void {
  word.angularVelocity += (direction * PUSH_IMPULSE) / word.mass;
  disturbWord(scene, word);
}

function grabWord(
  scene: PendulumScene,
  word: PendulumWord,
  pointerColumn: number,
  deltaSeconds: number,
): void {
  const ropeColumns = word.ropeRows * scene.cellAspect;
  const sineLimit = Math.sin(MAXIMUM_ANGLE_RADIANS);
  const targetAngle = Math.asin(
    clamp((pointerColumn - word.anchorColumn) / ropeColumns, -sineLimit, sineLimit),
  );
  word.angularVelocity = clamp(
    (targetAngle - word.angleRadians) / Math.max(deltaSeconds, MINIMUM_DELTA_SECONDS),
    -MAXIMUM_GRAB_SPEED,
    MAXIMUM_GRAB_SPEED,
  );
  word.angleRadians = targetAngle;
  disturbWord(scene, word);
}

function applyPointerInteraction(scene: PendulumScene, frame: GlyphFrame): void {
  const { pointer, metrics } = frame;
  const phase = updatePressTracker(scene.pressTracker, frame);
  const pointerColumn = pointer ? pointer.x / metrics.cellWidth : 0;
  const pointerRow = pointer ? pointer.y / metrics.cellHeight : 0;

  if (pointer && scene.previousPointer && !frame.isPointerDown) {
    const hoveredWordIndex = findWordIndexAt(scene, pointerColumn, pointerRow);
    const shiftColumns = (pointer.x - scene.previousPointer.x) / metrics.cellWidth;
    if (hoveredWordIndex >= 0 && Math.abs(shiftColumns) > HOVER_MINIMUM_SHIFT_COLUMNS) {
      const hoveredWord = scene.words[hoveredWordIndex];
      hoveredWord.angularVelocity +=
        (clamp(shiftColumns, -HOVER_MAXIMUM_SHIFT_COLUMNS, HOVER_MAXIMUM_SHIFT_COLUMNS) *
          HOVER_COUPLING) /
        hoveredWord.mass;
      disturbWord(scene, hoveredWord);
    }
  }

  if (phase === "started" && pointer) {
    const pressedWordIndex = findWordIndexAt(scene, pointerColumn, pointerRow);
    scene.grabbedWordIndex = pressedWordIndex >= 0 ? pressedWordIndex : null;
    if (pressedWordIndex >= 0) scene.selectedWordIndex = pressedWordIndex;
  }

  const grabbedWord =
    scene.grabbedWordIndex === null ? null : scene.words[scene.grabbedWordIndex];
  if (grabbedWord && phase === "held" && pointer) {
    grabWord(scene, grabbedWord, pointerColumn, frame.deltaSeconds);
  }
  if (grabbedWord && phase === "tapped") {
    const wordCenterColumn = locateWord(scene, grabbedWord).centerColumn;
    pushWord(scene, grabbedWord, pointerColumn < wordCenterColumn ? 1 : -1);
  }
  if (phase === "tapped" || phase === "dragEnded") scene.grabbedWordIndex = null;

  scene.previousPointer = pointer;
}

function stepWord(
  word: PendulumWord,
  stepSeconds: number,
  timeSeconds: number,
  breezeAcceleration: number,
): void {
  const restoringAcceleration =
    (PENDULUM_GRAVITY / word.ropeRows) * Math.sin(word.angleRadians);
  const breeze =
    breezeAcceleration * Math.sin(timeSeconds * BREEZE_FREQUENCY + word.breezePhase);
  word.angularVelocity +=
    (breeze - restoringAcceleration - word.dampingPerSecond * word.angularVelocity) *
    stepSeconds;
  word.angleRadians = clamp(
    word.angleRadians + word.angularVelocity * stepSeconds,
    -MAXIMUM_ANGLE_RADIANS,
    MAXIMUM_ANGLE_RADIANS,
  );
}

function resolveCollisions(scene: PendulumScene, stepSeconds: number): void {
  for (let wordIndex = 1; wordIndex < scene.words.length; wordIndex++) {
    const previousWord = scene.words[wordIndex - 1];
    const currentWord = scene.words[wordIndex];
    if (previousWord.lineIndex !== currentWord.lineIndex) continue;

    const previousLocation = locateWord(scene, previousWord);
    const currentLocation = locateWord(scene, currentWord);
    const overlapColumns =
      previousLocation.left + previousWord.widthColumns + MINIMUM_WORD_GAP_COLUMNS - currentLocation.left;
    const rowsApart = Math.abs(previousLocation.top - currentLocation.top);
    if (overlapColumns <= 0 || rowsApart >= scene.wordHeightRows) continue;

    const impulse = overlapColumns * COLLISION_STIFFNESS * stepSeconds;
    previousWord.angularVelocity -= impulse / (previousWord.mass * previousWord.ropeRows);
    currentWord.angularVelocity += impulse / (currentWord.mass * currentWord.ropeRows);
  }
}

function simulate(scene: PendulumScene, frame: GlyphFrame): void {
  const stepSeconds = Math.min(frame.deltaSeconds, MAXIMUM_DELTA_SECONDS) / SUBSTEP_COUNT;
  const breezeAcceleration = frame.prefersReducedMotion ? 0 : BREEZE_ACCELERATION;
  for (let substep = 0; substep < SUBSTEP_COUNT; substep++) {
    scene.words.forEach((word, wordIndex) => {
      if (wordIndex !== scene.grabbedWordIndex) {
        stepWord(word, stepSeconds, frame.timeSeconds, breezeAcceleration);
      }
    });
    resolveCollisions(scene, stepSeconds);
  }
}

function drawRope(
  sceneGrid: SceneGrid,
  metrics: GlyphMetrics,
  word: PendulumWord,
  location: WordLocation,
  color: string,
): void {
  const ropeStepCount = Math.round(location.top) - word.anchorRow - 1;
  const columnsPerRow = (location.centerColumn - word.anchorColumn) / (ropeStepCount + 1);
  const ropeGlyph =
    Math.abs(columnsPerRow) < ROPE_SLANT_THRESHOLD ? "|" : columnsPerRow > 0 ? "\\" : "/";
  for (let step = 1; step <= ropeStepCount; step++) {
    writeText(
      sceneGrid,
      metrics,
      ropeGlyph,
      Math.round(word.anchorColumn + columnsPerRow * step),
      word.anchorRow + step,
      color,
    );
  }
}

function drawScene(scene: PendulumScene, frame: GlyphFrame): void {
  const { metrics } = frame;
  const { colors } = scene;
  scene.timeSeconds = frame.timeSeconds;
  applyPointerInteraction(scene, frame);
  simulate(scene, frame);

  clearFrame(frame);
  const sceneGrid = createSceneGrid(metrics);
  scene.words.forEach((word, wordIndex) => {
    const location = locateWord(scene, word);
    const isSelected = wordIndex === scene.selectedWordIndex;
    const isDisturbed = isSelected || scene.timeSeconds < word.disturbedUntilSeconds;
    drawRope(sceneGrid, metrics, word, location, colors.faint);
    writeText(
      sceneGrid,
      metrics,
      ANCHOR_GLYPH,
      Math.round(word.anchorColumn),
      word.anchorRow,
      isSelected ? colors.accent : colors.dim,
    );
    drawBlockText(
      sceneGrid,
      metrics,
      word.text,
      Math.round(location.left),
      Math.round(location.top),
      scene.blockScale,
      isDisturbed ? colors.accent : colors.bright,
      colors.dim,
    );
  });
  drawSceneGrid(frame, sceneGrid);
}

function neighbourWordIndex(scene: PendulumScene, arrowStep: ArrowStep): number {
  if (scene.selectedWordIndex === null) return 0;
  const currentWord = scene.words[scene.selectedWordIndex];
  if (arrowStep.columns !== 0) {
    return clamp(scene.selectedWordIndex + arrowStep.columns, 0, scene.words.length - 1);
  }
  const candidateWords = scene.words.filter(
    (word) => word.lineIndex === currentWord.lineIndex + arrowStep.rows,
  );
  if (candidateWords.length === 0) return scene.selectedWordIndex;
  const closestWord = candidateWords.reduce((bestWord, word) =>
    Math.abs(word.anchorColumn - currentWord.anchorColumn) <
    Math.abs(bestWord.anchorColumn - currentWord.anchorColumn)
      ? word
      : bestWord,
  );
  return scene.words.indexOf(closestWord);
}

function handleKeyDown(scene: PendulumScene, event: KeyboardEvent): void {
  const arrowStep = arrowStepForKey(event);
  if (arrowStep) {
    event.preventDefault();
    scene.selectedWordIndex = neighbourWordIndex(scene, arrowStep);
    return;
  }
  if (isSpaceKey(event) && scene.selectedWordIndex !== null) {
    event.preventDefault();
    pushWord(scene, scene.words[scene.selectedWordIndex], event.shiftKey ? -1 : 1);
  }
}

export function PendulumSentence() {
  return (
    <GlyphStage
      hintText={PENDULUM_HINT}
      createScene={createScene}
      drawScene={drawScene}
      onKeyDown={handleKeyDown}
    />
  );
}
