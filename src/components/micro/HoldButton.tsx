"use client";

import { useState, type KeyboardEvent } from "react";
import { MICRO_BUTTON_CLASS } from "./microStyles";
import { useTimedFlag } from "./useTimedFlag";

const HOLD_DURATION_MS = 1000;
const DRAIN_DURATION_MS = 200;
const HOLD_KEYS = [" ", "Enter"];

export function HoldButton() {
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, markConfirmed] = useTimedFlag();

  function startHold() {
    setIsHolding(true);
  }

  function stopHold() {
    setIsHolding(false);
  }

  function startHoldFromKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat || !HOLD_KEYS.includes(event.key)) return;
    event.preventDefault();
    startHold();
  }

  function confirmWhenFillIsFull() {
    if (isHolding) markConfirmed();
  }

  return (
    <button
      type="button"
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      onKeyDown={startHoldFromKey}
      onKeyUp={stopHold}
      onBlur={stopHold}
      className={`${MICRO_BUTTON_CLASS} min-w-56 touch-none select-none`}
    >
      <span
        aria-hidden="true"
        onTransitionEnd={confirmWhenFillIsFull}
        className={`absolute inset-0 origin-left bg-accent transition-transform ease-linear ${
          isHolding || isConfirmed ? "scale-x-100" : "scale-x-0"
        }`}
        style={{ transitionDuration: `${isHolding ? HOLD_DURATION_MS : DRAIN_DURATION_MS}ms` }}
      />
      <span aria-live="polite" className="relative">
        {isConfirmed ? "Wiped" : "Hold to wipe"}
      </span>
    </button>
  );
}
