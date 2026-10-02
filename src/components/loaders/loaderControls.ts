import { defineControls, slider, type ConfigOf } from "@/lib/variantControls";

const DURATION_CONTROL = slider("durationMilliseconds", "Duration (ms)", 1500, 2000, 50, 1750);

export const DURATION_ONLY_LOADER_CONTROLS = defineControls([DURATION_CONTROL]);

export function createLoaderControls(defaultFontSizePixels: number) {
  return defineControls([
    DURATION_CONTROL,
    slider("fontSizePixels", "Font size (px)", 8, 40, 1, defaultFontSizePixels),
  ]);
}

export type LoaderControls = ReturnType<typeof createLoaderControls>;

export type LoaderConfig = ConfigOf<LoaderControls>;
