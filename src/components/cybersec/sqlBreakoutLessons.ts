import { SQL_BREAKOUT_USER_NAMES } from "@/content/cybersecContent";
import { LOGIN_TEXT_BY_NAME, type SqlBreakoutConfig } from "./controls/sqlBreakoutControls";
import type { GlossaryEntry, LessonStep } from "./lessonTypes";
import { analyseQuery, describeLoginResult } from "./sqlBreakoutQuery";

const USER_COUNT = SQL_BREAKOUT_USER_NAMES.length;

function readAnalysis({ loginText, isSafeQueryEnabled }: SqlBreakoutConfig) {
  return analyseQuery(loginText, isSafeQueryEnabled);
}

function describeCodeShare(config: SqlBreakoutConfig): string {
  const { injectedCodeCount } = readAnalysis(config);
  return `Login name: ${config.loginText}. ${injectedCodeCount} of ${config.loginText.length} characters run as code.`;
}

function describeResult(config: SqlBreakoutConfig): string {
  return `Login name: ${config.loginText}. Result: ${describeLoginResult(readAnalysis(config))}.`;
}

function describePasswordCheck(config: SqlBreakoutConfig): string {
  const { isPasswordCheckSkipped, matchedUserNames } = readAnalysis(config);
  return `Password check: ${isPasswordCheckSkipped ? "skipped" : "runs"}. Users found: ${matchedUserNames.length} of ${USER_COUNT}.`;
}

function describeUsersReturned(config: SqlBreakoutConfig): string {
  const analysis = readAnalysis(config);
  return `The query returns ${analysis.matchedUserNames.length} of ${USER_COUNT} users. Login: ${describeLoginResult(analysis)}.`;
}

function describeSafeComparison({ loginText }: SqlBreakoutConfig): string {
  const unsafeCount = analyseQuery(loginText, false).matchedUserNames.length;
  const safeCount = analyseQuery(loginText, true).matchedUserNames.length;
  return `Safe query off: ${unsafeCount} users returned. Safe query on: ${safeCount} users returned.`;
}

function describeSafeState(config: SqlBreakoutConfig): string {
  const { injectedCodeCount } = readAnalysis(config);
  return `Safe query is ${config.isSafeQueryEnabled ? "on" : "off"}. ${injectedCodeCount} characters of your text run as code.`;
}

export const SQL_BREAKOUT_LESSON_STEPS: readonly LessonStep<SqlBreakoutConfig>[] = [
  {
    title: "Watch a login",
    explanationLines: [
      "A website asks a database about each user who logs in.",
      "The site writes a query as text. It puts your name between two quote marks.",
      "White cells are the code of the site. Yellow cells are your name.",
    ],
    taskText: "Click the picture. Watch the query go to the database.",
    describeLiveFact: describeCodeShare,
  },
  {
    title: "Add a quote mark",
    explanationLines: [
      "A quote mark ends a text value.",
      "O'Brien has a quote mark in his name. The quote ends the text early.",
      "The rest of the name is now code. The database cannot read it.",
      "No attacker is here. A normal name broke the site.",
    ],
    taskText: `Turn off Safe query. Set Login name to ${LOGIN_TEXT_BY_NAME.nameWithQuote}.`,
    isTaskDone: ({ loginText, isSafeQueryEnabled }) =>
      loginText === LOGIN_TEXT_BY_NAME.nameWithQuote && !isSafeQueryEnabled,
    describeLiveFact: describeResult,
  },
  {
    title: "Skip the password",
    explanationLines: [
      "Two dashes start a comment. The database ignores a comment.",
      "The site puts the password check after your name. A comment can hide it.",
      "Now the query asks only for the name.",
    ],
    taskText: `Turn off Safe query. Set Login name to ${LOGIN_TEXT_BY_NAME.commentTrick}.`,
    isTaskDone: ({ loginText, isSafeQueryEnabled }) =>
      loginText === LOGIN_TEXT_BY_NAME.commentTrick && !isSafeQueryEnabled,
    describeLiveFact: describePasswordCheck,
  },
  {
    title: "Log in as anyone",
    explanationLines: [
      "OR 1=1 is always true. The query now matches every row.",
      "Many sites log in the first row they get. Here, the first row is admin.",
      "The attacker needs no password. Real sites lose data to this bug.",
    ],
    taskText: `Turn off Safe query. Set Login name to ${LOGIN_TEXT_BY_NAME.alwaysTrue}.`,
    isTaskDone: ({ loginText, isSafeQueryEnabled }) =>
      loginText === LOGIN_TEXT_BY_NAME.alwaysTrue && !isSafeQueryEnabled,
    describeLiveFact: describeUsersReturned,
  },
  {
    title: "Same text, safe query",
    explanationLines: [
      "A safe query has ? marks. The site sends your name in a separate lane.",
      "The database reads that lane as data only. It never runs it as code.",
      "Use the same login name. Change only Safe query.",
    ],
    taskText: `Set Login name to ${LOGIN_TEXT_BY_NAME.alwaysTrue}. Turn on Safe query.`,
    isTaskDone: ({ loginText, isSafeQueryEnabled }) =>
      loginText === LOGIN_TEXT_BY_NAME.alwaysTrue && isSafeQueryEnabled,
    describeLiveFact: describeSafeComparison,
  },
  {
    title: "Limits and defence",
    explanationLines: [
      "Safe queries are the main fix. Never join user text into a query.",
      "Give the database account only the rights it needs. Hide database errors from users.",
      "A filter that removes quote marks is weak. Attackers find other ways. Names like O'Brien must still work.",
    ],
    taskText: `Turn on Safe query. Set Login name to ${LOGIN_TEXT_BY_NAME.nameWithQuote}. The name works now.`,
    isTaskDone: ({ loginText, isSafeQueryEnabled }) =>
      loginText === LOGIN_TEXT_BY_NAME.nameWithQuote && isSafeQueryEnabled,
    describeLiveFact: describeSafeState,
  },
];

export const SQL_BREAKOUT_GLOSSARY_ENTRIES: readonly GlossaryEntry[] = [
  { term: "SQL", meaning: "A language that programs use to ask a database for data." },
  { term: "Database", meaning: "A program that stores data in tables." },
  { term: "Query", meaning: "One request to the database, written in SQL." },
  { term: "Injection", meaning: "Sending text that the program runs as code." },
  { term: "Quote mark", meaning: "In SQL, quote marks start and end a text value." },
  { term: "Comment", meaning: "Text after two dashes. The database ignores it." },
  { term: "Safe query", meaning: "A query with ? marks. The data goes in a separate lane. Also called a prepared statement." },
  { term: "Hash", meaning: "A one-way scramble of a password. The database stores hashes, not passwords." },
];
