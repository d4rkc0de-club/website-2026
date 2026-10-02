import { HERO_SLOGAN_LEAD } from "@/content/heroContent";
import { readColorVariable } from "./glyphStyle";

export const HOMOGLYPH_SUBSTITUTES: Readonly<Partial<Record<string, readonly string[]>>> = {
  W: ["\u051C"],
  e: ["3", "\u0435"],
  b: ["6", "\u044C"],
  r: ["\u0433"],
  a: ["4", "\u0430"],
  k: ["\u043A", "\u03BA"],
  t: ["7", "\u03C4"],
  h: ["\u04BB"],
  i: ["1", "\u0456"],
  n: ["\u043F", "\u0578"],
  g: ["9", "\u0261"],
  s: ["5", "\u0455"],
};

const ACCENT_COLOR_VARIABLE = "--color-accent";
const DISGUISED_SHARE = 0.5;
const MIN_MUTATION_INTERVAL_SECONDS = 0.4;
const MAX_MUTATION_INTERVAL_SECONDS = 1.6;
const HOVER_RESTORE_SECONDS = 1.2;
const RESTORE_ALL_HOLD_SECONDS = 2.5;
const RESTORE_ALL_STAGGER_SECONDS = 0.08;
const SPACE_LETTER = " ";

export type SloganLetter = {
  original: string;
  disguise: string;
  restoredUntilSeconds: number;
  nextMutationSeconds: number;
};

export type HomoglyphScene = {
  letters: SloganLetter[];
  keyboardLetterIndex: number | null;
  accentColor: string;
};

export type HomoglyphAction =
  | "restoreAll"
  | "reset"
  | "focusPrevious"
  | "focusNext";

function randomMutationInterval(): number {
  return (
    MIN_MUTATION_INTERVAL_SECONDS +
    Math.random() * (MAX_MUTATION_INTERVAL_SECONDS - MIN_MUTATION_INTERVAL_SECONDS)
  );
}

function chooseDisguise(original: string): string {
  const substitutes = HOMOGLYPH_SUBSTITUTES[original];
  if (!substitutes || Math.random() >= DISGUISED_SHARE) return original;
  return substitutes[Math.floor(Math.random() * substitutes.length)];
}

function createLetters(timeSeconds: number): SloganLetter[] {
  return [...HERO_SLOGAN_LEAD].map((original) => ({
    original,
    disguise: chooseDisguise(original),
    restoredUntilSeconds: 0,
    nextMutationSeconds: timeSeconds + randomMutationInterval(),
  }));
}

function stepLetterIndex(
  letters: readonly SloganLetter[],
  currentIndex: number | null,
  direction: 1 | -1,
): number {
  let nextIndex = currentIndex ?? (direction > 0 ? -1 : 0);
  do {
    nextIndex = (nextIndex + direction + letters.length) % letters.length;
  } while (letters[nextIndex].original === SPACE_LETTER);
  return nextIndex;
}

export function createHomoglyphScene(): HomoglyphScene {
  return {
    letters: createLetters(0),
    keyboardLetterIndex: null,
    accentColor: readColorVariable(ACCENT_COLOR_VARIABLE),
  };
}

export function applyAction(
  scene: HomoglyphScene,
  action: HomoglyphAction,
  timeSeconds: number,
  prefersReducedMotion: boolean,
): void {
  if (action === "reset") {
    scene.letters = createLetters(timeSeconds);
    scene.keyboardLetterIndex = null;
    return;
  }

  if (action === "restoreAll") {
    scene.letters.forEach((letter, letterIndex) => {
      letter.restoredUntilSeconds = prefersReducedMotion
        ? Infinity
        : timeSeconds +
          RESTORE_ALL_HOLD_SECONDS +
          letterIndex * RESTORE_ALL_STAGGER_SECONDS;
      letter.nextMutationSeconds =
        letter.restoredUntilSeconds + randomMutationInterval();
    });
    return;
  }

  scene.keyboardLetterIndex = stepLetterIndex(
    scene.letters,
    scene.keyboardLetterIndex,
    action === "focusNext" ? 1 : -1,
  );
}

export function holdLetterRestored(
  scene: HomoglyphScene,
  letterIndex: number,
  timeSeconds: number,
): void {
  const letter = scene.letters[letterIndex];
  letter.restoredUntilSeconds = Math.max(
    letter.restoredUntilSeconds,
    timeSeconds + HOVER_RESTORE_SECONDS,
  );
}

export function updateMutations(scene: HomoglyphScene, timeSeconds: number): void {
  scene.letters.forEach((letter) => {
    const isWaiting =
      timeSeconds < letter.restoredUntilSeconds ||
      timeSeconds < letter.nextMutationSeconds;
    if (isWaiting) return;
    letter.disguise = chooseDisguise(letter.original);
    letter.nextMutationSeconds = timeSeconds + randomMutationInterval();
  });
}

export function displayedGlyph(letter: SloganLetter, timeSeconds: number): string {
  return timeSeconds < letter.restoredUntilSeconds
    ? letter.original
    : letter.disguise;
}

export function isSpaceLetter(letter: SloganLetter): boolean {
  return letter.original === SPACE_LETTER;
}

export function codePointLabel(glyph: string): string {
  const codePointHex = (glyph.codePointAt(0) ?? 0).toString(16).toUpperCase();
  return `U+${codePointHex.padStart(4, "0")}`;
}
