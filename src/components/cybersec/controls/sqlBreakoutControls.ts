import { defineControls, select, toggle, type ConfigOf } from "@/lib/variantControls";

export const LOGIN_TEXT_BY_NAME = {
  normalName: "alice",
  nameWithQuote: "O'Brien",
  commentTrick: "admin'--",
  alwaysTrue: "' OR 1=1--",
} as const;

const LOGIN_TEXTS = Object.values(LOGIN_TEXT_BY_NAME);

export const SQL_BREAKOUT_CONTROLS = defineControls([
  select("loginText", "Login name", LOGIN_TEXTS, LOGIN_TEXT_BY_NAME.normalName),
  toggle("isSafeQueryEnabled", "Safe query", false),
]);

export type SqlBreakoutConfig = ConfigOf<typeof SQL_BREAKOUT_CONTROLS>;
