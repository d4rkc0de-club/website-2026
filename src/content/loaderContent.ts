import { HERO_DOMAINS } from "@/content/heroContent";

export const HACKCON_EDITION_COUNT = 7;

export const TERMINAL_BOOT_HEADER = "d4rkc0de  tty1";

export const TERMINAL_BOOT_STEPS = [
  "Started d4rkc0de.",
  "Mounted /club/founded: 2014.",
  `Loaded ${HERO_DOMAINS.length} domains.`,
  `Started HackCon, ${HACKCON_EDITION_COUNT} editions.`,
  "Reached target CTF Team.",
  "Reached target Tagline.",
] as const;

export const TERMINAL_PROMPT_TEXT = "$ ./say --tagline";
