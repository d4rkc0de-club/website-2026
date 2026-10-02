import { HERO_DOMAINS } from "./heroContent";

export const RELIC_SECTIONS = [
  { id: "home", label: "HOME", tone: "ink" },
  { id: "about", label: "ABOUT", tone: "sheet" },
  { id: "domains", label: "DOMAINS", tone: "ink" },
  { id: "events", label: "EVENTS", tone: "sheet" },
  { id: "team", label: "TEAM", tone: "ink" },
  { id: "join", label: "JOIN", tone: "ink" },
] as const;

export type RelicSectionId = (typeof RELIC_SECTIONS)[number]["id"];

export const RELIC_LINKS = {
  allEvents: "https://ctftime.org/team/15154/",
  join: "#",
} as const;

export const RELIC_BRAND = {
  name: "D4RKCODE",
  lines: ["IIIT DELHI", "COMPUTER SECURITY CLUB"],
  year: "// 2026",
} as const;

export const RELIC_HERO = {
  tagline:
    "We are students who explore cyber security, reverse engineering, cryptography, and more.",
  button: "EXPLORE",
  leftRail: ["LEARN", "BREAK", "ANALYSE", "BUILD", "COMPETE", "REPEAT"],
  rightRail: ["PEOPLE", "PROBLEMS", "IDEAS", "EXPLOITS", "WRITEUPS", "COMMUNITY"],
  note: ["CURIOSITY", "BUILDS", "SAFER", "SYSTEMS"],
} as const;

export const RELIC_ABOUT = {
  heading: "ABOUT US",
  paragraphs: [
    "d4rkc0de is the computer security club of IIIT Delhi. We are students who want to know how systems work, how they fail, and how to make them safe.",
    "We learn through practice. We hold workshops and talks. We organize CTFs and share writeups. We build a culture of curiosity and teamwork.",
  ],
  button: "OUR STORY",
  flow: ["PEOPLE", "KNOWLEDGE", "PRACTICE", "COMMUNITY"],
  domains: HERO_DOMAINS,
} as const;

export const RELIC_DOMAINS = {
  heading: "DOMAINS",
  items: [
    { name: "WEB", art: "lattice", text: "Web exploitation, application security, and modern web technology." },
    { name: "PWN", art: "star", text: "Binary exploitation, memory corruption, and low-level systems." },
    { name: "REV", art: "spheres", text: "Reverse engineering, malware analysis, and decompilation." },
    { name: "CRYPTO", art: "cubes", text: "Modern and classic cryptography, protocols, and their weaknesses." },
    { name: "FORENSICS", art: "waveform", text: "Digital forensics, incident response, and artifact analysis." },
    { name: "OSINT", art: "planet", text: "Open-source intelligence, reconnaissance, and data investigation." },
  ],
} as const;

export const RELIC_EVENTS = {
  heading: "PAST EVENTS",
  subheading: "// TALKS, WORKSHOPS, CTFs AND MORE",
  years: [
    { year: "2025", name: "h4ckc0n 2025" },
    { year: "2023", name: "h4ckc0n 2023" },
    { year: "2022", name: "Workshops and talks" },
    { year: "2019", name: "h4ckc0n 2019" },
    { year: "2018", name: "h4ckc0n 2018" },
    { year: "2017", name: "h4ckc0n 2017" },
    { year: "2016", name: "h4ckc0n 2016" },
    { year: "2015", name: "h4ckc0n 2015" },
  ],
  placeholderDetail: "Details will come soon.",
  allEventsButton: "VIEW ALL EVENTS",
} as const;

export const RELIC_PORTRAIT_BASE_URL = "https://randomuser.me/api/portraits";

export const RELIC_TEAM = {
  heading: "OUR PEOPLE",
  subheading: "// STUDENTS → COMMUNITY → D4RKCODE",
  members: [
    { name: "AARYAN SHARMA", role: "General Secretary", portraitPath: "men/32", accessories: ["glasses"] },
    { name: "RIYA VERMA", role: "Technical Head", portraitPath: "women/44", accessories: ["headphones"] },
    { name: "KARAN MEHTA", role: "Events & Outreach", portraitPath: "men/75", accessories: ["beanie"] },
    { name: "ISHA SINGH", role: "Design & Media", portraitPath: "women/65", accessories: ["glasses", "beanie"] },
    { name: "VIVID GARG", role: "CTF Team", portraitPath: "men/46", accessories: ["shades"] },
    { name: "MEHUL ARORA", role: "CTF Team", portraitPath: "men/22", accessories: ["headphones", "glasses"] },
    { name: "PRIYANSH ANAND", role: "CTF Team", portraitPath: "men/52", accessories: ["shades", "beanie"] },
  ],
  more: { name: "AND MANY MORE", role: "Community" },
  quote: "The same curiosity that breaks things also builds a safer world.",
} as const;

export const RELIC_JOIN = {
  heading: "JOIN US",
  subheading: "// LEARN / CONTRIBUTE / COMPETE / BE A PART OF IT",
  headline: ["CURIOUS", "MINDS", "BUILD", "SAFER", "SYSTEMS."],
  text: "We look for people who are curious about security, enjoy hard problems, and want to join a community that thinks the same way.",
  checklist: [
    "Attend our next recruitment challenge",
    "Take part in our events and CTFs",
    "Add to the community",
    "Grow with us",
  ],
  button: "JOIN D4RKCODE",
  note: ["SAME PEOPLE.", "DIFFERENT PERSPECTIVE.", "A SAFER INTERNET."],
} as const;
