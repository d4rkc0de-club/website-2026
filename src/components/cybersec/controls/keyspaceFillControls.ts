import { defineControls, select, slider, type ConfigOf } from "@/lib/variantControls";

const PRINTABLE_ASCII_START_CODE = 32;
const PRINTABLE_ASCII_COUNT = 95;

export const MAX_PASSWORD_LENGTH = 12;

export const CHARACTERS_BY_SET_NAME = {
  Digits: "0123456789",
  "Lowercase letters": "abcdefghijklmnopqrstuvwxyz",
  "Letters and digits": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  "All printable characters": Array.from({ length: PRINTABLE_ASCII_COUNT }, (_, offset) =>
    String.fromCharCode(PRINTABLE_ASCII_START_CODE + offset),
  ).join(""),
};

export const GUESSES_PER_SECOND_BY_NAME = {
  "Website login": 10,
  "One CPU": 1_000_000,
  "One GPU": 10_000_000_000,
} as const;

export type CharacterSetName = keyof typeof CHARACTERS_BY_SET_NAME;

export type GuessSpeedName = keyof typeof GUESSES_PER_SECOND_BY_NAME;

const CHARACTER_SET_NAMES = Object.keys(CHARACTERS_BY_SET_NAME) as CharacterSetName[];

const GUESS_SPEED_NAMES = Object.keys(GUESSES_PER_SECOND_BY_NAME) as GuessSpeedName[];

export const KEYSPACE_FILL_CONTROLS = defineControls([
  slider("passwordLength", "Password length", 1, MAX_PASSWORD_LENGTH, 1, 4),
  select("characterSetName", "Characters", CHARACTER_SET_NAMES, "Digits"),
  select("guessSpeedName", "Guess speed", GUESS_SPEED_NAMES, "One CPU"),
]);

export type KeyspaceFillConfig = ConfigOf<typeof KEYSPACE_FILL_CONTROLS>;

export type Keyspace = {
  characters: string;
  totalPasswordCount: number;
  guessesPerSecond: number;
};

export function readKeyspace(config: KeyspaceFillConfig): Keyspace {
  const characters = CHARACTERS_BY_SET_NAME[config.characterSetName];
  return {
    characters,
    totalPasswordCount: characters.length ** config.passwordLength,
    guessesPerSecond: GUESSES_PER_SECOND_BY_NAME[config.guessSpeedName],
  };
}
