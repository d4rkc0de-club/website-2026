export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function progressBetween(
  value: number,
  startValue: number,
  endValue: number,
): number {
  return clamp((value - startValue) / (endValue - startValue), 0, 1);
}

export function smoothStep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

const OVERSHOOT_STRENGTH = 1.5;

export function lerp(startValue: number, endValue: number, share: number): number {
  return startValue + (endValue - startValue) * share;
}

export function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

export function easeOutBack(progress: number): number {
  const cubicStrength = OVERSHOOT_STRENGTH + 1;
  const remaining = progress - 1;
  return 1 + cubicStrength * remaining ** 3 + OVERSHOOT_STRENGTH * remaining ** 2;
}
