import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import type { LoaderControls } from "./loaderControls";

export type LoaderDefinition<Scene> = {
  controls: LoaderControls;
  createScene: (metrics: GlyphMetrics) => Scene;
  drawScene: (scene: Scene, frame: GlyphFrame, progress: number) => void;
};
