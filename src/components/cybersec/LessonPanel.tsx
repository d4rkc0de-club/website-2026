"use client";

import { useState } from "react";
import { ActionButton } from "./CybersecParts";
import type { GlossaryEntry, LessonStep } from "./lessonTypes";

type LessonPanelProps<Config> = {
  steps: readonly LessonStep<Config>[];
  glossaryEntries: readonly GlossaryEntry[];
  config: Config;
};

export function LessonPanel<Config>({ steps, glossaryEntries, config }: LessonPanelProps<Config>) {
  const [stepIndex, setStepIndex] = useState(0);
  const lastStepIndex = steps.length - 1;
  const step = steps[stepIndex];
  const isTaskDone = step.isTaskDone?.(config) ?? false;
  const taskMarker = step.isTaskDone ? (isTaskDone ? "[x]" : "[ ]") : "TRY";

  return (
    <aside
      aria-label="Lesson"
      className="flex max-h-[45%] shrink-0 flex-col gap-4 overflow-y-auto border-t border-line p-4 font-mono text-sm lg:order-first lg:max-h-none lg:w-96 lg:border-r lg:border-t-0"
    >
      <p className="text-[11px] uppercase tracking-widest text-mid">
        Lesson {stepIndex + 1} of {steps.length}
      </p>
      <h2 className="text-lg font-black uppercase text-paper">{step.title}</h2>
      {step.explanationLines.map((line) => (
        <p key={line} className="text-light">
          {line}
        </p>
      ))}
      {step.describeLiveFact && (
        <p className="border-l-2 border-accent pl-3 text-paper">{step.describeLiveFact(config)}</p>
      )}
      {step.taskText && (
        <p className={isTaskDone ? "text-signal" : "text-paper"}>
          {taskMarker} {step.taskText}
        </p>
      )}
      <div className="flex gap-2">
        <ActionButton disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>
          [ Back ]
        </ActionButton>
        <ActionButton disabled={stepIndex === lastStepIndex} onClick={() => setStepIndex(stepIndex + 1)}>
          [ Next ]
        </ActionButton>
      </div>
      <details className="border-t border-line pt-3">
        <summary className="cursor-pointer text-[11px] uppercase tracking-widest text-mid">[ Words ]</summary>
        <dl className="mt-3 flex flex-col gap-2">
          {glossaryEntries.map(({ term, meaning }) => (
            <div key={term}>
              <dt className="text-paper">{term}</dt>
              <dd className="text-mid">{meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </aside>
  );
}
