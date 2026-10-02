"use client";

import { useRef, useState, type PointerEvent } from "react";
import { MICRO_BUTTON_CLASS } from "./microStyles";

type Ripple = {
  id: number;
  centerX: number;
  centerY: number;
};

const RIPPLE_DIAMETER_PX = 240;

export function RippleButton() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextRippleId = useRef(0);

  function addRipple(event: PointerEvent<HTMLButtonElement>) {
    const buttonBounds = event.currentTarget.getBoundingClientRect();
    const newRipple: Ripple = {
      id: nextRippleId.current++,
      centerX: event.clientX - buttonBounds.left,
      centerY: event.clientY - buttonBounds.top,
    };
    setRipples((currentRipples) => [...currentRipples, newRipple]);
  }

  function removeRipple(rippleId: number) {
    setRipples((currentRipples) => currentRipples.filter(({ id }) => id !== rippleId));
  }

  return (
    <button type="button" onPointerDown={addRipple} className={MICRO_BUTTON_CLASS}>
      Execute
      {ripples.map(({ id, centerX, centerY }) => (
        <span
          key={id}
          onAnimationEnd={() => removeRipple(id)}
          className="micro-ripple pointer-events-none absolute rounded-full bg-paper mix-blend-difference"
          style={{
            left: centerX - RIPPLE_DIAMETER_PX / 2,
            top: centerY - RIPPLE_DIAMETER_PX / 2,
            width: RIPPLE_DIAMETER_PX,
            height: RIPPLE_DIAMETER_PX,
          }}
        />
      ))}
    </button>
  );
}
