import { TRANSPARENT, darker, lighter, warm, cool } from './palette';

export const T = TRANSPARENT;

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered-dither threshold in [0,1). */
export const bayer = (x: number, y: number) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

/** A palette-indexed raster. 255 = transparent. */
export class Raster {
  px: Uint8Array;
  constructor(public w: number, public h: number, fill = T) {
    this.px = new Uint8Array(w * h).fill(fill);
  }
  inside(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x: number, y: number) { return this.inside(x, y) ? this.px[y * this.w + x] : T; }
  set(x: number, y: number, c: number) {
    x = Math.round(x); y = Math.round(y);
    if (c !== undefined && this.inside(x, y)) this.px[y * this.w + x] = c;
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  frame(x: number, y: number, w: number, h: number, c: number) {
    this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number, th = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (th <= 1) this.set(x0, y0, c);
      else {
        const o = Math.floor(th / 2);
        this.rect(x0 - o, y0 - o, th, th, c);
      }
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number, fill = true) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const d = ((x - cx) / (rx + 0.3)) ** 2 + ((y - cy) / (ry + 0.3)) ** 2;
        if (fill ? d <= 1 : d <= 1 && d > 0.55) this.set(x, y, c);
      }
    }
  }
  poly(pts: [number, number][], c: number) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]) - (xs[i + 1] % 1 === 0 ? 1 : 0); x++) this.set(x, y, c);
    }
  }
  /** Ordered-dither fill between two colours; level 0..1 = share of c2. */
  dither(x: number, y: number, w: number, h: number, c1: number, c2: number, level: number | ((x: number, y: number) => number)) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const l = typeof level === 'number' ? level : level(i, j);
      this.set(x + i, y + j, l > bayer(x + i, y + j) ? c2 : c1);
    }
  }
  /** Vertical gradient through a list of colours using ordered dithering. */
  vgrad(x: number, y: number, w: number, h: number, cols: number[]) {
    for (let j = 0; j < h; j++) {
      const t = (j / Math.max(1, h - 1)) * (cols.length - 1);
      const k = Math.min(cols.length - 2, Math.floor(t));
      const f = t - k;
      for (let i = 0; i < w; i++) this.set(x + i, y + j, f > bayer(x + i, y + j) ? cols[k + 1] : cols[k]);
    }
  }
  /** Speckle texture: sprinkles colours over existing pixels inside a rect. */
  speckle(x: number, y: number, w: number, h: number, cols: number[], density: number, seed: number, onlyOver?: number[]) {
    const r = rng(seed);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (r() < density) {
        const cur = this.get(x + i, y + j);
        if (cur === T) continue;
        if (onlyOver && !onlyOver.includes(cur)) continue;
        this.set(x + i, y + j, cols[Math.floor(r() * cols.length)]);
      }
    }
  }
  blit(src: Raster, x: number, y: number, flip = false) {
    for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) {
      const c = src.px[j * src.w + (flip ? src.w - 1 - i : i)];
      if (c !== T) this.set(x + i, y + j, c);
    }
  }
  /** Map every pixel inside a rect/mask through f. */
  map(x: number, y: number, w: number, h: number, f: (c: number, x: number, y: number) => number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const c = this.get(x + i, y + j);
      if (c !== T) this.set(x + i, y + j, f(c, x + i, y + j));
    }
  }
  /** Dithered shadow: darkens pixels inside polygon by `steps` (fractional allowed). */
  shade(pts: [number, number][], steps: number) {
    const m = new Raster(this.w, this.h, 0);
    m.poly(pts, 1);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!m.px[y * this.w + x]) continue;
      const s = Math.floor(steps + bayer(x, y));
      const c = this.get(x, y);
      if (c !== T && s > 0) this.set(x, y, darker(c, s));
    }
  }
  shadeRect(x: number, y: number, w: number, h: number, steps: number) {
    this.shade([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], steps);
  }
  /** Radial light with ordered-dithered falloff. kind decides tint. */
  light(cx: number, cy: number, radius: number, strength: number, kind: 'warm' | 'cool' | 'neutral', sy = 1) {
    const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(this.w - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius * sy)), y1 = Math.min(this.h - 1, Math.ceil(cy + radius * sy));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, (y - cy) / sy) / radius;
      if (d >= 1) continue;
      const t = (1 - d) ** 1.6 * strength * 3;
      let steps = Math.floor(t + bayer(x, y));
      if (steps <= 0) continue;
      let c = this.get(x, y);
      if (c === T) continue;
      if (kind === 'warm') c = warm(c); else if (kind === 'cool') c = cool(c);
      this.set(x, y, lighter(c, Math.max(0, steps - (kind === 'neutral' ? 0 : 1))));
    }
  }
  /** Add 1px outline around opaque pixels (on transparent neighbours). */
  outline(c: number, diag = false) {
    const out: [number, number][] = [];
    for (let y = -1; y <= this.h; y++) for (let x = -1; x <= this.w; x++) {
      if (this.get(x, y) !== T) continue;
      const n = this.get(x + 1, y) !== T || this.get(x - 1, y) !== T || this.get(x, y + 1) !== T || this.get(x, y - 1) !== T ||
        (diag && (this.get(x + 1, y + 1) !== T || this.get(x - 1, y - 1) !== T || this.get(x + 1, y - 1) !== T || this.get(x - 1, y + 1) !== T));
      if (n) out.push([x, y]);
    }
    for (const [x, y] of out) this.set(x, y, c);
  }
  clone() { const r = new Raster(this.w, this.h); r.px.set(this.px); return r; }
}
