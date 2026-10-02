import type { CSSProperties, ReactNode } from "react";
import { HERO_SLOGAN_LEAD, HERO_SLOGAN_TAIL } from "@/content/heroContent";
import { MILLISECONDS_PER_SECOND } from "@/lib/timeUnits";
import type { DomLoaderProps } from "./DomLoaderDemo";
import "./loaders.css";

type LoaderStageProps = DomLoaderProps & {
  children: ReactNode;
};

type TaglineTextProps = {
  className?: string;
};

export function LoaderStage({ durationMilliseconds, children }: LoaderStageProps) {
  const stageStyle = {
    "--loader-duration": `${durationMilliseconds / MILLISECONDS_PER_SECOND}s`,
  } as CSSProperties;

  return (
    <div className="loader-stage" style={stageStyle}>
      {children}
    </div>
  );
}

export function TaglineText({ className = "" }: TaglineTextProps) {
  return (
    <p className={`loader-tagline ${className}`}>
      <span className="block">{HERO_SLOGAN_LEAD}</span>
      <span className="loader-tagline-tail block">{HERO_SLOGAN_TAIL}</span>
    </p>
  );
}
