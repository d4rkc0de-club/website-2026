export const CTFTIME_TEAM_URL = "https://ctftime.org/team/15154/";

export const HERO_TAGLINE = ["Computer Security Club", "IIIT Delhi"] as const;

export const HERO_SLOGAN_LEAD = "We break things.";

export const HERO_SLOGAN_TAIL = "~Legally";

export const HERO_DOMAINS = [
  "WEB",
  "PWN",
  "REV",
  "CRYPTO",
  "FORENSICS",
  "OSINT",
] as const;

export type HeroDomain = (typeof HERO_DOMAINS)[number];

export const HERO_ANSWERS = [
  {
    question: "What is this?",
    answer: "d4rkc0de is the computer security club of IIIT Delhi.",
  },
  {
    question: "What do we do?",
    answer:
      "We learn, break, build, and compete. We play CTFs. We host HackCon each year.",
  },
  {
    question: "Why care?",
    answer:
      "Our team was 2nd in India on CTFtime in 2016 and 2017. We won the CTF at GCCS 2017.",
  },
  {
    question: "How to join?",
    answer:
      "Anyone can join the club. CTF team members join through their CTF results.",
  },
] as const;

export const NAV_ITEMS: readonly { label: string; href?: string }[] = [
  { label: "INDEX", href: "/" },
  { label: "WORK" },
  { label: "H4CKC0N" },
  { label: "HISTORY" },
  { label: "WRITEUPS" },
  { label: "TEAM" },
  { label: "JOIN" },
];
