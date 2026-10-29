import { C } from '../../src/art/palette';
import { Raster, T } from '../../src/art/raster';
import { bulkheadDoor, cable, crate, floorPlates, hangLamp, pipeH, pipeV, rivets, vignette, wallPlates } from './helpers';

export const VIEWPORT = { cx: 124, cy: 50, r: 22 };

export function paintQuarters() {
  const bg = new Raster(320, 180, C.void1);
  const fg = new Raster(320, 180);

  bg.vgrad(0, 0, 320, 16, [C.void0, C.void2, C.void3]);
  pipeH(bg, 0, 320, 5, 4); pipeH(bg, 0, 320, 11, 3, [C.steel0, C.steel2, C.steel3]);
  wallPlates(bg, 0, 16, 320, 106, { pw: 36, base: C.steel1, seed: 41 });
  bg.rect(0, 16, 320, 2, C.brass2); bg.rect(0, 16, 320, 1, C.brass4);
  // painted lower wall (rust) for a lived-in feel
  bg.rect(0, 96, 320, 26, C.rust0); bg.rect(0, 96, 320, 2, C.brass2);
  bg.speckle(0, 98, 320, 24, [C.void3, C.amber0, C.rust1], 0.1, 6, [C.rust0]);
  bg.rect(0, 120, 320, 2, C.void3);
  floorPlates(bg, 122, { base: C.steel1, dark: C.steel0, seed: 51, vx: 150 });
  bg.rect(0, 122, 320, 3, C.void2); bg.rect(0, 122, 320, 1, C.steel3);
  // worn rug
  bg.poly([[70, 140], [250, 140], [262, 168], [58, 168]], C.blue0);
  bg.poly([[78, 143], [242, 143], [252, 164], [68, 164]], C.blue1);
  bg.dither(70, 140, 192, 30, C.blue0, C.blue1, 0.5);
  bg.poly([[78, 143], [242, 143], [252, 164], [68, 164]], C.blue0);
  bg.dither(80, 146, 170, 16, C.blue0, C.blue1, 0.45);
  bg.rect(90, 152, 140, 1, C.brass2);

  // bunks
  bg.rect(4, 44, 6, 78, C.steel0); bg.rect(78, 44, 6, 78, C.steel0); bg.rect(4, 44, 1, 78, C.steel3); bg.rect(78, 44, 1, 78, C.steel3);
  bg.rect(8, 100, 72, 8, C.blue0); bg.rect(8, 100, 72, 3, C.blue1); bg.rect(8, 105, 72, 3, C.void3); // lower mattress
  bg.rect(8, 96, 18, 5, C.steel5); bg.rect(8, 96, 18, 1, C.steel5); bg.rect(8, 100, 18, 1, C.steel3); // pillow
  bg.rect(6, 108, 74, 6, C.steel0); bg.rect(6, 108, 74, 1, C.steel3); bg.rect(8, 111, 20, 2, C.brass2); bg.rect(48, 111, 28, 2, C.brass2);
  bg.rect(8, 66, 72, 8, C.rust0); bg.rect(8, 66, 72, 3, C.rust1); bg.rect(8, 71, 72, 3, C.void3); // upper
  bg.rect(8, 62, 16, 5, C.steel4); bg.rect(8, 66, 16, 1, C.steel3);
  bg.rect(6, 74, 74, 5, C.steel0); bg.rect(6, 74, 74, 1, C.steel3);
  // ladder
  bg.rect(72, 72, 2, 30, C.brass1); bg.rect(78, 72, 2, 30, C.brass1);
  for (let y = 76; y < 102; y += 6) bg.rect(72, y, 8, 2, C.brass3);
  // small pinned photo + dog-eared poster
  bg.rect(28, 50, 14, 10, C.steel5); bg.rect(29, 51, 12, 8, C.teal1); bg.rect(31, 53, 4, 4, C.skin1); bg.rect(36, 55, 3, 4, C.amber2);
  bg.set(28, 50, C.brass4); bg.set(41, 50, C.brass4);
  bg.rect(46, 48, 22, 14, C.steel4); bg.rect(47, 49, 20, 12, C.brass1); for (let i = 0; i < 3; i++) bg.rect(49, 51 + i * 3, 14 - i * 2, 1, C.brass4);
  rivets(bg, 4, 44, 80, 78);

  // viewport: brass ring, glass hole left transparent
  const { cx, cy, r } = VIEWPORT;
  bg.ellipse(cx, cy, r + 6, r + 6, C.steel0); bg.ellipse(cx, cy, r + 5, r + 5, C.brass2); bg.ellipse(cx, cy, r + 2, r + 2, C.brass1); bg.ellipse(cx, cy, r + 1, r + 1, C.void1);
  bg.ellipse(cx, cy, r, r, T);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; bg.ellipse(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4), 1.3, 1.3, C.brass4); }
  // shelf under viewport + mug spot
  bg.rect(92, 84, 64, 4, C.brass2); bg.rect(92, 84, 64, 1, C.brass4); bg.rect(92, 88, 64, 2, C.void2);
  bg.rect(94, 90, 3, 6, C.steel0); bg.rect(150, 90, 3, 6, C.steel0);
  // sill clutter: pencil cup, folded cloth
  bg.rect(136, 78, 8, 6, C.steel2); bg.line(138, 78, 139, 72, C.amber2); bg.line(141, 78, 143, 73, C.teal3);

  // reference sheet (pinned paper)
  bg.rect(160, 26, 22, 30, C.steel5); bg.rect(160, 26, 22, 1, C.steel5); bg.rect(181, 27, 1, 29, C.steel3); bg.rect(161, 55, 21, 1, C.steel3);
  bg.rect(162, 29, 18, 2, C.void2);
  for (let i = 0; i < 6; i++) bg.rect(162, 34 + i * 3, 14 + ((i * 5) % 5), 1, C.steel2);
  bg.rect(163, 50, 7, 3, C.amber1); bg.set(171, 51, C.void2);
  bg.set(170, 25, C.amber2); bg.set(170, 26, C.amber3);

  // desk
  bg.rect(150, 102, 116, 6, C.brass1); bg.rect(150, 100, 116, 3, C.brass3); bg.rect(150, 100, 116, 1, C.brass4); bg.rect(150, 107, 116, 1, C.void2);
  bg.rect(152, 108, 5, 14, C.steel0); bg.rect(259, 108, 5, 14, C.steel0);
  bg.rect(160, 108, 96, 12, C.steel0); bg.frame(160, 108, 96, 12, C.void2);
  for (let i = 0; i < 3; i++) { bg.rect(164 + i * 30, 110, 26, 8, C.steel1); bg.rect(164 + i * 30, 110, 26, 1, C.steel3); bg.rect(173 + i * 30, 113, 8, 2, C.brass3); }
  bg.speckle(150, 100, 116, 8, [C.brass0, C.brass2], 0.12, 71);
  // receiver
  bg.rect(152, 74, 32, 26, C.steel2); bg.rect(152, 74, 32, 2, C.steel4); bg.rect(152, 98, 32, 2, C.steel0); bg.rect(152, 74, 2, 26, C.steel3); bg.rect(182, 74, 2, 26, C.steel0);
  bg.rect(156, 78, 18, 9, C.void1); bg.frame(156, 78, 18, 9, C.brass2); bg.rect(157, 79, 16, 7, C.teal0);
  for (let i = 0; i < 5; i++) bg.rect(159 + i * 3, 82 - (i % 2), 1, 4 + (i % 2), C.teal3);
  for (let i = 0; i < 3; i++) { bg.ellipse(161 + i * 8, 92, 3, 3, C.steel4); bg.set(161 + i * 8, 90, C.void1); bg.ellipse(161 + i * 8, 92, 1, 1, C.steel1); }
  for (let i = 0; i < 4; i++) bg.rect(176, 80 + i * 3, 4, 1, C.void2);
  bg.line(180, 74, 188, 62, C.steel4); bg.set(188, 61, C.amber3); // antenna
  rivets(bg, 152, 74, 32, 26);
  // strip-chart printer
  bg.rect(190, 82, 32, 18, C.steel3); bg.rect(190, 82, 32, 2, C.steel5); bg.rect(190, 98, 32, 2, C.steel0);
  bg.rect(194, 78, 24, 6, C.steel1); bg.ellipse(200, 78, 4, 3, C.steel4); bg.ellipse(212, 78, 4, 3, C.steel4); bg.rect(196, 77, 20, 1, C.steel5);
  bg.rect(192, 88, 8, 8, C.void1); bg.rect(193, 89, 6, 2, C.amber2); bg.rect(193, 92, 6, 1, C.teal3);
  bg.rect(206, 96, 12, 3, C.void0); // paper slot at front
  bg.rect(204, 88, 14, 2, C.void2); bg.set(216, 92, C.amber3); bg.set(214, 92, C.teal3);
  // comparison board (lit box on wall)
  bg.rect(224, 38, 36, 56, C.steel0); bg.frame(224, 38, 36, 56, C.brass2); bg.rect(225, 39, 34, 1, C.brass4);
  bg.rect(227, 41, 30, 50, C.teal1); bg.dither(227, 41, 30, 50, C.teal1, C.teal2, (x, y) => 0.15 + y / 70);
  for (let i = 0; i < 30; i += 5) bg.rect(227 + i, 41, 1, 50, C.teal2);
  for (let j = 0; j < 50; j += 8) bg.rect(227, 41 + j, 30, 1, C.teal2);
  for (const ly of [50, 66, 82]) bg.rect(229, ly, 26, 2, C.teal0);
  bg.line(229, 56, 240, 52, C.amber2); bg.line(240, 52, 252, 58, C.amber2);
  bg.rect(228, 92, 28, 3, C.steel0);
  rivets(bg, 224, 38, 36, 56, C.brass4);
  // intercom panel
  bg.rect(266, 56, 18, 30, C.brass1); bg.frame(266, 56, 18, 30, C.brass3); bg.rect(268, 59, 14, 9, C.void1);
  for (let i = 0; i < 3; i++) bg.rect(269, 60 + i * 3, 12, 1, C.steel1);
  bg.ellipse(275, 76, 3, 3, C.amber2); bg.ellipse(275, 76, 1, 1, C.amber4); bg.rect(269, 82, 3, 2, C.teal3); bg.rect(278, 82, 3, 2, C.void3);
  bg.rect(267, 87, 16, 6, C.brass2); bg.rect(268, 88, 14, 1, C.void1);
  // hatch
  bulkheadDoor(bg, 290, 38, 26, 84, { glow: C.teal3 });
  // desk lamp (warm) hanging above desk
  hangLamp(bg, 204, 36, 16);
  // mug stays in a runtime prop; bunk lamp
  bg.rect(86, 80, 3, 3, C.steel2);

  // lighting
  bg.light(204, 40, 62, 0.9, 'warm', 1.1);
  bg.light(204, 120, 60, 0.7, 'warm', 0.4);
  bg.light(124, 50, 56, 0.9, 'cool', 1);
  bg.light(112, 138, 54, 0.8, 'cool', 0.4);
  bg.light(242, 66, 34, 0.9, 'cool');
  bg.light(166, 82, 24, 0.7, 'cool');
  bg.light(303, 30, 22, 0.7, 'cool');
  bg.shade([[4, 122], [90, 122], [104, 134], [4, 134]], 1.5);
  bg.shade([[150, 122], [266, 122], [282, 132], [160, 132]], 1.5);
  vignette(bg, 1.1);

  // foreground: pipes, duffel, chair back
  cable(fg, -4, 0, 100, 0, 16, C.void3, C.steel1);
  pipeV(fg, 0, 0, 40, 6, [C.void3, C.steel1, C.steel3]);
  // duffel bag bottom-left
  fg.ellipse(18, 168, 18, 9, C.rust0); fg.ellipse(18, 166, 16, 6, C.rust1); fg.rect(2, 162, 32, 1, C.rust0);
  fg.rect(8, 160, 20, 2, C.brass2); fg.rect(15, 158, 6, 3, C.brass3);
  fg.rect(0, 172, 40, 8, C.void2);
  fg.light(18, 160, 28, 0.6, 'cool');
  // chair back bottom-right
  fg.rect(246, 150, 28, 4, C.brass1); fg.rect(246, 150, 28, 1, C.brass3);
  fg.rect(248, 154, 3, 26, C.steel0); fg.rect(268, 154, 3, 26, C.steel0); fg.rect(251, 154, 17, 24, C.blue0); fg.rect(251, 154, 17, 2, C.blue1);
  fg.dither(251, 156, 17, 20, C.blue0, C.blue1, 0.25);
  return { bg, fg };
}
export { T };
