import {
  TERMINAL_BOOT_HEADER,
  TERMINAL_BOOT_STEPS,
  TERMINAL_PROMPT_TEXT,
} from "@/content/loaderContent";
import { drawGlyphText } from "@/lib/ascii/drawGlyphText";
import { progressBetween } from "@/lib/ascii/easing";
import { GLYPH_SETS } from "@/lib/ascii/glyphSets";
import {
  GLYPH_FONT_FAMILY,
  clearFrame,
  createThemeColorReader,
  type ThemeColorName,
} from "@/lib/ascii/glyphStyle";
import { TAGLINE_LINES } from "@/lib/ascii/taglineLayout";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import { createLoaderControls } from "./loaderControls";
import type { LoaderDefinition } from "./loaderDefinition";

type TerminalRevealScene = {
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

type TextCursor = { x: number; y: number; width: number; height: number };

const BOOT_END_SHARE = 0.6;
const BOOT_CLEAR_SHARE = 0.62;
const PROMPT_START_SHARE = 0.64;
const PROMPT_END_SHARE = 0.76;
const TAGLINE_START_SHARE = 0.78;
const TAGLINE_END_SHARE = 0.97;
const STEP_CONFIRM_SHARE = 0.09;
const STEP_TAG_CONFIRMED = "[  OK  ]";
const STEP_TAG_PENDING = "[  ..  ]";
const STEP_TAG_COLUMNS = STEP_TAG_CONFIRMED.length + 1;
const RULE_CHARACTER = "─";
const BAR_FILLED_CHARACTER = "█";
const BAR_EMPTY_CHARACTER = "░";
const BAR_LABEL = "BOOT ";
const BAR_PERCENT_COLUMNS = 5;
const BOOT_HEADER_ROWS = 2;
const BOOT_FOOTER_ROWS = 2;
const CURSOR_BLINKS_PER_SECOND = 3;
const SCRAMBLE_STEPS_PER_SECOND = 30;
const SCRAMBLE_LOOKAHEAD_COUNT = 3;
const MONO_ADVANCE_EM = 0.6;
const TAGLINE_FONT_WEIGHT = 700;
const TAGLINE_LINE_HEIGHT_EM = 1.25;
const TAGLINE_WIDTH_SHARE = 0.9;
const TAGLINE_MAX_FONT_SIZE_PIXELS = 120;
const PROMPT_GAP_CELLS = 3;
const HASH_MULTIPLIER = 43758.5453;
const HASH_INDEX_FACTOR = 12.9898;
const HASH_STEP_FACTOR = 78.233;

const BOOT_BLOCK_COLUMNS = Math.max(
  TERMINAL_BOOT_HEADER.length,
  ...TERMINAL_BOOT_STEPS.map((step) => STEP_TAG_COLUMNS + step.length),
);
const BOOT_BLOCK_ROWS = BOOT_HEADER_ROWS + TERMINAL_BOOT_STEPS.length + BOOT_FOOTER_ROWS;
const TAGLINE_TEXTS = TAGLINE_LINES.map(({ text }) => text);
const TAGLINE_CHARACTER_COUNT = TAGLINE_TEXTS.reduce((total, text) => total + text.length, 0);
const WIDEST_TAGLINE_COLUMNS = Math.max(...TAGLINE_TEXTS.map((text) => text.length));

function createScene(): TerminalRevealScene {
  return { readThemeColor: createThemeColorReader() };
}

function isCursorVisible(timeSeconds: number): boolean {
  return Math.floor(timeSeconds * CURSOR_BLINKS_PER_SECOND * 2) % 2 === 0;
}

function scrambleCharacter(characterIndex: number, timeSeconds: number): string {
  const timeStep = Math.floor(timeSeconds * SCRAMBLE_STEPS_PER_SECOND);
  const hash = Math.sin(characterIndex * HASH_INDEX_FACTOR + timeStep * HASH_STEP_FACTOR) * HASH_MULTIPLIER;
  const randomShare = hash - Math.floor(hash);
  return GLYPH_SETS.code[Math.floor(randomShare * GLYPH_SETS.code.length)];
}

function drawBootStep(
  scene: TerminalRevealScene,
  frame: GlyphFrame,
  step: string,
  stepIndex: number,
  bootShare: number,
  leftColumn: number,
  row: number,
): void {
  const { context, metrics } = frame;
  const stepStartShare = stepIndex / TERMINAL_BOOT_STEPS.length;
  if (bootShare < stepStartShare) return;
  const isConfirmed = bootShare >= stepStartShare + STEP_CONFIRM_SHARE;
  drawGlyphText(
    context,
    metrics,
    isConfirmed ? STEP_TAG_CONFIRMED : STEP_TAG_PENDING,
    leftColumn,
    row,
    scene.readThemeColor(isConfirmed ? "signal" : "mid"),
  );
  drawGlyphText(
    context,
    metrics,
    step,
    leftColumn + STEP_TAG_COLUMNS,
    row,
    scene.readThemeColor(isConfirmed ? "paper" : "light"),
  );
}

function drawBootFooter(
  scene: TerminalRevealScene,
  frame: GlyphFrame,
  bootShare: number,
  leftColumn: number,
  row: number,
): void {
  const { context, metrics } = frame;
  const barColumns = BOOT_BLOCK_COLUMNS - BAR_LABEL.length - BAR_PERCENT_COLUMNS;
  const filledColumns = Math.floor(bootShare * barColumns);
  const percentText = `${Math.floor(bootShare * 100)}%`.padStart(BAR_PERCENT_COLUMNS);
  drawGlyphText(context, metrics, BAR_LABEL, leftColumn, row, scene.readThemeColor("mid"));
  drawGlyphText(
    context,
    metrics,
    BAR_FILLED_CHARACTER.repeat(filledColumns),
    leftColumn + BAR_LABEL.length,
    row,
    scene.readThemeColor("paper"),
  );
  drawGlyphText(
    context,
    metrics,
    BAR_EMPTY_CHARACTER.repeat(barColumns - filledColumns),
    leftColumn + BAR_LABEL.length + filledColumns,
    row,
    scene.readThemeColor("line"),
  );
  drawGlyphText(
    context,
    metrics,
    percentText,
    leftColumn + BAR_LABEL.length + barColumns,
    row,
    scene.readThemeColor("light"),
  );
}

function drawBoot(scene: TerminalRevealScene, frame: GlyphFrame, progress: number): void {
  const { context, metrics } = frame;
  const bootShare = progressBetween(progress, 0, BOOT_END_SHARE);
  const leftColumn = Math.max(0, Math.floor((metrics.columns - BOOT_BLOCK_COLUMNS) / 2));
  const topRow = Math.max(0, Math.floor((metrics.rows - BOOT_BLOCK_ROWS) / 2));
  drawGlyphText(context, metrics, TERMINAL_BOOT_HEADER, leftColumn, topRow, scene.readThemeColor("mid"));
  drawGlyphText(
    context,
    metrics,
    RULE_CHARACTER.repeat(BOOT_BLOCK_COLUMNS),
    leftColumn,
    topRow + 1,
    scene.readThemeColor("line"),
  );
  TERMINAL_BOOT_STEPS.forEach((step, stepIndex) => {
    drawBootStep(scene, frame, step, stepIndex, bootShare, leftColumn, topRow + BOOT_HEADER_ROWS + stepIndex);
  });
  drawBootFooter(scene, frame, bootShare, leftColumn, topRow + BOOT_HEADER_ROWS + TERMINAL_BOOT_STEPS.length + 1);
}

function fitTaglineFontSize(metrics: GlyphMetrics): number {
  const fontSizeFittingWidth = (metrics.canvasWidth * TAGLINE_WIDTH_SHARE) / (WIDEST_TAGLINE_COLUMNS * MONO_ADVANCE_EM);
  return Math.min(fontSizeFittingWidth, TAGLINE_MAX_FONT_SIZE_PIXELS);
}

function drawPrompt(
  scene: TerminalRevealScene,
  frame: GlyphFrame,
  progress: number,
  promptRow: number,
  promptColumn: number,
): TextCursor | null {
  if (progress >= 1) return null;
  const { context, metrics } = frame;
  const typedCharacterCount = Math.floor(
    progressBetween(progress, PROMPT_START_SHARE, PROMPT_END_SHARE) * TERMINAL_PROMPT_TEXT.length,
  );
  drawGlyphText(
    context,
    metrics,
    TERMINAL_PROMPT_TEXT.slice(0, typedCharacterCount),
    promptColumn,
    promptRow,
    scene.readThemeColor("signal"),
  );
  return {
    x: (promptColumn + typedCharacterCount) * metrics.cellWidth,
    y: promptRow * metrics.cellHeight,
    width: metrics.cellWidth,
    height: metrics.cellHeight,
  };
}

function drawTagline(
  scene: TerminalRevealScene,
  frame: GlyphFrame,
  progress: number,
  fontSizePixels: number,
): TextCursor | null {
  const { context, metrics, timeSeconds } = frame;
  const typedCharacterCount = Math.floor(
    progressBetween(progress, TAGLINE_START_SHARE, TAGLINE_END_SHARE) * TAGLINE_CHARACTER_COUNT,
  );
  const lineHeightPixels = fontSizePixels * TAGLINE_LINE_HEIGHT_EM;
  const topPixels = (metrics.canvasHeight - lineHeightPixels * TAGLINE_LINES.length) / 2;
  const advancePixels = fontSizePixels * MONO_ADVANCE_EM;
  let characterIndex = 0;
  let cursor: TextCursor | null = null;

  context.font = `${TAGLINE_FONT_WEIGHT} ${fontSizePixels}px ${GLYPH_FONT_FAMILY}`;
  TAGLINE_LINES.forEach(({ text, colorName }, lineIndex) => {
    const leftPixels = (metrics.canvasWidth - text.length * advancePixels) / 2;
    const topLinePixels = topPixels + lineIndex * lineHeightPixels;
    [...text].forEach((character, characterOffset) => {
      const isTyped = characterIndex < typedCharacterCount;
      const isScrambled =
        !isTyped && characterIndex < typedCharacterCount + SCRAMBLE_LOOKAHEAD_COUNT && character !== " ";
      if (isTyped || isScrambled) {
        const shownCharacter = isTyped ? character : scrambleCharacter(characterIndex, timeSeconds);
        const shownColorName: ThemeColorName = isTyped ? colorName : "mid";
        context.fillStyle = scene.readThemeColor(shownColorName);
        context.fillText(shownCharacter, leftPixels + characterOffset * advancePixels, topLinePixels);
      }
      if (characterIndex === typedCharacterCount) {
        cursor = {
          x: leftPixels + characterOffset * advancePixels,
          y: topLinePixels,
          width: advancePixels,
          height: fontSizePixels,
        };
      }
      characterIndex += 1;
    });
  });
  return cursor;
}

function drawCursor(
  scene: TerminalRevealScene,
  frame: GlyphFrame,
  cursor: TextCursor | null,
): void {
  if (!cursor || !isCursorVisible(frame.timeSeconds)) return;
  frame.context.fillStyle = scene.readThemeColor("paper");
  frame.context.fillRect(cursor.x, cursor.y, cursor.width, cursor.height);
}

function drawScene(scene: TerminalRevealScene, frame: GlyphFrame, progress: number): void {
  const { context, metrics } = frame;
  const originalFont = context.font;
  clearFrame(frame);

  if (progress < BOOT_CLEAR_SHARE) {
    drawBoot(scene, frame, progress);
    return;
  }

  const fontSizePixels = fitTaglineFontSize(metrics);
  const promptRow = Math.max(
    0,
    Math.floor(
      ((metrics.canvasHeight - fontSizePixels * TAGLINE_LINE_HEIGHT_EM * TAGLINE_LINES.length) / 2) /
        metrics.cellHeight,
    ) - PROMPT_GAP_CELLS,
  );
  const promptColumn = Math.floor((metrics.columns - TERMINAL_PROMPT_TEXT.length) / 2);
  const promptCursor = drawPrompt(scene, frame, progress, promptRow, promptColumn);
  const taglineCursor = progress >= TAGLINE_START_SHARE ? drawTagline(scene, frame, progress, fontSizePixels) : null;
  context.font = originalFont;
  drawCursor(scene, frame, progress >= TAGLINE_START_SHARE ? taglineCursor : promptCursor);
}

export const TERMINAL_REVEAL_LOADER: LoaderDefinition<TerminalRevealScene> = {
  controls: createLoaderControls(14),
  createScene,
  drawScene,
};
