import {
  SQL_BREAKOUT_QUERY_PREFIX,
  SQL_BREAKOUT_QUERY_SUFFIX,
  SQL_BREAKOUT_SAFE_QUERY,
  SQL_BREAKOUT_USER_NAMES,
} from "@/content/cybersecContent";

export type QueryTone = "templateCode" | "string" | "injectedCode" | "comment";

export type ToneCell = { character: string; tone: QueryTone; isFromUserInput: boolean };

export type QueryAnalysis = {
  isSafeQuery: boolean;
  queryCells: readonly ToneCell[];
  valueCells: readonly ToneCell[];
  injectedCodeCount: number;
  isPasswordCheckSkipped: boolean;
  isSyntaxError: boolean;
  matchedUserNames: readonly string[];
};

type QueryCharacter = { character: string; isFromUserInput: boolean };

const QUOTE_CHARACTER = "'";
const COMMENT_START_CHARACTER = "-";
const ALWAYS_TRUE_CONDITION = "OR1=1";

function toQueryCharacters(text: string, isFromUserInput: boolean): QueryCharacter[] {
  return [...text].map((character) => ({ character, isFromUserInput }));
}

function toUniformCells(text: string, tone: QueryTone, isFromUserInput: boolean): ToneCell[] {
  return [...text].map((character) => ({ character, tone, isFromUserInput }));
}

function classifyQueryCharacters(queryCharacters: readonly QueryCharacter[]): {
  toneCells: ToneCell[];
  isStringOpenAtEnd: boolean;
} {
  let isInsideString = false;
  let isInsideComment = false;

  const toneCells = queryCharacters.map(({ character, isFromUserInput }, position): ToneCell => {
    if (isInsideComment) return { character, tone: "comment", isFromUserInput };

    if (character === QUOTE_CHARACTER) {
      isInsideString = !isInsideString;
      return { character, tone: isFromUserInput ? "injectedCode" : "string", isFromUserInput };
    }

    if (isInsideString) return { character, tone: "string", isFromUserInput };

    const isCommentStart =
      character === COMMENT_START_CHARACTER && queryCharacters[position + 1]?.character === COMMENT_START_CHARACTER;
    if (isCommentStart) {
      isInsideComment = true;
      return { character, tone: "comment", isFromUserInput };
    }

    return { character, tone: isFromUserInput ? "injectedCode" : "templateCode", isFromUserInput };
  });

  return { toneCells, isStringOpenAtEnd: isInsideString && !isInsideComment };
}

function findMatchedUserNames(
  loginText: string,
  toneCells: readonly ToneCell[],
  isPasswordCheckSkipped: boolean,
): readonly string[] {
  if (!isPasswordCheckSkipped) return [];

  const injectedCodeText = toneCells
    .filter(({ tone }) => tone === "injectedCode")
    .map(({ character }) => character)
    .join("")
    .replace(/\s/g, "")
    .toUpperCase();
  if (injectedCodeText.includes(ALWAYS_TRUE_CONDITION)) return SQL_BREAKOUT_USER_NAMES;

  const nameBeforeFirstQuote = loginText.split(QUOTE_CHARACTER)[0];
  return SQL_BREAKOUT_USER_NAMES.filter((userName) => userName === nameBeforeFirstQuote);
}

function analyseUnsafeQuery(loginText: string): QueryAnalysis {
  const { toneCells, isStringOpenAtEnd } = classifyQueryCharacters([
    ...toQueryCharacters(SQL_BREAKOUT_QUERY_PREFIX, false),
    ...toQueryCharacters(loginText, true),
    ...toQueryCharacters(SQL_BREAKOUT_QUERY_SUFFIX, false),
  ]);
  const isPasswordCheckSkipped = toneCells.some(({ tone }) => tone === "comment");

  return {
    isSafeQuery: false,
    queryCells: toneCells,
    valueCells: [],
    injectedCodeCount: toneCells.filter(({ isFromUserInput, tone }) => isFromUserInput && tone !== "string").length,
    isPasswordCheckSkipped,
    isSyntaxError: isStringOpenAtEnd,
    matchedUserNames: isStringOpenAtEnd ? [] : findMatchedUserNames(loginText, toneCells, isPasswordCheckSkipped),
  };
}

function analyseSafeQuery(loginText: string): QueryAnalysis {
  return {
    isSafeQuery: true,
    queryCells: toUniformCells(SQL_BREAKOUT_SAFE_QUERY, "templateCode", false),
    valueCells: toUniformCells(loginText, "string", true),
    injectedCodeCount: 0,
    isPasswordCheckSkipped: false,
    isSyntaxError: false,
    matchedUserNames: [],
  };
}

export function analyseQuery(loginText: string, isSafeQueryEnabled: boolean): QueryAnalysis {
  return isSafeQueryEnabled ? analyseSafeQuery(loginText) : analyseUnsafeQuery(loginText);
}

export function describeLoginResult({ isSyntaxError, matchedUserNames }: QueryAnalysis): string {
  if (isSyntaxError) return "database error";
  if (matchedUserNames.length > 0) return `logged in as ${matchedUserNames[0]}`;
  return "denied";
}
