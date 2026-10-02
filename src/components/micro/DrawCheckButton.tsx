"use client";

import { MICRO_BUTTON_CLASS } from "./microStyles";
import { useTimedFlag } from "./useTimedFlag";

export function DrawCheckButton() {
  const [isDone, markDone] = useTimedFlag();

  return (
    <button
      type="button"
      data-active={isDone}
      onClick={markDone}
      className={`${MICRO_BUTTON_CLASS} min-w-56 gap-3`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" strokeWidth="2" strokeLinecap="square">
        <circle cx="12" cy="12" r="9" className="stroke-line" />
        <circle cx="12" cy="12" r="9" pathLength={1} className="micro-draw-stroke stroke-signal" />
        <path
          d="M7 12.5l3.5 3.5L17 9"
          pathLength={1}
          className="micro-draw-stroke micro-draw-check stroke-signal"
        />
      </svg>
      {isDone ? "Copied" : "Copy flag"}
    </button>
  );
}
