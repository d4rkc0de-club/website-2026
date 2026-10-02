"use client";

import { useState } from "react";

const LINE_ROWS = [
  { name: "top", rowY: 7 },
  { name: "middle", rowY: 12 },
  { name: "bottom", rowY: 17 },
] as const;

export function MorphMenuIcon() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      type="button"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      data-active={isOpen}
      onClick={() => setIsOpen((wasOpen) => !wasOpen)}
      className="grid size-20 place-items-center border border-paper"
    >
      <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2">
        {LINE_ROWS.map(({ name, rowY }) => (
          <line
            key={name}
            x1="4"
            y1={rowY}
            x2="20"
            y2={rowY}
            className={`micro-morph-line micro-morph-${name}`}
          />
        ))}
      </svg>
    </button>
  );
}
