import { describeSwitchState } from "@/lib/describeSwitchState";
import { RULE_ORDER_NAME_BY_KEY, type FirewallRulesConfig } from "./controls/firewallRulesControls";
import { evaluateFirewall, summariseVerdicts, type PacketVerdict } from "./firewallRulesEvaluation";
import type { GlossaryEntry, LessonStep } from "./lessonTypes";

const ADMIN_PACKET_ID = "admin-ssh";
const WEB_PORT = 443;

function describeRuleMatch({ isDefaultRule, matchedRuleIndex }: PacketVerdict): string {
  return isDefaultRule ? "the default rule" : `rule ${matchedRuleIndex + 1}`;
}

function describeAllowedCount(config: FirewallRulesConfig): string {
  const { verdicts } = evaluateFirewall(config);
  const allowedCount = verdicts.filter(({ isAllowed }) => isAllowed).length;
  return `${allowedCount} of ${verdicts.length} packets reach the server.`;
}

function describeAdminPacket(config: FirewallRulesConfig): string {
  const { verdicts } = evaluateFirewall(config);
  const adminVerdict = verdicts.find(({ packet }) => packet.id === ADMIN_PACKET_ID);
  if (!adminVerdict) return "";
  return `The admin packet matches ${describeRuleMatch(adminVerdict)}. Result: ${adminVerdict.isAllowed ? "let in" : "blocked"}.`;
}

function describeDefaultEffect(config: FirewallRulesConfig): string {
  const { unwantedAllowedCount, wantedBlockedCount } = summariseVerdicts(evaluateFirewall(config).verdicts);
  return `Default deny is ${describeSwitchState(config.isDefaultDenyEnabled)}. Unwanted packets let in: ${unwantedAllowedCount}. Wanted packets blocked: ${wantedBlockedCount}.`;
}

function describeFirstRuleShare(config: FirewallRulesConfig): string {
  const { verdicts } = evaluateFirewall(config);
  const firstRuleCount = verdicts.filter(({ matchedRuleIndex }) => matchedRuleIndex === 0).length;
  const unwantedCount = verdicts.filter(({ packet }) => !packet.isWanted).length;
  const { unwantedAllowedCount } = summariseVerdicts(verdicts);
  return `Rule 1 decides ${firstRuleCount} of ${verdicts.length} packets. Unwanted packets let in: ${unwantedAllowedCount} of ${unwantedCount}.`;
}

function describeRightResults(config: FirewallRulesConfig): string {
  const { verdicts } = evaluateFirewall(config);
  const { rightResultCount } = summariseVerdicts(verdicts);
  return `${config.ruleOrderName}. Default deny ${describeSwitchState(config.isDefaultDenyEnabled)}. Right results: ${rightResultCount} of ${verdicts.length}.`;
}

function describeWebPackets(config: FirewallRulesConfig): string {
  const { verdicts } = evaluateFirewall(config);
  const webAllowedCount = verdicts.filter(({ packet, isAllowed }) => packet.port === WEB_PORT && isAllowed).length;
  return `Packets on port ${WEB_PORT} let in: ${webAllowedCount}. The firewall cannot see what is inside them.`;
}

function isBestSetup({ ruleOrderName, isDefaultDenyEnabled }: FirewallRulesConfig): boolean {
  return ruleOrderName === RULE_ORDER_NAME_BY_KEY.allowOfficeThenBlock && isDefaultDenyEnabled;
}

export const FIREWALL_RULES_LESSON_STEPS: readonly LessonStep<FirewallRulesConfig>[] = [
  {
    title: "Watch the packets",
    explanationLines: [
      "A firewall is a list of rules. It stands in front of a server.",
      "Each packet walks down the list. The first rule that matches decides.",
      "Green rows allow. Red rows deny.",
    ],
    taskText: "Click the picture. Watch each packet walk down the rules.",
    describeLiveFact: describeAllowedCount,
  },
  {
    title: "Swap two rules",
    explanationLines: [
      "Rule 1 lets the office network use port 22. Rule 2 blocks port 22 for all senders.",
      "Swap them. The block rule is now first.",
      "The admin packet matches the block rule first. It never reaches the allow rule.",
    ],
    taskText: `Set Rule order to ${RULE_ORDER_NAME_BY_KEY.blockThenAllowOffice}.`,
    isTaskDone: ({ ruleOrderName }) => ruleOrderName === RULE_ORDER_NAME_BY_KEY.blockThenAllowOffice,
    describeLiveFact: describeAdminPacket,
  },
  {
    title: "Set a default",
    explanationLines: [
      "Some packets match no rule. The default rule decides about them.",
      "Default allow lets them in. Default deny blocks them.",
      "Attackers use ports that you did not plan for.",
    ],
    taskText: `Set Rule order to ${RULE_ORDER_NAME_BY_KEY.allowOfficeThenBlock}. Turn on Default deny.`,
    isTaskDone: isBestSetup,
    describeLiveFact: describeDefaultEffect,
  },
  {
    title: "Real world",
    explanationLines: [
      "Many real firewalls work this way. Linux iptables is one example.",
      "Put an allow-all rule first. It matches every packet. The rules below it never run.",
      "Admins make this mistake in real networks.",
    ],
    taskText: `Set Rule order to ${RULE_ORDER_NAME_BY_KEY.allowAllFirst}.`,
    isTaskDone: ({ ruleOrderName }) => ruleOrderName === RULE_ORDER_NAME_BY_KEY.allowAllFirst,
    describeLiveFact: describeFirstRuleShare,
  },
  {
    title: "Compare setups",
    explanationLines: [
      "Try each rule order. Watch the right results number.",
      "Then turn Default deny on and off. Compare again.",
      "Only one setup gets all packets right.",
    ],
    taskText: "Find the setup where all 6 packets get the right result.",
    isTaskDone: (config) => {
      const { verdicts } = evaluateFirewall(config);
      return summariseVerdicts(verdicts).rightResultCount === verdicts.length;
    },
    describeLiveFact: describeRightResults,
  },
  {
    title: "Limits and defence",
    explanationLines: [
      "A firewall reads only the sender and the port. It does not read the data inside the packet.",
      "An attack on port 443 looks like a normal web request. Rule 3 lets it in.",
      "Use default deny. Keep the list short. Add other defences, such as updates and a web application firewall.",
    ],
    taskText: `Use the best setup: ${RULE_ORDER_NAME_BY_KEY.allowOfficeThenBlock} with Default deny on.`,
    isTaskDone: isBestSetup,
    describeLiveFact: describeWebPackets,
  },
];

export const FIREWALL_RULES_GLOSSARY_ENTRIES: readonly GlossaryEntry[] = [
  { term: "Firewall", meaning: "A program that checks each packet. It lets the packet pass or blocks it." },
  { term: "Packet", meaning: "A small piece of data that moves across a network." },
  { term: "Port", meaning: "A number on a server. Each service uses one port. Web pages use port 443." },
  { term: "Rule", meaning: "One line in the firewall list. It allows or denies one sender and one port." },
  { term: "First match", meaning: "The firewall stops at the first rule that fits. It does not read the rules below." },
  { term: "Default rule", meaning: "The last line. It decides about packets that match no other rule." },
  { term: "Default deny", meaning: "The default rule blocks every packet that no rule allows." },
  { term: "SSH", meaning: "A way to control a server from far away. Only admins need it." },
  { term: "RDP, Telnet", meaning: "Old ways to control a computer from far away. Attackers scan for them." },
];
