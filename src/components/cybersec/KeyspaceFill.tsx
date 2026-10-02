"use client";

import { GlyphCanvas, type CanvasPress } from "@/components/hero/GlyphCanvas";
import {
  KEYSPACE_FILL_HINT,
  KEYSPACE_FILL_INTRO,
  KEYSPACE_FILL_LADDER_LEGEND_LINES,
  KEYSPACE_FILL_LADDER_TITLE,
  PADLOCK_LOCKED_LINES,
  PADLOCK_OPEN_LINES,
  KEYSPACE_FILL_TITLE,
} from "@/content/cybersecContent";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { clamp } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader, type ThemeColorName } from "@/lib/ascii/glyphStyle";
import type { SceneRegion } from "@/lib/ascii/sceneGrid";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { formatCount, formatDuration } from "@/lib/formatQuantity";
import { SECONDS_PER_DAY, SECONDS_PER_YEAR } from "@/lib/timeUnits";
import { OUTCOME_TONE_COLOR_NAME, type OutcomeTone } from "./CybersecParts";
import {
  KEYSPACE_FILL_CONTROLS,
  MAX_PASSWORD_LENGTH,
  readKeyspace,
  type KeyspaceFillConfig,
} from "./controls/keyspaceFillControls";
import { createConfigurableDemo } from "./createConfigurableDemo";
import { KEYSPACE_GLOSSARY_ENTRIES, KEYSPACE_LESSON_STEPS } from "./keyspaceFillLessons";
import { LessonPanel } from "./LessonPanel";

type KeyspaceScene = {
  gridRegion: SceneRegion;
  gridColumnCount: number;
  cellCount: number;
  passwordsPerCell: number;
  ladderIsVisible: boolean;
  secretFraction: number;
  sweepFraction: number;
  isFound: boolean;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

const UNTRIED_GLYPH = "·";
const TRIED_GLYPH = "▒";
const RECENT_GLYPH = "▓";
const HEAD_GLYPH = "█";
const BAR_GLYPH = "█";
const FOUND_GLYPHS = ["@", "*"] as const;
const SPACE_DISPLAY_CHARACTER = "_";

const SWEEP_SECONDS = 6;
const MAX_STEP_SECONDS = 0.1;
const TRAIL_CELL_SHARE = 0.03;
const PULSES_PER_SECOND = 3;
const UNIVERSE_AGE_YEARS = 1.38e10;
const MAX_SPELLED_FACTORS = 6;

const SIDE_MARGIN_COLUMNS = 2;
const TITLE_ROW = 1;
const PADLOCK_ROW = 2;
const INFO_COLUMN = 13;
const INFO_VALUE_COLUMN = INFO_COLUMN + 11;
const CELL_NOTE_ROW = 8;
const HINT_ROW = 9;
const GRID_TOP_ROW = 11;
const BOTTOM_MARGIN_ROWS = 1;
const LADDER_GAP_ROWS = 1;
const MIN_GRID_ROWS_WITH_LADDER = 8;
const LADDER_BAR_COLUMNS = 24;
const LADDER_LABEL_COLUMNS = 4;
const LADDER_TEXT_GAP_COLUMNS = 2;
const LADDER_ROWS = 1 + KEYSPACE_FILL_LADDER_LEGEND_LINES.length + MAX_PASSWORD_LENGTH;
const MIN_ROWS_WITH_LADDER =
  GRID_TOP_ROW + MIN_GRID_ROWS_WITH_LADDER + LADDER_GAP_ROWS + LADDER_ROWS + BOTTOM_MARGIN_ROWS;
const LADDER_FULL_BAR_LOG10_SECONDS = Math.log10(UNIVERSE_AGE_YEARS * SECONDS_PER_YEAR);

function pickTone(worstCaseSeconds: number): OutcomeTone {
  if (worstCaseSeconds < SECONDS_PER_DAY) return "danger";
  return worstCaseSeconds < SECONDS_PER_YEAR ? "info" : "safe";
}

function describeCrackTime(worstCaseSeconds: number): string {
  const timeText = formatDuration(worstCaseSeconds);
  const tone = pickTone(worstCaseSeconds);
  if (tone === "danger") return `WEAK. An attacker tries all passwords in ${timeText}.`;
  if (tone === "info") return `NOT SAFE. An attacker needs ${timeText} to try all passwords.`;
  return `STRONG at this speed. An attacker needs ${timeText}.`;
}

function describeFactors(characterCount: number, passwordLength: number): string {
  if (passwordLength > MAX_SPELLED_FACTORS) {
    return `${characterCount} x ${characterCount} x ... (${passwordLength} times)`;
  }
  return Array.from({ length: passwordLength }, () => characterCount).join(" x ");
}

function buildGuessText(sweepFraction: number, characters: string, passwordLength: number): string {
  const guessCharacters: string[] = [];
  let remainingShare = sweepFraction;
  for (let position = 0; position < passwordLength; position++) {
    remainingShare *= characters.length;
    const characterIndex = Math.min(characters.length - 1, Math.floor(remainingShare));
    remainingShare -= characterIndex;
    const character = characters[characterIndex];
    guessCharacters.push(character === " " ? SPACE_DISPLAY_CHARACTER : character);
  }
  return guessCharacters.join(" ");
}

function restartSweep(scene: KeyspaceScene, secretFraction: number): void {
  scene.secretFraction = secretFraction;
  scene.sweepFraction = 0;
  scene.isFound = false;
}

function createScene(metrics: GlyphMetrics, config: KeyspaceFillConfig): KeyspaceScene {
  const ladderIsVisible = metrics.rows >= MIN_ROWS_WITH_LADDER;
  const bottomReservedRows = ladderIsVisible
    ? LADDER_ROWS + LADDER_GAP_ROWS + BOTTOM_MARGIN_ROWS
    : BOTTOM_MARGIN_ROWS;
  const gridRegion: SceneRegion = {
    column: SIDE_MARGIN_COLUMNS,
    row: GRID_TOP_ROW,
    columns: Math.max(1, metrics.columns - 2 * SIDE_MARGIN_COLUMNS),
    rows: Math.max(1, metrics.rows - GRID_TOP_ROW - bottomReservedRows),
  };
  const { totalPasswordCount } = readKeyspace(config);
  const cellCount = Math.min(totalPasswordCount, gridRegion.columns * gridRegion.rows);
  return {
    gridRegion,
    gridColumnCount: Math.min(gridRegion.columns, cellCount),
    cellCount,
    passwordsPerCell: Math.ceil(totalPasswordCount / cellCount),
    ladderIsVisible,
    secretFraction: Math.random(),
    sweepFraction: 0,
    isFound: false,
    readThemeColor: createThemeColorReader(),
  };
}

function updateScene(scene: KeyspaceScene, { deltaSeconds, prefersReducedMotion }: GlyphFrame): void {
  if (scene.isFound) return;
  const sweepStep = prefersReducedMotion ? 1 : Math.min(deltaSeconds, MAX_STEP_SECONDS) / SWEEP_SECONDS;
  scene.sweepFraction = Math.min(scene.secretFraction, scene.sweepFraction + sweepStep);
  scene.isFound = scene.sweepFraction >= scene.secretFraction;
}

function drawTextLine(
  { context, metrics }: GlyphFrame,
  text: string,
  column: number,
  row: number,
  color: string,
): void {
  drawGlyphCell(context, metrics, text, column, row, color);
}

function drawInfoLine(
  frame: GlyphFrame,
  scene: KeyspaceScene,
  row: number,
  label: string,
  value: string,
  valueColorName: ThemeColorName = "paper",
): void {
  drawTextLine(frame, label, INFO_COLUMN, row, scene.readThemeColor("mid"));
  drawTextLine(frame, value, INFO_VALUE_COLUMN, row, scene.readThemeColor(valueColorName));
}

function describeGridCell(
  scene: KeyspaceScene,
  cellIndex: number,
  headCellIndex: number,
  timeSeconds: number,
): { character: string; colorName: ThemeColorName } {
  if (cellIndex === headCellIndex) {
    if (!scene.isFound) return { character: HEAD_GLYPH, colorName: "white" };
    return { character: FOUND_GLYPHS[Math.floor(timeSeconds * PULSES_PER_SECOND) % 2], colorName: "signal" };
  }
  if (cellIndex > headCellIndex) return { character: UNTRIED_GLYPH, colorName: "line" };
  const trailCellCount = Math.max(1, Math.round(scene.cellCount * TRAIL_CELL_SHARE));
  const isRecent = headCellIndex - cellIndex <= trailCellCount;
  return isRecent
    ? { character: RECENT_GLYPH, colorName: "light" }
    : { character: TRIED_GLYPH, colorName: "mid" };
}

function drawGrid(scene: KeyspaceScene, frame: GlyphFrame): void {
  const { gridRegion, gridColumnCount, cellCount } = scene;
  const headCellIndex = Math.min(cellCount - 1, Math.floor(scene.sweepFraction * cellCount));
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    const { character, colorName } = describeGridCell(scene, cellIndex, headCellIndex, frame.timeSeconds);
    drawTextLine(
      frame,
      character,
      gridRegion.column + (cellIndex % gridColumnCount),
      gridRegion.row + Math.floor(cellIndex / gridColumnCount),
      scene.readThemeColor(colorName),
    );
  }
}

function drawPadlock(scene: KeyspaceScene, frame: GlyphFrame): void {
  const padlockLines = scene.isFound ? PADLOCK_OPEN_LINES : PADLOCK_LOCKED_LINES;
  const padlockColor = scene.readThemeColor(scene.isFound ? "signal" : "light");
  padlockLines.forEach((line, lineIndex) => {
    drawTextLine(frame, line, SIDE_MARGIN_COLUMNS, PADLOCK_ROW + lineIndex, padlockColor);
  });
}

function drawHud(scene: KeyspaceScene, frame: GlyphFrame, config: KeyspaceFillConfig): void {
  const { characters, totalPasswordCount, guessesPerSecond } = readKeyspace(config);
  const triedCount = Math.min(totalPasswordCount, Math.ceil(scene.sweepFraction * totalPasswordCount));
  const worstCaseSeconds = totalPasswordCount / guessesPerSecond;
  const guessText = buildGuessText(scene.sweepFraction, characters, config.passwordLength);
  const cellNote =
    scene.passwordsPerCell === 1
      ? "Each cell is 1 password."
      : `Each cell is ${formatCount(scene.passwordsPerCell)} passwords.`;

  drawTextLine(frame, KEYSPACE_FILL_TITLE, SIDE_MARGIN_COLUMNS, TITLE_ROW, scene.readThemeColor("paper"));
  drawTextLine(
    frame,
    KEYSPACE_FILL_INTRO,
    SIDE_MARGIN_COLUMNS + KEYSPACE_FILL_TITLE.length + 2,
    TITLE_ROW,
    scene.readThemeColor("mid"),
  );
  drawInfoLine(
    frame,
    scene,
    PADLOCK_ROW,
    scene.isFound ? "FOUND" : "TRYING",
    `[ ${guessText} ]`,
    scene.isFound ? "signal" : "white",
  );
  drawInfoLine(
    frame,
    scene,
    PADLOCK_ROW + 1,
    "PASSWORDS",
    `${formatCount(totalPasswordCount)} = ${describeFactors(characters.length, config.passwordLength)}`,
  );
  drawInfoLine(frame, scene, PADLOCK_ROW + 2, "TRIED", formatCount(triedCount));
  drawInfoLine(
    frame,
    scene,
    PADLOCK_ROW + 3,
    "REAL TIME",
    `${formatDuration(triedCount / guessesPerSecond)} (${formatCount(guessesPerSecond)} guesses per second)`,
  );
  drawTextLine(
    frame,
    describeCrackTime(worstCaseSeconds),
    INFO_COLUMN,
    PADLOCK_ROW + 4,
    scene.readThemeColor(OUTCOME_TONE_COLOR_NAME[pickTone(worstCaseSeconds)]),
  );
  drawTextLine(
    frame,
    `The grid is a time-lapse. ${cellNote}`,
    SIDE_MARGIN_COLUMNS,
    CELL_NOTE_ROW,
    scene.readThemeColor("mid"),
  );
  drawTextLine(frame, KEYSPACE_FILL_HINT, SIDE_MARGIN_COLUMNS, HINT_ROW, scene.readThemeColor("mid"));
}

function drawLadder(scene: KeyspaceScene, frame: GlyphFrame, config: KeyspaceFillConfig): void {
  const { characters, guessesPerSecond } = readKeyspace(config);
  const topRow = frame.metrics.rows - BOTTOM_MARGIN_ROWS - LADDER_ROWS;
  const firstLengthRow = topRow + 1 + KEYSPACE_FILL_LADDER_LEGEND_LINES.length;
  const durationColumn =
    SIDE_MARGIN_COLUMNS + LADDER_LABEL_COLUMNS + LADDER_BAR_COLUMNS + LADDER_TEXT_GAP_COLUMNS;

  drawTextLine(frame, KEYSPACE_FILL_LADDER_TITLE, SIDE_MARGIN_COLUMNS, topRow, scene.readThemeColor("paper"));
  KEYSPACE_FILL_LADDER_LEGEND_LINES.forEach((line, lineIndex) => {
    drawTextLine(frame, line, SIDE_MARGIN_COLUMNS, topRow + 1 + lineIndex, scene.readThemeColor("mid"));
  });

  for (let passwordLength = 1; passwordLength <= MAX_PASSWORD_LENGTH; passwordLength++) {
    const worstCaseSeconds = characters.length ** passwordLength / guessesPerSecond;
    const barLength = clamp(
      Math.round((Math.log10(Math.max(1, worstCaseSeconds)) / LADDER_FULL_BAR_LOG10_SECONDS) * LADDER_BAR_COLUMNS),
      1,
      LADDER_BAR_COLUMNS,
    );
    const isCurrentLength = passwordLength === config.passwordLength;
    const row = firstLengthRow + passwordLength - 1;
    drawTextLine(
      frame,
      `${isCurrentLength ? ">" : " "}${String(passwordLength).padStart(2)}`,
      SIDE_MARGIN_COLUMNS,
      row,
      scene.readThemeColor(isCurrentLength ? "white" : "mid"),
    );
    drawTextLine(
      frame,
      BAR_GLYPH.repeat(barLength),
      SIDE_MARGIN_COLUMNS + LADDER_LABEL_COLUMNS,
      row,
      scene.readThemeColor(OUTCOME_TONE_COLOR_NAME[pickTone(worstCaseSeconds)]),
    );
    drawTextLine(
      frame,
      formatDuration(worstCaseSeconds),
      durationColumn,
      row,
      scene.readThemeColor(isCurrentLength ? "white" : "light"),
    );
  }
}

function findPressedCellIndex(scene: KeyspaceScene, { x, y }: CanvasPress, metrics: GlyphMetrics): number {
  const column = Math.floor(x / metrics.cellWidth) - scene.gridRegion.column;
  const row = Math.floor(y / metrics.cellHeight) - scene.gridRegion.row;
  const cellIndex = row * scene.gridColumnCount + column;
  const isInsideGrid = column >= 0 && column < scene.gridColumnCount && row >= 0 && cellIndex < scene.cellCount;
  return isInsideGrid ? cellIndex : -1;
}

type KeyspaceFillProps = {
  config: KeyspaceFillConfig;
};

function KeyspaceFill({ config }: KeyspaceFillProps) {
  const { totalPasswordCount, guessesPerSecond } = readKeyspace(config);

  const drawScene = (scene: KeyspaceScene, frame: GlyphFrame) => {
    updateScene(scene, frame);
    clearFrame(frame);
    drawGrid(scene, frame);
    drawPadlock(scene, frame);
    drawHud(scene, frame, config);
    if (scene.ladderIsVisible) drawLadder(scene, frame, config);
  };

  const handlePress = (scene: KeyspaceScene, press: CanvasPress, metrics: GlyphMetrics) => {
    const cellIndex = findPressedCellIndex(scene, press, metrics);
    restartSweep(scene, cellIndex === -1 ? Math.random() : (cellIndex + 0.5) / scene.cellCount);
  };

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row">
      <div className="relative min-h-0 flex-1">
        <GlyphCanvas
          key={`${config.passwordLength}-${config.characterSetName}`}
          createScene={(metrics) => createScene(metrics, config)}
          drawScene={drawScene}
          onPress={handlePress}
        />
        <p role="status" className="sr-only">
          {formatCount(totalPasswordCount)} possible passwords. {describeCrackTime(totalPasswordCount / guessesPerSecond)}
        </p>
      </div>
      <LessonPanel steps={KEYSPACE_LESSON_STEPS} glossaryEntries={KEYSPACE_GLOSSARY_ENTRIES} config={config} />
    </div>
  );
}

export const KeyspaceFillDemo = createConfigurableDemo(KEYSPACE_FILL_CONTROLS, KeyspaceFill);
