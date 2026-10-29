/**
 * Deterministic build-time art: paints every room (background + foreground
 * overlay) into palette-indexed rasters and writes PNGs to public/assets.
 */
import { mkdirSync } from 'node:fs';
import { writePng } from './art/png';
import { paintWorkshop } from './art/room-workshop';
import { paintConverter } from './art/room-converter';
import { paintQuarters } from './art/room-quarters';
import { paintBoard } from './art/room-board';
import { paintTitle } from './art/title';

const out = new URL('../public/assets/rooms/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const jobs = { workshop: paintWorkshop, converter: paintConverter, quarters: paintQuarters, board: paintBoard, title: paintTitle };
for (const [name, fn] of Object.entries(jobs)) {
  const { bg, fg } = fn();
  writePng(`${out}${name}-bg.png`, bg);
  writePng(`${out}${name}-fg.png`, fg);
}
// app icon (192x192) for Add to Home Screen
import { Raster } from '../src/art/raster';
import { C } from '../src/art/palette';
const icon = new Raster(16, 16, C.void1);
icon.rect(1, 1, 14, 14, C.brass2); icon.rect(2, 2, 12, 12, C.void1); icon.rect(2, 2, 12, 1, C.brass4);
icon.ellipse(8, 8, 4, 4, C.amber2); icon.ellipse(8, 8, 2, 2, C.amber4);
icon.rect(0, 7, 3, 2, C.teal3); icon.rect(13, 7, 3, 2, C.teal3);
writePng(new URL('../public/icon-192.png', import.meta.url).pathname, icon, 12);
console.log('art written to', out);
