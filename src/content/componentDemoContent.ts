import type { TerminalLine } from "@/components/variants/TerminalCard";

export const REVEAL_DEMO_HINT = "Scroll down. Glyphs cover each card. They clear as the card rises.";

export const REVEAL_DEMO_LINK_TEXT = "We play CTFs. See our team on CTFtime.";

export const REVEAL_DEMO_BAR_HEIGHTS = [30, 55, 40, 80, 65, 95, 70, 110] as const;

export const TERMINAL_DEMO_TITLE = "ctf@d4rkc0de: ~/pwn/warmup";

export const TERMINAL_DEMO_LINES: readonly TerminalLine[] = [
  [
    { text: "$ ", tone: "prompt" },
    { text: "nc challenge.d4rkc0de.local 1337", tone: "command" },
  ],
  [
    { text: "[*] ", tone: "info" },
    { text: "Connected to the target.", tone: "output" },
  ],
  [
    { text: "[!] ", tone: "warning" },
    { text: "Stack canary found.", tone: "output" },
  ],
  [
    { text: "[+] ", tone: "success" },
    { text: "Canary leaked: ", tone: "output" },
    { text: "0x8f3a1c00", tone: "info" },
  ],
  [
    { text: "[-] ", tone: "error" },
    { text: "Wrong offset. The program crashed.", tone: "output" },
  ],
  [
    { text: "[+] ", tone: "success" },
    { text: "Shell open.", tone: "output" },
  ],
  [
    { text: "$ ", tone: "prompt" },
    { text: "cat flag.txt", tone: "command" },
  ],
  [{ text: "d4rk{you_found_it}", tone: "success" }],
  [{ text: "$ ", tone: "prompt" }],
];

export const SHAPE_CARD_LABEL = "d4rkc0de";

export const SHAPE_CARD_TITLE = "Cut and round";

export const SHAPE_CARD_BODY =
  "Use the controls. Clip a corner. Round a corner. Change the size of each cut.";

export const HEX_XRAY_PARAGRAPH =
  "A computer does not read letters. It reads bytes. Each letter is one number. The letter A is 65. Move the lens over this text. You see the bytes under the letters. A hacker reads the bytes and not the letters. Look close. A flag can hide in plain text: d4rk{x_ray_eyes}. Move the lens away. The letters come back.";

export const HASH_AVALANCHE_DEFAULT_TEXT = "d4rkc0de";

export const HASH_AVALANCHE_INPUT_LABEL = "Type text. Change one letter. Watch the bits.";

export const FLAG_LOCK_PREFIX = "d4rk{";

export const FLAG_LOCK_SUFFIX = "}";

export const FLAG_LOCK_BODY = "you_found_it";

export const FLAG_LOCK_HINT = "Hint: the Terminal Card demo has the flag.";

export const WORM_SPREAD_HINT = "Click a node to infect it. Right-click a node to patch it.";

export const PENDULUM_SENTENCE_LINES: readonly (readonly string[])[] = [
  ["A", "PRINTED"],
  ["SENTENCE", "HAS"],
  ["LEFT", "THE", "PAGE"],
];

export const PENDULUM_HINT =
  "Move the cursor across a word. Click to push. Drag and let go. Arrow keys select. Space pushes. Shift and Space push back.";

export const LOOM_WORD = "D4RKC0DE";

export const LOOM_PROGRESS_LABEL = "WOVEN";

export const LOOM_HINT =
  "Move the shuttle. Click to weave one row. Drag to weave more. Arrow keys move. Space weaves the row.";

export const SHADOW_PUPPET_LINES = ["LOOK", "CLOSER"];

export const SHADOW_PUPPET_HINT =
  "Move the cursor to move the light. Click to freeze. Hold and move up or down to change the light distance. Arrow keys move. Space freezes.";

export const WOVEN_WORD = "WOVEN";

export const WOVEN_HORIZONTAL_THREAD_TEXT = "WEFT·CARRIES·ONE·SENTENCE·";

export const WOVEN_VERTICAL_THREAD_TEXT = "WARP·CARRIES·ANOTHER·";

export const WOVEN_HINT =
  "Move over a strand to lift it. Click to reverse a crossing. Drag to pull a strand. Arrow keys move. Space reverses. Shift and arrow pull.";

export const STENCIL_LINES = ["BELOW", "THE", "SURFACE"];

export const STENCIL_HINT =
  "Move the cutter. Click to cut. Drag to cut a line. Arrow keys move. Shift and arrow cut a line. Space cuts. R restores.";
