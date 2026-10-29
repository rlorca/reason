import { C } from '../../src/art/palette';
import { Raster, bayer, rng } from '../../src/art/raster';
import { pipeH } from './helpers';

export function paintTitle() {
  const r = new Raster(320, 180, C.void0);
  r.vgrad(0, 0, 320, 180, [C.void0, C.void1, C.void2, C.void3]);
  const rn = rng(4);
  for (let i = 0; i < 120; i++) r.set(Math.floor(rn() * 320), Math.floor(rn() * 120), rn() > 0.8 ? C.steel5 : C.steel3);
  // sun: warm dithered disc
  for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) {
    const d = Math.hypot(x - 54, y - 44);
    if (d < 20) r.set(x, y, C.amber4);
    else if (d < 26) r.set(x, y, C.amber3);
    else if (d < 70) { const t = 1 - (d - 26) / 44; if (t * 1.3 > bayer(x, y)) r.set(x, y, t > 0.6 ? C.amber2 : t > 0.3 ? C.amber1 : C.amber0); }
  }
  // Earth limb
  r.ellipse(290, 250, 200, 130, C.teal0);
  r.ellipse(290, 252, 198, 128, C.teal1);
  for (let y = 120; y < 180; y++) for (let x = 100; x < 320; x++) {
    if (r.get(x, y) === C.teal1 && (x * 7 + y * 3) % 11 === 0) r.set(x, y, C.teal2);
  }
  r.ellipse(290, 250, 200, 130, C.teal3, false);
  // station: solar arrays, hub, converter dish, beam
  const hx = 190, hy = 76;
  r.rect(60, hy - 6, 80, 12, C.steel1); r.rect(60, hy - 6, 80, 1, C.steel4);
  for (let i = 0; i < 4; i++) { r.rect(62 + i * 19, hy - 5, 17, 10, C.teal1); r.rect(62 + i * 19, hy - 5, 17, 1, C.teal3); r.rect(62 + i * 19 + 8, hy - 5, 1, 10, C.teal0); }
  pipeH(r, 138, 172, hy - 2, 4);
  r.ellipse(hx, hy, 18, 18, C.brass2); r.ellipse(hx, hy, 15, 15, C.brass1); r.ellipse(hx, hy, 11, 11, C.void1);
  r.ellipse(hx, hy, 7, 7, C.amber2); r.ellipse(hx, hy, 4, 4, C.amber4);
  r.map(hx - 18, hy - 18, 14, 36, (c) => (c === C.brass2 ? C.brass3 : c));
  r.rect(hx + 14, hy - 4, 40, 8, C.steel2); r.rect(hx + 14, hy - 4, 40, 1, C.steel4);
  r.poly([[hx + 54, hy - 12], [hx + 62, hy - 8], [hx + 62, hy + 8], [hx + 54, hy + 12]], C.steel3);
  // beam toward Earth
  for (let i = 0; i < 80; i++) { const bx = hx + 62 + i * 1.6, by = hy + i * 0.9; for (let k = -1; k <= 1; k++) r.set(bx, by + k, k === 0 ? C.teal4 : C.teal2); }
  // stipple shadow side
  r.shade([[60, hy + 6], [140, hy + 6], [140, hy + 12], [60, hy + 12]], 1);
  r.outline(C.void0);
  return { bg: r, fg: new Raster(320, 180) };
}
