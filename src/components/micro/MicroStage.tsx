import type { ReactNode } from "react";
import "./micro.css";

type MicroStageProps = {
  children: ReactNode;
};

export function MicroStage({ children }: MicroStageProps) {
  return <div className="grid min-h-full place-items-center p-10">{children}</div>;
}
