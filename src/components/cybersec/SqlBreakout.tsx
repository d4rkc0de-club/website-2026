"use client";

import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import {
  PADLOCK_LOCKED_LINES,
  PADLOCK_OPEN_LINES,
  SQL_BREAKOUT_DATABASE_LABEL,
  SQL_BREAKOUT_FORM_LABEL,
  SQL_BREAKOUT_HINT,
  SQL_BREAKOUT_INTRO,
  SQL_BREAKOUT_PASSWORD_PLACEHOLDER,
  SQL_BREAKOUT_QUERY_LABEL,
  SQL_BREAKOUT_SAFE_QUERY_LABEL,
  SQL_BREAKOUT_TITLE,
  SQL_BREAKOUT_TONE_LEGEND_TEXT,
  SQL_BREAKOUT_USER_NAMES,
  SQL_BREAKOUT_VALUE_LABEL,
} from "@/content/cybersecContent";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { drawGlyphText } from "@/lib/ascii/drawGlyphText";
import { clamp, lerp } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader, type ThemeColorName } from "@/lib/ascii/glyphStyle";
import type { GlyphFrame } from "@/lib/ascii/types";
import { OUTCOME_TONE_COLOR_NAME, type OutcomeTone } from "./CybersecParts";
import { SQL_BREAKOUT_CONTROLS, type SqlBreakoutConfig } from "./controls/sqlBreakoutControls";
import { createConfigurableDemo } from "./createConfigurableDemo";
import { LessonPanel } from "./LessonPanel";
import { SQL_BREAKOUT_GLOSSARY_ENTRIES, SQL_BREAKOUT_LESSON_STEPS } from "./sqlBreakoutLessons";
import {
  analyseQuery,
  describeLoginResult,
  type QueryAnalysis,
  type QueryTone,
  type ToneCell,
} from "./sqlBreakoutQuery";

type SqlBreakoutScene = {
  analysis: QueryAnalysis;
  elapsedSeconds: number;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

const TONE_COLOR_NAME: Record<QueryTone, ThemeColorName> = {
  templateCode: "paper",
  string: "wasp",
  injectedCode: "accent",
  comment: "mid",
};

const PACKET_GLYPH = "▼";
const SCANNER_GLYPH = ">";
const SWATCH_GLYPH = "█";
const UNCHECKED_GLYPH = "·";

const PACKET_TRAVEL_SECONDS = 0.8;
const SECONDS_PER_ROW_CHECK = 0.4;
const TOTAL_SECONDS = PACKET_TRAVEL_SECONDS + SQL_BREAKOUT_USER_NAMES.length * SECONDS_PER_ROW_CHECK;
const MAX_STEP_SECONDS = 0.1;

const SIDE_MARGIN_COLUMNS = 2;
const TITLE_ROW = 1;
const HINT_ROW = 2;
const FORM_LABEL_ROW = 4;
const FORM_VALUE_COLUMN = 12;
const SECTION_GAP_ROWS = 1;
const LEGEND_COLUMN_WIDTH = 26;
const LEGEND_COLUMNS_PER_ROW = 2;
const TABLE_NAME_COLUMN = SIDE_MARGIN_COLUMNS + 2;
const TABLE_STATUS_COLUMN = TABLE_NAME_COLUMN + 12;
const INFO_COLUMN = 13;
const INFO_VALUE_COLUMN = INFO_COLUMN + 21;
const PACKET_COLUMN = SIDE_MARGIN_COLUMNS - 1;

function readOutcomeTone(analysis: QueryAnalysis): OutcomeTone {
  if (analysis.isSyntaxError || analysis.matchedUserNames.length > 0) return "danger";
  return analysis.isSafeQuery ? "safe" : "info";
}

function describeOutcome(analysis: QueryAnalysis): string[] {
  if (analysis.isSafeQuery) {
    return [
      "The database treats your text as data.",
      "It looks for one user with this exact name.",
      "The password check still runs.",
    ];
  }
  if (analysis.isSyntaxError) {
    return [
      "The quote mark ends the name early.",
      "The rest of your text is not valid SQL.",
      "The database stops with an error.",
    ];
  }
  if (analysis.matchedUserNames.length > 1) {
    return [
      "The query returns every user.",
      `The site logs you in as the first one: ${analysis.matchedUserNames[0]}.`,
    ];
  }
  if (analysis.matchedUserNames.length === 1) {
    return [
      "A comment hides the password check.",
      `The query returns ${analysis.matchedUserNames[0]}. The site logs you in.`,
    ];
  }
  return ["Your text stays a name.", "The password check runs.", "The login fails."];
}

function readCheckedRowCount(scene: SqlBreakoutScene): number {
  if (scene.analysis.isSyntaxError) return 0;
  const checkedRowCount = Math.floor((scene.elapsedSeconds - PACKET_TRAVEL_SECONDS) / SECONDS_PER_ROW_CHECK);
  return clamp(checkedRowCount, 0, SQL_BREAKOUT_USER_NAMES.length);
}

function describeRowStatus(
  scene: SqlBreakoutScene,
  rowIndex: number,
): { text: string; colorName: ThemeColorName; isChecking: boolean } {
  const isPacketArrived = scene.elapsedSeconds >= PACKET_TRAVEL_SECONDS;
  if (!isPacketArrived) return { text: "waiting", colorName: "line", isChecking: false };
  if (scene.analysis.isSyntaxError) return { text: "not read", colorName: "mid", isChecking: false };

  const checkedRowCount = readCheckedRowCount(scene);
  if (rowIndex > checkedRowCount) return { text: "waiting", colorName: "line", isChecking: false };
  if (rowIndex === checkedRowCount) return { text: "checking", colorName: "white", isChecking: true };
  const isMatch = scene.analysis.matchedUserNames.includes(SQL_BREAKOUT_USER_NAMES[rowIndex]);
  return isMatch
    ? { text: "RETURNED", colorName: "accent", isChecking: false }
    : { text: "no match", colorName: "mid", isChecking: false };
}

function updateScene(scene: SqlBreakoutScene, { deltaSeconds, prefersReducedMotion }: GlyphFrame): void {
  scene.elapsedSeconds = prefersReducedMotion
    ? TOTAL_SECONDS
    : Math.min(TOTAL_SECONDS, scene.elapsedSeconds + Math.min(deltaSeconds, MAX_STEP_SECONDS));
}

function restartSend(scene: SqlBreakoutScene): void {
  scene.elapsedSeconds = 0;
}

function createScene(config: SqlBreakoutConfig): SqlBreakoutScene {
  return {
    analysis: analyseQuery(config.loginText, config.isSafeQueryEnabled),
    elapsedSeconds: 0,
    readThemeColor: createThemeColorReader(),
  };
}

function drawLabel(scene: SqlBreakoutScene, frame: GlyphFrame, text: string, row: number): void {
  drawGlyphText(frame.context, frame.metrics, text, SIDE_MARGIN_COLUMNS, row, scene.readThemeColor("mid"));
}

function drawWrappedCells(
  scene: SqlBreakoutScene,
  frame: GlyphFrame,
  cells: readonly ToneCell[],
  topRow: number,
): number {
  const columnCount = Math.max(1, frame.metrics.columns - 2 * SIDE_MARGIN_COLUMNS);
  cells.forEach(({ character, tone }, cellIndex) => {
    drawGlyphCell(
      frame.context,
      frame.metrics,
      character,
      SIDE_MARGIN_COLUMNS + (cellIndex % columnCount),
      topRow + Math.floor(cellIndex / columnCount),
      scene.readThemeColor(TONE_COLOR_NAME[tone]),
    );
  });
  return Math.ceil(cells.length / columnCount);
}

function drawHeader(scene: SqlBreakoutScene, frame: GlyphFrame): void {
  const { context, metrics } = frame;
  drawGlyphText(context, metrics, SQL_BREAKOUT_TITLE, SIDE_MARGIN_COLUMNS, TITLE_ROW, scene.readThemeColor("paper"));
  drawGlyphText(
    context,
    metrics,
    SQL_BREAKOUT_INTRO,
    SIDE_MARGIN_COLUMNS + SQL_BREAKOUT_TITLE.length + 2,
    TITLE_ROW,
    scene.readThemeColor("mid"),
  );
  drawLabel(scene, frame, SQL_BREAKOUT_HINT, HINT_ROW);
}

function drawForm(scene: SqlBreakoutScene, frame: GlyphFrame, config: SqlBreakoutConfig): number {
  const { context, metrics } = frame;
  drawLabel(scene, frame, SQL_BREAKOUT_FORM_LABEL, FORM_LABEL_ROW);
  drawGlyphText(context, metrics, "name", SIDE_MARGIN_COLUMNS, FORM_LABEL_ROW + 1, scene.readThemeColor("light"));
  drawGlyphText(
    context,
    metrics,
    `[ ${config.loginText} ]`,
    FORM_VALUE_COLUMN,
    FORM_LABEL_ROW + 1,
    scene.readThemeColor("wasp"),
  );
  drawGlyphText(context, metrics, "password", SIDE_MARGIN_COLUMNS, FORM_LABEL_ROW + 2, scene.readThemeColor("light"));
  drawGlyphText(
    context,
    metrics,
    `[ ${SQL_BREAKOUT_PASSWORD_PLACEHOLDER} ]`,
    FORM_VALUE_COLUMN,
    FORM_LABEL_ROW + 2,
    scene.readThemeColor("mid"),
  );
  return FORM_LABEL_ROW + 3 + SECTION_GAP_ROWS;
}

function drawQuery(scene: SqlBreakoutScene, frame: GlyphFrame, topRow: number): number {
  const { isSafeQuery, queryCells, valueCells } = scene.analysis;
  drawLabel(scene, frame, isSafeQuery ? SQL_BREAKOUT_SAFE_QUERY_LABEL : SQL_BREAKOUT_QUERY_LABEL, topRow);
  let nextRow = topRow + 1 + drawWrappedCells(scene, frame, queryCells, topRow + 1);
  if (isSafeQuery) {
    nextRow += SECTION_GAP_ROWS;
    drawLabel(scene, frame, SQL_BREAKOUT_VALUE_LABEL, nextRow);
    nextRow += 1 + drawWrappedCells(scene, frame, valueCells, nextRow + 1);
  }
  return nextRow;
}

function drawLegend(scene: SqlBreakoutScene, frame: GlyphFrame, topRow: number): number {
  const legendTones = Object.keys(SQL_BREAKOUT_TONE_LEGEND_TEXT) as QueryTone[];
  legendTones.forEach((tone, toneIndex) => {
    const column = SIDE_MARGIN_COLUMNS + (toneIndex % LEGEND_COLUMNS_PER_ROW) * LEGEND_COLUMN_WIDTH;
    const row = topRow + Math.floor(toneIndex / LEGEND_COLUMNS_PER_ROW);
    const color = scene.readThemeColor(TONE_COLOR_NAME[tone]);
    drawGlyphCell(frame.context, frame.metrics, SWATCH_GLYPH, column, row, color);
    drawGlyphText(frame.context, frame.metrics, SQL_BREAKOUT_TONE_LEGEND_TEXT[tone], column + 2, row, color);
  });
  return topRow + Math.ceil(legendTones.length / LEGEND_COLUMNS_PER_ROW) + SECTION_GAP_ROWS;
}

function drawDatabase(scene: SqlBreakoutScene, frame: GlyphFrame, topRow: number): number {
  const { context, metrics } = frame;
  drawLabel(scene, frame, SQL_BREAKOUT_DATABASE_LABEL, topRow);
  SQL_BREAKOUT_USER_NAMES.forEach((userName, rowIndex) => {
    const row = topRow + 1 + rowIndex;
    const { text, colorName, isChecking } = describeRowStatus(scene, rowIndex);
    drawGlyphCell(
      context,
      metrics,
      isChecking ? SCANNER_GLYPH : UNCHECKED_GLYPH,
      SIDE_MARGIN_COLUMNS,
      row,
      scene.readThemeColor(isChecking ? "white" : "line"),
    );
    drawGlyphText(context, metrics, userName, TABLE_NAME_COLUMN, row, scene.readThemeColor(isChecking ? "white" : "light"));
    drawGlyphText(context, metrics, text, TABLE_STATUS_COLUMN, row, scene.readThemeColor(colorName));
  });
  return topRow + 1 + SQL_BREAKOUT_USER_NAMES.length + SECTION_GAP_ROWS;
}

function drawPacket(
  scene: SqlBreakoutScene,
  frame: GlyphFrame,
  startRow: number,
  endRow: number,
): void {
  if (scene.elapsedSeconds >= PACKET_TRAVEL_SECONDS) return;
  const travelShare = scene.elapsedSeconds / PACKET_TRAVEL_SECONDS;
  drawGlyphCell(
    frame.context,
    frame.metrics,
    PACKET_GLYPH,
    PACKET_COLUMN,
    Math.round(lerp(startRow, endRow, travelShare)),
    scene.readThemeColor("wasp"),
  );
}

function drawInfoLine(
  scene: SqlBreakoutScene,
  frame: GlyphFrame,
  row: number,
  label: string,
  value: string,
  valueColorName: ThemeColorName = "paper",
): void {
  drawGlyphText(frame.context, frame.metrics, label, INFO_COLUMN, row, scene.readThemeColor("mid"));
  drawGlyphText(frame.context, frame.metrics, value, INFO_VALUE_COLUMN, row, scene.readThemeColor(valueColorName));
}

function drawResult(scene: SqlBreakoutScene, frame: GlyphFrame, topRow: number): void {
  const { analysis } = scene;
  const isFinished = scene.elapsedSeconds >= TOTAL_SECONDS;
  const toneColorName = OUTCOME_TONE_COLOR_NAME[readOutcomeTone(analysis)];
  const foundCount = SQL_BREAKOUT_USER_NAMES.slice(0, readCheckedRowCount(scene)).filter((userName) =>
    analysis.matchedUserNames.includes(userName),
  ).length;
  const isLoginOpen = isFinished && analysis.matchedUserNames.length > 0;
  const padlockLines = isLoginOpen ? PADLOCK_OPEN_LINES : PADLOCK_LOCKED_LINES;

  padlockLines.forEach((line, lineIndex) => {
    drawGlyphCell(
      frame.context,
      frame.metrics,
      line,
      SIDE_MARGIN_COLUMNS,
      topRow + lineIndex,
      scene.readThemeColor(isFinished ? toneColorName : "light"),
    );
  });
  drawInfoLine(scene, frame, topRow, "CODE FROM YOUR TEXT", `${analysis.injectedCodeCount} characters`);
  drawInfoLine(
    scene,
    frame,
    topRow + 1,
    "PASSWORD CHECK",
    analysis.isPasswordCheckSkipped ? "skipped" : "runs",
    analysis.isPasswordCheckSkipped ? "accent" : "paper",
  );
  drawInfoLine(scene, frame, topRow + 2, "USERS FOUND", `${foundCount} of ${SQL_BREAKOUT_USER_NAMES.length}`);
  drawInfoLine(
    scene,
    frame,
    topRow + 3,
    "LOGIN",
    isFinished ? describeLoginResult(analysis) : "waiting for the database",
    isFinished ? toneColorName : "mid",
  );
  if (isFinished) {
    describeOutcome(analysis).forEach((outcomeLine, lineIndex) => {
      drawGlyphText(
        frame.context,
        frame.metrics,
        outcomeLine,
        INFO_COLUMN,
        topRow + 4 + lineIndex,
        scene.readThemeColor(toneColorName),
      );
    });
  }
}

type SqlBreakoutProps = {
  config: SqlBreakoutConfig;
};

function SqlBreakout({ config }: SqlBreakoutProps) {
  const analysis = analyseQuery(config.loginText, config.isSafeQueryEnabled);

  const drawScene = (scene: SqlBreakoutScene, frame: GlyphFrame) => {
    updateScene(scene, frame);
    clearFrame(frame);
    drawHeader(scene, frame);
    const queryTopRow = drawForm(scene, frame, config);
    const queryEndRow = drawQuery(scene, frame, queryTopRow);
    const databaseTopRow = drawLegend(scene, frame, queryEndRow + SECTION_GAP_ROWS);
    const resultTopRow = drawDatabase(scene, frame, databaseTopRow);
    drawPacket(scene, frame, queryEndRow - 1, databaseTopRow + 1);
    drawResult(scene, frame, resultTopRow);
  };

  const handleKeyDown = (scene: SqlBreakoutScene, event: KeyboardEvent) => {
    if (event.key === "Enter") restartSend(scene);
  };

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row">
      <div className="relative min-h-0 flex-1">
        <GlyphCanvas
          key={`${config.loginText}-${config.isSafeQueryEnabled}`}
          createScene={() => createScene(config)}
          drawScene={drawScene}
          onPress={restartSend}
          onKeyDown={handleKeyDown}
        />
        <p role="status" className="sr-only">
          Login name: {config.loginText}. {analysis.injectedCodeCount} characters run as code. Password check{" "}
          {analysis.isPasswordCheckSkipped ? "skipped" : "runs"}. Result: {describeLoginResult(analysis)}.
        </p>
      </div>
      <LessonPanel
        steps={SQL_BREAKOUT_LESSON_STEPS}
        glossaryEntries={SQL_BREAKOUT_GLOSSARY_ENTRIES}
        config={config}
      />
    </div>
  );
}

export const SqlBreakoutDemo = createConfigurableDemo(SQL_BREAKOUT_CONTROLS, SqlBreakout);
