import { PALETTE, RGB } from '../art/palette';
import { BOT_ANCHOR, ICON_STRINGS, PROPS, SPRITES, botFrame, stripProp, type BotState } from '../art/sprites';
import type { SceneId } from '../game/types';

const CH = '0123456789abcdefghijklmnopqrstuv';

export function canvasFromStrings(rows: string[], flip = false): HTMLCanvasElement {
  const w = rows[0].length, h = rows.length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][flip ? w - 1 - x : x];
    if (ch === '.') continue;
    const [r, g, b] = RGB[CH.indexOf(ch)];
    const o = (y * w + x) * 4;
    img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('failed to load ' + src));
    i.src = src;
  });
}

export class Assets {
  bg: Partial<Record<SceneId | 'title', HTMLImageElement>> = {};
  fg: Partial<Record<SceneId | 'title', HTMLImageElement>> = {};
  private cache = new Map<string, HTMLCanvasElement>();

  async load(base = import.meta.env.BASE_URL) {
    const names: (SceneId | 'title')[] = ['workshop', 'converter', 'quarters', 'board', 'title'];
    await Promise.all(names.map(async (n) => {
      this.bg[n] = await loadImage(`${base}assets/rooms/${n}-bg.png`);
      this.fg[n] = await loadImage(`${base}assets/rooms/${n}-fg.png`);
    }));
  }

  sprite(key: string, frame: string, flip: boolean): { c: HTMLCanvasElement; ax: number; ay: number } {
    const def = SPRITES[key];
    const k = `s:${key}:${frame}:${flip}`;
    let c = this.cache.get(k);
    if (!c) { c = canvasFromStrings(def.frames[frame] ?? def.frames.idle0, flip); this.cache.set(k, c); }
    return { c, ax: flip ? c.width - def.ax - 1 : def.ax, ay: def.ay };
  }
  bot(b: BotState): { c: HTMLCanvasElement; ax: number; ay: number } {
    const k = `b:${b.arm}${b.module}${b.active}${b.facing}${b.blink ? 1 : 0}`;
    let c = this.cache.get(k);
    if (!c) { c = canvasFromStrings(botFrame(b)); this.cache.set(k, c); }
    return { c, ...BOT_ANCHOR };
  }
  prop(name: string): HTMLCanvasElement {
    const k = 'p:' + name;
    let c = this.cache.get(k);
    if (!c) { c = canvasFromStrings(PROPS[name]); this.cache.set(k, c); }
    return c;
  }
  strip(len: number): HTMLCanvasElement {
    const k = 'strip:' + len;
    let c = this.cache.get(k);
    if (!c) { c = canvasFromStrings(stripProp(len)); this.cache.set(k, c); }
    return c;
  }
  icon(id: string): HTMLCanvasElement { return canvasFromStrings(ICON_STRINGS[id]); }
}
void PALETTE;
