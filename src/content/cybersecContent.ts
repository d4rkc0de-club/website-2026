import type { OutcomeTone } from "@/components/cybersec/CybersecParts";
import type { QueryTone } from "@/components/cybersec/sqlBreakoutQuery";
import type { PageEffect, XssTone } from "@/components/cybersec/xssPageAnalysis";

export type RingNumber = 0 | 1 | 2 | 3;

export type RingStep = {
  ring: RingNumber;
  tone: OutcomeTone;
  message: string;
};

export const RING_CLIMB_IDLE_STEPS: readonly RingStep[] = [
  { ring: 3, tone: "info", message: "The app runs in ring 3. Press a button to start." },
];

export const RING_CLIMB_SYSCALL_STEPS: readonly RingStep[] = [
  { ring: 3, tone: "info", message: "The app asks the kernel for a service. The request goes to the gate." },
  { ring: 2, tone: "safe", message: "The gate checks the request. The request is valid. The gate lets it pass." },
  { ring: 1, tone: "safe", message: "The next gate checks the request again. The request passes." },
  { ring: 0, tone: "safe", message: "The kernel does the work for the app." },
  { ring: 3, tone: "safe", message: "The result goes back to the app. The app stays in ring 3." },
];

const EXPLOIT_START_STEP: RingStep = {
  ring: 3,
  tone: "info",
  message: "The attacker sends bad input. The input uses a bug in the gate.",
};

export const RING_CLIMB_EXPLOIT_STEPS: readonly RingStep[] = [
  EXPLOIT_START_STEP,
  { ring: 2, tone: "danger", message: "The bug lets the input skip the gate check." },
  { ring: 1, tone: "danger", message: "The input skips the next gate check too." },
  { ring: 0, tone: "danger", message: "The attacker runs code in ring 0. The attacker controls the whole system." },
];

export const RING_CLIMB_PATCHED_EXPLOIT_STEPS: readonly RingStep[] = [
  EXPLOIT_START_STEP,
  { ring: 3, tone: "safe", message: "The patched gate checks the input. The input is not valid. The gate blocks it." },
];

export const RING_CLIMB_LEGEND_LINES: readonly { ring: RingNumber; text: string }[] = [
  { ring: 3, text: "Ring 3: user apps" },
  { ring: 2, text: "Ring 2: services" },
  { ring: 1, text: "Ring 1: drivers" },
  { ring: 0, text: "Ring 0: kernel" },
];

export const RING_CLIMB_GATE_LEGEND_LINES = [
  "[=] gate: it checks each request",
  "[#] patched gate: it blocks bad input",
] as const;

export const SQL_BREAKOUT_QUERY_PREFIX = "SELECT * FROM users WHERE name = '";

export const SQL_BREAKOUT_QUERY_SUFFIX = "' AND password = 'hash_of_password';";

export const SQL_BREAKOUT_SAFE_QUERY = "SELECT * FROM users WHERE name = ? AND password = ?;";

export const SQL_BREAKOUT_USER_NAMES: readonly string[] = ["admin", "alice", "bob", "carol"];

export const SQL_BREAKOUT_TITLE = "SQL INJECTION";

export const SQL_BREAKOUT_INTRO = "Text from a user can become code.";

export const SQL_BREAKOUT_HINT = "Click the picture or press Enter to send the login again.";

export const SQL_BREAKOUT_FORM_LABEL = "LOGIN FORM";

export const SQL_BREAKOUT_PASSWORD_PLACEHOLDER = "the attacker does not know it";

export const SQL_BREAKOUT_QUERY_LABEL = "QUERY THE SITE BUILDS";

export const SQL_BREAKOUT_SAFE_QUERY_LABEL = "QUERY WITH ? MARKS";

export const SQL_BREAKOUT_VALUE_LABEL = "VALUE FOR THE FIRST ? MARK (DATA LANE)";

export const SQL_BREAKOUT_DATABASE_LABEL = "DATABASE TABLE: users";

export const SQL_BREAKOUT_TONE_LEGEND_TEXT: Record<QueryTone, string> = {
  templateCode: "query code",
  string: "text value",
  injectedCode: "your text as code",
  comment: "comment (not run)",
};

export type FirewallRule = {
  id: string;
  action: "allow" | "deny";
  source: "any" | "office";
  port: number | "any";
};

export type FirewallPacket = {
  id: string;
  senderLabel: string;
  source: "office" | "internet";
  port: number;
  isWanted: boolean;
};

export const FIREWALL_RULES = {
  officeSsh: { id: "office-ssh", action: "allow", source: "office", port: 22 },
  blockSsh: { id: "block-ssh", action: "deny", source: "any", port: 22 },
  allowHttps: { id: "allow-https", action: "allow", source: "any", port: 443 },
  allowHttp: { id: "allow-http", action: "allow", source: "any", port: 80 },
  allowEverything: { id: "allow-everything", action: "allow", source: "any", port: "any" },
} as const satisfies Record<string, FirewallRule>;

export const FIREWALL_PACKETS: readonly FirewallPacket[] = [
  { id: "customer-https", senderLabel: "Customer", source: "internet", port: 443, isWanted: true },
  { id: "customer-http", senderLabel: "Customer", source: "internet", port: 80, isWanted: true },
  { id: "admin-ssh", senderLabel: "Admin", source: "office", port: 22, isWanted: true },
  { id: "attacker-ssh", senderLabel: "Attacker", source: "internet", port: 22, isWanted: false },
  { id: "attacker-rdp", senderLabel: "Attacker", source: "internet", port: 3389, isWanted: false },
  { id: "attacker-telnet", senderLabel: "Attacker", source: "internet", port: 23, isWanted: false },
];

export const FIREWALL_PORT_NAMES: Readonly<Record<number, string>> = {
  22: "SSH",
  23: "Telnet",
  80: "HTTP",
  443: "HTTPS",
  3389: "RDP",
};

export const FIREWALL_SOURCE_LABELS = {
  any: "any sender",
  office: "office network",
  internet: "internet",
} as const;

export const FIREWALL_TITLE = "FIREWALL";

export const FIREWALL_INTRO = "Rules decide which packets reach the server.";

export const FIREWALL_HINT = "Click the picture or press Enter to send the packets again.";

export const FIREWALL_PACKET_LABEL = "PACKET NOW";

export const FIREWALL_RULES_LABEL = "FIREWALL RULES, TOP TO BOTTOM";

export const FIREWALL_RESULTS_LABEL = "RESULT FOR EACH PACKET";

export const FIREWALL_DEFAULT_SOURCE_TEXT = "default rule";

export const FIREWALL_DONE_TEXT = "All packets checked.";

export const FIREWALL_SERVER_TOP_LINE = ".--------.";

export const FIREWALL_SERVER_NAME_LINE = "| SERVER |";

export const FIREWALL_SERVER_EMPTY_LINE = "|        |";

export const FIREWALL_SERVER_BOTTOM_LINE = "'--------'";

export const FIREWALL_LIVE_LABELS = {
  rightResults: "RIGHT RESULTS",
  unwantedIn: "UNWANTED PACKETS IN",
  wantedBlocked: "WANTED PACKETS BLOCKED",
} as const;

export const RACE_WINDOW_HINT = "Click to replay. Pick a scenario. Use Pause.";

export const RACE_SCENARIOS = {
  oneAtATime: "One at a time",
  race: "Two at once: race condition",
  lock: "Two at once: with lock",
  custom: "Custom order",
} as const;

export const RACE_SCENARIO_NAMES = Object.values(RACE_SCENARIOS);

export const KEYSPACE_FILL_TITLE = "BRUTE FORCE";

export const KEYSPACE_FILL_INTRO = "A computer tries every password, one after one.";

export const KEYSPACE_FILL_HINT = "Click a cell to hide the password there. Click outside the grid to start again.";

export const PADLOCK_LOCKED_LINES: readonly string[] = [
  "  .---.  ",
  "  |   |  ",
  " [#####] ",
  " [##o##] ",
  " [#####] ",
];

export const PADLOCK_OPEN_LINES: readonly string[] = [
  "  .---.  ",
  "      |  ",
  " [#####] ",
  " [## ##] ",
  " [#####] ",
];

export const KEYSPACE_FILL_LADDER_TITLE = "TIME TO TRY ALL PASSWORDS, BY LENGTH";

export const KEYSPACE_FILL_LADDER_LEGEND_LINES: readonly string[] = [
  "Bar = time to try all passwords. Full bar = age of the universe.",
  "Red: under 1 day. White: under 1 year. Green: more than 1 year.",
];

export const XSS_TITLE = "XSS";

export const XSS_INTRO = "A site can turn comment text into code.";

export const XSS_HINT = "Click the picture or press Enter to send the comment again.";

export const XSS_COMMENT_LABEL = "COMMENT BOX (EVERY VISITOR CAN TYPE HERE)";

export const XSS_SOURCE_LABEL = "PAGE THE SITE BUILDS FOR THE NEXT VISITOR";

export const XSS_BROWSER_LABEL = "NEXT VISITOR BROWSER";

export const XSS_ATTACKER_LABEL = "ATTACKER SERVER";

export const XSS_PAGE_OPEN_TAG = "<p>";

export const XSS_PAGE_CLOSE_TAG = "</p>";

export const XSS_SESSION_COOKIE = "session=7f3a9c";

export const XSS_BROKEN_IMAGE_TEXT = "[broken image]";

export const XSS_EMPTY_PAGE_TEXT = "(nothing to see)";

export const XSS_BOLD_NOTE = "(bold: the tag ran)";

export const XSS_PROTECTED_COOKIE_NOTE = "(protected: scripts cannot read it)";

export const XSS_WAITING_TEXT = "waiting";

export const XSS_NOTHING_RECEIVED_TEXT = "nothing";

export const XSS_NOT_KNOWN_YET_TEXT = "-";

export const XSS_TONE_LEGEND_TEXT: Record<XssTone, string> = {
  pageCode: "page code",
  commentText: "comment text",
  commentCode: "comment as code",
  escapedText: "escaped text (safe)",
};

export const XSS_PAGE_EFFECT_TEXT: Record<PageEffect, string> = {
  text: "only text",
  tag: "a tag",
  script: "a script",
};

export const XSS_ROW_LABELS = {
  comment: "comment",
  sees: "sees",
  pageRuns: "page runs",
  cookie: "cookie",
  received: "received",
} as const;

export const XSS_LIVE_LABELS = {
  codeCharacters: "CHARACTERS RUN AS CODE",
  scriptsRun: "SCRIPTS RUN",
  cookiesSent: "COOKIES SENT TO ATTACKER",
} as const;
