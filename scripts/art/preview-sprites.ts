import { SPRITES, fromStrings, drawBot, ICONS } from '../../src/art/sprites';
import { Raster } from '../../src/art/raster';
import { C } from '../../src/art/palette';
import { writePng } from './png';

export function spriteSheetPreview(out: string, scale = 4) {
  const sheet = new Raster(400, 140, C.void2);
  let x = 4;
  for (const key of ['powell', 'donovan', 'cutie']) {
    const s = SPRITES[key];
    for (const f of ['idle0', 'talk1', 'reach', 'walk0', 'walk1', 'walk2', 'walk3']) { sheet.blit(fromStrings(s.frames[f]), x, key === 'powell' ? 2 : key === 'donovan' ? 2 : 2); x += 0; break; }
  }
  // lay out: rows per character
  let y = 2;
  for (const key of ['powell', 'donovan', 'cutie']) {
    const s = SPRITES[key]; let xx = 2;
    for (const f of ['idle0', 'say1', 'talk1', 'reach', 'walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5']) { sheet.blit(fromStrings(s.frames[f]), xx, y); xx += s.w + 1; }
    y += s.h + 1;
  }
  let xx = 2;
  const f = SPRITES.follower;
  for (const k of ['idle0', 'bow', 'walk0', 'walk1']) { sheet.blit(fromStrings(f.frames[k]), 270 + (xx % 120), 2 + Math.floor(xx / 120) * 42); xx += 22; }
  const bots = [{ arm: false, module: false, active: false }, { arm: true, module: false, active: false }, { arm: true, module: true, active: false }, { arm: true, module: true, active: true }] as const;
  bots.forEach((b, i) => sheet.blit(drawBot({ ...b, facing: 1 }), 250 + i * 36 - (i > 1 ? 0 : 0), 50 + 0));
  Object.values(ICONS).forEach((ic, i) => sheet.blit(ic, 250 + i * 18, 100));
  writePng(out, sheet, scale);
}
spriteSheetPreview(process.argv[2] ?? '/tmp/sprites.png');
