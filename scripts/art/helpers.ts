import { C } from '../../src/art/palette';
import { Raster, rng, T } from '../../src/art/raster';

/** Riveted steel wall with panel seams and speckled grain. */
export function wallPlates(r: Raster, x: number, y: number, w: number, h: number, opts: { pw?: number; base?: number; seam?: number; hi?: number; seed?: number } = {}) {
  const pw = opts.pw ?? 32, base = opts.base ?? C.steel1, seam = opts.seam ?? C.steel0, hi = opts.hi ?? C.steel2;
  r.rect(x, y, w, h, base);
  r.speckle(x, y, w, h, [seam, hi, base], 0.1, opts.seed ?? 7, [base]);
  for (let px = x; px < x + w; px += pw) {
    r.rect(px, y, 1, h, seam);
    if (px + 1 < x + w) r.rect(px + 1, y, 1, h, hi);
    for (let py = y + 3; py < y + h - 2; py += 20) { r.set(px + 3, py, hi); r.set(px + pw - 4, py, hi); r.set(px + 3, py + 1, seam); }
  }
}

/** Perspective plated floor from y0 to bottom of raster. */
export function floorPlates(r: Raster, y0: number, o: { base?: number; dark?: number; seam?: number; vx?: number; seed?: number } = {}) {
  const base = o.base ?? C.steel1, dark = o.dark ?? C.steel0, seam = o.seam ?? C.void2, vx = o.vx ?? 160;
  r.vgrad(0, y0, r.w, r.h - y0, [dark, base, base, C.steel2]);
  r.speckle(0, y0, r.w, r.h - y0, [dark, C.steel2, seam], 0.08, o.seed ?? 3);
  // horizontal seams get further apart toward viewer
  let y = y0 + 5, step = 5;
  while (y < r.h) { r.rect(0, y, r.w, 1, seam); r.rect(0, y + 1, r.w, 1, lightSeam(r, 0, y + 1)); y += step; step += 3; }
  // vertical seams converging toward vanishing point
  for (let k = -9; k <= 9; k++) {
    const bx = vx + k * 42;
    r.line(vx + (bx - vx) * 0.18, y0, bx, r.h, seam);
  }
}
function lightSeam(_r: Raster, _x: number, _y: number) { return C.steel2; }

export function rivets(r: Raster, x: number, y: number, w: number, h: number, c = C.steel3) {
  for (const [px, py] of [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]]) { r.set(px, py, c); r.set(px, py + 1, C.steel0); }
}

export function pipeH(r: Raster, x0: number, x1: number, y: number, th: number, cols: [number, number, number] = [C.steel1, C.steel3, C.steel4]) {
  r.rect(x0, y, x1 - x0, th, cols[1]);
  r.rect(x0, y, x1 - x0, 1, cols[2]); r.rect(x0, y + th - 1, x1 - x0, 1, C.void2);
  r.rect(x0, y + th - 2, x1 - x0, 1, cols[0]);
  for (let x = x0 + 12; x < x1 - 4; x += 40) { r.rect(x, y - 1, 3, th + 2, C.brass2); r.rect(x, y - 1, 3, 1, C.brass4); }
}
export function pipeV(r: Raster, x: number, y0: number, y1: number, th: number, cols: [number, number, number] = [C.steel1, C.steel3, C.steel4]) {
  r.rect(x, y0, th, y1 - y0, cols[1]);
  r.rect(x, y0, 1, y1 - y0, cols[0]); r.rect(x + th - 1, y0, 1, y1 - y0, C.void2);
  r.rect(x + 1, y0, 1, y1 - y0, cols[2]);
  for (let y = y0 + 10; y < y1 - 4; y += 34) { r.rect(x - 1, y, th + 2, 3, C.brass2); r.rect(x - 1, y, th + 2, 1, C.brass4); }
}

/** Sagging cable between two points. */
export function cable(r: Raster, x0: number, y0: number, x1: number, y1: number, sag: number, c = C.void3, hi = C.steel1) {
  let px = x0, py = y0;
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
    r.line(px, py, x, y, c, 2); r.line(px, py - 1, x, y - 1, hi);
    px = x; py = y;
  }
}

export function bulkheadDoor(r: Raster, x: number, y: number, w: number, h: number, o: { glow?: number; wheel?: boolean; open?: number } = {}) {
  r.rect(x - 3, y - 3, w + 6, h + 3, C.brass1);
  r.rect(x - 3, y - 3, w + 6, 2, C.brass3); r.rect(x - 3, y - 3, 2, h + 3, C.brass2); r.rect(x + w + 1, y - 3, 2, h + 3, C.brass0);
  r.rect(x, y, w, h, C.steel1);
  r.vgrad(x, y, w, h, [C.steel2, C.steel1, C.steel0]);
  r.rect(x + 3, y + 3, w - 6, h - 6, C.steel1); r.frame(x + 3, y + 3, w - 6, h - 6, C.steel0);
  r.rect(x + 3, y + 3, w - 6, 1, C.steel3);
  r.rect(x + Math.floor(w / 2), y, 1, h, C.void2);
  for (let i = 0; i < 5; i++) r.rect(x + 5, y + 10 + i * Math.floor((h - 20) / 4), 2, 2, C.steel3), r.rect(x + w - 7, y + 10 + i * Math.floor((h - 20) / 4), 2, 2, C.steel3);
  if (o.wheel !== false) {
    r.ellipse(x + w / 2, y + h * 0.5, 6, 6, C.brass1); r.ellipse(x + w / 2, y + h * 0.5, 4, 4, C.void2);
    r.line(x + w / 2 - 6, y + h * 0.5, x + w / 2 + 6, y + h * 0.5, C.brass3); r.line(x + w / 2, y + h * 0.5 - 6, x + w / 2, y + h * 0.5 + 6, C.brass3);
  }
  // hazard stripe at threshold
  for (let i = 0; i < w; i += 4) r.rect(x + i, y + h - 4, 2, 4, C.brass3), r.rect(x + i + 2, y + h - 4, 2, 4, C.void1);
  if (o.glow !== undefined) { r.rect(x + w / 2 - 4, y - 8, 9, 4, C.void1); r.rect(x + w / 2 - 3, y - 7, 7, 2, o.glow); }
}

export function hangLamp(r: Raster, x: number, y: number, cordTop = 0, glow = C.amber4) {
  r.line(x, cordTop, x, y - 3, C.void3);
  r.rect(x - 1, y - 4, 3, 3, C.steel1);
  r.poly([[x - 8, y + 5], [x + 8, y + 5], [x + 3, y - 2], [x - 3, y - 2]], C.brass2);
  r.rect(x - 8, y + 4, 17, 1, C.brass4); r.rect(x - 3, y - 2, 4, 5, C.brass3);
  r.rect(x - 6, y + 5, 13, 2, glow); r.rect(x - 4, y + 6, 9, 1, C.amber4);
}

export function gauge(r: Raster, cx: number, cy: number, rad: number, face = C.teal0, ring = C.brass2, needle = C.teal4, ang = -0.6) {
  r.ellipse(cx, cy, rad + 1, rad + 1, ring); r.ellipse(cx, cy, rad, rad, face);
  for (let i = 0; i < 7; i++) { const a = -2.4 + i * 0.8; r.set(cx + Math.cos(a) * (rad - 1), cy + Math.sin(a) * (rad - 1), C.teal3); }
  r.line(cx, cy, cx + Math.cos(ang - 1.57) * (rad - 1), cy + Math.sin(ang - 1.57) * (rad - 1), needle);
  r.set(cx, cy, C.steel5);
  r.set(cx - 1, cy - rad, C.brass4);
}

export function crate(r: Raster, x: number, y: number, w: number, h: number) {
  r.rect(x, y, w, h, C.brass1); r.rect(x, y, w, 2, C.brass3);
  r.rect(x, y + 2, w, 1, C.brass2);
  r.frame(x, y, w, h, C.void2);
  for (let i = 5; i < h - 2; i += 6) { r.rect(x + 1, y + i, w - 2, 1, C.brass0); }
  r.line(x + 2, y + 3, x + w - 3, y + h - 3, C.brass0); r.line(x + w - 3, y + 3, x + 2, y + h - 3, C.brass0);
  r.rect(x + 1, y + 1, 2, 2, C.steel3); r.rect(x + w - 3, y + 1, 2, 2, C.steel3);
  r.speckle(x, y, w, h, [C.brass0, C.brass2], 0.12, x * 3 + y, [C.brass1]);
}

export function barrel(r: Raster, x: number, y: number, w: number, h: number) {
  r.rect(x, y, w, h, C.steel2);
  r.rect(x, y, 3, h, C.steel1); r.rect(x + w - 3, y, 3, h, C.steel4);
  r.ellipse(x + w / 2, y, w / 2, 3, C.steel3); r.ellipse(x + w / 2, y + 0.5, w / 2 - 2, 2, C.steel1);
  r.rect(x, y + 6, w, 2, C.amber1); r.rect(x, y + h - 8, w, 2, C.amber1);
  r.rect(x, y + 6, w, 1, C.amber2);
  r.ellipse(x + w / 2, y + h, w / 2, 3, C.void2);
}

/** Noise-free vignette: darken edges with dither. */
export function vignette(r: Raster, strength = 1) {
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const dx = Math.abs(x - r.w / 2) / (r.w / 2), dy = Math.abs(y - r.h / 2) / (r.h / 2);
    const d = Math.max(0, Math.max(dx - 0.55, dy - 0.7)) * strength;
    const c = r.get(x, y);
    if (c === T) continue;
    const bay = ((x & 3) * 4 + (y & 3));
    const t = d * 2.6 - (bay % 16) / 16 * 0.9;
    if (t > 0.5) r.set(x, y, darkerBy(c, Math.min(2, Math.floor(t))));
  }
}
import { darker } from '../../src/art/palette';
function darkerBy(c: number, n: number) { return darker(c, n); }
export { rng };
