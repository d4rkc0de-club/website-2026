"use client";

import { TERMINAL_DEMO_LINES, TERMINAL_DEMO_TITLE } from "@/content/componentDemoContent";
import { Configurable } from "./Configurable";
import { TerminalCard } from "./TerminalCard";
import { TERMINAL_CARD_CONTROLS } from "./controls/terminalCardControls";

export function TerminalCardDemo() {
  return (
    <Configurable controls={TERMINAL_CARD_CONTROLS}>
      {(config) => (
        <div className="mx-auto flex min-h-full max-w-2xl items-center p-6">
          <div className="w-full">
            <TerminalCard config={config} title={TERMINAL_DEMO_TITLE} lines={TERMINAL_DEMO_LINES} />
          </div>
        </div>
      )}
    </Configurable>
  );
}
