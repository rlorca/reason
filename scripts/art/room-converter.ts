import { C } from '../../src/art/palette';
import { Raster, T } from '../../src/art/raster';
import { barrel, bulkheadDoor, cable, floorPlates, gauge, pipeH, pipeV, rivets, vignette, wallPlates } from './helpers';

export function paintConverter() {
  const bg = new Raster(320, 180, C.void1);
  const fg = new Raster(320, 180);

  // ceiling gantries
  bg.vgrad(0, 0, 320, 20, [C.void0, C.void1, C.void2]);
  for (let x = -8; x < 330; x += 32) { bg.line(x, 0, x + 16, 14, C.steel0); bg.line(x + 32, 0, x + 16, 14, C.steel0); }
  bg.rect(0, 14, 320, 4, C.steel0); bg.rect(0, 14, 320, 1, C.steel2); bg.rect(0, 18, 320, 1, C.void0);
  // back wall (deep)
  bg.vgrad(0, 19, 320, 100, [C.void1, C.void2, C.void3, C.void2]);
  for (let x = 0; x < 320; x += 14) { bg.rect(x, 19, 1, 100, C.void0); bg.rect(x + 1, 19, 1, 100, C.void3); }
  bg.speckle(0, 19, 320, 100, [C.void3, C.steel0, C.void1], 0.06, 9);
  // great columns left and right
  for (const cx of [48, 266]) {
    bg.rect(cx, 19, 16, 100, C.steel0); bg.rect(cx + 1, 19, 3, 100, C.steel1); bg.rect(cx + 12, 19, 4, 100, C.void2);
    for (let y = 30; y < 118; y += 18) { bg.rect(cx - 2, y, 20, 3, C.brass1); bg.rect(cx - 2, y, 20, 1, C.brass3); }
  }
  // organ pipes behind the converter
  const cx0 = 160;
  for (let i = -7; i <= 7; i++) {
    const x = cx0 + i * 8 - 3;
    const h = 100 - Math.abs(i) * 8 - (i % 2 ? 4 : 0);
    const top = 112 - h;
    bg.rect(x, top, 7, 112 - top, C.steel2);
    bg.rect(x, top, 2, 112 - top, C.steel1); bg.rect(x + 5, top, 2, 112 - top, C.steel4);
    bg.rect(x - 1, top, 9, 3, C.brass3); bg.rect(x - 1, top, 9, 1, C.brass4);
    bg.rect(x - 1, top + 22, 9, 2, C.brass1);
    bg.rect(x + 1, top + 4, 5, 2, C.amber2);
  }
  // converter core housing
  bg.rect(128, 12, 64, 94, C.steel1);
  bg.rect(128, 12, 8, 94, C.steel0); bg.rect(184, 12, 8, 94, C.steel3);
  bg.rect(136, 12, 48, 94, C.steel2);
  bg.ellipse(160, 12, 32, 6, C.steel3); bg.ellipse(160, 11, 26, 4, C.brass2);
  // glowing core window
  bg.rect(142, 22, 36, 76, C.void1);
  for (let y = 0; y < 76; y++) for (let x = 0; x < 36; x++) {
    const d = Math.abs(x - 17.5) / 18;
    const band = (y % 12) < 3 ? 0.18 : 0;
    const t = 1 - d * 1.1 - band + Math.sin(y * 0.4) * 0.03;
    const col = t > 0.75 ? C.amber4 : t > 0.5 ? C.amber3 : t > 0.25 ? C.amber2 : t > 0.05 ? C.amber1 : C.amber0;
    bg.set(142 + x, 22 + y, col);
  }
  bg.frame(141, 21, 38, 78, C.brass3); bg.frame(142, 22, 36, 76, C.brass1);
  for (const y of [34, 60, 86]) { bg.rect(130, y, 60, 5, C.brass2); bg.rect(130, y, 60, 1, C.brass4); bg.rect(130, y + 4, 60, 1, C.brass0); }
  // coils and insulators (ceramic)
  for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
    const ix = 160 + side * 40, iy = 26 + k * 18;
    bg.rect(ix - 6 + (side > 0 ? 0 : -2), iy, 8, 5, C.steel5); bg.rect(ix - 6 + (side > 0 ? 0 : -2), iy, 8, 1, C.steel5); bg.rect(ix - 6 + (side > 0 ? 0 : -2), iy + 4, 8, 1, C.steel3);
    bg.line(ix - 3 + (side > 0 ? 0 : -2), iy + 5, 160 + side * 34, iy + 12, C.amber1);
  }
  // crown rings and cables from ceiling
  bg.rect(150, 0, 20, 14, C.void3); bg.rect(152, 0, 3, 14, C.steel1);
  cable(bg, 104, 0, 134, 20, 6, C.void3, C.steel1); cable(bg, 216, 0, 186, 20, 6, C.void3, C.steel1);
  cable(bg, 70, 0, 120, 30, 10, C.void3, C.steel1); cable(bg, 250, 0, 200, 30, 10, C.void3, C.steel1);
  // plinth: three steps
  const steps = [[84, 236, 112, 118], [72, 248, 118, 124], [60, 260, 124, 130]];
  for (const [x0, x1, y0, y1] of steps) {
    bg.rect(x0, y0, x1 - x0, y1 - y0, C.steel2);
    bg.rect(x0, y0, x1 - x0, 1, C.brass3); bg.rect(x0, y1 - 1, x1 - x0, 1, C.void2);
    bg.rect(x0, y0 + 1, x1 - x0, 1, C.amber3);
    bg.speckle(x0, y0, x1 - x0, y1 - y0, [C.steel1, C.steel3], 0.1, y0);
  }

  // left: service schematic (framed) and instrument rack
  bg.rect(56, 40, 44, 38, C.brass1); bg.frame(56, 40, 44, 38, C.brass3); bg.rect(58, 42, 40, 34, C.teal0);
  bg.dither(58, 42, 40, 34, C.teal0, C.teal1, 0.25);
  bg.frame(62, 48, 14, 12, C.teal3); bg.rect(65, 51, 8, 6, C.amber2); bg.set(68, 53, C.amber4);
  bg.line(76, 54, 86, 54, C.teal4); bg.set(85, 53, C.teal4); bg.set(85, 55, C.teal4);
  bg.frame(84, 60, 11, 9, C.teal3); bg.rect(86, 62, 7, 2, C.teal2); bg.rect(86, 66, 7, 1, C.teal2);
  bg.line(69, 60, 69, 66, C.teal3); bg.line(69, 66, 84, 66, C.teal3);
  bg.rect(62, 70, 16, 1, C.teal3); bg.rect(62, 72, 24, 1, C.teal2);
  rivets(bg, 56, 40, 44, 38, C.brass4);
  // gauge bank
  bg.rect(66, 92, 46, 32, C.steel0); bg.frame(66, 92, 46, 32, C.steel2); bg.rect(67, 93, 44, 2, C.steel3);
  gauge(bg, 78, 102, 6, C.teal0, C.brass2, C.teal4, -0.8); gauge(bg, 96, 102, 6, C.teal0, C.brass2, C.teal4, 0.4);
  for (let i = 0; i < 6; i++) { bg.rect(70 + i * 7, 114, 4, 3, i % 3 === 0 ? C.amber3 : C.teal2); }
  bg.rect(70, 119, 38, 2, C.void2);
  bg.rect(68, 124, 4, 6, C.steel0); bg.rect(106, 124, 4, 6, C.steel0);

  // console (right)
  bg.poly([[236, 98], [296, 98], [304, 116], [228, 116]], C.steel1);
  bg.rect(228, 116, 76, 14, C.steel0); bg.rect(228, 116, 76, 1, C.brass3);
  for (let i = 0; i < 8; i++) bg.rect(232 + i * 9, 119, 6, 8, C.void2);
  bg.rect(238, 78, 26, 22, C.void1); bg.frame(238, 78, 26, 22, C.steel2); bg.rect(240, 80, 22, 18, C.teal0);
  bg.rect(268, 82, 24, 18, C.void1); bg.frame(268, 82, 24, 18, C.steel2); bg.rect(270, 84, 20, 14, C.teal0);
  bg.line(241, 94, 245, 86, C.teal3); bg.line(245, 86, 250, 92, C.teal3); bg.line(250, 92, 255, 83, C.teal3); bg.line(255, 83, 260, 89, C.teal3);
  for (let i = 0; i < 4; i++) bg.rect(272, 87 + i * 3, 10 + (i * 5) % 7, 1, C.teal3);
  for (let i = 0; i < 5; i++) { bg.ellipse(244 + i * 11, 106, 2, 2, i % 2 ? C.amber2 : C.teal2); bg.set(244 + i * 11, 105, C.steel5); }
  bg.rect(238, 100, 56, 2, C.brass2);
  rivets(bg, 228, 116, 76, 14);
  // door left
  bulkheadDoor(bg, 8, 66, 28, 62, { glow: C.amber3 });

  // mid-plane grating floor + railing + visitor floor
  bg.rect(0, 130, 320, 12, C.steel0);
  for (let x = 0; x < 320; x += 4) { bg.rect(x, 131, 1, 10, C.void2); }
  for (let y = 132; y < 142; y += 3) bg.rect(0, y, 320, 1, C.void2);
  floorPlates(bg, 142, { base: C.steel1, dark: C.steel0, seed: 31, seam: C.void2 });
  bg.rect(0, 141, 320, 1, C.steel3); bg.rect(0, 142, 320, 2, C.void2);
  // railing with posts (gap at left for the door)
  for (let x = 46; x < 320; x += 24) { bg.rect(x, 124, 3, 18, C.brass2); bg.rect(x, 124, 1, 18, C.brass4); bg.rect(x + 2, 124, 1, 18, C.brass0); }
  bg.rect(46, 124, 274, 3, C.brass2); bg.rect(46, 124, 274, 1, C.brass4); bg.rect(46, 127, 274, 1, C.brass0);
  bg.rect(46, 132, 274, 2, C.brass1);
  bg.rect(0, 128, 46, 2, C.brass1);
  // stray pipes, hazards on the floor
  pipeH(bg, 0, 320, 21, 3, [C.void3, C.steel1, C.steel3]);

  // lighting: converter glow (warm), instrument light (cool)
  bg.light(160, 60, 120, 1.0, 'warm', 1.1);
  bg.light(160, 150, 90, 0.9, 'warm', 0.45);
  bg.light(88, 104, 40, 1.0, 'cool');
  bg.light(264, 90, 40, 0.9, 'cool');
  bg.light(78, 56, 24, 0.9, 'cool');
  bg.light(22, 62, 20, 0.7, 'warm');
  bg.shade([[0, 128], [58, 128], [70, 142], [0, 142]], 0.8);
  vignette(bg, 1.3);

  // foreground
  cable(fg, -4, 0, 70, 0, 18, C.void3, C.steel1);
  cable(fg, 240, 0, 324, 0, 14, C.void3, C.steel1);
  barrel(fg, 2, 150, 22, 30);
  fg.rect(0, 176, 28, 4, C.void2);
  pipeV(fg, 300, 120, 180, 8, [C.void3, C.steel1, C.steel3]);
  fg.rect(296, 172, 16, 8, C.steel0); fg.rect(296, 172, 16, 1, C.brass3);
  fg.light(302, 150, 22, 0.5, 'warm');
  return { bg, fg };
}
export { T };
