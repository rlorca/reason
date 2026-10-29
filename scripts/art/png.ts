import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { RGB, TRANSPARENT } from '../../src/art/palette';
import type { Raster } from '../../src/art/raster';

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Encode an indexed raster as an RGBA PNG, optionally upscaled by an integer factor. */
export function encodePng(r: Raster, scale = 1): Buffer {
  const w = r.w * scale, h = r.h * scale;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const c = r.px[Math.floor(y / scale) * r.w + Math.floor(x / scale)];
      const o = row + 1 + x * 4;
      if (c === TRANSPARENT) { raw[o] = raw[o + 1] = raw[o + 2] = raw[o + 3] = 0; }
      else { raw[o] = RGB[c][0]; raw[o + 1] = RGB[c][1]; raw[o + 2] = RGB[c][2]; raw[o + 3] = 255; }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function writePng(file: string, r: Raster, scale = 1) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, encodePng(r, scale));
}
