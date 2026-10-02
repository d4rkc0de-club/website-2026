"use client";

import { useState, type PointerEvent } from "react";

const MAX_TILT_DEGREES = 12;
const PERSPECTIVE_PX = 800;
const LEVEL_TILT = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isInside: false };

const CARD_TITLE = "HackCon";
const CARD_SUBTITLE = "Annual CTF";

export function TiltCard() {
  const [tilt, setTilt] = useState(LEVEL_TILT);

  function tiltTowardCursor(event: PointerEvent<HTMLDivElement>) {
    const areaBounds = event.currentTarget.getBoundingClientRect();
    const horizontalRatio = (event.clientX - areaBounds.left) / areaBounds.width;
    const verticalRatio = (event.clientY - areaBounds.top) / areaBounds.height;
    setTilt({
      rotateX: (0.5 - verticalRatio) * 2 * MAX_TILT_DEGREES,
      rotateY: (horizontalRatio - 0.5) * 2 * MAX_TILT_DEGREES,
      glareX: horizontalRatio * 100,
      glareY: verticalRatio * 100,
      isInside: true,
    });
  }

  return (
    <div
      onPointerMove={tiltTowardCursor}
      onPointerLeave={() => setTilt(LEVEL_TILT)}
      className="w-full max-w-sm p-8"
    >
      <div
        className="micro-tilt-card relative overflow-hidden border border-line bg-panel"
        style={{
          transform: `perspective(${PERSPECTIVE_PX}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        }}
      >
        <div className="grid aspect-[4/3] place-items-center">
          <span className="font-display text-5xl uppercase tracking-tight">{CARD_TITLE}</span>
        </div>
        <div className="border-t border-line p-4 font-mono text-xs uppercase tracking-widest text-mid">
          {CARD_SUBTITLE}
        </div>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
            tilt.isInside ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgb(255 255 255 / 0.18), transparent 55%)`,
          }}
        />
      </div>
    </div>
  );
}
