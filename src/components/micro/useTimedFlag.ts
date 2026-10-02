import { useEffect, useState } from "react";

export const DONE_STATE_DURATION_MS = 2000;

export function useTimedFlag(durationMs: number = DONE_STATE_DURATION_MS) {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    if (!isOn) return;
    const timeoutId = window.setTimeout(() => setIsOn(false), durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [isOn, durationMs]);

  function turnOn() {
    setIsOn(true);
  }

  return [isOn, turnOn] as const;
}
