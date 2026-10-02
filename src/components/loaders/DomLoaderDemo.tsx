"use client";

import { useState, type ComponentType } from "react";
import { Configurable } from "@/components/variants/Configurable";
import { DURATION_ONLY_LOADER_CONTROLS } from "./loaderControls";
import { ReplayButton } from "./ReplayButton";

export type DomLoaderProps = {
  durationMilliseconds: number;
};

type DomLoaderDemoProps = {
  Loader: ComponentType<DomLoaderProps>;
};

export function DomLoaderDemo({ Loader }: DomLoaderDemoProps) {
  const [replayCount, setReplayCount] = useState(0);

  return (
    <Configurable controls={DURATION_ONLY_LOADER_CONTROLS}>
      {(config) => (
        <>
          <Loader key={replayCount} durationMilliseconds={config.durationMilliseconds} />
          <ReplayButton onReplay={() => setReplayCount((previousCount) => previousCount + 1)} />
        </>
      )}
    </Configurable>
  );
}
