"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { MICRO_BUTTON_CLASS } from "./microStyles";

type FlagStatus = "waiting" | "wrong" | "right";

const FLAG_FORMAT = /^flag\{.+\}$/;

const STATUS_MESSAGES: Record<FlagStatus, string> = {
  waiting: "Type a flag. Press Enter.",
  wrong: "Wrong format. Use flag{...}.",
  right: "Format is correct.",
};

const STATUS_STYLES: Record<FlagStatus, { border: string; message: string }> = {
  waiting: { border: "border-line focus:border-paper", message: "text-mid" },
  wrong: { border: "border-accent", message: "text-accent" },
  right: { border: "border-signal", message: "text-signal" },
};

export function ShakeInput() {
  const [flagText, setFlagText] = useState("");
  const [flagStatus, setFlagStatus] = useState<FlagStatus>("waiting");
  const [isShaking, setIsShaking] = useState(false);

  function updateFlagText(event: ChangeEvent<HTMLInputElement>) {
    setFlagText(event.target.value);
    setFlagStatus("waiting");
  }

  function checkFlagFormat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isFormatCorrect = FLAG_FORMAT.test(flagText);
    setFlagStatus(isFormatCorrect ? "right" : "wrong");
    setIsShaking(!isFormatCorrect);
  }

  return (
    <form onSubmit={checkFlagFormat} className="flex w-full max-w-md flex-col gap-3">
      <div
        onAnimationEnd={() => setIsShaking(false)}
        className={`flex gap-3 ${isShaking ? "micro-shake" : ""}`}
      >
        <input
          value={flagText}
          onChange={updateFlagText}
          placeholder="flag{...}"
          aria-label="Flag"
          aria-invalid={flagStatus === "wrong"}
          className={`min-w-0 flex-1 border bg-transparent px-4 py-4 font-mono text-xs tracking-widest outline-none ${STATUS_STYLES[flagStatus].border}`}
        />
        <button type="submit" className={MICRO_BUTTON_CLASS}>
          Submit
        </button>
      </div>
      <p role="status" className={`font-mono text-xs ${STATUS_STYLES[flagStatus].message}`}>
        {STATUS_MESSAGES[flagStatus]}
      </p>
    </form>
  );
}
