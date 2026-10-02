export const THREAD_NAMES = ["A", "B"] as const;

export type ThreadName = (typeof THREAD_NAMES)[number];

export const STEPS_PER_THREAD = 3;

function countSetBits(value: number): number {
  return value.toString(2).split("1").length - 1;
}

function buildThreadInterleavings(stepsPerThread: number): ThreadName[][] {
  const totalStepCount = stepsPerThread * THREAD_NAMES.length;
  const interleavings: ThreadName[][] = [];
  for (let threadAStepMask = 0; threadAStepMask < 2 ** totalStepCount; threadAStepMask++) {
    if (countSetBits(threadAStepMask) !== stepsPerThread) continue;
    interleavings.push(
      Array.from({ length: totalStepCount }, (_, position) =>
        (threadAStepMask >> position) & 1 ? "A" : "B",
      ),
    );
  }
  return interleavings;
}

export const THREAD_INTERLEAVINGS = buildThreadInterleavings(STEPS_PER_THREAD);
