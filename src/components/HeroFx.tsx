"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyPost,
  FX_DEFAULTS,
  FX_LABELS,
  FX_ORDER,
  PFX_BUDGET_IDLE,
  PFX_HEAVY,
  PFX_HEAVY_MAX,
  PFX_HEAVY_MIN,
  PFX_TIME,
  PFX_TUNED_W,
  type FxKey,
  type FxState,
} from "@/lib/postfx";

const RAMP = " .:-=+*#%@";
const ACCENT = "31,201,93";
const HOT = "250,250,250";

const PROMPT = "root@d4rkc0de:~#";
const HEAD_1 = "a single vulnerability";
const HEAD_2 = "is all it takes.";

function initialState(): FxState {
  const s = {} as FxState;
  for (const k of FX_ORDER) s[k] = { on: false, val: FX_DEFAULTS[k] };
  s.vignette.on = true;
  s.scanlines.on = true;
  s.charbloom.on = true;
  return s;
}

function paintText(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
  c.textAlign = "center";
  c.textBaseline = "middle";

  const avail = w * 0.9;
  const headSize = Math.max(14, Math.min(avail / (HEAD_1.length * 0.602), h * 0.24));
  const promptSize = Math.max(10, headSize * 0.32);
  const cx = w / 2;
  const cy = h * 0.5;
  const gap = headSize * 1.28;

  c.fillStyle = `rgb(${ACCENT})`;
  c.font = `500 ${promptSize}px monospace`;
  c.fillText(PROMPT, cx, cy - gap - promptSize * 0.75);

  c.fillStyle = "#fafafa";
  c.font = `800 ${headSize}px monospace`;
  c.fillText(HEAD_1, cx, cy - gap * 0.45);
  c.fillText(HEAD_2, cx, cy + gap * 0.45);
}

function buildSource(
  w: number,
  h: number,
  cellW: number,
  cellH: number,
  cols: number,
  rows: number,
): Float32Array {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const c = off.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(cols * rows);
  if (!c) return out;

  paintText(c, w, h);

  const img = c.getImageData(0, 0, w, h).data;

  for (let ry = 0; ry < rows; ry++) {
    const y0 = ry * cellH;
    const y1 = Math.min(y0 + cellH, h);
    for (let rx = 0; rx < cols; rx++) {
      const x0 = rx * cellW;
      const x1 = Math.min(x0 + cellW, w);
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * w + x) * 4;
          sum +=
            img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114;
          n++;
        }
      }
      out[ry * cols + rx] = n ? sum / n / 255 : 0;
    }
  }
  return out;
}

export default function HeroFx() {
  const [state, setState] = useState<FxState>(initialState);
  const [asciiOn, setAsciiOn] = useState(true);
  const stateRef = useRef<FxState>(state);
  const asciiRef = useRef(asciiOn);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    asciiRef.current = asciiOn;
  }, [asciiOn]);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    const maybeBox = boxRef.current;
    if (!maybeCanvas || !maybeBox) return;
    const maybeCtx = maybeCanvas.getContext("2d");
    const ascii = document.createElement("canvas");
    const maybeActx = ascii.getContext("2d");
    if (!maybeCtx || !maybeActx) return;

    const canvas: HTMLCanvasElement = maybeCanvas;
    const box: HTMLDivElement = maybeBox;
    const ctx: CanvasRenderingContext2D = maybeCtx;
    const actx: CanvasRenderingContext2D = maybeActx;

    let src: Float32Array | null = null;
    let boxW = box.clientWidth;
    let boxH = box.clientHeight;
    let cw = 0;
    let ch = 0;
    let cellW = 6;
    let cellH = 10;
    let cols = 0;
    let rows = 0;
    let heavyBudget = PFX_HEAVY_MAX;
    let fxMs = 0;
    let fxFrames = 0;
    let lastAscii = 0;
    let lastState: FxState | null = null;
    let lastAsciiOn = asciiRef.current;
    let dirty = false;
    let drewOnce = false;
    let visible = true;
    let raf = 0;

    function ensure() {
      if (!boxW || !boxH) return false;
      const isMobile = window.innerWidth <= 860;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
      const st = stateRef.current;
      const heavy = PFX_HEAVY.some((k) => st[k].on);
      const budget = heavy ? heavyBudget : PFX_BUDGET_IDLE;
      const fit = Math.min(1, Math.sqrt(budget / (boxW * dpr * boxH * dpr)));
      const tw = Math.max(1, Math.round(boxW * dpr * fit));
      const th = Math.max(1, Math.round(boxH * dpr * fit));
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      cw = tw;
      ch = th;
      if (ascii.width !== tw || ascii.height !== th) {
        ascii.width = tw;
        ascii.height = th;
        const scale = tw / boxW;
        cellW = Math.max(4, Math.round(6 * scale));
        cellH = Math.max(6, Math.round(10 * scale));
        cols = Math.ceil(tw / cellW);
        rows = Math.ceil(th / cellH);
        src = buildSource(tw, th, cellW, cellH, cols, rows);
        dirty = true;
      }
      return true;
    }

    function drawSource(t: number) {
      if (asciiRef.current) {
        drawAscii(t);
      } else {
        paintText(actx, cw, ch);
      }
    }

    function drawAscii(t: number) {
      if (!src) return;
      actx.fillStyle = "#000";
      actx.fillRect(0, 0, cw, ch);
      actx.font = `${cellH}px monospace`;
      actx.textAlign = "left";
      actx.textBaseline = "top";
      const limit = RAMP.length;
      for (let ry = 0; ry < rows; ry++) {
        const y = ry * cellH;
        for (let rx = 0; rx < cols; rx++) {
          const base = src[ry * cols + rx];
          if (base < 0.06) continue;
          const shimmer =
            0.74 + 0.26 * Math.sin(t * 1.7 + rx * 0.23 + ry * 0.15);
          const lum = base * shimmer;
          if (lum < 0.05) continue;
          let idx = Math.floor(lum * limit);
          if (idx >= limit) idx = limit - 1;
          const glyph = RAMP[idx];
          if (glyph === " ") continue;
          const a = (0.3 + 0.7 * lum).toFixed(3);
          actx.fillStyle =
            lum > 0.92 ? `rgba(${HOT},${a})` : `rgba(${ACCENT},${a})`;
          actx.fillText(glyph, rx * cellW, y);
        }
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const st = stateRef.current;
      const heavy = PFX_HEAVY.some((k) => st[k].on);
      const timeFx = PFX_TIME.some((k) => st[k].on);
      const asciiOnNow = asciiRef.current;
      const changed = st !== lastState || asciiOnNow !== lastAsciiOn;
      lastState = st;
      lastAsciiOn = asciiOnNow;
      if (!ensure()) return;

      const asciiDue = now - lastAscii > 90;
      if (!asciiDue && !timeFx && !changed && !dirty && drewOnce) return;

      if (asciiDue || changed || dirty) {
        lastAscii = now;
        drawSource(now / 1000);
      }
      dirty = false;

      ctx.drawImage(ascii, 0, 0, cw, ch);
      const fxStart = performance.now();
      applyPost(ctx, cw, ch, st, cw / PFX_TUNED_W);

      if (heavy) {
        fxMs = fxMs * 0.85 + (performance.now() - fxStart) * 0.15;
        if (++fxFrames >= 20) {
          fxFrames = 0;
          if (fxMs > 12) heavyBudget = Math.max(PFX_HEAVY_MIN, heavyBudget * 0.7);
          else if (fxMs < 6)
            heavyBudget = Math.min(PFX_HEAVY_MAX, heavyBudget * 1.2);
        }
      }
      drewOnce = true;
    }

    const ro = new ResizeObserver(() => {
      boxW = box.clientWidth;
      boxH = box.clientHeight;
    });
    ro.observe(box);

    const io = new IntersectionObserver(
      (e) => {
        visible = e[0].isIntersecting;
      },
      { threshold: 0.01 },
    );
    io.observe(box);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const toggle = (k: FxKey) =>
    setState((s) => ({ ...s, [k]: { ...s[k], on: !s[k].on } }));
  const setVal = (k: FxKey, v: number) =>
    setState((s) => ({ ...s, [k]: { ...s[k], val: v } }));

  return (
    <section className="bg-stage">
      <div
        ref={boxRef}
        className="relative min-h-[62vh] w-full overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        />
        <h1 className="sr-only">
          {PROMPT} {HEAD_1} {HEAD_2}
        </h1>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <p className="font-mono text-sm text-accent">
              root@d4rkc0de:~/post-fx#
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-pressed={asciiOn}
                aria-label="Toggle ASCII text rendering"
                onClick={() => setAsciiOn((v) => !v)}
                className={`relative h-[19px] w-[38px] shrink-0 border transition-colors ${
                  asciiOn
                    ? "border-accent bg-accent"
                    : "border-line bg-transparent"
                }`}
              >
                <span
                  className={`absolute top-[3px] block h-[13px] w-[13px] transition-all duration-200 ${
                    asciiOn ? "left-[22px] bg-black" : "left-[3px] bg-foreground"
                  }`}
                />
              </button>
              <span className="font-mono text-sm text-foreground opacity-70">
                ascii
              </span>
              <span className="hidden font-mono text-xs text-muted sm:inline">
                14 effects · live
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-x-10 gap-y-[18px] sm:grid-cols-2">
            {FX_ORDER.map((k) => {
              const on = state[k].on;
              const val = state[k].val;
              const label = FX_LABELS[k];
              return (
                <div key={k} className="group flex items-center gap-[17px]">
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Toggle ${label}`}
                    onClick={() => toggle(k)}
                    className={`relative h-[19px] w-[38px] shrink-0 border transition-colors ${
                      on
                        ? "border-accent bg-accent"
                        : "border-line bg-transparent"
                    }`}
                  >
                    <span
                      className={`absolute top-[3px] block h-[13px] w-[13px] transition-all duration-200 ${
                        on ? "left-[22px] bg-black" : "left-[3px] bg-foreground"
                      }`}
                    />
                  </button>

                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground opacity-70 transition-opacity group-hover:opacity-95 sm:text-[15px]">
                    {label}
                  </span>

                  <div
                    className="relative h-[9px] w-[130px] shrink-0"
                    style={{ display: on ? "block" : "none" }}
                  >
                    <span
                      className="absolute inset-x-0 top-[3px] block h-[3px]"
                      style={{ background: "rgba(255,255,255,0.12)" }}
                    />
                    <span
                      className="absolute left-0 top-[3px] block h-[3px] bg-foreground"
                      style={{ width: `${val}%` }}
                    />
                    <span
                      className="absolute top-0 block h-[9px] w-[9px] bg-foreground"
                      style={{ left: `calc(${val}% - 4.5px)` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={val}
                      aria-label={`${label} intensity`}
                      onChange={(e) => setVal(k, Number(e.target.value))}
                      className="absolute left-0 top-[-8px] h-[25px] w-full cursor-pointer appearance-none bg-transparent opacity-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
