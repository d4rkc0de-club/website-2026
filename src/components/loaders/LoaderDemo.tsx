"use client";

import { useState } from "react";
import { GlyphCanvas } from "@/components/hero/GlyphCanvas";
import { Configurable } from "@/components/variants/Configurable";
import { loaderProgress } from "@/lib/ascii/loaderProgress";
import type { LoaderDefinition } from "./loaderDefinition";
import { ReplayButton } from "./ReplayButton";

type LoaderDemoProps<Scene> = {
  loader: LoaderDefinition<Scene>;
};

export function LoaderDemo<Scene>({ loader }: LoaderDemoProps<Scene>) {
  const [replayCount, setReplayCount] = useState(0);

  return (
    <Configurable controls={loader.controls}>
      {(config) => (
        <>
          <GlyphCanvas
            key={replayCount}
            createScene={loader.createScene}
            drawScene={(scene, frame) =>
              loader.drawScene(scene, frame, loaderProgress(frame, config.durationMilliseconds))
            }
            wideFontSizePixels={config.fontSizePixels}
            narrowFontSizePixels={config.fontSizePixels}
          />
          <ReplayButton onReplay={() => setReplayCount((previousCount) => previousCount + 1)} />
        </>
      )}
    </Configurable>
  );
}
