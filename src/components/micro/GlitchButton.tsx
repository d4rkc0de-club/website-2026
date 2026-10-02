import { MICRO_BUTTON_CLASS } from "./microStyles";

const BUTTON_LABEL = "Access";

export function GlitchButton() {
  return (
    <button type="button" data-label={BUTTON_LABEL} className={`${MICRO_BUTTON_CLASS} micro-glitch`}>
      {BUTTON_LABEL}
    </button>
  );
}
