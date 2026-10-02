"use client";

import { useState, type PointerEvent } from "react";

const CARD_TITLE = "Induction '26";
const CARD_DATE = "9 February 2026";

const PILL_HIDDEN_AT_START = { x: 0, y: 0, isInside: false };

export function CursorPillCard() {
  const [pill, setPill] = useState(PILL_HIDDEN_AT_START);

  function movePillToCursor(event: PointerEvent<HTMLButtonElement>) {
    const cardBounds = event.currentTarget.getBoundingClientRect();
    setPill({
      x: event.clientX - cardBounds.left,
      y: event.clientY - cardBounds.top,
      isInside: true,
    });
  }

  function hidePill() {
    setPill((currentPill) => ({ ...currentPill, isInside: false }));
  }

  return (
    <button
      type="button"
      onPointerMove={movePillToCursor}
      onPointerLeave={hidePill}
      className="relative block w-full max-w-lg cursor-none overflow-hidden border border-line text-left"
    >
      <span className="block aspect-video bg-gradient-to-br from-panel to-line" />
      <span className="flex items-baseline justify-between gap-4 p-4 font-mono text-xs uppercase tracking-widest">
        <span>{CARD_TITLE}</span>
        <span className="text-mid">{CARD_DATE}</span>
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0"
        style={{ transform: `translate(${pill.x}px, ${pill.y}px) translate(-50%, -50%)` }}
      >
        <span
          className={`block rounded-full bg-ice px-6 py-3 font-mono text-xs uppercase tracking-widest text-void transition-transform duration-200 motion-reduce:transition-none ${
            pill.isInside ? "scale-100" : "scale-0"
          }`}
        >
          View ↗
        </span>
      </span>
    </button>
  );
}
