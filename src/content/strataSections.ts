import { CTFTIME_TEAM_URL, HERO_DOMAINS, HERO_TAGLINE } from "./heroContent";

export type StrataSection = {
  id: string;
  label: string;
  heading: string;
  body: readonly string[];
  useWordmarkGrid: boolean;
  gridLines: readonly string[];
};

export const STRATA_SECTIONS: readonly StrataSection[] = [
  {
    id: "hero",
    label: "SURFACE",
    heading: "d4rkc0de",
    body: [HERO_TAGLINE.join(" · ")],
    useWordmarkGrid: true,
    gridLines: [],
  },
  {
    id: "domains",
    label: "DOMAINS",
    heading: "What we play",
    body: ["We train and compete across standard CTF categories."],
    useWordmarkGrid: false,
    gridLines: [...HERO_DOMAINS],
  },
  {
    id: "team",
    label: "TEAM",
    heading: "IIIT Delhi",
    body: [
      "The club is open to all students.",
      "The CTF team selects members through CTF results.",
    ],
    useWordmarkGrid: false,
    gridLines: ["TEAM", "IIITD"],
  },
  {
    id: "join",
    label: "JOIN",
    heading: "Come build with us",
    body: [
      "Join the club at IIIT Delhi.",
      "Follow our CTFtime profile for competition updates.",
    ],
    useWordmarkGrid: false,
    gridLines: ["JOIN", "CTF"],
  },
];

export const STRATA_CTF_LINK = CTFTIME_TEAM_URL;
