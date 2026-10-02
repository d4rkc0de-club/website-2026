"use client";

import { useState, type ReactNode } from "react";
import {
  buildDefaultValues,
  type ConfigOf,
  type Control,
  type ControlValue,
  type ControlValues,
} from "@/lib/variantControls";

type ConfigurableProps<Controls extends readonly Control[]> = {
  controls: Controls;
  children: (config: ConfigOf<Controls>) => ReactNode;
};

type ControlFieldProps = {
  control: Control;
  value: ControlValue | undefined;
  onValueChange: (key: string, value: ControlValue) => void;
};

const LABEL_CLASS = "font-mono text-[11px] uppercase tracking-widest";
const FIELD_CLASS = "flex flex-col gap-1";
const BUTTON_CLASS = "border border-line px-2 py-1 hover:bg-paper hover:text-void";

function ControlField({ control, value, onValueChange }: ControlFieldProps) {
  if (control.kind === "slider" && typeof value === "number") {
    return (
      <label className={FIELD_CLASS}>
        <span className={`${LABEL_CLASS} flex justify-between`}>
          <span>{control.label}</span>
          <span className="text-mid">{value}</span>
        </span>
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={value}
          onChange={(event) => onValueChange(control.key, event.currentTarget.valueAsNumber)}
          className="accent-accent"
        />
      </label>
    );
  }

  if (control.kind === "toggle" && typeof value === "boolean") {
    return (
      <label className={`${LABEL_CLASS} flex items-center justify-between`}>
        <span>{control.label}</span>
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onValueChange(control.key, event.currentTarget.checked)}
          className="accent-accent"
        />
      </label>
    );
  }

  if (control.kind === "select" && typeof value === "string") {
    return (
      <label className={FIELD_CLASS}>
        <span className={LABEL_CLASS}>{control.label}</span>
        <select
          value={value}
          onChange={(event) => onValueChange(control.key, event.currentTarget.value)}
          className="border border-line bg-void px-2 py-1 font-mono text-xs"
        >
          {control.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (control.kind === "multiSelect" && Array.isArray(value)) {
    return (
      <fieldset className={FIELD_CLASS}>
        <legend className={`${LABEL_CLASS} mb-1`}>{control.label}</legend>
        <div className="grid grid-cols-2 gap-1">
          {control.options.map((option) => {
            const isActive = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onValueChange(
                    control.key,
                    isActive ? value.filter((activeOption) => activeOption !== option) : [...value, option],
                  )
                }
                className={`${BUTTON_CLASS} font-mono text-xs ${isActive ? "bg-paper text-void" : ""}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return null;
}

export function Configurable<const Controls extends readonly Control[]>({
  controls,
  children,
}: ConfigurableProps<Controls>) {
  const [values, setValues] = useState<ControlValues>(() => buildDefaultValues(controls));

  const updateValue = (key: string, value: ControlValue) => {
    setValues((previousValues) => ({ ...previousValues, [key]: value }));
  };

  return (
    <>
      {children(values as ConfigOf<Controls>)}
      <details
        open
        className="fixed right-4 bottom-4 z-20 w-72 max-w-[calc(100vw-2rem)] border border-line bg-ink/95 text-paper"
      >
        <summary className={`${LABEL_CLASS} cursor-pointer px-3 py-2`}>[ Controls ]</summary>
        <div className="flex max-h-[60dvh] flex-col gap-3 overflow-y-auto border-t border-line p-3">
          {controls.map((control) => (
            <ControlField
              key={control.key}
              control={control}
              value={values[control.key]}
              onValueChange={updateValue}
            />
          ))}
          <button
            type="button"
            onClick={() => setValues(buildDefaultValues(controls))}
            className={`${BUTTON_CLASS} ${LABEL_CLASS}`}
          >
            [ Reset ]
          </button>
        </div>
      </details>
    </>
  );
}
