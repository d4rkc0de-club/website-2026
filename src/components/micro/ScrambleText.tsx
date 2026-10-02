"use client";

import { useEffect, useState } from "react";
import { GLYPH_SETS } from "@/lib/ascii/glyphSets";

const TEXT_TO_SHOW = "Join the club";
const FRAME_INTERVAL_MS = 40;
const FRAMES_PER_LETTER = 3;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function pickRandomGlyph(): string {
  return GLYPH_SETS.code[Math.floor(Math.random() * GLYPH_SETS.code.length)];
}

function scrambleText(text: string, frameIndex: number): string {
  const settledLetterCount = Math.floor(frameIndex / FRAMES_PER_LETTER);
  return Array.from(text, (letter, letterIndex) =>
    letter === " " || letterIndex < settledLetterCount ? letter : pickRandomGlyph(),
  ).join("");
}

export function ScrambleText() {
  const [displayedText, setDisplayedText] = useState(TEXT_TO_SHOW);
  const [scrambleCount, setScrambleCount] = useState(0);

  useEffect(() => {
    if (scrambleCount === 0 || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const lastFrameIndex = TEXT_TO_SHOW.length * FRAMES_PER_LETTER;
    let frameIndex = 0;
    const intervalId = window.setInterval(() => {
      frameIndex += 1;
      setDisplayedText(scrambleText(TEXT_TO_SHOW, frameIndex));
      if (frameIndex >= lastFrameIndex) window.clearInterval(intervalId);
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [scrambleCount]);

  function startScramble() {
    setScrambleCount((currentCount) => currentCount + 1);
  }

  return (
    <button
      type="button"
      aria-label={TEXT_TO_SHOW}
      onPointerEnter={startScramble}
      onFocus={startScramble}
      className="font-mono text-2xl uppercase tracking-widest"
    >
      {displayedText}
    </button>
  );
}
