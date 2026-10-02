import { readColorVariable } from "./glyphStyle";

export type StageColors = {
  faint: string;
  dim: string;
  mid: string;
  bright: string;
  accent: string;
};

export function readStageColors(): StageColors {
  return {
    faint: readColorVariable("--color-line"),
    dim: readColorVariable("--color-mid"),
    mid: readColorVariable("--color-light"),
    bright: readColorVariable("--color-paper"),
    accent: readColorVariable("--color-accent"),
  };
}
