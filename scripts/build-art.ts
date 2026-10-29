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
console.log('art written to', out);
