"use client";

import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import { RACE_SCENARIOS, RACE_WINDOW_HINT } from "@/content/cybersecContent";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { clearFrame, createThemeColorReader, type ThemeColorName } from "@/lib/ascii/glyphStyle";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import {
  STEPS_PER_THREAD,
  THREAD_INTERLEAVINGS,
  THREAD_NAMES,
  type ThreadName,
} from "@/lib/threadInterleavings";
import type { ConfigOf } from "@/lib/variantControls";
import { RACE_WINDOW_CONTROLS } from "./controls/raceWindowControls";
import { createConfigurableDemo } from "./createConfigurableDemo";

type RaceWindowConfig = ConfigOf<typeof RACE_WINDOW_CONTROLS>;

type StepKind = "read" | "check" | "write";

type TravelStepKind = "read" | "write";

type StepStatus = "pending" | "active" | "done";

type RaceRules = {
  startingBalance: number;
  withdrawalAmount: number;
};

type RaceStep = {
  stepIndex: number;
  threadName: ThreadName;
  stepKind: StepKind;
  balanceSeenByThread: number;
  isCheckPassed: boolean;
  isPaid: boolean;
  balanceBeforeStep: number;
  balanceAfterStep: number;
  paidOutAfterStep: number;
};

type RaceView = {
  steps: readonly RaceStep[];
  completedStepCount: number;
  activeStep: RaceStep | undefined;
  activeStepProgress: number;
  balance: number;
  paidOut: number;
  isBroken: boolean;
};

type RaceLayout = {
  sceneColumn: number;
  sceneWidth: number;
  sceneTopRow: number;
  threadColumns: Record<ThreadName, number>;
};

type RaceScene = {
  elapsedStepCount: number;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

type RaceDraw = {
  frame: GlyphFrame;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
  layout: RaceLayout;
  view: RaceView;
  rules: RaceRules;
  isLockEnabled: boolean;
};

const STEP_KINDS: readonly StepKind[] = ["read", "check", "write"];
const TRAVEL_STEP_KINDS: readonly TravelStepKind[] = ["read", "write"];
const THREAD_COLOR_NAMES: Record<ThreadName, ThemeColorName> = { A: "ice", B: "wasp" };
const RAIL_ARROWS: Record<TravelStepKind, string> = { read: "v", write: "^" };
const RAIL_LABELS: Record<TravelStepKind, string> = { read: "READ", write: "WRITE" };
const RAIL_COLUMN_OFFSETS: Record<TravelStepKind, number> = { read: 9, write: 22 };
const RAIL_LABEL_COLUMN_OFFSETS: Record<TravelStepKind, number> = { read: 2, write: 26 };

const ONE_AT_A_TIME_ORDER: readonly ThreadName[] = THREAD_NAMES.flatMap((threadName) =>
  Array<ThreadName>(STEPS_PER_THREAD).fill(threadName),
);
const SAME_TIME_ORDER: readonly ThreadName[] = Array.from({ length: STEPS_PER_THREAD }, () => [
  ...THREAD_NAMES,
]).flat();

const COIN_VALUE = 10;
const END_HOLD_STEP_COUNT = 4;
const MAX_STEP_SECONDS = 0.1;

const THREAD_BOX_WIDTH = 35;
const THREAD_BOX_HEIGHT = 6;
const VAULT_HEIGHT = 5;
const RAIL_ROWS = 5;
const MIN_GAP_COLUMNS = 2;
const MAX_GAP_COLUMNS = 12;
const SIDE_MARGIN_COLUMNS = 4;
const HUD_ROWS = 4;
const PACKET_WIDTH_COLUMNS = 5;
const PACKET_CENTER_OFFSET_COLUMNS = 2;
const VAULT_TEXT_INDENT_COLUMNS = 3;
const MARKER_COLUMN_OFFSET = 2;
const CODE_COLUMN_OFFSET = 4;
const NOTE_COLUMN_OFFSET = 2;
const NOTE_ROW_OFFSET = 4;
const TURN_CELL_WIDTH_COLUMNS = 4;
const TURN_LABEL_OFFSET_COLUMNS = 7;

const THREAD_TOP_OFFSET = VAULT_HEIGHT + RAIL_ROWS;
const RAIL_LABEL_ROW_OFFSET = VAULT_HEIGHT + Math.floor(RAIL_ROWS / 2);
const TURNS_ROW_OFFSET = THREAD_TOP_OFFSET + THREAD_BOX_HEIGHT + 1;
const MESSAGE_ROW_OFFSET = TURNS_ROW_OFFSET + 2;

function chooseStepOrder(config: RaceWindowConfig): readonly ThreadName[] {
  if (config.scenario === RACE_SCENARIOS.race) return SAME_TIME_ORDER;
  if (config.scenario === RACE_SCENARIOS.custom) return THREAD_INTERLEAVINGS[config.customOrderNumber];
  return ONE_AT_A_TIME_ORDER;
}

function runSteps(stepOrder: readonly ThreadName[], { startingBalance, withdrawalAmount }: RaceRules): RaceStep[] {
  let balance = startingBalance;
  let paidOut = 0;
  const balancesSeen: Record<ThreadName, number> = { A: 0, B: 0 };
  const passedChecks: Record<ThreadName, boolean> = { A: false, B: false };
  const finishedStepCounts: Record<ThreadName, number> = { A: 0, B: 0 };

  return stepOrder.map((threadName, stepIndex) => {
    const stepKind = STEP_KINDS[finishedStepCounts[threadName]];
    finishedStepCounts[threadName] += 1;
    const balanceBeforeStep = balance;

    if (stepKind === "read") balancesSeen[threadName] = balance;
    if (stepKind === "check") passedChecks[threadName] = balancesSeen[threadName] >= withdrawalAmount;
    const isPaid = stepKind === "write" && passedChecks[threadName];
    if (isPaid) {
      balance = balancesSeen[threadName] - withdrawalAmount;
      paidOut += withdrawalAmount;
    }

    return {
      stepIndex,
      threadName,
      stepKind,
      balanceSeenByThread: balancesSeen[threadName],
      isCheckPassed: passedChecks[threadName],
      isPaid,
      balanceBeforeStep,
      balanceAfterStep: balance,
      paidOutAfterStep: paidOut,
    };
  });
}

function didStepSucceed({ stepKind, isCheckPassed, isPaid }: RaceStep): boolean {
  if (stepKind === "check") return isCheckPassed;
  if (stepKind === "write") return isPaid;
  return true;
}

function resolveStepStatus(stepIndex: number, completedStepCount: number): StepStatus {
  if (stepIndex < completedStepCount) return "done";
  return stepIndex === completedStepCount ? "active" : "pending";
}

function buildCodeLines({ withdrawalAmount }: RaceRules): Record<StepKind, string> {
  return {
    read: "balance = read(account)",
    check: `if balance >= ${withdrawalAmount}:`,
    write: `  pay ${withdrawalAmount}, save balance - ${withdrawalAmount}`,
  };
}

function describeStepAction(step: RaceStep, { withdrawalAmount }: RaceRules): string {
  const threadLabel = `Thread ${step.threadName}`;
  const seenBalance = step.balanceSeenByThread;
  if (step.stepKind === "read") return `${threadLabel} reads the balance. It sees ${seenBalance}.`;
  if (step.stepKind === "check") {
    return step.isCheckPassed
      ? `${threadLabel} checks its note. ${seenBalance} is enough for ${withdrawalAmount}. It goes on.`
      : `${threadLabel} checks its note. ${seenBalance} is not enough for ${withdrawalAmount}. It stops.`;
  }
  if (!step.isPaid) return `${threadLabel} does not pay. Its check failed.`;
  return seenBalance === step.balanceBeforeStep
    ? `${threadLabel} pays ${withdrawalAmount} and saves the new balance: ${step.balanceAfterStep}.`
    : `${threadLabel} pays ${withdrawalAmount}. But the real balance is ${step.balanceBeforeStep}. Its note is old.`;
}

function describeVerdict({ balance, paidOut, isBroken }: RaceView, { startingBalance }: RaceRules): string {
  return isBroken
    ? `RACE CONDITION. Paid ${paidOut}. Balance shows ${balance}. It must show ${startingBalance - paidOut}.`
    : `No race. Paid ${paidOut}. Balance shows ${balance}. This is correct.`;
}

function createScene(): RaceScene {
  return { elapsedStepCount: 0, readThemeColor: createThemeColorReader() };
}

function createView(steps: readonly RaceStep[], elapsedStepCount: number, rules: RaceRules): RaceView {
  const cycleStepCount = steps.length + END_HOLD_STEP_COUNT;
  const playedStepCount = Math.min(steps.length, elapsedStepCount % cycleStepCount);
  const completedStepCount = Math.floor(playedStepCount);
  const latestCompletedStep = steps[completedStepCount - 1];
  const balance = latestCompletedStep?.balanceAfterStep ?? rules.startingBalance;
  const paidOut = latestCompletedStep?.paidOutAfterStep ?? 0;

  return {
    steps,
    completedStepCount,
    activeStep: steps[completedStepCount],
    activeStepProgress: playedStepCount - completedStepCount,
    balance,
    paidOut,
    isBroken: balance + paidOut !== rules.startingBalance,
  };
}

function createLayout({ columns }: GlyphMetrics): RaceLayout {
  const freeColumns = columns - 2 * THREAD_BOX_WIDTH - 2 * SIDE_MARGIN_COLUMNS;
  const gapColumns = Math.min(MAX_GAP_COLUMNS, Math.max(MIN_GAP_COLUMNS, Math.floor(freeColumns / 2)));
  const sceneWidth = 2 * THREAD_BOX_WIDTH + gapColumns;
  const sceneColumn = Math.max(0, Math.floor((columns - sceneWidth) / 2));

  return {
    sceneColumn,
    sceneWidth,
    sceneTopRow: HUD_ROWS,
    threadColumns: { A: sceneColumn, B: sceneColumn + THREAD_BOX_WIDTH + gapColumns },
  };
}

function centeredColumn(containerColumn: number, containerWidth: number, contentWidth: number): number {
  return containerColumn + Math.floor((containerWidth - contentWidth) / 2);
}

function railColumn({ threadColumns }: RaceLayout, threadName: ThreadName, stepKind: TravelStepKind): number {
  return threadColumns[threadName] + RAIL_COLUMN_OFFSETS[stepKind];
}

function drawText(
  { frame, readThemeColor }: RaceDraw,
  text: string,
  column: number,
  row: number,
  colorName: ThemeColorName,
): void {
  drawGlyphCell(frame.context, frame.metrics, text, column, row, readThemeColor(colorName));
}

function clearCells({ context, metrics }: GlyphFrame, column: number, row: number, cellCount: number): void {
  context.fillStyle = metrics.palette.backgroundColor;
  context.fillRect(
    column * metrics.cellWidth,
    row * metrics.cellHeight,
    cellCount * metrics.cellWidth,
    metrics.cellHeight,
  );
}

function drawBox(
  draw: RaceDraw,
  column: number,
  topRow: number,
  width: number,
  height: number,
  title: string,
  colorName: ThemeColorName,
): void {
  drawText(draw, `+${`- ${title} `.padEnd(width - 2, "-")}+`, column, topRow, colorName);
  drawText(draw, `+${"-".repeat(width - 2)}+`, column, topRow + height - 1, colorName);
  for (let rowOffset = 1; rowOffset < height - 1; rowOffset += 1) {
    drawText(draw, "|", column, topRow + rowOffset, colorName);
    drawText(draw, "|", column + width - 1, topRow + rowOffset, colorName);
  }
}

function drawCoins(
  draw: RaceDraw,
  column: number,
  row: number,
  slotCount: number,
  filledCount: number,
  honestSlotCount: number,
): void {
  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    const isFilled = slotIndex < filledCount;
    const filledColorName: ThemeColorName = slotIndex < honestSlotCount ? "paper" : "accent";
    drawText(draw, isFilled ? "$" : ".", column + slotIndex, row, isFilled ? filledColorName : "line");
  }
}

function drawHud(draw: RaceDraw): void {
  drawText(
    draw,
    `Two threads run the same code. Each takes ${draw.rules.withdrawalAmount} from one account.`,
    SIDE_MARGIN_COLUMNS,
    1,
    "light",
  );
  drawText(draw, RACE_WINDOW_HINT, SIDE_MARGIN_COLUMNS, 2, "mid");
}

function drawVault(draw: RaceDraw): void {
  const { layout, view, rules, isLockEnabled } = draw;
  const { sceneColumn, sceneWidth, sceneTopRow } = layout;
  const leftColumn = sceneColumn + VAULT_TEXT_INDENT_COLUMNS;
  const rightColumn = sceneColumn + Math.floor(sceneWidth / 2) + VAULT_TEXT_INDENT_COLUMNS;
  const startingSlotCount = rules.startingBalance / COIN_VALUE;
  const trayColorName: ThemeColorName = view.paidOut > rules.startingBalance ? "accent" : "paper";
  const totalColorName: ThemeColorName = view.isBroken ? "accent" : "signal";
  const lockText = isLockEnabled ? "LOCK ON" : "LOCK OFF";

  drawBox(draw, sceneColumn, sceneTopRow, sceneWidth, VAULT_HEIGHT, "ACCOUNT", view.isBroken ? "accent" : "light");
  drawText(draw, `BALANCE ${view.balance}`, leftColumn, sceneTopRow + 1, "paper");
  drawText(draw, `PAID OUT ${view.paidOut}`, rightColumn, sceneTopRow + 1, trayColorName);
  drawCoins(draw, leftColumn, sceneTopRow + 2, startingSlotCount, view.balance / COIN_VALUE, startingSlotCount);
  drawCoins(
    draw,
    rightColumn,
    sceneTopRow + 2,
    (THREAD_NAMES.length * rules.withdrawalAmount) / COIN_VALUE,
    view.paidOut / COIN_VALUE,
    startingSlotCount,
  );
  drawText(
    draw,
    `balance + paid out = ${view.balance + view.paidOut} (start ${rules.startingBalance})`,
    leftColumn,
    sceneTopRow + 3,
    totalColorName,
  );
  drawText(
    draw,
    lockText,
    sceneColumn + sceneWidth - VAULT_TEXT_INDENT_COLUMNS - lockText.length,
    sceneTopRow + 3,
    isLockEnabled ? "signal" : "mid",
  );
}

function drawRails(draw: RaceDraw): void {
  const { layout, view } = draw;
  const railTopRow = layout.sceneTopRow + VAULT_HEIGHT;
  const labelRow = layout.sceneTopRow + RAIL_LABEL_ROW_OFFSET;

  THREAD_NAMES.forEach((threadName) => {
    TRAVEL_STEP_KINDS.forEach((stepKind) => {
      const isActiveRail = view.activeStep?.threadName === threadName && view.activeStep.stepKind === stepKind;
      const colorName = isActiveRail ? THREAD_COLOR_NAMES[threadName] : "line";
      for (let rowOffset = 0; rowOffset < RAIL_ROWS; rowOffset += 1) {
        drawText(draw, RAIL_ARROWS[stepKind], railColumn(layout, threadName, stepKind), railTopRow + rowOffset, colorName);
      }
      drawText(
        draw,
        RAIL_LABELS[stepKind],
        layout.threadColumns[threadName] + RAIL_LABEL_COLUMN_OFFSETS[stepKind],
        labelRow,
        "mid",
      );
    });
  });
}

function drawThreadBox(draw: RaceDraw, threadName: ThreadName): void {
  const { layout, view, rules, isLockEnabled } = draw;
  const column = layout.threadColumns[threadName];
  const topRow = layout.sceneTopRow + THREAD_TOP_OFFSET;
  const threadColorName = THREAD_COLOR_NAMES[threadName];
  const threadSteps = view.steps.filter((step) => step.threadName === threadName);
  const codeLines = buildCodeLines(rules);
  const hasActiveStep = view.activeStep?.threadName === threadName;

  drawBox(
    draw,
    column,
    topRow,
    THREAD_BOX_WIDTH,
    THREAD_BOX_HEIGHT,
    `THREAD ${threadName}`,
    hasActiveStep ? threadColorName : "line",
  );

  threadSteps.forEach((step, lineIndex) => {
    const status = resolveStepStatus(step.stepIndex, view.completedStepCount);
    const didSucceed = didStepSucceed(step);
    const marker = status === "active" ? ">" : didSucceed ? "+" : "x";
    const colorName: ThemeColorName =
      status === "active" ? threadColorName : status === "done" && didSucceed ? "light" : "mid";
    const row = topRow + 1 + lineIndex;
    if (status !== "pending") drawText(draw, marker, column + MARKER_COLUMN_OFFSET, row, colorName);
    drawText(draw, codeLines[step.stepKind], column + CODE_COLUMN_OFFSET, row, colorName);
  });

  const [readStep, , writeStep] = threadSteps;
  const hasRead = readStep.stepIndex < view.completedStepCount;
  const hasWritten = writeStep.stepIndex < view.completedStepCount;
  const isWaitingForLock =
    isLockEnabled && !hasRead && view.activeStep !== undefined && view.activeStep.threadName !== threadName;
  const noteColumn = column + NOTE_COLUMN_OFFSET;
  const noteRow = topRow + NOTE_ROW_OFFSET;

  if (isWaitingForLock) {
    drawText(draw, "waiting for the lock...", noteColumn, noteRow, "mid");
    return;
  }
  if (!hasRead) {
    drawText(draw, "note: nothing yet", noteColumn, noteRow, "mid");
    return;
  }
  const noteText = `note: balance = ${readStep.balanceSeenByThread}`;
  drawText(draw, noteText, noteColumn, noteRow, "light");
  if (!hasWritten && readStep.balanceSeenByThread !== view.balance) {
    drawText(draw, "OLD NUMBER", noteColumn + noteText.length + 1, noteRow, "accent");
  }
}

function drawPacket(draw: RaceDraw): void {
  const { layout, view } = draw;
  const { activeStep, activeStepProgress } = view;
  if (!activeStep || activeStep.stepKind === "check") return;

  const { threadName, stepKind } = activeStep;
  if (stepKind === "write" && !activeStep.isPaid) return;
  const downShare = stepKind === "read" ? activeStepProgress : 1 - activeStepProgress;
  const row = layout.sceneTopRow + VAULT_HEIGHT + Math.round(downShare * (RAIL_ROWS - 1));
  const column = railColumn(layout, threadName, stepKind) - PACKET_CENTER_OFFSET_COLUMNS;
  const carriedAmount = stepKind === "read" ? activeStep.balanceSeenByThread : activeStep.balanceAfterStep;

  clearCells(draw.frame, column, row, PACKET_WIDTH_COLUMNS);
  drawText(draw, `[${String(carriedAmount).padStart(3)}]`, column, row, THREAD_COLOR_NAMES[threadName]);
}

function drawTurns(draw: RaceDraw): void {
  const { layout, view } = draw;
  const row = layout.sceneTopRow + TURNS_ROW_OFFSET;
  const firstColumn = centeredColumn(
    layout.sceneColumn,
    layout.sceneWidth,
    view.steps.length * TURN_CELL_WIDTH_COLUMNS,
  );

  drawText(draw, "TURNS", firstColumn - TURN_LABEL_OFFSET_COLUMNS, row, "mid");
  view.steps.forEach((step) => {
    const status = resolveStepStatus(step.stepIndex, view.completedStepCount);
    drawText(
      draw,
      status === "active" ? `[${step.threadName}]` : ` ${step.threadName} `,
      firstColumn + step.stepIndex * TURN_CELL_WIDTH_COLUMNS,
      row,
      status === "pending" ? "mid" : THREAD_COLOR_NAMES[step.threadName],
    );
  });
}

function drawMessage(draw: RaceDraw): void {
  const { layout, view, rules } = draw;
  const { activeStep } = view;
  const message = activeStep ? describeStepAction(activeStep, rules) : describeVerdict(view, rules);
  const colorName: ThemeColorName = activeStep
    ? THREAD_COLOR_NAMES[activeStep.threadName]
    : view.isBroken
      ? "accent"
      : "signal";

  drawText(
    draw,
    message,
    centeredColumn(layout.sceneColumn, layout.sceneWidth, message.length),
    layout.sceneTopRow + MESSAGE_ROW_OFFSET,
    colorName,
  );
}

type RaceWindowProps = {
  config: RaceWindowConfig;
};

function RaceWindow({ config }: RaceWindowProps) {
  const rules: RaceRules = {
    startingBalance: config.startingBalance,
    withdrawalAmount: config.withdrawalAmount,
  };
  const steps = runSteps(chooseStepOrder(config), rules);
  const isLockEnabled = config.scenario === RACE_SCENARIOS.lock;

  const drawScene = (scene: RaceScene, frame: GlyphFrame) => {
    if (!config.isPaused) {
      scene.elapsedStepCount += Math.min(frame.deltaSeconds, MAX_STEP_SECONDS) / config.stepSeconds;
    }
    const draw: RaceDraw = {
      frame,
      readThemeColor: scene.readThemeColor,
      layout: createLayout(frame.metrics),
      view: createView(steps, scene.elapsedStepCount, rules),
      rules,
      isLockEnabled,
    };

    clearFrame(frame);
    drawHud(draw);
    drawVault(draw);
    drawRails(draw);
    THREAD_NAMES.forEach((threadName) => drawThreadBox(draw, threadName));
    drawPacket(draw);
    drawTurns(draw);
    drawMessage(draw);
  };

  const handlePress = (scene: RaceScene) => {
    scene.elapsedStepCount = 0;
  };

  return (
    <GlyphCanvas
      key={`${config.scenario}-${config.customOrderNumber}-${config.startingBalance}-${config.withdrawalAmount}`}
      createScene={createScene}
      drawScene={drawScene}
      onPress={handlePress}
    />
  );
}

export const RaceWindowDemo = createConfigurableDemo(RACE_WINDOW_CONTROLS, RaceWindow);
