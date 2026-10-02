"use client";

import { useEffect, useState } from "react";
import {
  RING_CLIMB_EXPLOIT_STEPS,
  RING_CLIMB_GATE_LEGEND_LINES,
  RING_CLIMB_IDLE_STEPS,
  RING_CLIMB_LEGEND_LINES,
  RING_CLIMB_PATCHED_EXPLOIT_STEPS,
  RING_CLIMB_SYSCALL_STEPS,
  type RingNumber,
  type RingStep,
} from "@/content/cybersecContent";
import type { ConfigOf } from "@/lib/variantControls";
import {
  ActionButton,
  ColoredText,
  CybersecStage,
  OUTCOME_TONE_CLASS,
  OutcomeText,
  type ColoredCell,
} from "./CybersecParts";
import { RING_CLIMB_CONTROLS } from "./controls/ringClimbControls";
import { createConfigurableDemo } from "./createConfigurableDemo";

type RingClimbConfig = ConfigOf<typeof RING_CLIMB_CONTROLS>;

const GRID_COLUMN_COUNT = 45;
const GRID_ROW_COUNT = 27;
const CENTER_COLUMN = 22;
const CENTER_ROW = 13;
const CELL_WIDTH_TO_HEIGHT_RATIO = 0.6;
const RING_LINE_HALF_THICKNESS = 0.5;
const RING_OUTER_RADII = [3, 6, 9, 12] as const;
const GATE_RADII = [3, 6, 9] as const;
const DOT_ROW_OFFSET_BY_RING: Record<RingNumber, number> = { 0: 0, 1: 5, 2: 8, 3: 11 };

function pickGateCharacter(columnOffsetFromCenter: number, isGatePatched: boolean): string {
  if (columnOffsetFromCenter < 0) return "[";
  if (columnOffsetFromCenter > 0) return "]";
  return isGatePatched ? "#" : "=";
}

function describeCell(
  row: number,
  column: number,
  dotRing: RingNumber,
  dotClassName: string,
  isGatePatched: boolean,
): ColoredCell {
  const rowOffsetFromCenter = CENTER_ROW - row;
  const columnOffsetFromCenter = column - CENTER_COLUMN;

  if (columnOffsetFromCenter === 0 && rowOffsetFromCenter === DOT_ROW_OFFSET_BY_RING[dotRing]) {
    return { character: "@", className: dotClassName };
  }

  const isGateCell = GATE_RADII.some((radius) => radius === rowOffsetFromCenter) && Math.abs(columnOffsetFromCenter) <= 1;
  if (isGateCell) {
    return {
      character: pickGateCharacter(columnOffsetFromCenter, isGatePatched),
      className: isGatePatched ? "text-signal" : "text-light",
    };
  }

  const distanceFromCenter = Math.hypot(columnOffsetFromCenter * CELL_WIDTH_TO_HEIGHT_RATIO, rowOffsetFromCenter);
  const isRingLineCell = RING_OUTER_RADII.some(
    (radius) => Math.abs(distanceFromCenter - radius) < RING_LINE_HALF_THICKNESS,
  );
  return isRingLineCell ? { character: ".", className: "text-mid" } : { character: " ", className: "" };
}

function buildRingRows(dotRing: RingNumber, dotClassName: string, isGatePatched: boolean): ColoredCell[][] {
  return Array.from({ length: GRID_ROW_COUNT }, (_, row) =>
    Array.from({ length: GRID_COLUMN_COUNT }, (_, column) =>
      describeCell(row, column, dotRing, dotClassName, isGatePatched),
    ),
  );
}

type RingClimbProps = {
  config: RingClimbConfig;
};

function RingClimb({ config }: RingClimbProps) {
  const [playedSteps, setPlayedSteps] = useState<readonly RingStep[]>(RING_CLIMB_IDLE_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const isPlaying = currentStepIndex < playedSteps.length - 1;

  useEffect(() => {
    if (!isPlaying) return;
    const timerId = setTimeout(() => setCurrentStepIndex((previousIndex) => previousIndex + 1), config.stepDelayMilliseconds);
    return () => clearTimeout(timerId);
  }, [isPlaying, currentStepIndex, config.stepDelayMilliseconds]);

  const play = (steps: readonly RingStep[]) => {
    setPlayedSteps(steps);
    setCurrentStepIndex(0);
  };

  const currentStep = playedSteps[currentStepIndex];
  const ringRows = buildRingRows(currentStep.ring, OUTCOME_TONE_CLASS[currentStep.tone], config.isGatePatched);

  return (
    <CybersecStage label="Privilege rings">
      <div className="flex flex-wrap items-center gap-8">
        <pre aria-hidden="true" className="leading-none">
          {ringRows.map((cells, rowIndex) => (
            <span key={rowIndex} className="block">
              <ColoredText cells={cells} />
            </span>
          ))}
        </pre>
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1">
            {RING_CLIMB_LEGEND_LINES.map(({ ring, text }) => (
              <li key={ring} className={ring === currentStep.ring ? "text-paper" : "text-mid"}>
                {text}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-1 text-mid">
            {RING_CLIMB_GATE_LEGEND_LINES.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      </div>
      <OutcomeText tone={currentStep.tone}>{currentStep.message}</OutcomeText>
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => play(RING_CLIMB_SYSCALL_STEPS)}>[ System call ]</ActionButton>
        <ActionButton
          onClick={() => play(config.isGatePatched ? RING_CLIMB_PATCHED_EXPLOIT_STEPS : RING_CLIMB_EXPLOIT_STEPS)}
        >
          [ Exploit ]
        </ActionButton>
      </div>
    </CybersecStage>
  );
}

export const RingClimbDemo = createConfigurableDemo(RING_CLIMB_CONTROLS, RingClimb);
