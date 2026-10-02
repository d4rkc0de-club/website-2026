"use client";

import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import {
  FIREWALL_DEFAULT_SOURCE_TEXT,
  FIREWALL_DONE_TEXT,
  FIREWALL_HINT,
  FIREWALL_INTRO,
  FIREWALL_LIVE_LABELS,
  FIREWALL_PACKET_LABEL,
  FIREWALL_PORT_NAMES,
  FIREWALL_RESULTS_LABEL,
  FIREWALL_RULES_LABEL,
  FIREWALL_SERVER_BOTTOM_LINE,
  FIREWALL_SERVER_EMPTY_LINE,
  FIREWALL_SERVER_NAME_LINE,
  FIREWALL_SERVER_TOP_LINE,
  FIREWALL_SOURCE_LABELS,
  FIREWALL_TITLE,
  type FirewallRule,
} from "@/content/cybersecContent";
import { clamp, lerp } from "@/lib/ascii/easing";
import { clearFrame, createThemeColorReader, type ThemeColorName } from "@/lib/ascii/glyphStyle";
import type { GlyphFrame } from "@/lib/ascii/types";
import { describeSwitchState } from "@/lib/describeSwitchState";
import { FIREWALL_RULES_CONTROLS, type FirewallRulesConfig } from "./controls/firewallRulesControls";
import { createConfigurableDemo } from "./createConfigurableDemo";
import { drawThemedCell, drawThemedText, type ThemedScene } from "./cybersecCanvasDrawing";
import { evaluateFirewall, summariseVerdicts, type PacketVerdict } from "./firewallRulesEvaluation";
import { FIREWALL_RULES_GLOSSARY_ENTRIES, FIREWALL_RULES_LESSON_STEPS } from "./firewallRulesLessons";
import { LessonPanel } from "./LessonPanel";

type PacketTimeline = {
  startSeconds: number;
  matchEndSeconds: number;
  endSeconds: number;
};

type FirewallScene = {
  rules: readonly FirewallRule[];
  verdicts: readonly PacketVerdict[];
  timelines: readonly PacketTimeline[];
  totalSeconds: number;
  elapsedSeconds: number;
} & ThemedScene;

type PacketProgress = {
  activePacketIndex: number;
  activeVerdict: PacketVerdict | null;
  decidedPacketCount: number;
  scannerRowIndex: number;
  isOutcomeShown: boolean;
  outcomeShare: number;
};

const ACTION_COLOR_NAME: Record<FirewallRule["action"], ThemeColorName> = {
  allow: "signal",
  deny: "accent",
};

const PACKET_GLYPH = ">";
const BLOCKED_GLYPH = "x";
const WALL_GLYPH = "#";
const CHECKED_GLYPH = "·";

const SECONDS_PER_RULE_CHECK = 0.3;
const OUTCOME_SECONDS = 0.7;
const MAX_STEP_SECONDS = 0.1;
const SERVER_ARRIVAL_SHARE = 0.8;

const SIDE_MARGIN_COLUMNS = 2;
const TITLE_ROW = 1;
const HINT_ROW = 2;
const PACKET_LABEL_ROW = 4;
const PACKET_INFO_ROW = 5;
const RULES_LABEL_ROW = 7;
const RULES_TOP_ROW = 8;
const SECTION_GAP_ROWS = 1;

const RULE_NUMBER_COLUMN = 4;
const RULE_ACTION_COLUMN = 6;
const RULE_SOURCE_COLUMN = 12;
const RULE_PORT_COLUMN = 27;
const WALL_COLUMN = 42;
const SERVER_COLUMN = 46;

const RESULT_SENDER_COLUMN = 2;
const RESULT_SOURCE_COLUMN = 11;
const RESULT_PORT_COLUMN = 26;
const RESULT_RULE_COLUMN = 37;
const RESULT_OUTCOME_COLUMN = 45;
const RESULT_WRONG_COLUMN = 55;

const LIVE_VALUE_COLUMN = 26;

function describePortWithName(port: number): string {
  return `${port} ${FIREWALL_PORT_NAMES[port]}`;
}

function describeRulePort(port: FirewallRule["port"]): string {
  return port === "any" ? "any port" : `port ${describePortWithName(port)}`;
}

function readOutcomeColorName({ isCorrect }: PacketVerdict): ThemeColorName {
  return isCorrect ? "signal" : "accent";
}

function buildTimelines(verdicts: readonly PacketVerdict[]): PacketTimeline[] {
  let nextStartSeconds = 0;
  return verdicts.map(({ matchedRuleIndex }) => {
    const matchEndSeconds = nextStartSeconds + (matchedRuleIndex + 1) * SECONDS_PER_RULE_CHECK;
    const timeline = {
      startSeconds: nextStartSeconds,
      matchEndSeconds,
      endSeconds: matchEndSeconds + OUTCOME_SECONDS,
    };
    nextStartSeconds = timeline.endSeconds;
    return timeline;
  });
}

function createScene(config: FirewallRulesConfig): FirewallScene {
  const { rules, verdicts } = evaluateFirewall(config);
  const timelines = buildTimelines(verdicts);
  return {
    rules,
    verdicts,
    timelines,
    totalSeconds: timelines[timelines.length - 1].endSeconds,
    elapsedSeconds: 0,
    readThemeColor: createThemeColorReader(),
  };
}

function updateScene(scene: FirewallScene, { deltaSeconds, prefersReducedMotion }: GlyphFrame): void {
  scene.elapsedSeconds = prefersReducedMotion
    ? scene.totalSeconds
    : Math.min(scene.totalSeconds, scene.elapsedSeconds + Math.min(deltaSeconds, MAX_STEP_SECONDS));
}

function restartRun(scene: FirewallScene): void {
  scene.elapsedSeconds = 0;
}

function handleKeyDown(scene: FirewallScene, event: KeyboardEvent): void {
  if (event.key === "Enter") restartRun(scene);
}

function readProgress(scene: FirewallScene): PacketProgress {
  const activePacketIndex = scene.timelines.findIndex(({ endSeconds }) => scene.elapsedSeconds < endSeconds);
  if (activePacketIndex === -1) {
    return {
      activePacketIndex,
      activeVerdict: null,
      decidedPacketCount: scene.verdicts.length,
      scannerRowIndex: -1,
      isOutcomeShown: false,
      outcomeShare: 0,
    };
  }
  const { startSeconds, matchEndSeconds } = scene.timelines[activePacketIndex];
  const activeVerdict = scene.verdicts[activePacketIndex];
  const checkedRowCount = Math.floor((scene.elapsedSeconds - startSeconds) / SECONDS_PER_RULE_CHECK);
  return {
    activePacketIndex,
    activeVerdict,
    decidedPacketCount: activePacketIndex,
    scannerRowIndex: Math.min(activeVerdict.matchedRuleIndex, checkedRowCount),
    isOutcomeShown: scene.elapsedSeconds >= matchEndSeconds,
    outcomeShare: clamp((scene.elapsedSeconds - matchEndSeconds) / OUTCOME_SECONDS, 0, 1),
  };
}

function drawHeader(scene: FirewallScene, frame: GlyphFrame): void {
  drawThemedText(scene, frame, FIREWALL_TITLE, SIDE_MARGIN_COLUMNS, TITLE_ROW, "paper");
  drawThemedText(scene, frame, FIREWALL_INTRO, SIDE_MARGIN_COLUMNS + FIREWALL_TITLE.length + 2, TITLE_ROW, "mid");
  drawThemedText(scene, frame, FIREWALL_HINT, SIDE_MARGIN_COLUMNS, HINT_ROW, "mid");
}

function drawPacketInfo(scene: FirewallScene, frame: GlyphFrame, { activeVerdict }: PacketProgress): void {
  drawThemedText(scene, frame, FIREWALL_PACKET_LABEL, SIDE_MARGIN_COLUMNS, PACKET_LABEL_ROW, "mid");
  if (!activeVerdict) {
    drawThemedText(scene, frame, FIREWALL_DONE_TEXT, SIDE_MARGIN_COLUMNS, PACKET_INFO_ROW, "light");
    return;
  }
  const { packet } = activeVerdict;
  const packetText = `${packet.senderLabel}  ${FIREWALL_SOURCE_LABELS[packet.source]}  ${describeRulePort(packet.port)}`;
  drawThemedText(scene, frame, packetText, SIDE_MARGIN_COLUMNS, PACKET_INFO_ROW, "wasp");
}

function readRuleTextColorName(progress: PacketProgress, ruleIndex: number): ThemeColorName {
  if (ruleIndex === progress.scannerRowIndex) return "white";
  const isBeforeScanner = ruleIndex < progress.scannerRowIndex;
  const isAfterMatch = progress.isOutcomeShown && ruleIndex > progress.scannerRowIndex;
  return isBeforeScanner || isAfterMatch ? "mid" : "light";
}

function drawRules(scene: FirewallScene, frame: GlyphFrame, progress: PacketProgress): void {
  drawThemedText(scene, frame, FIREWALL_RULES_LABEL, SIDE_MARGIN_COLUMNS, RULES_LABEL_ROW, "mid");
  scene.rules.forEach((rule, ruleIndex) => {
    const row = RULES_TOP_ROW + ruleIndex;
    const isDefaultRule = ruleIndex === scene.rules.length - 1;
    const isScanned = ruleIndex === progress.scannerRowIndex;
    const isGateOpen = isScanned && progress.isOutcomeShown && Boolean(progress.activeVerdict?.isAllowed);
    const textColorName = readRuleTextColorName(progress, ruleIndex);
    const sourceText = isDefaultRule ? FIREWALL_DEFAULT_SOURCE_TEXT : FIREWALL_SOURCE_LABELS[rule.source];

    drawThemedCell(scene, frame, isScanned ? PACKET_GLYPH : CHECKED_GLYPH, SIDE_MARGIN_COLUMNS, row, isScanned ? "white" : "line");
    drawThemedText(scene, frame, isDefaultRule ? "-" : String(ruleIndex + 1), RULE_NUMBER_COLUMN, row, textColorName);
    drawThemedText(scene, frame, rule.action.toUpperCase(), RULE_ACTION_COLUMN, row, ACTION_COLOR_NAME[rule.action]);
    drawThemedText(scene, frame, sourceText, RULE_SOURCE_COLUMN, row, textColorName);
    drawThemedText(scene, frame, describeRulePort(rule.port), RULE_PORT_COLUMN, row, textColorName);
    if (!isGateOpen) drawThemedCell(scene, frame, WALL_GLYPH, WALL_COLUMN, row, "mid");
  });
}

function drawServer(scene: FirewallScene, frame: GlyphFrame, progress: PacketProgress): void {
  const { activeVerdict, isOutcomeShown, outcomeShare } = progress;
  const isPacketArriving = Boolean(activeVerdict?.isAllowed) && isOutcomeShown && outcomeShare >= SERVER_ARRIVAL_SHARE;
  const colorName = activeVerdict && isPacketArriving ? readOutcomeColorName(activeVerdict) : "light";

  drawThemedText(scene, frame, FIREWALL_SERVER_TOP_LINE, SERVER_COLUMN, RULES_LABEL_ROW, colorName);
  scene.rules.forEach((_, ruleIndex) => {
    const line = ruleIndex === 0 ? FIREWALL_SERVER_NAME_LINE : FIREWALL_SERVER_EMPTY_LINE;
    drawThemedText(scene, frame, line, SERVER_COLUMN, RULES_TOP_ROW + ruleIndex, colorName);
  });
  drawThemedText(scene, frame, FIREWALL_SERVER_BOTTOM_LINE, SERVER_COLUMN, RULES_TOP_ROW + scene.rules.length, colorName);
}

function drawPacketMotion(scene: FirewallScene, frame: GlyphFrame, progress: PacketProgress): void {
  const { activeVerdict, isOutcomeShown, outcomeShare, scannerRowIndex } = progress;
  if (!activeVerdict || !isOutcomeShown) return;
  const row = RULES_TOP_ROW + scannerRowIndex;
  const colorName = readOutcomeColorName(activeVerdict);
  if (activeVerdict.isAllowed) {
    drawThemedCell(scene, frame, PACKET_GLYPH, Math.round(lerp(WALL_COLUMN - 1, SERVER_COLUMN, outcomeShare)), row, colorName);
    return;
  }
  drawThemedCell(scene, frame, BLOCKED_GLYPH, WALL_COLUMN - 1, row, colorName);
}

function drawResults(scene: FirewallScene, frame: GlyphFrame, topRow: number, progress: PacketProgress): void {
  drawThemedText(scene, frame, FIREWALL_RESULTS_LABEL, SIDE_MARGIN_COLUMNS, topRow - 1, "mid");
  scene.verdicts.forEach((verdict, packetIndex) => {
    const { packet, isDefaultRule, matchedRuleIndex, isAllowed, isCorrect } = verdict;
    const row = topRow + packetIndex;
    const isDecided = packetIndex < progress.decidedPacketCount;
    const isActive = packetIndex === progress.activePacketIndex;
    const packetColorName = isActive ? "white" : isDecided ? "light" : "mid";

    drawThemedText(scene, frame, packet.senderLabel, RESULT_SENDER_COLUMN, row, packetColorName);
    drawThemedText(scene, frame, FIREWALL_SOURCE_LABELS[packet.source], RESULT_SOURCE_COLUMN, row, packetColorName);
    drawThemedText(scene, frame, describePortWithName(packet.port), RESULT_PORT_COLUMN, row, packetColorName);

    if (!isDecided) {
      drawThemedText(scene, frame, isActive ? "checking" : "waiting", RESULT_RULE_COLUMN, row, isActive ? "white" : "line");
      return;
    }
    drawThemedText(scene, frame, isDefaultRule ? "default" : `rule ${matchedRuleIndex + 1}`, RESULT_RULE_COLUMN, row, "light");
    drawThemedText(scene, frame, isAllowed ? "-> server" : "x blocked", RESULT_OUTCOME_COLUMN, row, readOutcomeColorName(verdict));
    if (!isCorrect) drawThemedText(scene, frame, "WRONG", RESULT_WRONG_COLUMN, row, "accent");
  });
}

function drawLiveNumbers(scene: FirewallScene, frame: GlyphFrame, topRow: number, progress: PacketProgress): void {
  const { rightResultCount, unwantedAllowedCount, wantedBlockedCount } = summariseVerdicts(
    scene.verdicts.slice(0, progress.decidedPacketCount),
  );
  const liveLines: { label: string; value: string; colorName: ThemeColorName }[] = [
    { label: FIREWALL_LIVE_LABELS.rightResults, value: `${rightResultCount} of ${scene.verdicts.length}`, colorName: "paper" },
    { label: FIREWALL_LIVE_LABELS.unwantedIn, value: String(unwantedAllowedCount), colorName: unwantedAllowedCount > 0 ? "accent" : "paper" },
    { label: FIREWALL_LIVE_LABELS.wantedBlocked, value: String(wantedBlockedCount), colorName: wantedBlockedCount > 0 ? "accent" : "paper" },
  ];
  liveLines.forEach(({ label, value, colorName }, lineIndex) => {
    drawThemedText(scene, frame, label, SIDE_MARGIN_COLUMNS, topRow + lineIndex, "mid");
    drawThemedText(scene, frame, value, LIVE_VALUE_COLUMN, topRow + lineIndex, colorName);
  });
}

function drawScene(scene: FirewallScene, frame: GlyphFrame): void {
  updateScene(scene, frame);
  const progress = readProgress(scene);
  const resultsLabelRow = RULES_TOP_ROW + scene.rules.length + 1 + SECTION_GAP_ROWS;
  const resultsTopRow = resultsLabelRow + 1;
  const liveTopRow = resultsTopRow + scene.verdicts.length + SECTION_GAP_ROWS;

  clearFrame(frame);
  drawHeader(scene, frame);
  drawPacketInfo(scene, frame, progress);
  drawRules(scene, frame, progress);
  drawServer(scene, frame, progress);
  drawPacketMotion(scene, frame, progress);
  drawResults(scene, frame, resultsTopRow, progress);
  drawLiveNumbers(scene, frame, liveTopRow, progress);
}

type FirewallRulesProps = {
  config: FirewallRulesConfig;
};

function FirewallRules({ config }: FirewallRulesProps) {
  const { verdicts } = evaluateFirewall(config);
  const { rightResultCount, unwantedAllowedCount, wantedBlockedCount } = summariseVerdicts(verdicts);

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row">
      <div className="relative min-h-0 flex-1">
        <GlyphCanvas
          key={`${config.ruleOrderName}-${config.isDefaultDenyEnabled}`}
          createScene={() => createScene(config)}
          drawScene={drawScene}
          onPress={restartRun}
          onKeyDown={handleKeyDown}
        />
        <p role="status" className="sr-only">
          Rule order: {config.ruleOrderName}. Default deny: {describeSwitchState(config.isDefaultDenyEnabled)}. Right
          results: {rightResultCount} of {verdicts.length}. Unwanted packets let in: {unwantedAllowedCount}. Wanted
          packets blocked: {wantedBlockedCount}.
        </p>
      </div>
      <LessonPanel
        steps={FIREWALL_RULES_LESSON_STEPS}
        glossaryEntries={FIREWALL_RULES_GLOSSARY_ENTRIES}
        config={config}
      />
    </div>
  );
}

export const FirewallRulesDemo = createConfigurableDemo(FIREWALL_RULES_CONTROLS, FirewallRules);
