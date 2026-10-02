"use client";

import { useState, type PointerEvent } from "react";
import { MICRO_BUTTON_CLASS } from "./microStyles";

const PULL_STRENGTH = 0.35;
const NO_OFFSET = { x: 0, y: 0 };

export function MagneticButton() {
  const [buttonOffset, setButtonOffset] = useState(NO_OFFSET);

  function pullButtonToCursor(event: PointerEvent<HTMLDivElement>) {
    const fieldBounds = event.currentTarget.getBoundingClientRect();
    setButtonOffset({
      x: (event.clientX - (fieldBounds.left + fieldBounds.width / 2)) * PULL_STRENGTH,
      y: (event.clientY - (fieldBounds.top + fieldBounds.height / 2)) * PULL_STRENGTH,
    });
  }

  return (
    <div
      onPointerMove={pullButtonToCursor}
      onPointerLeave={() => setButtonOffset(NO_OFFSET)}
      className="border border-dashed border-line p-20"
    >
      <button
        type="button"
        className={`${MICRO_BUTTON_CLASS} micro-magnetic-button`}
        style={{ transform: `translate(${buttonOffset.x}px, ${buttonOffset.y}px)` }}
      >
        Join us
      </button>
    </div>
  );
}
