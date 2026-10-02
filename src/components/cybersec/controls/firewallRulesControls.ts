import { defineControls, select, toggle, type ConfigOf } from "@/lib/variantControls";

export const RULE_ORDER_NAME_BY_KEY = {
  allowOfficeThenBlock: "Allow office, then block",
  blockThenAllowOffice: "Block, then allow office",
  allowAllFirst: "Allow all first",
  webRulesOnly: "Web rules only",
} as const;

const RULE_ORDER_NAMES = Object.values(RULE_ORDER_NAME_BY_KEY);

export const FIREWALL_RULES_CONTROLS = defineControls([
  select("ruleOrderName", "Rule order", RULE_ORDER_NAMES, RULE_ORDER_NAME_BY_KEY.allowOfficeThenBlock),
  toggle("isDefaultDenyEnabled", "Default deny", false),
]);

export type FirewallRulesConfig = ConfigOf<typeof FIREWALL_RULES_CONTROLS>;
