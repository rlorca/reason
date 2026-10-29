import { C, PALETTE, RGB } from '../art/palette';
import { bayer, rng } from '../art/raster';
import type { Assets } from './assets';
import type { GameState, SceneId } from '../game/types';
import { has } from '../game/state';
import { BOT_POS, CUTIE_HOME, DONOVAN_POS, FOLLOWER_A, FOLLOWER_B } from '../game/rooms';

export interface Actor {
  id: string; sprite: 'powell' | 'donovan' | 'cutie' | 'follower';
  x: number; y: number; face: 1 | -1; walking: boolean; walkT: number;
  talking: boolean; reach: number; visible: boolean; bow?: number;
}

export interface View {
  scene: SceneId;
  state: GameState;
  t: number;
  actors: Record<string, Actor>;
  botFace: 1 | -1;
  camX: number;
  viewW: number;
  stormT: number | null;
  reduced: boolean;
  selected: string | null; // selected close-up hotspot id
}

const HEX = PALETTE;
const SKY_STARS = (() => { const r = rng(99); return Array.from({ length: 70 }, () => ({ x: r() * 60, y: r() * 60, s: 0.3 + r() * 1.2, c: r() })); })();
const smooth = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const FLASHES = [2.4, 4.3, 6.1, 7.7, 9.3];

export class Renderer {
  ctx: CanvasRenderingContext2D;
  private pattern: HTMLCanvasElement[] = [];
  private coreImg: ImageData;
  constructor(private canvas: HTMLCanvasElement, private assets: Assets) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
    this.coreImg = this.ctx.createImageData(36, 76);
    // dither flash patterns (palette pixels only)
    for (const d of [0.12, 0.28]) {
      const c = document.createElement('canvas'); c.width = 320; c.height = 180;
      const x = c.getContext('2d')!; const img = x.createImageData(320, 180);
      const [r, g, b] = RGB[C.steel5];
      for (let j = 0; j < 180; j++) for (let i = 0; i < 320; i++) if (d > bayer(i, j)) { const o = (j * 320 + i) * 4; img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255; }
      x.putImageData(img, 0, 0); this.pattern.push(c);
    }
  }

  private px(x: number, y: number, c: number) { this.ctx.fillStyle = HEX[c]; this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  private rect(x: number, y: number, w: number, h: number, c: number) { this.ctx.fillStyle = HEX[c]; this.ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  private line(x0: number, y0: number, x1: number, y1: number, c: number) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }

  draw(v: View) {
    if (this.canvas.width !== v.viewW) { this.canvas.width = v.viewW; this.ctx.imageSmoothingEnabled = false; }
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.canvas.width, 180);
    ctx.translate(-Math.round(v.camX), 0);
    const storm = v.stormT !== null;
    if (storm && !v.reduced) {
      const k = smooth(0.5, 3, v.stormT!) * (1 - smooth(9.5, 12, v.stormT!));
      ctx.translate(Math.round(Math.sin(v.t * 41) * 1.2 * k), Math.round(Math.cos(v.t * 37) * 1.2 * k));
    }
    if (v.scene === 'board') this.drawBoard(v);
    else {
      if (v.scene === 'quarters') this.drawSky(v);
      ctx.drawImage(this.assets.bg[v.scene]!, 0, 0);
      this.ambient(v);
      this.drawEntities(v);
      ctx.drawImage(this.assets.fg[v.scene]!, 0, 0);
      if (v.scene === 'quarters') this.stormOverlay(v);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ entities
  private frame(a: Actor, t: number): string {
    if (a.sprite === 'follower') {
      if (a.walking) return `walk${Math.floor(a.walkT * 8) % 4}`;
      if (a.bow) return 'bow';
      return Math.floor(t * 0.7 + a.x) % 5 === 0 && (t * 0.7) % 1 > 0.85 ? 'idle1' : 'idle0';
    }
    if (a.walking) return `walk${Math.floor(a.walkT * 9) % 6}`;
    if (a.reach > 0) return 'reach';
    if (a.talking) return ['say1', 'say0', 'talk1', 'talk0'][Math.floor(t * 6 + a.x) % 4];
    const blink = ((t * 0.5 + a.x * 0.13) % 3.7) > 3.55;
    return blink ? 'blink' : Math.floor(t * 1.2 + a.x) % 2 ? 'idle1' : 'idle0';
  }

  private drawEntities(v: View) {
    const list: { y: number; fn: () => void }[] = [];
    const add = (a: Actor | undefined) => {
      if (!a || !a.visible) return;
      list.push({ y: a.y, fn: () => {
        const flip = a.face < 0;
        const { c, ax, ay } = this.assets.sprite(a.sprite, this.frame(a, v.t), flip);
        this.ctx.drawImage(c, Math.round(a.x) - ax, Math.round(a.y) - ay);
      } });
    };
    // contact shadow under every character
    const shadow = (a: Actor | undefined, w = 9) => {
      if (!a || !a.visible) return;
      for (let i = -w; i <= w; i++) { if ((i + Math.round(a.y)) % 2 === 0 || Math.abs(i) < w - 2) this.px(a.x + i, a.y + 1, C.void2); }
    };
    if (v.scene === 'workshop') {
      shadow(v.actors.cutie, 12); shadow(v.actors.powell);
      list.push({ y: BOT_POS[1], fn: () => {
        const f = v.state.flags;
        const active = !!f.botActive && !!f.robotAssembled;
        const blink = active && ((v.t * 0.6) % 4) > 3.8;
        const { c, ax, ay } = this.assets.bot({ arm: !!f.armFitted, module: !!f.moduleFitted, active, facing: v.botFace, blink });
        this.ctx.drawImage(c, BOT_POS[0] - ax, BOT_POS[1] - ay);
      } });
      this.workshopProps(v);
      add(v.actors.cutie);
    } else if (v.scene === 'converter') {
      shadow(v.actors.cutie, 12); shadow(v.actors.powell); shadow(v.actors.followerA, 8); shadow(v.actors.followerB, 8);
      add(v.actors.cutie); add(v.actors.followerA); add(v.actors.followerB);
    } else {
      shadow(v.actors.donovan); shadow(v.actors.powell);
      this.quartersProps(v);
      add(v.actors.donovan);
    }
    add(v.actors.powell);
    list.sort((a, b) => a.y - b.y).forEach((e) => e.fn());
  }

  private workshopProps(v: View) {
    const f = v.state.flags;
    if (!f.screwdriverTaken) this.ctx.drawImage(this.assets.prop('screwdriver'), 87, 96);
    if (f.drawerOpen) this.ctx.drawImage(this.assets.prop(`drawer_${f.armTaken ? '-' : 'a'}${f.moduleTaken ? '-' : 'm'}`), 166, 100);
  }
  private quartersProps(v: View) {
    const f = v.state.flags;
    if (!f.mugTaken && !f.mugGiven) this.ctx.drawImage(this.assets.prop('mug'), 99, 74);
    if (f.printed && !f.stripTaken) {
      let len = 22;
      if (v.stormT !== null) len = Math.max(2, Math.min(22, Math.floor((v.stormT - 3) * 2.8)));
      if (v.stormT === null || v.stormT > 3) this.ctx.drawImage(this.assets.strip(len), 205, 99);
    } else if (v.stormT !== null && v.stormT > 3) {
      this.ctx.drawImage(this.assets.strip(Math.max(2, Math.min(22, Math.floor((v.stormT - 3) * 2.8)))), 205, 99);
    }
  }

  // ------------------------------------------------------------ ambient animation
  private ambient(v: View) {
    const t = v.t;
    const blinkOn = (hz: number, ph = 0) => Math.floor(t * hz + ph) % 2 === 0;
    if (v.scene === 'workshop') {
      // lamps hum between two warm tones, dust motes drift in each cone
      for (const lx of [108, 222]) {
        const hot = Math.sin(t * 1.3 + lx) > -0.2;
        this.rect(lx - 4, 40, 9, 1, hot ? C.amber4 : C.amber3);
        for (let i = 0; i < 5; i++) {
          const mx = lx + Math.sin(t * 0.4 + i * 1.7 + lx) * 12, my = 46 + ((t * 5 + i * 17 + lx) % 40);
          this.px(mx, my, i % 2 ? C.amber3 : C.amber4);
        }
      }
      this.rect(258, 82, 3, 3, blinkOn(1.2) ? C.amber4 : C.amber1);
      this.rect(212, 60, 6, 3, blinkOn(0.8, 1) ? C.teal3 : C.teal0);
      this.rect(21, 36, 3, 2, blinkOn(0.9) ? C.teal4 : C.teal1);
      // clock second hand
      const a = (Math.floor(t) % 60) / 60 * Math.PI * 2;
      this.line(190, 40, 190 + Math.sin(a) * 4, 40 - Math.cos(a) * 4, C.amber1);
    } else if (v.scene === 'converter') {
      this.drawCore(v);
      // gauge needles swing slowly
      for (const [gx, ph] of [[78, 0], [96, 2]]) {
        this.ctx.fillStyle = HEX[C.teal0]; this.ctx.fillRect(gx - 4, 98, 9, 9);
        const ang = Math.sin(t * 0.9 + ph) * 0.9 - 1.57 + (ph ? 0.3 : -0.2);
        this.line(gx, 102, gx + Math.cos(ang) * 5, 102 + Math.sin(ang) * 5, C.teal4);
        this.px(gx, 102, C.steel5);
      }
      // status lights
      for (let i = 0; i < 6; i++) this.rect(70 + i * 7, 114, 4, 3, blinkOn(0.8 + i * 0.15, i) ? (i % 3 === 0 ? C.amber3 : C.teal3) : C.void2);
      for (let i = 0; i < 5; i++) { const on = blinkOn(0.6 + i * 0.2, i * 0.5); this.rect(243 + i * 11, 105, 3, 2, on ? (i % 2 ? C.amber3 : C.teal3) : C.void2); }
      // console graph scrolls
      this.ctx.fillStyle = HEX[C.teal0]; this.ctx.fillRect(240, 80, 22, 18);
      let py = 90;
      for (let i = 0; i < 22; i++) { const ny = 89 + Math.sin((i + t * 14) * 0.5) * 4 + Math.sin((i + t * 14) * 1.3) * 1.5; if (i) this.line(240 + i - 1, py, 240 + i, ny, C.teal3); py = ny; }
      // sparks on the insulators
      for (let i = 0; i < 3; i++) { const k = Math.floor(t * 3 + i * 7) % 11; if (k < 3) { this.px(120 + ((i * 53 + k * 11) % 8), 38 + ((i * 29 + k * 7) % 40), C.amber4); this.px(200 + ((i * 37 + k * 13) % 8), 40 + ((i * 17 + k * 9) % 40), C.amber4); } }
    } else {
      // receiver dial, lamps and LEDs
      const storm = v.stormT !== null;
      const run = storm ? 1 : has(v.state, 'accessGranted') && !has(v.state, 'stormDone') ? 0.4 : 0;
      this.ctx.fillStyle = HEX[C.teal0]; this.ctx.fillRect(157, 79, 16, 7);
      for (let i = 0; i < 5; i++) {
        const amp = run ? 1 + Math.abs(Math.sin(t * (storm ? 9 : 2.5) + i * 1.9)) * (storm ? 3 : 1.5) : 1;
        this.rect(159 + i * 3, 85 - Math.floor(amp), 1, Math.floor(amp), C.teal3);
      }
      const hot = Math.sin(t * 2.1) > -0.3;
      this.rect(200, 41, 9, 1, hot ? C.amber4 : C.amber3);
      this.rect(274, 75, 3, 3, blinkOn(1.1) ? C.amber4 : C.amber1);
      this.rect(216, 92, 2, 2, storm || blinkOn(0.7) ? C.amber3 : C.void2);
      // comparison board: faint lane glow when the feed is open
      if (run) for (const ly of [50, 66, 82]) { const w = 8 + Math.floor((Math.sin(t * (storm ? 6 : 1.2) + ly) + 1) * 8); this.rect(229, ly, w, 2, C.teal3); }
      // dust in the lamp cone
      for (let i = 0; i < 4; i++) this.px(204 + Math.sin(t * 0.5 + i * 2) * 10, 48 + ((t * 4 + i * 19) % 40), C.amber3);
    }
  }

  private drawCore(v: View) {
    const d = this.coreImg.data, t = v.t;
    for (let y = 0; y < 76; y++) for (let x = 0; x < 36; x++) {
      const dd = Math.abs(x - 17.5) / 18;
      const band = ((y + t * 14) % 12) < 3 ? 0.18 : 0;
      const tt = 1 - dd * 1.1 - band + Math.sin(y * 0.4 - t * 2) * 0.05 + Math.sin(t * 1.5) * 0.04;
      const col = tt > 0.75 ? C.amber4 : tt > 0.5 ? C.amber3 : tt > 0.25 ? C.amber2 : tt > 0.05 ? C.amber1 : C.amber0;
      const o = (y * 36 + x) * 4;
      d[o] = RGB[col][0]; d[o + 1] = RGB[col][1]; d[o + 2] = RGB[col][2]; d[o + 3] = 255;
    }
    this.ctx.putImageData(this.coreImg, 142, 22);
  }

  // ------------------------------------------------------------ viewport sky and storm
  private drawSky(v: View) {
    const ctx = this.ctx, t = v.t;
    const sk = v.stormT;
    const prelude = has(v.state, 'accessGranted') && !has(v.state, 'stormDone') && sk === null;
    const post = has(v.state, 'stormDone') && sk === null;
    const intensity = sk !== null ? smooth(0.5, 3, sk) * (1 - smooth(9.5, 12, sk)) : prelude ? 0.18 : post ? 0.08 : 0;
    // base: void gradient
    for (let y = 26; y < 76; y++) {
      const k = (y - 26) / 50;
      const base = intensity > 0.5 ? (k > 0.5 ? C.void3 : C.void2) : (k > 0.6 ? C.void2 : C.void1);
      ctx.fillStyle = HEX[base]; ctx.fillRect(100, y, 48, 1);
    }
    // sun glare at the lower-left
    for (let y = 56; y < 76; y++) for (let x = 100; x < 120; x++) { const d = Math.hypot(x - 100, y - 76); if (d < 18 && (1 - d / 18) * 1.1 > bayer(x, y)) this.px(x, y, d < 8 ? C.amber3 : C.amber1); }
    // stars
    for (const s of SKY_STARS) {
      const x = 102 + ((s.x + t * s.s * (v.reduced ? 0 : 0.6)) % 44);
      const tw = (Math.sin(t * 2 + s.c * 40) > 0.6) ? C.steel5 : s.c > 0.7 ? C.steel4 : C.steel2;
      this.px(x, 28 + s.y % 44, tw);
    }
    // aurora ribbons
    if (intensity > 0.02) {
      const n = Math.floor(intensity * 16);
      for (let i = 0; i < n; i++) {
        const x = 102 + (i * 11 + Math.floor(t * 7 * (v.reduced ? 0 : 1))) % 44;
        const y0 = 30 + Math.floor(8 + Math.sin(t * 0.8 + i) * 6 + i % 3 * 4);
        for (let k = 0; k < 14; k++) if ((k + i) % 2 === 0 || intensity > 0.6) this.px(x, y0 + k, k < 3 ? C.teal4 : k < 9 ? C.teal3 : C.teal1);
      }
      // electron streaks
      if (sk !== null) {
        const streaks = Math.floor(intensity * 14);
        for (let i = 0; i < streaks; i++) {
          const f = (t * (v.reduced ? 20 : 70) + i * 37) % 70;
          const x = 148 - f * 0.7, y = 28 + ((i * 29) % 40) + f * 0.3;
          this.line(x, y, x + 5, y - 2, i % 2 ? C.amber3 : C.teal4);
        }
      }
    }
    // flash
    if (sk !== null && !v.reduced) {
      for (const ft of FLASHES) if (sk > ft && sk < ft + 0.3) { ctx.drawImage(this.pattern[1], 100, 26, 48, 50, 100, 26, 48, 50); }
    } else if (sk !== null && v.reduced) {
      ctx.drawImage(this.pattern[0], 100, 26, 48, 50, 100, 26, 48, 50);
    }
  }

  private stormOverlay(v: View) {
    if (v.stormT === null) return;
    const sk = v.stormT;
    if (!v.reduced) for (const ft of FLASHES) if (sk > ft && sk < ft + 0.14) this.ctx.drawImage(this.pattern[0], 0, 0);
    // rec lamp on the receiver
    this.rect(176, 76, 3, 2, Math.floor(v.t * 2) % 2 ? C.amber4 : C.amber1);
  }

  // ------------------------------------------------------------ board close-up overlay
  private drawBoard(v: View) {
    const ctx = this.ctx, f = v.state.flags;
    ctx.drawImage(this.assets.bg.board!, 0, 0);
    const check = (x: number, y: number) => {
      this.rect(x - 1, y - 1, 15, 15, C.teal0); this.rect(x, y, 13, 13, C.teal3);
      for (const [dx, dy] of [[2, 7], [3, 8], [4, 9], [5, 8], [6, 7], [7, 6], [8, 5], [9, 4], [10, 3]]) this.rect(x + dx, y + dy, 2, 2, C.void0);
    };
    const frame = (x: number, y: number, w: number, h: number, c: number) => {
      ctx.strokeStyle = HEX[c]; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    };
    if (f.findingDirection) { frame(10, 64, 190, 42, C.teal4); frame(206, 24, 104, 66, C.teal4); check(176, 70); check(214, 30); }
    if (f.findingFocus) { frame(10, 108, 190, 42, C.teal4); frame(206, 94, 104, 66, C.teal4); check(176, 114); check(214, 100); }
    const pulse = Math.floor(v.t * 4) % 2 === 0 || v.reduced;
    const sel: Record<string, [number, number, number, number]> = { cu_storm: [10, 20, 190, 42], cu_dir: [10, 64, 190, 42], cu_focus: [10, 108, 190, 42] };
    if (v.selected && sel[v.selected] && pulse) frame(...sel[v.selected], C.amber4);
  }
}
void CUTIE_HOME; void DONOVAN_POS; void FOLLOWER_A; void FOLLOWER_B;
