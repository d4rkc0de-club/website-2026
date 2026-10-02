import { findVariantBySlug, type VariantEntry } from "@/lib/variantRegistry";
import { CrossSiteScriptDemo } from "./CrossSiteScript";
import { FirewallRulesDemo } from "./FirewallRules";
import { KeyspaceFillDemo } from "./KeyspaceFill";
import { RaceWindowDemo } from "./RaceWindow";
import { RingClimbDemo } from "./RingClimb";
import { SqlBreakoutDemo } from "./SqlBreakout";

export const CYBERSEC_VARIANTS: readonly VariantEntry[] = [
  {
    slug: "race-window",
    title: "Race Window",
    summary:
      "Two threads take money from one account. Change the step order with the control. Some orders pay two times. Turn on the lock to stop this.",
    Component: RaceWindowDemo,
  },
  {
    slug: "ring-climb",
    title: "Ring Climb",
    summary:
      "Rings show how much power code has. Send a system call through the gate. Then use an exploit to skip the gate. Patch the gate to stop the exploit.",
    Component: RingClimbDemo,
  },
  {
    slug: "keyspace-fill",
    title: "Keyspace Fill",
    summary:
      "Pick a password length and a character set. A grid shows every possible password. A scanner tries them one after one until it finds the hidden password. Add one character. The time to find it grows fast.",
    Component: KeyspaceFillDemo,
  },
  {
    slug: "sql-breakout",
    title: "SQL Breakout",
    summary:
      "Pick a login name. The query shows how the database reads it. A quote mark turns text into code. A comment skips the password check. Turn on the safe query to stop this.",
    Component: SqlBreakoutDemo,
  },
  {
    slug: "firewall-rules",
    title: "Firewall Rules",
    summary:
      "Packets walk down a list of rules toward a server. The first rule that matches decides. Change the order of the rules. Turn on default deny. Watch which packets get in.",
    Component: FirewallRulesDemo,
  },
  {
    slug: "xss",
    title: "Cross-Site Script",
    summary:
      "A visitor posts a comment. The site writes the comment into a page. A tag in the comment runs as code in the next visitor's browser. A script can send the visitor's cookie to an attacker. Turn on escape output to stop this.",
    Component: CrossSiteScriptDemo,
  },
];

export function findCybersecVariant(slug: string): VariantEntry | undefined {
  return findVariantBySlug(CYBERSEC_VARIANTS, slug);
}
