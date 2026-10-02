import type { ComponentProps, ReactNode } from "react";
import type { ThemeColorName } from "@/lib/ascii/glyphStyle";
import { groupAdjacentByKey } from "@/lib/groupAdjacentByKey";

export type OutcomeTone = "safe" | "danger" | "info";

export type ColoredCell = { character: string; className: string };

export const OUTCOME_TONE_CLASS: Record<OutcomeTone, string> = {
  safe: "text-signal",
  danger: "text-accent",
  info: "text-light",
};

export const OUTCOME_TONE_COLOR_NAME: Record<OutcomeTone, ThemeColorName> = {
  safe: "signal",
  danger: "accent",
  info: "light",
};

const ACTION_BUTTON_CLASS =
  "border border-line px-3 py-1 font-mono text-xs uppercase tracking-widest hover:bg-paper hover:text-void disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-current";

type CybersecStageProps = {
  label: string;
  children: ReactNode;
};

export function CybersecStage({ label, children }: CybersecStageProps) {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <section aria-label={label} className="flex w-full max-w-3xl flex-col gap-4 font-mono text-sm">
        {children}
      </section>
    </div>
  );
}

type OutcomeTextProps = {
  tone: OutcomeTone;
  children: ReactNode;
};

export function OutcomeText({ tone, children }: OutcomeTextProps) {
  return (
    <p role="status" className={`max-w-xl ${OUTCOME_TONE_CLASS[tone]}`}>
      {children}
    </p>
  );
}

export function ActionButton(props: ComponentProps<"button">) {
  return <button type="button" {...props} className={ACTION_BUTTON_CLASS} />;
}

type ColoredTextProps = {
  cells: readonly ColoredCell[];
};

export function ColoredText({ cells }: ColoredTextProps) {
  return (
    <>
      {groupAdjacentByKey(cells, ({ className }) => className).map(({ key, items }, groupIndex) => (
        <span key={groupIndex} className={key}>
          {items.map(({ character }) => character).join("")}
        </span>
      ))}
    </>
  );
}
