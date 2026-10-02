"use client";

import { GlyphCanvas, type GlyphCanvasProps } from "@/components/hero/GlyphCanvas";

type GlyphStageProps<Scene> = GlyphCanvasProps<Scene> & { hintText: string };

export function GlyphStage<Scene>({ hintText, ...canvasProps }: GlyphStageProps<Scene>) {
  return (
    <div className="absolute inset-0">
      <GlyphCanvas {...canvasProps} />
      <p className="pointer-events-none absolute bottom-3 left-4 right-4 font-mono text-[11px] uppercase tracking-widest text-mid">
        {hintText}
      </p>
    </div>
  );
}
