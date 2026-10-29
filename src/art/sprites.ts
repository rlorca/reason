/**
 * Character, prop and icon sprites. Every frame is a palette-indexed pixel
 * string array (one char per pixel: '.' transparent, '0'-'9','a'-'v' = palette
 * index). Frames are composed by small drawing routines at module load so the
 * poses stay consistent, then frozen into strings -- the data format the
 * renderer consumes.
 */
import { C, PALETTE, TRANSPARENT } from './palette';
import { Raster, T } from './raster';

const CH = '0123456789abcdefghijklmnopqrstuv';
export function toStrings(r: Raster): string[] {
  const rows: string[] = [];
  for (let y = 0; y < r.h; y++) {
    let s = '';
    for (let x = 0; x < r.w; x++) { const c = r.px[y * r.w + x]; s += c === T ? '.' : CH[c]; }
    rows.push(s);
  }
  return rows;
}
export function fromStrings(rows: string[]): Raster {
  const r = new Raster(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r.px[y * r.w + x] = CH.indexOf(ch); }));
  return r;
}

export interface SpriteDef { w: number; h: number; ax: number; ay: number; frames: Record<string, string[]> }

// ---------------------------------------------------------------- humans
export interface HumanStyle {
  skin: [number, number, number]; hair: [number, number]; cloth: [number, number]; belt: number;
  build: number; stubble?: boolean; mustache?: boolean; cap?: boolean;
}
export const POWELL: HumanStyle = { skin: [C.skin0, C.skin1, C.skin2], hair: [C.brass0, C.brass1], cloth: [C.blue0, C.blue1], belt: C.brass2, build: 0, mustache: true };
export const DONOVAN: HumanStyle = { skin: [C.skin0, C.skin1, C.skin2], hair: [C.amber0, C.amber1], cloth: [C.rust0, C.rust1], belt: C.brass1, build: 1, stubble: true };

interface Pose { phase?: number; talk?: 0 | 1; gesture?: boolean; reach?: boolean; blink?: boolean; breath?: number; facingUp?: boolean }
const W = 24, H = 57, OX = 3, OY = 1, GROUND = 53;
const vec = (a: number, l: number): [number, number] => [Math.sin(a) * l, Math.cos(a) * l];

function legGeom(hx: number, hy: number, phase: number | undefined, back: boolean, idleA: number) {
  let a = idleA, flex = 0;
  if (phase !== undefined) {
    const p = phase * Math.PI * 2 + (back ? Math.PI : 0);
    a = 0.62 * Math.sin(p);
    flex = 0.95 * Math.max(0, Math.cos(p));
  }
  const [kx, ky] = vec(a, 10);
  const [ax, ay] = vec(a - flex, 10);
  return { hx, hy, kx: hx + kx, ky: hy + ky, ax: hx + kx + ax, ay: hy + ky + ay };
}

export function drawHuman(s: HumanStyle, pose: Pose): Raster {
  const r = new Raster(W, H);
  const [sk0, sk1, sk2] = s.skin;
  const [cl0, cl1] = s.cloth;
  const hipX = OX + 10, hipY0 = OY + 31;
  const bk = legGeom(hipX, hipY0, pose.phase, true, -0.1);
  const fr = legGeom(hipX, hipY0, pose.phase, false, 0.1);
  const dy = Math.round(GROUND - 2 - Math.max(bk.ay, fr.ay));
  const bob = pose.breath ?? 0;
  const lean = pose.phase !== undefined ? 1 : 0;
  const leg = (g: ReturnType<typeof legGeom>, main: number, shade: number, boot: number) => {
    r.line(g.hx, g.hy + dy, g.kx, g.ky + dy, main, 4);
    r.line(g.kx, g.ky + dy, g.ax, g.ay + dy, shade === main ? main : main, 3);
    r.rect(Math.round(g.hx) - 2, Math.round(g.hy + dy), 4, 2, main);
    // boot
    r.rect(Math.round(g.ax) - 1, Math.round(g.ay + dy) - 1, 6, 4, boot);
    r.rect(Math.round(g.ax) - 1, Math.round(g.ay + dy) + 2, 6, 1, C.void1);
    r.set(Math.round(g.ax) + 3, Math.round(g.ay + dy), C.steel2);
  };
  const arm = (a1: number, a2: number, main: number, hand: number, sx = hipX + 1, sy = OY + 14) => {
    const [ex, ey] = vec(a1, 8);
    const [wx, wy] = vec(a2, 7);
    const y0 = sy + dy + bob;
    r.line(sx, y0, sx + ex, y0 + ey, main, 3);
    r.line(sx + ex, y0 + ey, sx + ex + wx, y0 + ey + wy, main, 2);
    r.rect(Math.round(sx + ex + wx), Math.round(y0 + ey + wy), 2, 2, hand);
    r.set(Math.round(sx + ex + wx), Math.round(y0 + ey + wy) + 2, hand);
  };
  const swing = pose.phase !== undefined ? Math.sin(pose.phase * Math.PI * 2) : 0;
  // back arm
  arm(-0.5 * swing - 0.12, -0.3 * swing + 0.15, cl0, sk0, hipX - 1);
  leg(bk, cl0, cl0, C.void2);
  // torso
  const sh = 4 + s.build, wa = 3 + s.build;
  const top = OY + 12 + dy + bob, bot = OY + 31 + dy;
  r.poly([[hipX - sh + lean * 0, top], [hipX + sh, top], [hipX + wa + 0.5, bot], [hipX - wa, bot]], cl1);
  r.map(hipX - sh, top, sh + 1, bot - top + 1, (c) => (c === cl1 ? cl0 : c));
  r.rect(hipX - sh + 1, top, 2 * sh - 1, 2, C.brass2); // collar
  r.set(hipX + sh - 1, top, C.brass3);
  r.rect(hipX + 2, top + 5, 2, 3, C.teal2); // chest patch
  r.rect(hipX + 2, top + 5, 2, 1, C.teal3);
  r.rect(hipX - wa, bot - 3, 2 * wa + 1, 2, s.belt); // belt
  r.set(hipX + 1, bot - 3, C.brass4); r.set(hipX + 1, bot - 2, C.brass3);
  r.rect(hipX - wa, bot - 1, 2 * wa + 1, 1, cl1);
  r.rect(hipX - wa - 1, bot - 1, 3, 4, C.brass1); // pouch
  r.rect(hipX - wa - 1, bot - 1, 3, 1, C.brass2);
  leg(fr, cl1, cl1, C.void3);
  // neck + head
  const hx = hipX + lean, hy = OY + 6 + dy + bob;
  r.rect(hx - 1, hy + 5, 3, 3, sk0);
  r.ellipse(hx, hy, 4, 5.2, sk1);
  r.map(hx - 5, hy - 6, 4, 13, (c) => (c === sk1 ? sk0 : c));
  r.rect(hx + 1, hy + 1, 3, 3, sk1);
  r.set(hx + 3, hy + 2, sk2); r.set(hx + 3, hy + 3, sk2);
  r.set(hx + 5, hy + 1, sk1); r.set(hx + 5, hy + 2, sk2); // nose
  r.set(hx - 3, hy, sk0); r.set(hx - 3, hy + 1, C.skin0);
  // eyes (blink = line)
  const ex = hx + 2;
  if (pose.blink) { r.set(ex, hy - 0, sk0); r.set(ex + 1, hy, sk0); }
  else { r.set(ex, hy - 1, C.steel5); r.set(ex + 1, hy - 1, C.void0); r.set(ex, hy, C.void1); r.set(ex + 1, hy, C.void0); }
  r.rect(ex - 1, hy - 2, 3, 1, s.hair[0]); // brow
  if (s.mustache) r.rect(hx + 2, hy + 3, 4, 1, s.hair[0]);
  if (s.stubble) r.speckle(hx - 1, hy + 2, 6, 4, [sk0], 0.5, 11, [sk1, sk2]);
  // mouth
  if (pose.talk) { r.rect(hx + 3, hy + 3 + (s.mustache ? 1 : 0), 2, 2, C.void1); r.set(hx + 3, hy + 3 + (s.mustache ? 1 : 0), C.amber1); }
  else r.rect(hx + 3, hy + 3 + (s.mustache ? 1 : 0), 2, 1, sk0);
  // hair
  r.ellipse(hx - 0.5, hy - 2.5, 4.6, 3.4, s.hair[0]);
  r.rect(hx - 5, hy - 2, 4, 6, s.hair[0]);
  r.rect(hx - 1, hy - 4, 5, 1, s.hair[1]);
  r.set(hx + 3, hy - 3, s.hair[1]); r.set(hx + 4, hy - 2, s.hair[0]);
  r.set(hx - 3, hy - 4, s.hair[1]);
  // front arm
  if (pose.reach) arm(1.45, 1.55, cl1, sk1);
  else if (pose.gesture) arm(0.7, 2.4, cl1, sk1);
  else arm(0.5 * swing + 0.1, 0.35 + 0.35 * Math.max(0, swing), cl1, sk1);
  r.outline(C.void0);
  return r;
}

// ---------------------------------------------------------------- Cutie (QT-1)
export function drawCutie(pose: Pose): Raster {
  const r = new Raster(W + 4, H);
  const ox = 2;
  const hipX = ox + OX + 10, hipY0 = OY + 31;
  const bk = legGeom(hipX, hipY0, pose.phase, true, -0.1);
  const fr = legGeom(hipX, hipY0, pose.phase, false, 0.1);
  const dy = Math.round(GROUND - 3 - Math.max(bk.ay, fr.ay));
  const bob = pose.breath ?? 0;
  const leg = (g: ReturnType<typeof legGeom>, main: number, boot: number) => {
    r.line(g.hx, g.hy + dy, g.kx, g.ky + dy, main, 5);
    r.line(g.kx, g.ky + dy, g.ax, g.ay + dy, main, 4);
    r.ellipse(g.kx, g.ky + dy, 2.6, 2.6, C.steel4);
    r.set(g.kx, g.ky + dy, C.steel2);
    r.rect(Math.round(g.ax) - 2, Math.round(g.ay + dy) - 1, 8, 4, boot);
    r.rect(Math.round(g.ax) - 2, Math.round(g.ay + dy) + 2, 8, 1, C.void2);
    r.rect(Math.round(g.ax) - 1, Math.round(g.ay + dy) - 1, 3, 1, C.brass3);
  };
  const arm = (a1: number, a2: number, main: number, sx = hipX + 1, sy = OY + 15) => {
    const [ex, ey] = vec(a1, 8);
    const [wx, wy] = vec(a2, 8);
    const y0 = sy + dy + bob;
    r.line(sx, y0, sx + ex, y0 + ey, main, 4);
    r.line(sx + ex, y0 + ey, sx + ex + wx, y0 + ey + wy, C.steel3, 3);
    r.ellipse(sx + ex, y0 + ey, 2.3, 2.3, C.brass3);
    r.rect(Math.round(sx + ex + wx) - 1, Math.round(y0 + ey + wy), 4, 4, C.steel1);
    r.set(Math.round(sx + ex + wx), Math.round(y0 + ey + wy) + 4, C.steel1);
    r.set(Math.round(sx + ex + wx) + 2, Math.round(y0 + ey + wy) + 4, C.steel1);
  };
  const swing = pose.phase !== undefined ? Math.sin(pose.phase * Math.PI * 2) : 0;
  arm(-0.35 * swing - 0.12, -0.2 * swing + 0.1, C.steel1, hipX - 2);
  leg(bk, C.steel1, C.void3);
  const top = OY + 12 + dy + bob, bot = OY + 32 + dy;
  // torso: heavy barrel with brass plate
  r.poly([[hipX - 7, top + 1], [hipX - 5, top], [hipX + 6, top], [hipX + 8, top + 1], [hipX + 6, bot], [hipX - 5, bot]], C.steel3);
  r.map(hipX - 8, top, 6, bot - top + 1, (c) => (c === C.steel3 ? C.steel2 : c));
  r.rect(hipX + 6, top + 1, 2, bot - top - 1, C.steel4);
  r.rect(hipX - 3, top + 4, 8, 10, C.brass2); // chest plate
  r.rect(hipX - 3, top + 4, 8, 1, C.brass4);
  r.rect(hipX - 3, top + 13, 8, 1, C.brass1);
  r.rect(hipX - 1, top + 6, 4, 4, C.void1); r.rect(hipX, top + 7, 2, 2, C.teal3); r.set(hipX, top + 7, C.teal4);
  r.rect(hipX - 5, bot - 4, 12, 3, C.steel1); r.rect(hipX - 5, bot - 4, 12, 1, C.brass3);
  r.line(hipX - 6, top + 17, hipX + 6, top + 17, C.steel1);
  leg(fr, C.steel2, C.void3);
  // head: domed with visor
  const hx = hipX + 1 + (pose.phase !== undefined ? 1 : 0), hy = OY + 6 + dy + bob;
  r.rect(hx - 2, hy + 5, 5, 3, C.steel1);
  r.ellipse(hx, hy, 5.2, 5.4, C.steel3);
  r.map(hx - 6, hy - 6, 5, 13, (c) => (c === C.steel3 ? C.steel2 : c));
  r.rect(hx + 4, hy - 2, 2, 7, C.steel4);
  r.rect(hx - 4, hy - 1, 10, 4, C.void1); // visor slot
  const eye = pose.blink ? C.amber1 : C.amber3;
  r.rect(hx + 1, hy, 2, 2, eye); r.rect(hx + 4, hy, 2, 2, eye);
  if (!pose.blink) { r.set(hx + 1, hy, C.amber4); r.set(hx + 4, hy, C.amber4); }
  r.rect(hx - 3, hy - 4, 8, 1, C.brass3); // crest band
  r.set(hx - 1, hy - 6, C.steel4); r.set(hx, hy - 6, C.steel4);
  if (pose.talk) r.rect(hx + 1, hy + 4, 4, 2, C.teal3); else r.rect(hx + 1, hy + 4, 4, 1, C.steel1);
  if (pose.gesture) arm(0.7, 2.2, C.steel2);
  else if (pose.reach) arm(1.45, 1.5, C.steel2);
  else arm(0.4 * swing + 0.1, 0.3, C.steel2);
  r.outline(C.void0);
  return r;
}

// ---------------------------------------------------------------- follower robots
export function drawFollower(pose: { phase?: number; bow?: boolean; blink?: boolean }): Raster {
  const r = new Raster(20, 40);
  const gx = 10;
  const swing = pose.phase !== undefined ? Math.sin(pose.phase * Math.PI * 2) : 0;
  const lift = pose.phase !== undefined ? Math.round(Math.abs(swing) * 1) : 0;
  // legs
  const lx = Math.round(swing * 2);
  r.rect(gx - 4 - lx, 26, 3, 9 - lift, C.brass1); r.rect(gx - 5 - lx, 34 - lift, 5, 3, C.void3);
  r.rect(gx + 1 + lx, 26, 3, 9, C.brass2); r.rect(gx + lx, 34, 5, 3, C.void2);
  // torso
  const bow = pose.bow ? 2 : 0;
  r.rect(gx - 5, 14 + bow, 11, 13, C.brass2);
  r.rect(gx - 5, 14 + bow, 3, 13, C.brass1);
  r.rect(gx + 3, 14 + bow, 3, 13, C.brass3);
  r.rect(gx - 3, 17 + bow, 7, 5, C.void2); r.rect(gx - 1, 18 + bow, 3, 3, C.teal2); r.set(gx, 18 + bow, C.teal4);
  r.rect(gx - 5, 25 + bow, 11, 2, C.steel1);
  // arms
  if (pose.bow) { r.rect(gx - 8, 16 + bow, 3, 7, C.brass1); r.rect(gx + 6, 16 + bow, 3, 7, C.brass2); r.rect(gx - 9, 22 + bow, 3, 3, C.steel2); r.rect(gx + 7, 22 + bow, 3, 3, C.steel2); }
  else { r.rect(gx - 8, 15, 3, 10, C.brass1); r.rect(gx + 6, 15, 3, 10, C.brass2); r.rect(gx - 8, 25, 3, 3, C.steel2); r.rect(gx + 6, 25, 3, 3, C.steel2); }
  // head
  const hy = pose.bow ? 8 : 4;
  r.rect(gx - 4, hy, 9, 9, C.steel3); r.rect(gx - 4, hy, 3, 9, C.steel2); r.rect(gx + 3, hy, 2, 9, C.steel4);
  r.rect(gx - 3, hy + 3, 7, 3, C.void1);
  r.rect(gx - 1, hy + 3, 3, 3, pose.blink ? C.teal1 : C.teal3); if (!pose.blink) r.set(gx, hy + 3, C.teal4);
  r.rect(gx - 4, hy - 1, 9, 1, C.brass3);
  r.line(gx + 1, hy - 1, gx + 1, hy - 4, C.steel4); r.set(gx + 1, hy - 5, C.amber2);
  r.outline(C.void0);
  return r;
}

// ---------------------------------------------------------------- maintenance robot (demo project)
export interface BotState { arm: boolean; module: boolean; active: boolean; facing: 1 | -1; blink?: boolean }
export function drawBot(b: BotState): Raster {
  const r = new Raster(34, 46);
  const gx = 17;
  // cradle
  r.rect(gx - 11, 40, 22, 3, C.steel1); r.rect(gx - 11, 40, 22, 1, C.steel3); r.rect(gx - 9, 43, 18, 2, C.void3);
  // legs
  r.rect(gx - 6, 28, 5, 12, C.steel2); r.rect(gx + 2, 28, 5, 12, C.steel3);
  r.rect(gx - 7, 38, 7, 3, C.steel1); r.rect(gx + 1, 38, 7, 3, C.steel2);
  r.rect(gx - 6, 33, 5, 1, C.brass2); r.rect(gx + 2, 33, 5, 1, C.brass3);
  // torso
  r.rect(gx - 8, 14, 17, 15, C.steel3); r.rect(gx - 8, 14, 5, 15, C.steel2); r.rect(gx + 6, 14, 3, 15, C.steel4);
  r.rect(gx - 8, 14, 17, 2, C.brass2); r.rect(gx - 8, 27, 17, 2, C.brass1);
  // chest cavity / panel
  r.rect(gx - 4, 18, 9, 7, C.void1);
  if (b.active) { r.rect(gx - 2, 19, 5, 5, C.teal2); r.rect(gx - 1, 20, 3, 3, C.teal3); r.set(gx, 21, C.teal4); }
  else { r.rect(gx - 3, 19, 7, 1, C.steel0); r.rect(gx - 3, 23, 7, 1, C.steel0); }
  // shoulder socket (left side = viewer's right) always; arm present or empty socket
  // far shoulder always has an arm stub
  r.rect(gx - 12, 15, 4, 11, C.steel1); r.rect(gx - 12, 25, 4, 3, C.steel2);
  const sx = gx + 9;
  if (b.arm) {
    r.rect(sx, 15, 5, 12, C.steel3); r.rect(sx, 15, 2, 12, C.steel4); r.rect(sx, 20, 5, 1, C.brass3);
    r.rect(sx, 26, 5, 4, C.steel1); r.rect(sx, 26, 5, 1, C.brass3);
    if (b.active) r.set(sx + 2, 28, C.teal3);
  } else {
    r.ellipse(sx + 1, 20, 3, 4, C.void0); r.ellipse(sx + 1, 20, 3.2, 4.2, C.brass2, false);
    r.rect(sx - 1, 19, 2, 2, C.void2);
    r.set(sx + 4, 17, C.brass3);
    // loose wires
    r.line(sx, 24, sx + 2, 29, C.amber1); r.set(sx + 2, 30, C.amber3);
  }
  // head
  const hx = gx + (b.facing > 0 ? 0 : 0);
  r.rect(gx - 5, 3, 11, 10, C.steel3); r.rect(gx - 5, 3, 3, 10, C.steel2); r.rect(gx + 4, 3, 2, 10, C.steel4);
  r.rect(gx - 3, 13, 7, 2, C.steel1);
  if (b.module) {
    r.rect(gx - 4, 6, 9, 4, C.void1);
    const ex = b.facing > 0 ? 1 : -3;
    const col = b.active ? (b.blink ? C.teal2 : C.teal3) : C.steel1;
    r.rect(hx + ex - 1, 7, 3, 2, col); r.rect(hx + ex + 3, 7, 3, 2, col);
    if (b.active && !b.blink) { r.set(hx + ex - 1, 7, C.teal4); r.set(hx + ex + 3, 7, C.teal4); }
    r.rect(gx - 5, 2, 11, 1, C.brass3);
  } else {
    r.rect(gx - 3, 2, 7, 2, C.void0); r.rect(gx - 4, 4, 9, 6, C.void0); r.rect(gx - 4, 4, 9, 6, C.void1);
    r.frame(gx - 4, 4, 9, 6, C.brass2);
    r.rect(gx - 2, 6, 5, 2, C.void0);
    r.set(gx - 3, 5, C.brass3); r.set(gx + 3, 5, C.brass3);
  }
  // retaining screws
  const sc = b.active ? C.steel5 : C.steel1;
  if (b.arm && b.module) { r.set(sx + 1, 16, sc); r.set(sx + 3, 16, sc); r.set(gx - 4, 4, sc); r.set(gx + 4, 4, sc); }
  r.outline(C.void0);
  return r;
}

// ---------------------------------------------------------------- inventory icons (16x16)
function icon(f: (r: Raster) => void): Raster {
  const r = new Raster(16, 16);
  f(r);
  r.outline(C.void0, true);
  return r;
}
export const ICONS: Record<string, Raster> = {
  screwdriver: icon((r) => {
    r.line(3, 12, 10, 5, C.steel4, 2); r.line(4, 12, 10, 6, C.steel3, 1);
    r.line(10, 5, 13, 2, C.amber2, 3); r.line(11, 4, 13, 2, C.amber3, 1);
    r.set(2, 13, C.steel2); r.set(3, 13, C.steel2);
  }),
  arm: icon((r) => {
    r.rect(2, 5, 6, 5, C.steel3); r.rect(2, 5, 6, 1, C.steel5); r.rect(2, 9, 6, 1, C.steel1);
    r.rect(8, 6, 4, 3, C.brass2); r.rect(8, 6, 4, 1, C.brass4);
    r.rect(12, 5, 2, 5, C.steel2); r.set(14, 5, C.steel2); r.set(14, 9, C.steel2);
    r.rect(3, 3, 2, 2, C.brass3); r.rect(3, 10, 2, 2, C.amber1); r.set(3, 12, C.amber3);
  }),
  module: icon((r) => {
    r.rect(3, 3, 10, 10, C.steel2); r.rect(3, 3, 10, 1, C.steel4); r.rect(3, 12, 10, 1, C.steel0);
    r.rect(5, 5, 6, 6, C.void1); r.rect(6, 6, 4, 4, C.teal2); r.rect(7, 7, 2, 2, C.teal4);
    for (let i = 0; i < 4; i++) r.set(4 + i * 3, 14, C.brass3);
    r.set(3, 3, C.brass3); r.set(12, 3, C.brass3);
  }),
  mug: icon((r) => {
    r.rect(3, 5, 7, 8, C.steel4); r.rect(3, 5, 2, 8, C.steel3); r.rect(3, 5, 7, 1, C.steel5);
    r.rect(4, 6, 5, 2, C.amber0); r.frame(10, 6, 3, 5, C.steel4); r.set(11, 7, T); r.set(11, 8, T); r.set(11, 9, T);
    r.rect(3, 12, 7, 1, C.steel2); r.set(6, 3, C.steel3); r.set(7, 2, C.steel3);
  }),
  strip: icon((r) => {
    r.rect(2, 2, 12, 12, C.steel5); r.rect(2, 13, 12, 1, C.steel3); r.rect(13, 2, 1, 12, C.steel4);
    r.line(3, 5, 5, 4, C.amber2); r.line(5, 4, 7, 11, C.amber2); r.line(7, 11, 9, 3, C.amber2); r.line(9, 3, 12, 12, C.amber2);
    r.line(3, 8, 12, 8, C.teal2); r.line(3, 11, 12, 10, C.brass2);
    r.set(2, 3, C.steel3); r.set(2, 5, C.steel3); r.set(2, 7, C.steel3);
  }),
};

// ---------------------------------------------------------------- assembled sprite sets
function sheet(frames: Record<string, Raster>, ax: number, ay: number): SpriteDef {
  const first = Object.values(frames)[0];
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(frames)) out[k] = toStrings(frames[k]);
  return { w: first.w, h: first.h, ax, ay, frames: out };
}

function humanSheet(s: HumanStyle): SpriteDef {
  const f: Record<string, Raster> = {
    idle0: drawHuman(s, { breath: 0 }),
    idle1: drawHuman(s, { breath: 1 }),
    blink: drawHuman(s, { blink: true }),
    talk0: drawHuman(s, { talk: 0, gesture: true }),
    talk1: drawHuman(s, { talk: 1, gesture: true }),
    say0: drawHuman(s, { talk: 0 }),
    say1: drawHuman(s, { talk: 1 }),
    reach: drawHuman(s, { reach: true }),
  };
  for (let i = 0; i < 6; i++) f['walk' + i] = drawHuman(s, { phase: i / 6 });
  return sheet(f, OX + 10, GROUND + OY - 0);
}

export const SPRITES: Record<string, SpriteDef> = {
  powell: humanSheet(POWELL),
  donovan: humanSheet(DONOVAN),
  cutie: (() => {
    const f: Record<string, Raster> = {
      idle0: drawCutie({ breath: 0 }), idle1: drawCutie({ breath: 1 }), blink: drawCutie({ blink: true }),
      talk0: drawCutie({ gesture: true }), talk1: drawCutie({ talk: 1, gesture: true }),
      say0: drawCutie({}), say1: drawCutie({ talk: 1 }), reach: drawCutie({ reach: true }),
    };
    for (let i = 0; i < 6; i++) f['walk' + i] = drawCutie({ phase: i / 6 });
    return sheet(f, 2 + OX + 10, GROUND + OY);
  })(),
  follower: (() => {
    const f: Record<string, Raster> = { idle0: drawFollower({}), idle1: drawFollower({ blink: true }), bow: drawFollower({ bow: true }) };
    for (let i = 0; i < 4; i++) f['walk' + i] = drawFollower({ phase: i / 4 });
    return sheet(f, 10, 37);
  })(),
};

export function botFrame(b: BotState): string[] { return toStrings(drawBot(b)); }
export const BOT_ANCHOR = { ax: 17, ay: 45 };
export const ICON_STRINGS: Record<string, string[]> = Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [k, toStrings(v)]));
void PALETTE; void TRANSPARENT;
