import type { DomLoaderProps } from "./DomLoaderDemo";
import { LoaderStage, TaglineText } from "./LoaderStage";

export function CounterSwapLoader({ durationMilliseconds }: DomLoaderProps) {
  return (
    <LoaderStage durationMilliseconds={durationMilliseconds}>
      <div className="loader-center">
        <div className="counter-clip">
          <div className="counter-number" aria-hidden="true" />
        </div>
      </div>
      <div className="loader-center">
        <div className="counter-clip">
          <TaglineText className="counter-tagline" />
        </div>
      </div>
      <div className="counter-bar" />
    </LoaderStage>
  );
}
