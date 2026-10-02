import { formatCount, formatDuration } from "@/lib/formatQuantity";
import {
  CHARACTERS_BY_SET_NAME,
  MAX_PASSWORD_LENGTH,
  readKeyspace,
  type KeyspaceFillConfig,
} from "./controls/keyspaceFillControls";
import type { GlossaryEntry, LessonStep } from "./lessonTypes";

const LONG_LOWERCASE_LENGTH = MAX_PASSWORD_LENGTH;
const SHORT_PRINTABLE_LENGTH = 8;
const MIN_LENGTH_FOR_GROWTH_TASK = 6;
const MIN_CHARACTER_COUNT_FOR_VARIETY_TASK = 62;

function describeGrid(config: KeyspaceFillConfig): string {
  const { totalPasswordCount } = readKeyspace(config);
  return `Your grid has ${formatCount(totalPasswordCount)} passwords. The secret is one of them.`;
}

function describeGrowth(config: KeyspaceFillConfig): string {
  const { characters, totalPasswordCount } = readKeyspace(config);
  return `Now: ${formatCount(totalPasswordCount)} passwords. One more character: ${formatCount(totalPasswordCount * characters.length)} passwords. That is ${characters.length} times more work.`;
}

function describeChoices(config: KeyspaceFillConfig): string {
  const { characters, totalPasswordCount } = readKeyspace(config);
  return `${characters.length} choices in ${config.passwordLength} places = ${formatCount(totalPasswordCount)} passwords.`;
}

function describeSpeed(config: KeyspaceFillConfig): string {
  const { totalPasswordCount, guessesPerSecond } = readKeyspace(config);
  return `At this speed, the attacker tries all passwords in ${formatDuration(totalPasswordCount / guessesPerSecond)}.`;
}

function describeLengthComparison(): string {
  const lowercaseCount = CHARACTERS_BY_SET_NAME["Lowercase letters"].length ** LONG_LOWERCASE_LENGTH;
  const printableCount = CHARACTERS_BY_SET_NAME["All printable characters"].length ** SHORT_PRINTABLE_LENGTH;
  return `${LONG_LOWERCASE_LENGTH} lowercase letters: ${formatCount(lowercaseCount)} passwords. ${SHORT_PRINTABLE_LENGTH} printable characters: ${formatCount(printableCount)} passwords. The long password has ${formatCount(lowercaseCount / printableCount)} times more.`;
}

export const KEYSPACE_LESSON_STEPS: readonly LessonStep<KeyspaceFillConfig>[] = [
  {
    title: "Try every password",
    explanationLines: [
      "Brute force means: try every possible password, one after one.",
      "The grid shows all possible passwords. One cell is one password.",
      "The attacker does not know the secret. The scanner tries cells until it finds it.",
    ],
    taskText: "Click a cell at the end of the grid. The scanner works longer before it finds the secret.",
    describeLiveFact: describeGrid,
  },
  {
    title: "Add one character",
    explanationLines: [
      "Each new character multiplies the number of passwords.",
      "Each place in the password has the same number of choices.",
      "Choices x choices x choices ... = all passwords.",
    ],
    taskText: `Set Password length to ${MIN_LENGTH_FOR_GROWTH_TASK} or more. Watch the multiplication line.`,
    isTaskDone: ({ passwordLength }) => passwordLength >= MIN_LENGTH_FOR_GROWTH_TASK,
    describeLiveFact: describeGrowth,
  },
  {
    title: "More kinds of characters",
    explanationLines: [
      "A bigger character set gives more choices for each place.",
      "Digits give 10 choices. Lowercase letters give 26. Letters and digits give 62. All printable characters give 95.",
    ],
    taskText: "Set Characters to Letters and digits, or to All printable characters.",
    isTaskDone: (config) => readKeyspace(config).characters.length >= MIN_CHARACTER_COUNT_FOR_VARIETY_TASK,
    describeLiveFact: describeChoices,
  },
  {
    title: "Speed changes everything",
    explanationLines: [
      "A website allows only a few guesses each second. This is an online attack.",
      "An attacker can also steal a copy of the stored passwords. Then no website slows the guesses. This is an offline attack.",
      "A fast GPU makes billions of guesses each second against weak storage.",
    ],
    taskText: "Set Guess speed to One GPU. Look at the length ladder.",
    isTaskDone: ({ guessSpeedName }) => guessSpeedName === "One GPU",
    describeLiveFact: describeSpeed,
  },
  {
    title: "Length beats tricks",
    explanationLines: [
      "A rule like add a symbol makes a small change. More length makes a big change.",
      "Compare two passwords.",
    ],
    taskText: `Set Characters to Lowercase letters. Set Password length to ${LONG_LOWERCASE_LENGTH}.`,
    isTaskDone: ({ characterSetName, passwordLength }) =>
      characterSetName === "Lowercase letters" && passwordLength === LONG_LOWERCASE_LENGTH,
    describeLiveFact: describeLengthComparison,
  },
  {
    title: "What the grid does not show",
    explanationLines: [
      "Real attackers do not start at the first cell. They try common passwords first, such as password1 and qwerty. This is a dictionary attack.",
      "A long but common password can fall in seconds.",
      "Use a long random password or a long phrase. Use a password manager. Turn on two-factor authentication.",
      "Websites must limit login tries. Websites must store passwords as slow hashes, such as bcrypt or Argon2.",
    ],
  },
];

export const KEYSPACE_GLOSSARY_ENTRIES: readonly GlossaryEntry[] = [
  { term: "Brute force", meaning: "Try every possible password." },
  { term: "Keyspace", meaning: "The number of all possible passwords." },
  { term: "Hash", meaning: "A one-way scramble of a password. Websites store hashes, not passwords." },
  { term: "Dictionary attack", meaning: "Try common passwords from a list first." },
  { term: "Online attack", meaning: "The attacker guesses at the real website. The site can slow or block the guesses." },
  { term: "Offline attack", meaning: "The attacker has a stolen copy of the hashes. Nothing slows the guesses." },
  { term: "1E10", meaning: "A short way to write 1 followed by 10 zeros. 3E6 is 3,000,000." },
];
