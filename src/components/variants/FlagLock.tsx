"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  FLAG_LOCK_BODY,
  FLAG_LOCK_HINT,
  FLAG_LOCK_PREFIX,
  FLAG_LOCK_SUFFIX,
} from "@/content/componentDemoContent";
import { themeColorCssValue } from "@/lib/ascii/glyphStyle";
import { MILLISECONDS_PER_SECOND } from "@/lib/timeUnits";
import type { ConfigOf } from "@/lib/variantControls";
import type { FLAG_LOCK_CONTROLS } from "./controls/flagLockControls";

type FlagLockConfig = ConfigOf<typeof FLAG_LOCK_CONTROLS>;

type SlotState = { displayedCharacter: string; isLocked: boolean };

type Submission = {
  guessText: string;
  lockStaggerMilliseconds: number;
  shakeStrengthPixels: number;
};

const SLOT_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789_";
const SHAKE_DURATION_MILLISECONDS = 400;
const SHAKE_DIRECTION_SEQUENCE = [0, -1, 1, -1, 1, 0] as const;
const BUTTON_CLASS = "border border-line px-3 py-1 font-mono text-xs uppercase tracking-widest hover:bg-paper hover:text-void";

function randomSlotCharacter(): string {
  return SLOT_ALPHABET[Math.floor(Math.random() * SLOT_ALPHABET.length)];
}

function createSlots(slotCount: number): SlotState[] {
  return Array.from({ length: slotCount }, () => ({
    displayedCharacter: randomSlotCharacter(),
    isLocked: false,
  }));
}

type FlagLockBoardProps = {
  config: FlagLockConfig;
};

function FlagLockBoard({ config }: FlagLockBoardProps) {
  const targetBody = FLAG_LOCK_BODY.slice(0, config.slotCount);
  const [slots, setSlots] = useState(() => createSlots(config.slotCount));
  const [guessText, setGuessText] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const lockRowRef = useRef<HTMLDivElement>(null);
  const isUnlocked = slots.every(({ isLocked }) => isLocked);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSlots((previousSlots) =>
        previousSlots.map((slot) =>
          slot.isLocked ? slot : { ...slot, displayedCharacter: randomSlotCharacter() },
        ),
      );
    }, MILLISECONDS_PER_SECOND / config.spinSpeedPerSecond);
    return () => window.clearInterval(intervalId);
  }, [config.spinSpeedPerSecond]);

  useEffect(() => {
    if (!submission) return;
    const { guessText: submittedText, lockStaggerMilliseconds, shakeStrengthPixels } = submission;

    const timeoutIds = [...targetBody].map((targetCharacter, slotIndex) =>
      window.setTimeout(() => {
        if (submittedText[slotIndex] !== targetCharacter) return;
        setSlots((previousSlots) =>
          previousSlots.map((slot, index) =>
            index === slotIndex ? { displayedCharacter: targetCharacter, isLocked: true } : slot,
          ),
        );
      }, slotIndex * lockStaggerMilliseconds),
    );

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (submittedText !== targetBody && !prefersReducedMotion) {
      timeoutIds.push(
        window.setTimeout(() => {
          lockRowRef.current?.animate(
            SHAKE_DIRECTION_SEQUENCE.map((direction) => ({
              transform: `translateX(${direction * shakeStrengthPixels}px)`,
            })),
            { duration: SHAKE_DURATION_MILLISECONDS, easing: "ease-in-out" },
          );
        }, targetBody.length * lockStaggerMilliseconds),
      );
    }

    return () => timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, [submission, targetBody]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmission({
      guessText,
      lockStaggerMilliseconds: config.lockStaggerMilliseconds,
      shakeStrengthPixels: config.shakeStrengthPixels,
    });
  };

  const handleReset = () => {
    setSubmission(null);
    setGuessText("");
    setSlots(createSlots(config.slotCount));
  };

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 font-mono">
        <div
          ref={lockRowRef}
          role="group"
          aria-label="Flag lock"
          className="flex flex-wrap items-center justify-center gap-1 text-3xl md:text-5xl"
        >
          <span className="text-mid">{FLAG_LOCK_PREFIX}</span>
          {slots.map(({ displayedCharacter, isLocked }, slotIndex) => {
            const slotColor = themeColorCssValue(isLocked ? config.lockedColorName : config.spinColorName);
            return (
              <span
                key={slotIndex}
                className="inline-block w-[1.3em] border text-center"
                style={{ color: slotColor, borderColor: slotColor }}
              >
                {displayedCharacter}
              </span>
            );
          })}
          <span className="text-mid">{FLAG_LOCK_SUFFIX}</span>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
          <input
            type="text"
            value={guessText}
            maxLength={config.slotCount}
            onChange={(event) => setGuessText(event.currentTarget.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label={`Type ${config.slotCount} characters`}
            placeholder={`${config.slotCount} characters`}
            className="min-w-0 flex-1 border border-line bg-void px-2 py-1 text-sm"
          />
          <button type="submit" className={BUTTON_CLASS}>
            [ Unlock ]
          </button>
          <button type="button" onClick={handleReset} className={BUTTON_CLASS}>
            [ Reset ]
          </button>
        </form>
        <p className="text-center text-xs text-mid">{FLAG_LOCK_HINT}</p>
        <p aria-live="polite" className="text-center text-sm text-light">
          {isUnlocked ? "Unlocked. The flag is correct." : "Locked. A right character stays. A wrong one keeps spinning."}
        </p>
      </div>
    </div>
  );
}

type FlagLockProps = {
  config: FlagLockConfig;
};

export function FlagLock({ config }: FlagLockProps) {
  return <FlagLockBoard key={config.slotCount} config={config} />;
}
