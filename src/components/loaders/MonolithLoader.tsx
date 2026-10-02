import type { DomLoaderProps } from "./DomLoaderDemo";
import { LoaderStage, TaglineText } from "./LoaderStage";

export function MonolithLoader({ durationMilliseconds }: DomLoaderProps) {
  return (
    <LoaderStage durationMilliseconds={durationMilliseconds}>
      <div className="monolith-panel" />
      <div className="loader-center monolith-text">
        <TaglineText />
      </div>
    </LoaderStage>
  );
}
