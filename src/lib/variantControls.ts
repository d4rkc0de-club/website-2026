export type SliderControl<Key extends string = string> = {
  kind: "slider";
  key: Key;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export type ToggleControl<Key extends string = string> = {
  kind: "toggle";
  key: Key;
  label: string;
  defaultValue: boolean;
};

export type SelectControl<Key extends string = string, Option extends string = string> = {
  kind: "select";
  key: Key;
  label: string;
  options: readonly Option[];
  defaultValue: Option;
};

export type MultiSelectControl<Key extends string = string, Option extends string = string> = {
  kind: "multiSelect";
  key: Key;
  label: string;
  options: readonly Option[];
  defaultValue: readonly Option[];
};

export type Control = SliderControl | ToggleControl | SelectControl | MultiSelectControl;

export type ControlValue = number | boolean | string | readonly string[];

export type ControlValues = Record<string, ControlValue>;

type ControlValueOf<ControlDefinition extends Control> = ControlDefinition extends SliderControl
  ? number
  : ControlDefinition extends ToggleControl
    ? boolean
    : ControlDefinition extends SelectControl<string, infer Option>
      ? Option
      : ControlDefinition extends MultiSelectControl<string, infer Option>
        ? Option[]
        : never;

export type ConfigOf<Controls extends readonly Control[]> = {
  [ControlDefinition in Controls[number] as ControlDefinition["key"]]: ControlValueOf<ControlDefinition>;
};

export function defineControls<const Controls extends readonly Control[]>(controls: Controls): Controls {
  return controls;
}

export function slider<const Key extends string>(
  key: Key,
  label: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number,
): SliderControl<Key> {
  return { kind: "slider", key, label, min, max, step, defaultValue };
}

export function toggle<const Key extends string>(
  key: Key,
  label: string,
  defaultValue: boolean,
): ToggleControl<Key> {
  return { kind: "toggle", key, label, defaultValue };
}

export function select<const Key extends string, const Option extends string>(
  key: Key,
  label: string,
  options: readonly Option[],
  defaultValue: Option,
): SelectControl<Key, Option> {
  return { kind: "select", key, label, options, defaultValue };
}

export function multiSelect<const Key extends string, const Option extends string>(
  key: Key,
  label: string,
  options: readonly Option[],
  defaultValue: readonly Option[],
): MultiSelectControl<Key, Option> {
  return { kind: "multiSelect", key, label, options, defaultValue };
}

export function buildDefaultValues(controls: readonly Control[]): ControlValues {
  return Object.fromEntries(controls.map(({ key, defaultValue }) => [key, defaultValue]));
}
