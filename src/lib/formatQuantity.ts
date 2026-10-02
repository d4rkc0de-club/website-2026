import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_YEAR,
} from "./timeUnits";

const SCIENTIFIC_NOTATION_THRESHOLD = 1e9;

const DURATION_UNITS = [
  { name: "year", seconds: SECONDS_PER_YEAR },
  { name: "day", seconds: SECONDS_PER_DAY },
  { name: "hour", seconds: SECONDS_PER_HOUR },
  { name: "minute", seconds: SECONDS_PER_MINUTE },
  { name: "second", seconds: 1 },
] as const;

export function formatCount(value: number): string {
  const isLarge = value >= SCIENTIFIC_NOTATION_THRESHOLD;
  return new Intl.NumberFormat("en-US", {
    notation: isLarge ? "scientific" : "standard",
    maximumFractionDigits: isLarge ? 2 : 1,
  }).format(value);
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 1) return "less than 1 second";
  const largestFittingUnit =
    DURATION_UNITS.find(({ seconds }) => totalSeconds >= seconds) ?? DURATION_UNITS[DURATION_UNITS.length - 1];
  const amountText = formatCount(totalSeconds / largestFittingUnit.seconds);
  return `${amountText} ${largestFittingUnit.name}${amountText === "1" ? "" : "s"}`;
}
