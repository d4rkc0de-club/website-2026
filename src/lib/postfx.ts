export type FxKey =
  | "vignette"
  | "scanlines"
  | "crt"
  | "chromatic"
  | "bloom"
  | "charbloom"
  | "filmgrain"
  | "glitch"
  | "rgbsplit"
  | "blur"
  | "halftone"
  | "pixelate"
  | "filmdust"
  | "coloroverlay";

export type FxState = Record<FxKey, { on: boolean; val: number }>;

export const FX_ORDER: FxKey[] = [
  "vignette",
  "scanlines",
  "crt",
  "chromatic",
  "bloom",
  "charbloom",
  "filmgrain",
  "glitch",
  "rgbsplit",
  "blur",
  "halftone",
  "pixelate",
  "filmdust",
  "coloroverlay",
];

export const FX_LABELS: Record<FxKey, string> = {
  vignette: "Vignette",
  scanlines: "Scan Lines",
  crt: "CRT Curvature",
  chromatic: "Chromatic Abr.",
  bloom: "Bloom",
  charbloom: "Character Bloom",
  filmgrain: "Film Grain",
  glitch: "Glitch",
  rgbsplit: "RGB Split",
  blur: "Blur",
  halftone: "Halftone",
  pixelate: "Pixelate",
  filmdust: "Film Dust",
  coloroverlay: "Color Overlay",
};

export const FX_DEFAULTS: Record<FxKey, number> = {
  vignette: 50,
  scanlines: 50,
  crt: 50,
  chromatic: 50,
  bloom: 60,
  charbloom: 60,
  filmgrain: 40,
  glitch: 50,
  rgbsplit: 50,
  blur: 30,
  halftone: 50,
  pixelate: 40,
  filmdust: 40,
  coloroverlay: 30,
};

export const PFX_HEAVY: FxKey[] = [
  "bloom",
  "charbloom",
  "chromatic",
  "rgbsplit",
  "crt",
  "filmgrain",
  "glitch",
  "halftone",
];

export const PFX_TIME: FxKey[] = ["glitch", "filmgrain", "filmdust"];

export const PFX_TUNED_W = 640;
export const PFX_BUDGET_IDLE = 2400000;
export const PFX_HEAVY_MAX = 920000;
export const PFX_HEAVY_MIN = 229000;

type Scratch = {
  bloomOff: HTMLCanvasElement;
  bloomBlur: HTMLCanvasElement;
  blurOff: HTMLCanvasElement;
  pixOff: HTMLCanvasElement;
  htOff: HTMLCanvasElement;
  bloomCtx: CanvasRenderingContext2D;
  blurCtx2: CanvasRenderingContext2D;
  blurOffCtx: CanvasRenderingContext2D;
  pixCtx: CanvasRenderingContext2D;
  htCtx: CanvasRenderingContext2D;
};

let scratch: Scratch | null = null;

function S(): Scratch {
  if (!scratch) {
    const bloomOff = document.createElement("canvas");
    const bloomBlur = document.createElement("canvas");
    const blurOff = document.createElement("canvas");
    const pixOff = document.createElement("canvas");
    const htOff = document.createElement("canvas");
    scratch = {
      bloomOff,
      bloomBlur,
      blurOff,
      pixOff,
      htOff,
      bloomCtx: bloomOff.getContext("2d")!,
      blurCtx2: bloomBlur.getContext("2d")!,
      blurOffCtx: blurOff.getContext("2d")!,
      pixCtx: pixOff.getContext("2d")!,
      htCtx: htOff.getContext("2d")!,
    };
  }
  return scratch;
}

function _resize(c: HTMLCanvasElement, w: number, h: number) {
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
}

type Ctx = CanvasRenderingContext2D;

function pfxVignette(ctx: Ctx, w: number, h: number, intensity: number) {
  const cx = w / 2,
    cy = h / 2,
    r = Math.max(w, h) * 0.7;
  const g = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function pfxScanLines(
  ctx: Ctx,
  w: number,
  h: number,
  intensity: number,
  spacing: number,
) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${intensity * 0.6})`;
  for (let y = 0; y < h; y += spacing) ctx.fillRect(0, y, w, 1);
  ctx.restore();
}

function pfxBloom(
  ctx: Ctx,
  w: number,
  h: number,
  intensity: number,
  threshold: number,
) {
  const s = S();
  _resize(s.bloomOff, w, h);
  _resize(s.bloomBlur, w, h);
  s.bloomCtx.clearRect(0, 0, w, h);
  s.bloomCtx.drawImage(ctx.canvas, 0, 0);
  const d = s.bloomCtx.getImageData(0, 0, w, h);
  const data = d.data;
  const t = threshold * 255;
  for (let i = 0; i < data.length; i += 4) {
    const lum =
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    if (lum < t) {
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  }
  s.bloomCtx.putImageData(d, 0, 0);
  s.blurCtx2.clearRect(0, 0, w, h);
  s.blurCtx2.filter = `blur(${Math.round(8 + intensity * 12)}px)`;
  s.blurCtx2.drawImage(s.bloomOff, 0, 0);
  s.blurCtx2.filter = "none";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = intensity;
  ctx.drawImage(s.bloomBlur, 0, 0);
  ctx.restore();
}

function pfxCharBloom(ctx: Ctx, w: number, h: number, intensity: number) {
  const s = S();
  _resize(s.bloomOff, w, h);
  _resize(s.bloomBlur, w, h);
  s.bloomCtx.clearRect(0, 0, w, h);
  s.bloomCtx.drawImage(ctx.canvas, 0, 0);
  const d = s.bloomCtx.getImageData(0, 0, w, h);
  const data = d.data;
  const t = 0.65 * 255;
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    if (lum < t) {
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  }
  s.bloomCtx.putImageData(d, 0, 0);
  s.blurCtx2.clearRect(0, 0, w, h);
  s.blurCtx2.filter = `blur(${Math.round(2 + intensity * 8)}px)`;
  s.blurCtx2.drawImage(s.bloomOff, 0, 0);
  s.blurCtx2.filter = "none";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = intensity * 0.85;
  ctx.drawImage(s.bloomBlur, 0, 0);
  ctx.restore();
}

function pfxChromatic(ctx: Ctx, w: number, h: number, offset: number) {
  const d = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(d.data);
  const data = d.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i] = src[(y * w + Math.max(0, x - offset)) * 4];
      data[i + 1] = src[i + 1];
      data[i + 2] = src[(y * w + Math.min(w - 1, x + offset)) * 4 + 2];
    }
  }
  ctx.putImageData(d, 0, 0);
}

function pfxRgbSplit(ctx: Ctx, w: number, h: number, offset: number) {
  pfxChromatic(ctx, w, h, offset);
}

function pfxCrtCurve(ctx: Ctx, w: number, h: number, intensity: number) {
  const strength = intensity * 0.3;
  const d = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(d.data);
  const data = d.data;
  data.fill(0);
  const cx = w / 2,
    cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / cx,
        ny = (y - cy) / cy,
        r2 = nx * nx + ny * ny,
        distort = 1 + r2 * strength;
      const sx = Math.round(nx * distort * cx + cx);
      const sy = Math.round(ny * distort * cy + cy);
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        const si = (sy * w + sx) * 4,
          di = (y * w + x) * 4;
        data[di] = src[si];
        data[di + 1] = src[si + 1];
        data[di + 2] = src[si + 2];
        data[di + 3] = src[si + 3];
      }
    }
  }
  ctx.putImageData(d, 0, 0);
}

function pfxBlur(ctx: Ctx, w: number, h: number, radius: number) {
  const s = S();
  _resize(s.blurOff, w, h);
  s.blurOffCtx.clearRect(0, 0, w, h);
  s.blurOffCtx.filter = `blur(${radius}px)`;
  s.blurOffCtx.drawImage(ctx.canvas, 0, 0);
  s.blurOffCtx.filter = "none";
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(s.blurOff, 0, 0);
}

function pfxGlitch(ctx: Ctx, w: number, h: number, intensity: number) {
  const sliceCount = Math.floor(3 + intensity * 15);
  const maxOffset = Math.floor(intensity * w * 0.1);
  for (let i = 0; i < sliceCount; i++) {
    const sliceY = Math.floor(Math.random() * h);
    const sliceH = Math.floor(2 + Math.random() * 20);
    const offset = Math.floor((Math.random() - 0.5) * 2 * maxOffset);
    if (!offset) continue;
    const slice = ctx.getImageData(0, sliceY, w, Math.min(sliceH, h - sliceY));
    ctx.putImageData(slice, offset, sliceY);
  }
}

function pfxFilmGrain(ctx: Ctx, w: number, h: number, intensity: number) {
  const d = ctx.getImageData(0, 0, w, h);
  const data = d.data;
  const amt = intensity * 60;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(d, 0, 0);
}

function pfxPixelate(ctx: Ctx, w: number, h: number, size: number) {
  const s = S();
  const sw = Math.max(1, Math.ceil(w / size));
  const sh = Math.max(1, Math.ceil(h / size));
  _resize(s.pixOff, sw, sh);
  s.pixCtx.imageSmoothingEnabled = false;
  s.pixCtx.clearRect(0, 0, sw, sh);
  s.pixCtx.drawImage(ctx.canvas, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(s.pixOff, 0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
}

function pfxHalftone(ctx: Ctx, w: number, h: number, size: number) {
  const s = S();
  const d = ctx.getImageData(0, 0, w, h);
  const data = d.data;
  _resize(s.htOff, w, h);
  s.htCtx.fillStyle = "#000";
  s.htCtx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let dy = 0; dy < size && y + dy < h; dy++) {
        for (let dx = 0; dx < size && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }
      r /= count;
      g /= count;
      b /= count;
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const radius = (size / 2) * Math.sqrt(lum);
      if (radius > 0.3) {
        s.htCtx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
        s.htCtx.beginPath();
        s.htCtx.arc(x + size / 2, y + size / 2, radius, 0, Math.PI * 2);
        s.htCtx.fill();
      }
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.drawImage(s.htOff, 0, 0);
  ctx.restore();
}

function pfxFilmDust(ctx: Ctx, w: number, h: number, density: number) {
  const count = Math.floor(density * 200);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w,
      y = Math.random() * h,
      bright = Math.random() > 0.6;
    ctx.fillStyle = bright
      ? `rgba(255,255,255,${0.2 + Math.random() * 0.5})`
      : `rgba(0,0,0,${0.2 + Math.random() * 0.4})`;
    if (Math.random() > 0.8) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 8, y + Math.random() * 12);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 0.3 + Math.random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function pfxColorOverlay(ctx: Ctx, w: number, h: number, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "#ff50c8";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function applyPost(
  ctx: Ctx,
  w: number,
  h: number,
  st: FxState,
  pxScale: number,
) {
  const px = (n: number, min: number) =>
    Math.max(min, Math.round(n * pxScale));
  const v = (k: FxKey) => st[k].val / 100;

  if (st.coloroverlay.on) pfxColorOverlay(ctx, w, h, v("coloroverlay"));
  if (st.vignette.on) pfxVignette(ctx, w, h, v("vignette"));
  if (st.scanlines.on) pfxScanLines(ctx, w, h, v("scanlines"), px(3, 2));
  if (st.bloom.on) pfxBloom(ctx, w, h, v("bloom"), 0.6);
  if (st.charbloom.on) pfxCharBloom(ctx, w, h, v("charbloom"));
  if (st.chromatic.on)
    pfxChromatic(ctx, w, h, px((v("chromatic") * 12), 1));
  if (st.rgbsplit.on) pfxRgbSplit(ctx, w, h, px(v("rgbsplit") * 12, 1));
  if (st.crt.on) pfxCrtCurve(ctx, w, h, v("crt"));
  if (st.blur.on) pfxBlur(ctx, w, h, v("blur") * 6 * pxScale);
  if (st.glitch.on) pfxGlitch(ctx, w, h, v("glitch"));
  if (st.filmgrain.on) pfxFilmGrain(ctx, w, h, v("filmgrain"));
  if (st.pixelate.on)
    pfxPixelate(ctx, w, h, px(v("pixelate") * 18 + 2, 2));
  if (st.halftone.on) pfxHalftone(ctx, w, h, px(20 - v("halftone") * 16, 2));
  if (st.filmdust.on) pfxFilmDust(ctx, w, h, v("filmdust"));
}
