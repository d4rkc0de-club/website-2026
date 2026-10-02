"use client";

import { useState } from "react";
import { MICRO_BUTTON_CLASS } from "./microStyles";

const DIGIT_COUNT = 3;
const COUNT_LIMIT = 10 ** DIGIT_COUNT;
const DIGIT_VALUES = Array.from({ length: 10 }, (_, digitValue) => digitValue);

type RollingDigitProps = {
  digit: number;
};

function RollingDigit({ digit }: RollingDigitProps) {
  return (
    <span className="inline-block h-[1em] overflow-hidden leading-none">
      <span
        className="flex flex-col transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {DIGIT_VALUES.map((digitValue) => (
          <span key={digitValue} className="block h-[1em]">
            {digitValue}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollCounter() {
  const [memberCount, setMemberCount] = useState(0);

  const digits = String(memberCount).padStart(DIGIT_COUNT, "0");

  return (
    <div className="flex flex-col items-center gap-8">
      <p aria-label={`${memberCount} members`} className="flex font-mono text-6xl leading-none">
        <span aria-hidden="true" className="flex">
          {Array.from(digits, (digit, digitIndex) => (
            <RollingDigit key={digitIndex} digit={Number(digit)} />
          ))}
        </span>
      </p>
      <button
        type="button"
        onClick={() => setMemberCount((currentCount) => (currentCount + 1) % COUNT_LIMIT)}
        className={MICRO_BUTTON_CLASS}
      >
        Add member
      </button>
    </div>
  );
}
