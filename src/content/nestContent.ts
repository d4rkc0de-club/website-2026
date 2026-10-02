export type NestEvent = { year: string; name: string; result: string };

export type NestCoordinator = { name: string; role: string };

export const NEST_WIN_RESULT = "Won";

export const NEST_HERO_HINT = "Move the pointer. Click to sting.";

export const NEST_STING_LABEL = "Sting";

export const NEST_ABOUT_HEADING = "About us";

export const NEST_ABOUT_PARAGRAPHS = [
  "d4rkc0de is the computer security club of IIIT Delhi.",
  "We learn, practise, and compete in cyber security.",
  "We work in crypto, web, pwn, reverse engineering, and forensics.",
  "n00b talks help beginners. pr0 talks help advanced members.",
] as const;

export const NEST_ABOUT_FACTS = [
  { value: "2015–2026", label: "Years on CTFtime" },
  { value: "7", label: "h4ckc0n events" },
] as const;

export const NEST_EVENTS_HEADING = "Past events";

export const NEST_EVENTS: readonly NestEvent[] = [
  { year: "2017", name: "Global Conference on Cyberspace CTF", result: NEST_WIN_RESULT },
  { year: "2019", name: "BITSCTF", result: "2nd place" },
  { year: "2022", name: "WRECKCTF", result: "2nd place" },
  { year: "2022", name: "BlueHens CTF", result: "9th place" },
  { year: "2025", name: "h4ckc0n", result: "Organised by the club" },
  { year: "Year TBD", name: "Aurora 2.0 (DTU)", result: NEST_WIN_RESULT },
];

export const NEST_COORDINATORS_HEADING = "Coordinators";

export const NEST_COORDINATORS: readonly NestCoordinator[] = [
  { name: "Coordinator One", role: "Role TBD" },
  { name: "Coordinator Two", role: "Role TBD" },
  { name: "Coordinator Three", role: "Role TBD" },
  { name: "Coordinator Four", role: "Role TBD" },
];

export const NEST_JOIN_HEADING = "Join us";

export const NEST_JOIN_TEXT =
  "IIIT Delhi students can join the club. CTF team members join through CTF results.";

export const NEST_JOIN_BUTTON_LABEL = "Join the club";
