"use client";

import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import {
  XSS_ATTACKER_LABEL,
  XSS_BOLD_NOTE,
  XSS_BROWSER_LABEL,
  XSS_COMMENT_LABEL,
  XSS_HINT,
  XSS_INTRO,
  XSS_LIVE_LABELS,
  XSS_NOT_KNOWN_YET_TEXT,
  XSS_NOTHING_RECEIVED_TEXT,
  XSS_PAGE_EFFECT_TEXT,
  XSS_PROTECTED_COOKIE_NOTE,
  XSS_ROW_LABELS,
  XSS_SESSION_COOKIE,
  XSS_SOURCE_LABEL,
  XSS_TITLE,
  XSS_TONE_LEGEND_TEXT,
  XSS_WAITING_TEXT,
} from "@/content/cybersecContent";
import { lerp } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader, type ThemeColorName } from "@/lib/ascii/glyphStyle";
import type { GlyphFrame } from "@/lib/ascii/types";
import { describeSwitchState } from "@/lib/describeSwitchState";
import { XSS_CONTROLS, type XssConfig } from "./controls/xssControls";
import { createConfigurableDemo } from "./createConfigurableDemo";
import {
  drawThemedCell,
  drawThemedText,
  drawWrappedColoredGlyphs,
  type ColoredGlyph,
  type ThemedScene,
} from "./cybersecCanvasDrawing";
import { LessonPanel } from "./LessonPanel";
import { analyseComment, type CommentAnalysis, type XssTone } from "./xssPageAnalysis";
import { XSS_GLOSSARY_ENTRIES, XSS_LESSON_STEPS } from "./xssLessons";

type XssScene = {
  config: XssConfig;
  analysis: CommentAnalysis;
  pageGlyphs: readonly ColoredGlyph[];
  totalSeconds: number;
  elapsedSeconds: number;
} & ThemedScene;

type StageProgress = {
  isCommentArrived: boolean;
  isRenderDone: boolean;
  isFinished: boolean;
};

const TONE_COLOR_NAME: Record<XssTone, ThemeColorName> = {
  pageCode: "paper",
  commentText: "wasp",
  commentCode: "accent",
  escapedText: "signal",
};

const LEGEND_TONES = Object.keys(XSS_TONE_LEGEND_TEXT) as XssTone[];

const COMMENT_PACKET_GLYPH = "▼";
const SWATCH_GLYPH = "█";

const COMMENT_TRAVEL_SECONDS = 0.8;
const RENDER_SECONDS = 0.6;
const COOKIE_TRAVEL_SECONDS = 0.8;
const MAX_STEP_SECONDS = 0.1;

const SIDE_MARGIN_COLUMNS = 2;
const PACKET_COLUMN = SIDE_MARGIN_COLUMNS - 1;
const TITLE_ROW = 1;
const HINT_ROW = 2;
const COMMENT_LABEL_ROW = 4;
const COMMENT_ROW = 5;
const SOURCE_LABEL_ROW = 7;
const SECTION_GAP_ROWS = 1;
const COMMENT_VALUE_COLUMN = 12;
const BROWSER_VALUE_COLUMN = 14;
const LEGEND_COLUMN_WIDTH = 26;
const LEGEND_COLUMNS_PER_ROW = 2;
const LEGEND_ROW_COUNT = Math.ceil(LEGEND_TONES.length / LEGEND_COLUMNS_PER_ROW);
const BROWSER_ROW_COUNT = 3;
const LIVE_VALUE_COLUMN = 28;

function readTotalSeconds({ isCookieSent }: CommentAnalysis): number {
  return COMMENT_TRAVEL_SECONDS + RENDER_SECONDS + (isCookieSent ? COOKIE_TRAVEL_SECONDS : 0);
}

function createScene(config: XssConfig): XssScene {
  const analysis = analyseComment(config.commentText, config.isEscapeEnabled, config.isCookieProtected);
  return {
    config,
    analysis,
    pageGlyphs: analysis.pageCells.map(({ character, tone }) => ({ character, colorName: TONE_COLOR_NAME[tone] })),
    totalSeconds: readTotalSeconds(analysis),
    elapsedSeconds: 0,
    readThemeColor: createThemeColorReader(),
  };
}

function updateScene(scene: XssScene, { deltaSeconds, prefersReducedMotion }: GlyphFrame): void {
  scene.elapsedSeconds = prefersReducedMotion
    ? scene.totalSeconds
    : Math.min(scene.totalSeconds, scene.elapsedSeconds + Math.min(deltaSeconds, MAX_STEP_SECONDS));
}

function restartRun(scene: XssScene): void {
  scene.elapsedSeconds = 0;
}

function handleKeyDown(scene: XssScene, event: KeyboardEvent): void {
  if (event.key === "Enter") restartRun(scene);
}

function readProgress({ elapsedSeconds, totalSeconds }: XssScene): StageProgress {
  return {
    isCommentArrived: elapsedSeconds >= COMMENT_TRAVEL_SECONDS,
    isRenderDone: elapsedSeconds >= COMMENT_TRAVEL_SECONDS + RENDER_SECONDS,
    isFinished: elapsedSeconds >= totalSeconds,
  };
}

function readEffectColorName({ analysis, config }: XssScene): ThemeColorName {
  if (analysis.pageEffect === "script") return "accent";
  if (analysis.pageEffect === "tag") return "wasp";
  return config.isEscapeEnabled ? "signal" : "light";
}

function drawHeader(scene: XssScene, frame: GlyphFrame): void {
  drawThemedText(scene, frame, XSS_TITLE, SIDE_MARGIN_COLUMNS, TITLE_ROW, "paper");
  drawThemedText(scene, frame, XSS_INTRO, SIDE_MARGIN_COLUMNS + XSS_TITLE.length + 2, TITLE_ROW, "mid");
  drawThemedText(scene, frame, XSS_HINT, SIDE_MARGIN_COLUMNS, HINT_ROW, "mid");
}

function drawCommentBox(scene: XssScene, frame: GlyphFrame): void {
  drawThemedText(scene, frame, XSS_COMMENT_LABEL, SIDE_MARGIN_COLUMNS, COMMENT_LABEL_ROW, "mid");
  drawThemedText(scene, frame, XSS_ROW_LABELS.comment, SIDE_MARGIN_COLUMNS, COMMENT_ROW, "light");
  drawThemedText(scene, frame, `[ ${scene.config.commentText} ]`, COMMENT_VALUE_COLUMN, COMMENT_ROW, "wasp");
}

function drawSource(scene: XssScene, frame: GlyphFrame): number {
  drawThemedText(scene, frame, XSS_SOURCE_LABEL, SIDE_MARGIN_COLUMNS, SOURCE_LABEL_ROW, "mid");
  return drawWrappedColoredGlyphs(
    scene,
    frame,
    scene.pageGlyphs,
    SIDE_MARGIN_COLUMNS,
    SOURCE_LABEL_ROW + 1,
    SIDE_MARGIN_COLUMNS,
  );
}

function drawLegend(scene: XssScene, frame: GlyphFrame, topRow: number): void {
  LEGEND_TONES.forEach((tone, toneIndex) => {
    const column = SIDE_MARGIN_COLUMNS + (toneIndex % LEGEND_COLUMNS_PER_ROW) * LEGEND_COLUMN_WIDTH;
    const row = topRow + Math.floor(toneIndex / LEGEND_COLUMNS_PER_ROW);
    drawThemedCell(scene, frame, SWATCH_GLYPH, column, row, TONE_COLOR_NAME[tone]);
    drawThemedText(scene, frame, XSS_TONE_LEGEND_TEXT[tone], column + 2, row, TONE_COLOR_NAME[tone]);
  });
}

function drawBrowser(scene: XssScene, frame: GlyphFrame, labelRow: number, progress: StageProgress): void {
  const { analysis, config } = scene;
  const seesRow = labelRow + 1;
  const runsRow = labelRow + 2;
  const cookieRow = labelRow + 3;

  drawThemedText(scene, frame, XSS_BROWSER_LABEL, SIDE_MARGIN_COLUMNS, labelRow, "mid");
  drawThemedText(scene, frame, XSS_ROW_LABELS.sees, SIDE_MARGIN_COLUMNS, seesRow, "light");
  drawThemedText(scene, frame, XSS_ROW_LABELS.pageRuns, SIDE_MARGIN_COLUMNS, runsRow, "light");
  drawThemedText(scene, frame, XSS_ROW_LABELS.cookie, SIDE_MARGIN_COLUMNS, cookieRow, "light");

  if (!progress.isCommentArrived) {
    drawThemedText(scene, frame, XSS_WAITING_TEXT, BROWSER_VALUE_COLUMN, seesRow, "line");
  } else {
    drawThemedText(scene, frame, analysis.visibleText, BROWSER_VALUE_COLUMN, seesRow, config.isEscapeEnabled ? "signal" : "paper");
    if (analysis.pageEffect === "tag") {
      drawThemedText(scene, frame, XSS_BOLD_NOTE, BROWSER_VALUE_COLUMN + analysis.visibleText.length + 2, seesRow, "wasp");
    }
  }

  if (!progress.isRenderDone) {
    drawThemedText(scene, frame, XSS_WAITING_TEXT, BROWSER_VALUE_COLUMN, runsRow, "line");
  } else {
    drawThemedText(scene, frame, XSS_PAGE_EFFECT_TEXT[analysis.pageEffect], BROWSER_VALUE_COLUMN, runsRow, readEffectColorName(scene));
  }

  const isCookieLeaving = progress.isRenderDone && analysis.isCookieSent;
  drawThemedText(scene, frame, XSS_SESSION_COOKIE, BROWSER_VALUE_COLUMN, cookieRow, isCookieLeaving ? "accent" : "paper");
  if (config.isCookieProtected) {
    drawThemedText(scene, frame, XSS_PROTECTED_COOKIE_NOTE, BROWSER_VALUE_COLUMN + XSS_SESSION_COOKIE.length + 2, cookieRow, "signal");
  }
}

function drawAttacker(scene: XssScene, frame: GlyphFrame, labelRow: number, progress: StageProgress): void {
  const receivedRow = labelRow + 1;
  drawThemedText(scene, frame, XSS_ATTACKER_LABEL, SIDE_MARGIN_COLUMNS, labelRow, "mid");
  drawThemedText(scene, frame, XSS_ROW_LABELS.received, SIDE_MARGIN_COLUMNS, receivedRow, "light");
  if (!progress.isFinished) {
    drawThemedText(scene, frame, XSS_WAITING_TEXT, BROWSER_VALUE_COLUMN, receivedRow, "line");
    return;
  }
  const { isCookieSent } = scene.analysis;
  drawThemedText(
    scene,
    frame,
    isCookieSent ? XSS_SESSION_COOKIE : XSS_NOTHING_RECEIVED_TEXT,
    BROWSER_VALUE_COLUMN,
    receivedRow,
    isCookieSent ? "accent" : "mid",
  );
}

function drawLiveNumbers(scene: XssScene, frame: GlyphFrame, topRow: number, progress: StageProgress): void {
  const { analysis, config } = scene;
  const liveLines: { label: string; value: string; colorName: ThemeColorName }[] = [
    {
      label: XSS_LIVE_LABELS.codeCharacters,
      value: `${analysis.injectedCodeCount} of ${config.commentText.length}`,
      colorName: analysis.injectedCodeCount > 0 ? "accent" : "paper",
    },
    {
      label: XSS_LIVE_LABELS.scriptsRun,
      value: progress.isRenderDone ? String(Number(analysis.isScriptRunning)) : XSS_NOT_KNOWN_YET_TEXT,
      colorName: progress.isRenderDone && analysis.isScriptRunning ? "accent" : "paper",
    },
    {
      label: XSS_LIVE_LABELS.cookiesSent,
      value: progress.isFinished ? String(Number(analysis.isCookieSent)) : XSS_NOT_KNOWN_YET_TEXT,
      colorName: progress.isFinished && analysis.isCookieSent ? "accent" : "paper",
    },
  ];
  liveLines.forEach(({ label, value, colorName }, lineIndex) => {
    drawThemedText(scene, frame, label, SIDE_MARGIN_COLUMNS, topRow + lineIndex, "mid");
    drawThemedText(scene, frame, value, LIVE_VALUE_COLUMN, topRow + lineIndex, colorName);
  });
}

function drawPacket(
  scene: XssScene,
  frame: GlyphFrame,
  firstRow: number,
  secondRow: number,
  thirdRow: number,
): void {
  const { elapsedSeconds, analysis } = scene;
  if (elapsedSeconds < COMMENT_TRAVEL_SECONDS) {
    const travelShare = elapsedSeconds / COMMENT_TRAVEL_SECONDS;
    drawThemedCell(scene, frame, COMMENT_PACKET_GLYPH, PACKET_COLUMN, Math.round(lerp(firstRow, secondRow, travelShare)), "wasp");
    return;
  }
  const cookieStartSeconds = COMMENT_TRAVEL_SECONDS + RENDER_SECONDS;
  const isCookieTravelling = analysis.isCookieSent && elapsedSeconds >= cookieStartSeconds && elapsedSeconds < scene.totalSeconds;
  if (!isCookieTravelling) return;
  const travelShare = (elapsedSeconds - cookieStartSeconds) / COOKIE_TRAVEL_SECONDS;
  drawThemedCell(scene, frame, COMMENT_PACKET_GLYPH, PACKET_COLUMN, Math.round(lerp(secondRow, thirdRow, travelShare)), "accent");
}

function drawScene(scene: XssScene, frame: GlyphFrame): void {
  updateScene(scene, frame);
  const progress = readProgress(scene);

  clearFrame(frame);
  drawHeader(scene, frame);
  drawCommentBox(scene, frame);
  const sourceRowCount = drawSource(scene, frame);
  const legendTopRow = SOURCE_LABEL_ROW + 1 + sourceRowCount + SECTION_GAP_ROWS;
  drawLegend(scene, frame, legendTopRow);
  const browserLabelRow = legendTopRow + LEGEND_ROW_COUNT + SECTION_GAP_ROWS;
  drawBrowser(scene, frame, browserLabelRow, progress);
  const attackerLabelRow = browserLabelRow + 1 + BROWSER_ROW_COUNT + SECTION_GAP_ROWS;
  drawAttacker(scene, frame, attackerLabelRow, progress);
  drawLiveNumbers(scene, frame, attackerLabelRow + 2 + SECTION_GAP_ROWS, progress);
  drawPacket(scene, frame, COMMENT_ROW, browserLabelRow + 1, attackerLabelRow + 1);
}

type CrossSiteScriptProps = {
  config: XssConfig;
};

function CrossSiteScript({ config }: CrossSiteScriptProps) {
  const { isScriptRunning, isCookieSent, pageEffect, injectedCodeCount } = analyseComment(
    config.commentText,
    config.isEscapeEnabled,
    config.isCookieProtected,
  );

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row">
      <div className="relative min-h-0 flex-1">
        <GlyphCanvas
          key={`${config.commentText}-${config.isEscapeEnabled}-${config.isCookieProtected}`}
          createScene={() => createScene(config)}
          drawScene={drawScene}
          onPress={restartRun}
          onKeyDown={handleKeyDown}
        />
        <p role="status" className="sr-only">
          Comment: {config.commentText}. Escape output: {describeSwitchState(config.isEscapeEnabled)}. Cookie
          protection: {describeSwitchState(config.isCookieProtected)}. {injectedCodeCount} characters run as code. The
          page runs {XSS_PAGE_EFFECT_TEXT[pageEffect]}. Scripts run: {Number(isScriptRunning)}. Cookies sent to the
          attacker: {Number(isCookieSent)}.
        </p>
      </div>
      <LessonPanel steps={XSS_LESSON_STEPS} glossaryEntries={XSS_GLOSSARY_ENTRIES} config={config} />
    </div>
  );
}

export const CrossSiteScriptDemo = createConfigurableDemo(XSS_CONTROLS, CrossSiteScript);
