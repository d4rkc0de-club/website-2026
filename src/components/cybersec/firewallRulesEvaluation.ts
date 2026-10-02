import {
  FIREWALL_PACKETS,
  FIREWALL_RULES,
  type FirewallPacket,
  type FirewallRule,
} from "@/content/cybersecContent";
import { RULE_ORDER_NAME_BY_KEY, type FirewallRulesConfig } from "./controls/firewallRulesControls";

export type PacketVerdict = {
  packet: FirewallPacket;
  matchedRuleIndex: number;
  isDefaultRule: boolean;
  isAllowed: boolean;
  isCorrect: boolean;
};

export type VerdictSummary = {
  rightResultCount: number;
  unwantedAllowedCount: number;
  wantedBlockedCount: number;
};

const RULES_BY_ORDER_NAME: Record<FirewallRulesConfig["ruleOrderName"], readonly FirewallRule[]> = {
  [RULE_ORDER_NAME_BY_KEY.allowOfficeThenBlock]: [
    FIREWALL_RULES.officeSsh,
    FIREWALL_RULES.blockSsh,
    FIREWALL_RULES.allowHttps,
    FIREWALL_RULES.allowHttp,
  ],
  [RULE_ORDER_NAME_BY_KEY.blockThenAllowOffice]: [
    FIREWALL_RULES.blockSsh,
    FIREWALL_RULES.officeSsh,
    FIREWALL_RULES.allowHttps,
    FIREWALL_RULES.allowHttp,
  ],
  [RULE_ORDER_NAME_BY_KEY.allowAllFirst]: [
    FIREWALL_RULES.allowEverything,
    FIREWALL_RULES.officeSsh,
    FIREWALL_RULES.blockSsh,
    FIREWALL_RULES.allowHttps,
    FIREWALL_RULES.allowHttp,
  ],
  [RULE_ORDER_NAME_BY_KEY.webRulesOnly]: [FIREWALL_RULES.allowHttps, FIREWALL_RULES.allowHttp],
};

function ruleMatchesPacket(rule: FirewallRule, packet: FirewallPacket): boolean {
  const isSourceMatch = rule.source === "any" || rule.source === packet.source;
  const isPortMatch = rule.port === "any" || rule.port === packet.port;
  return isSourceMatch && isPortMatch;
}

export function evaluateFirewall({ ruleOrderName, isDefaultDenyEnabled }: FirewallRulesConfig): {
  rules: readonly FirewallRule[];
  verdicts: readonly PacketVerdict[];
} {
  const defaultRule: FirewallRule = {
    id: "default",
    action: isDefaultDenyEnabled ? "deny" : "allow",
    source: "any",
    port: "any",
  };
  const rules = [...RULES_BY_ORDER_NAME[ruleOrderName], defaultRule];
  const verdicts = FIREWALL_PACKETS.map((packet) => {
    const matchedRuleIndex = rules.findIndex((rule) => ruleMatchesPacket(rule, packet));
    const isAllowed = rules[matchedRuleIndex].action === "allow";
    return {
      packet,
      matchedRuleIndex,
      isDefaultRule: matchedRuleIndex === rules.length - 1,
      isAllowed,
      isCorrect: isAllowed === packet.isWanted,
    };
  });
  return { rules, verdicts };
}

export function summariseVerdicts(verdicts: readonly PacketVerdict[]): VerdictSummary {
  return {
    rightResultCount: verdicts.filter(({ isCorrect }) => isCorrect).length,
    unwantedAllowedCount: verdicts.filter(({ isAllowed, packet }) => isAllowed && !packet.isWanted).length,
    wantedBlockedCount: verdicts.filter(({ isAllowed, packet }) => !isAllowed && packet.isWanted).length,
  };
}
