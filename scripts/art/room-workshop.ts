import { C } from '../../src/art/palette';
import { Raster, T } from '../../src/art/raster';
import { barrel, bulkheadDoor, cable, crate, floorPlates, hangLamp, pipeH, pipeV, rivets, vignette, wallPlates } from './helpers';

export function paintWorkshop() {
  const bg = new Raster(320, 180, C.void1);
  const fg = new Raster(320, 180);

  // ceiling: beams, pipes, cable run
  bg.vgrad(0, 0, 320, 24, [C.void0, C.void2, C.void3]);
  for (let x = 0; x < 320; x += 64) { bg.rect(x, 0, 6, 24, C.steel0); bg.rect(x + 1, 0, 1, 24, C.steel1); }
  pipeH(bg, 0, 320, 8, 5);
  pipeH(bg, 0, 320, 16, 3, [C.steel0, C.steel2, C.steel3]);
  cable(bg, 8, 4, 150, 4, 4); cable(bg, 150, 4, 310, 5, 5);

  // back wall
  wallPlates(bg, 0, 24, 320, 94, { pw: 40, seed: 11 });
  bg.rect(0, 24, 320, 2, C.brass2); bg.rect(0, 24, 320, 1, C.brass4); bg.rect(0, 26, 320, 1, C.brass0);
  // wainscot
  bg.rect(0, 94, 320, 24, C.steel0);
  bg.speckle(0, 94, 320, 24, [C.void3, C.steel1], 0.12, 5, [C.steel0]);
  bg.rect(0, 94, 320, 2, C.brass2); bg.rect(0, 94, 320, 1, C.brass3);
  for (let x = 6; x < 320; x += 40) bg.rect(x, 98, 1, 20, C.void2);

  // floor
  floorPlates(bg, 118, { base: C.steel1, dark: C.steel0, seed: 21 });
  bg.rect(0, 118, 320, 3, C.void2); bg.rect(0, 118, 320, 1, C.steel3);

  // doors
  bulkheadDoor(bg, 8, 44, 28, 74, { glow: C.teal3 });
  bulkheadDoor(bg, 284, 44, 28, 74, { glow: C.amber3 });
  // direction plates
  bg.rect(6, 31, 32, 7, C.brass1); bg.rect(7, 32, 30, 5, C.brass2); bg.rect(14, 34, 3, 1, C.void1); bg.rect(14, 34, 10, 1, C.void1); bg.set(14, 33, C.void1); bg.set(14, 35, C.void1);
  bg.rect(282, 31, 32, 7, C.brass1); bg.rect(283, 32, 30, 5, C.brass2); bg.rect(296, 34, 10, 1, C.void1); bg.set(305, 33, C.void1); bg.set(305, 35, C.void1);

  // tool rack (pegboard)
  bg.rect(47, 37, 46, 44, C.brass0);
  bg.dither(48, 38, 44, 42, C.brass1, C.brass0, 0.4);
  for (let y = 40; y < 80; y += 4) for (let x = 50; x < 90; x += 4) bg.set(x, y, C.void1);
  bg.frame(47, 37, 46, 44, C.brass2); bg.rect(47, 37, 46, 1, C.brass4);
  // wrench
  bg.line(54, 44, 54, 64, C.steel4, 2); bg.ellipse(54, 43, 3, 3, C.steel4); bg.rect(53, 40, 3, 3, C.brass0);
  bg.ellipse(54, 66, 3, 3, C.steel4); bg.set(54, 66, C.brass1);
  // hammer
  bg.line(64, 50, 64, 72, C.brass3, 2); bg.rect(60, 44, 9, 6, C.steel3); bg.rect(60, 44, 9, 1, C.steel5); bg.rect(68, 45, 2, 4, C.steel2);
  // pliers
  bg.line(75, 46, 72, 64, C.amber2, 2); bg.line(75, 46, 78, 64, C.amber2, 2); bg.line(72, 44, 78, 44, C.steel4, 2);
  // saw & wire coil
  bg.poly([[84, 44], [90, 44], [90, 66], [88, 70], [84, 66]], C.steel3); bg.rect(84, 44, 1, 22, C.steel5);
  for (let i = 0; i < 6; i++) bg.set(89, 50 + i * 3, C.steel1);
  bg.ellipse(86, 74, 3, 3, C.teal2); bg.ellipse(86, 74, 1, 1, C.brass0);
  // rack shadow
  bg.shade([[93, 40], [97, 44], [97, 85], [93, 81]], 1.2);

  // wall diagram (blueprint)
  bg.rect(103, 31, 58, 54, C.brass1); bg.frame(103, 31, 58, 54, C.brass3);
  bg.rect(105, 33, 54, 50, C.teal0);
  bg.dither(105, 33, 54, 50, C.teal0, C.teal1, (x, y) => 0.15 + (y / 50) * 0.2);
  for (let i = 0; i < 54; i += 6) { bg.rect(105 + i, 33, 1, 50, C.teal1); }
  for (let j = 0; j < 50; j += 6) { bg.rect(105, 33 + j, 54, 1, C.teal1); }
  // schematic robot
  const bx = 124, by = 38;
  bg.frame(bx + 6, by, 14, 11, C.teal3); bg.frame(bx + 3, by + 12, 20, 18, C.teal3); bg.frame(bx + 3, by + 31, 7, 12, C.teal3); bg.frame(bx + 13, by + 31, 7, 12, C.teal3);
  bg.frame(bx - 4, by + 12, 6, 16, C.teal3); bg.frame(bx + 24, by + 12, 6, 16, C.teal3);
  // sockets highlighted
  bg.ellipse(bx + 27, by + 16, 3, 3, C.amber3, false); bg.ellipse(bx + 13, by + 5, 4, 3, C.amber3, false);
  bg.set(bx + 27, by + 16, C.amber4); bg.set(bx + 13, by + 5, C.amber4);
  bg.line(bx + 30, by + 16, 150, 44, C.amber2); bg.line(bx + 17, by + 5, 150, 40, C.amber2);
  bg.rect(145, 38, 11, 2, C.amber2); bg.rect(145, 43, 11, 2, C.amber2);
  // screw crosses
  for (const [sx, sy] of [[bx + 6, by + 1], [bx + 19, by + 1], [bx + 25, by + 13]]) { bg.set(sx, sy, C.teal4); bg.set(sx - 1, sy, C.teal3); bg.set(sx + 1, sy, C.teal3); bg.set(sx, sy - 1, C.teal3); bg.set(sx, sy + 1, C.teal3); }
  // notes lines
  for (let i = 0; i < 4; i++) bg.rect(108, 66 + i * 4, 18 + ((i * 7) % 9), 1, C.teal3);
  bg.rect(108, 76, 10, 2, C.amber3);
  rivets(bg, 103, 31, 58, 54, C.brass4);

  // parts cabinet
  bg.rect(166, 50, 44, 70, C.steel0); bg.rect(167, 51, 42, 68, C.steel2); bg.frame(166, 50, 44, 70, C.void2);
  bg.rect(167, 51, 42, 2, C.steel4);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const dx = 169 + col * 13, dy = 55 + row * 11;
    bg.rect(dx, dy, 12, 9, C.steel1); bg.rect(dx, dy, 12, 1, C.steel3); bg.rect(dx + 4, dy + 3, 4, 1, C.brass3); bg.rect(dx + 2, dy + 6, 8, 2, C.steel3);
    bg.set(dx + 3, dy + 6, C.brass4);
  }
  // the big parts drawer
  bg.rect(169, 90, 38, 22, C.steel1); bg.frame(169, 90, 38, 22, C.void2); bg.rect(169, 90, 38, 1, C.steel4);
  bg.rect(176, 95, 24, 4, C.brass1); bg.rect(176, 95, 24, 1, C.brass3); bg.rect(180, 99, 16, 3, C.void2);
  bg.rect(172, 104, 32, 5, C.brass2); bg.rect(172, 104, 32, 1, C.brass4); bg.rect(175, 106, 8, 2, C.void1); bg.rect(190, 106, 12, 2, C.void1);
  rivets(bg, 169, 90, 38, 22);
  bg.rect(166, 118, 44, 4, C.void2);

  // workbench
  const bx0 = 50, bx1 = 154;
  bg.rect(bx0 + 3, 106, 5, 18, C.steel0); bg.rect(bx1 - 8, 106, 5, 18, C.steel0);
  bg.rect(bx0 + 3, 106, 1, 18, C.steel2); bg.rect(bx1 - 8, 106, 1, 18, C.steel2);
  bg.rect(bx0 + 8, 115, bx1 - bx0 - 16, 3, C.brass1); bg.rect(bx0 + 8, 115, bx1 - bx0 - 16, 1, C.brass2); // lower shelf
  bg.rect(bx0 + 12, 109, 18, 6, C.void2); bg.rect(bx0 + 36, 111, 12, 4, C.steel1); bg.rect(bx0 + 70, 109, 14, 6, C.teal1); bg.rect(bx0 + 70, 109, 14, 1, C.teal3);
  bg.rect(bx0 - 2, 100, bx1 - bx0 + 4, 7, C.brass1); // top slab front
  bg.rect(bx0 - 2, 106, bx1 - bx0 + 4, 3, C.brass0);
  bg.rect(bx0 - 2, 98, bx1 - bx0 + 4, 3, C.brass3); bg.rect(bx0 - 2, 98, bx1 - bx0 + 4, 1, C.brass4);
  bg.speckle(bx0 - 2, 98, bx1 - bx0 + 4, 9, [C.brass0, C.brass2], 0.12, 77);
  bg.rect(bx0 - 2, 106, bx1 - bx0 + 4, 1, C.void2);
  // bench clutter: vise, tray, soldering arm, tins
  bg.rect(bx0 + 6, 86, 12, 12, C.steel2); bg.rect(bx0 + 6, 86, 12, 2, C.steel4); bg.rect(bx0 + 4, 92, 4, 6, C.steel1); bg.rect(bx0 + 16, 90, 3, 8, C.steel1); bg.rect(bx0 + 12, 96, 12, 2, C.void2);
  bg.line(bx0 + 22, 90, bx0 + 28, 98, C.steel3, 2);
  bg.rect(bx0 + 56, 92, 22, 6, C.steel1); bg.rect(bx0 + 56, 92, 22, 1, C.steel3); bg.dither(bx0 + 58, 94, 18, 3, C.void2, C.brass2, 0.3); // parts tray
  bg.line(bx1 - 22, 98, bx1 - 22, 78, C.steel3, 2); bg.line(bx1 - 22, 78, bx1 - 34, 74, C.steel3, 2); bg.ellipse(bx1 - 36, 74, 3, 2, C.steel4);
  bg.rect(bx1 - 38, 76, 4, 2, C.amber3); bg.rect(bx1 - 26, 94, 12, 4, C.steel2);
  bg.rect(bx1 - 12, 90, 7, 8, C.amber1); bg.rect(bx1 - 12, 90, 7, 2, C.amber3); bg.rect(bx1 - 12, 94, 7, 1, C.steel4);

  // intercom (wall unit)
  bg.rect(249, 62, 20, 30, C.brass1); bg.frame(249, 62, 20, 30, C.brass3); bg.rect(250, 63, 18, 2, C.brass4);
  bg.rect(252, 66, 14, 10, C.void1);
  for (let i = 0; i < 4; i++) bg.rect(253, 67 + i * 2, 12, 1, C.steel1);
  bg.ellipse(259, 83, 3, 3, C.amber2); bg.ellipse(259, 83, 1, 1, C.amber4);
  bg.rect(253, 88, 3, 2, C.teal3); bg.rect(263, 88, 3, 2, C.void3);
  bg.line(259, 92, 262, 104, C.void3, 1); bg.rect(260, 103, 4, 5, C.void2);
  rivets(bg, 249, 62, 20, 30, C.brass4);

  // robot support gantry behind cradle
  bg.rect(208, 56, 3, 62, C.steel0); bg.rect(240, 56, 3, 62, C.steel0); bg.rect(206, 54, 38, 5, C.steel1); bg.rect(206, 54, 38, 1, C.steel3);
  bg.line(224, 59, 224, 70, C.void3, 2); bg.rect(221, 69, 6, 4, C.brass2);
  // diagnostic lamp on gantry
  bg.rect(212, 60, 6, 3, C.teal0);

  // hanging lamps
  hangLamp(bg, 108, 34, 0); hangLamp(bg, 222, 36, 0);
  // wall clock / gauge
  bg.ellipse(190, 40, 6, 6, C.brass2); bg.ellipse(190, 40, 5, 5, C.steel5); bg.line(190, 40, 190, 36, C.void1); bg.line(190, 40, 193, 41, C.void1);

  // lighting
  bg.light(108, 38, 62, 0.95, 'warm', 1.15);
  bg.light(222, 40, 68, 0.9, 'warm', 1.1);
  bg.light(108, 130, 62, 0.8, 'warm', 0.4);
  bg.light(222, 132, 70, 0.8, 'warm', 0.4);
  bg.light(23, 30, 22, 0.6, 'cool');
  bg.light(298, 30, 22, 0.7, 'warm');
  // shadows: under bench, left of cabinet, doors
  bg.shade([[56, 124], [160, 124], [176, 132], [62, 132]], 1.5);
  bg.shade([[210, 118], [246, 118], [260, 128], [214, 128]], 1.5);
  bg.shade([[0, 24], [320, 24], [320, 34], [0, 30]], 1.3);
  vignette(bg, 1);

  // ---------------- foreground overlay
  cable(fg, -4, 0, 48, 0, 14, C.void3, C.steel1);
  cable(fg, 250, 0, 324, 0, 10, C.void3, C.steel1);
  crate(fg, 0, 150, 26, 22); crate(fg, 4, 134, 20, 17);
  fg.rect(0, 172, 30, 8, C.void2); fg.rect(0, 172, 30, 1, C.steel1);
  fg.shade([[0, 168], [30, 168], [30, 180], [0, 180]], 0);
  barrel(fg, 294, 140, 24, 34);
  pipeV(fg, 312, 100, 142, 5);
  fg.rect(290, 174, 30, 6, C.void2);
  fg.light(296, 150, 24, 0.5, 'warm');
  return { bg, fg };
}
export { T };
