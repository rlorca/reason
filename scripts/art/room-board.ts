import { C } from '../../src/art/palette';
import { Raster, rng } from '../../src/art/raster';

export const LANES = { storm: { y: 22 }, dir: { y: 66 }, focus: { y: 110 }, x: 12, w: 186, h: 38 };

function marker(r: Raster, kind: 'tri' | 'sq' | 'dot', x: number, y: number, c: number) {
  if (kind === 'sq') { r.rect(x - 2, y - 2, 5, 5, c); r.rect(x - 1, y - 1, 3, 3, C.steel5); }
  else if (kind === 'dot') { r.ellipse(x, y, 2.4, 2.4, c); r.set(x, y, C.steel5); }
  else { r.poly([[x, y - 3], [x + 3, y + 3], [x - 3, y + 3]], c); r.set(x, y + 1, C.steel5); }
}

function band(r: Raster, x: number, y: number, w: number, cy: number, half: number) {
  r.dither(x, cy - half, w, half * 2 + 1, C.steel5, C.teal3, 0.35);
  r.rect(x, cy - half, w, 1, C.teal1); r.rect(x, cy + half, w, 1, C.teal1);
  // bracket ends
  for (const bx of [x + 1, x + w - 3]) { r.rect(bx, cy - half - 2, 2, half * 2 + 5, C.teal1); }
  r.rect(x + 1, cy - half - 2, 5, 1, C.teal1); r.rect(x + 1, cy + half + 2, 5, 1, C.teal1);
  r.rect(x + w - 7, cy - half - 2, 5, 1, C.teal1); r.rect(x + w - 7, cy + half + 2, 5, 1, C.teal1);
}

function lane(r: Raster, y: number, kind: 'tri' | 'sq' | 'dot', mk: number, seed: number, amp: number, spike: boolean, dashed: boolean, hasBand: boolean) {
  const { x, w, h } = LANES;
  r.rect(x - 2, y - 2, w + 4, h + 4, C.steel1);
  r.rect(x, y, w, h, C.steel5);
  for (let gx = 0; gx < w; gx += 12) r.rect(x + gx, y, 1, h, C.steel4);
  for (let gy = 0; gy < h; gy += 9) r.rect(x, y + gy, w, 1, C.steel4);
  const cy = y + Math.floor(h / 2);
  if (hasBand) band(r, x, y, w, cy, 9);
  r.rect(x, cy, w, 1, C.steel3);
  const rn = rng(seed);
  let py = cy, px = x + 3;
  let phase = rn() * 6;
  for (let i = 4; i < w - 4; i++) {
    let v: number;
    if (spike) {
      const env = Math.exp(-((i - 100) ** 2) / 2600) * 15 + Math.exp(-((i - 45) ** 2) / 600) * 9;
      v = -(env * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.5 + phase)))) + (rn() - 0.5) * 3 + 3;
    } else v = Math.sin(i * 0.11 + phase) * amp * 0.7 + Math.sin(i * 0.37 + phase * 2) * amp * 0.3 + (rn() - 0.5) * 1.4;
    const ny = Math.round(Math.max(y + 3, Math.min(y + h - 4, cy + v)));
    const nx = x + i;
    if (!dashed || (i % 6) < 4) r.line(px, py, nx, ny, mk, spike ? 2 : 1);
    py = ny; px = nx;
    if (i % 24 === 12) marker(r, kind, nx, ny, mk);
  }
}

export function paintBoard() {
  const bg = new Raster(320, 180, C.void1);
  bg.rect(0, 0, 320, 180, C.void1);
  bg.rect(2, 2, 316, 176, C.brass1); bg.rect(2, 2, 316, 1, C.brass4); bg.rect(2, 177, 316, 1, C.brass0);
  bg.rect(5, 5, 310, 170, C.teal0);
  bg.dither(5, 5, 310, 170, C.teal0, C.teal1, (x, y) => 0.1 + (y / 170) * 0.18);
  for (let x = 5; x < 315; x += 10) bg.rect(x, 5, 1, 170, C.teal1);
  for (let y = 5; y < 175; y += 10) bg.rect(5, y, 310, 1, C.teal1);
  // lanes
  lane(bg, LANES.storm.y, 'tri', C.amber1, 5, 0, true, false, false);
  lane(bg, LANES.dir.y, 'sq', C.teal1, 17, 5, false, false, true);
  lane(bg, LANES.focus.y, 'dot', C.brass1, 29, 4, false, true, true);
  // reference cards
  for (const [y, kind, mk] of [[26, 'sq', C.teal1], [96, 'dot', C.brass1]] as const) {
    bg.rect(206, y - 2, 104, 66, C.steel1);
    bg.rect(208, y, 100, 62, C.steel5);
    for (let gx = 0; gx < 100; gx += 12) bg.rect(208 + gx, y, 1, 62, C.steel4);
    const cy = y + 31;
    band(bg, 208, y, 100, cy, 12);
    bg.rect(208, cy, 100, 1, C.steel3);
    marker(bg, kind, 222, y + 9, mk);
    marker(bg, kind, 296, y + 53, mk);
    bg.rect(208, y + 60, 100, 2, C.steel3);
  }
  // rivets
  for (const [x, y] of [[8, 8], [311, 8], [8, 171], [311, 171]]) { bg.ellipse(x, y, 2, 2, C.brass3); bg.set(x, y - 1, C.brass4); }
  return { bg, fg: new Raster(320, 180) };
}
