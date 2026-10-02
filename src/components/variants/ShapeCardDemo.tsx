"use client";

import { SHAPE_CARD_BODY, SHAPE_CARD_LABEL, SHAPE_CARD_TITLE } from "@/content/componentDemoContent";
import { Configurable } from "./Configurable";
import { ShapeCard } from "./ShapeCard";
import { SHAPE_CARD_CONTROLS } from "./controls/shapeCardControls";

export function ShapeCardDemo() {
  return (
    <Configurable controls={SHAPE_CARD_CONTROLS}>
      {(config) => (
        <div className="flex min-h-full items-center justify-center p-6">
          <ShapeCard config={config}>
            <p className="font-mono text-[11px] uppercase tracking-widest text-mid">{SHAPE_CARD_LABEL}</p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-paper">{SHAPE_CARD_TITLE}</h2>
            <p className="text-sm text-light">{SHAPE_CARD_BODY}</p>
          </ShapeCard>
        </div>
      )}
    </Configurable>
  );
}
