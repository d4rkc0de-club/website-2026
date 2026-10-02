export type FaceAccessory = {
  lines: readonly string[];
  centerShare: number;
  widthShare: number;
};

export const FACE_ACCESSORIES = {
  glasses: {
    lines: [".---. .---.", "|   |-|   |", "'---' '---'"],
    centerShare: 0.4,
    widthShare: 0.56,
  },
  shades: {
    lines: [".---. .---.", "|###|-|###|", "'---' '---'"],
    centerShare: 0.4,
    widthShare: 0.56,
  },
  beanie: {
    lines: ["    .---.    ", "  .'     '.  ", " /  D4RK    \\", "'-----------'"],
    centerShare: 0.15,
    widthShare: 0.6,
  },
  headphones: {
    lines: [
      "  .-------.  ",
      " /         \\ ",
      "|           |",
      "[#]       [#]",
      "[#]       [#]",
    ],
    centerShare: 0.36,
    widthShare: 0.8,
  },
} as const satisfies Record<string, FaceAccessory>;

export type FaceAccessoryName = keyof typeof FACE_ACCESSORIES;
