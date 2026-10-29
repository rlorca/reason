/**
 * The one fixed 32-colour palette. Every pixel of art in the game (room PNGs,
 * sprites, icons, runtime-drawn ambience) is an index into PALETTE.
 */
export const RAMPS = {
  void: ['#06070c', '#0e111b', '#181c2b', '#252a3d'], // deep shadow
  steel: ['#313a4e', '#465167', '#5f6c82', '#8190a3', '#a9b5c2', '#d3d9dc'],
  brass: ['#3b2711', '#684718', '#996d22', '#c8983a', '#ebc866'],
  teal: ['#0a363f', '#10606a', '#1d928e', '#4bc8b0', '#a8f2d8'], // instrument light
  amber: ['#5e1c0b', '#b0431a', '#e6772a', '#ffb34b', '#ffe49f'], // converter glow
  skin: ['#a96d4c', '#d29a72', '#f2c9a4'],
  cloth: ['#2d4b72', '#4b79a6', '#8f3b25', '#c9602f'], // blue coverall x2, rust x2
} as const;

export type RampName = keyof typeof RAMPS;

export const PALETTE: string[] = [];
export const RAMP_INDEX: Record<RampName, number[]> = {} as any;
for (const name of Object.keys(RAMPS) as RampName[]) {
  RAMP_INDEX[name] = RAMPS[name].map((hex) => PALETTE.push(hex) - 1);
}

const R = RAMP_INDEX;
/** Named colour indices. */
export const C = {
  void0: R.void[0], void1: R.void[1], void2: R.void[2], void3: R.void[3],
  steel0: R.steel[0], steel1: R.steel[1], steel2: R.steel[2], steel3: R.steel[3], steel4: R.steel[4], steel5: R.steel[5],
  brass0: R.brass[0], brass1: R.brass[1], brass2: R.brass[2], brass3: R.brass[3], brass4: R.brass[4],
  teal0: R.teal[0], teal1: R.teal[1], teal2: R.teal[2], teal3: R.teal[3], teal4: R.teal[4],
  amber0: R.amber[0], amber1: R.amber[1], amber2: R.amber[2], amber3: R.amber[3], amber4: R.amber[4],
  skin0: R.skin[0], skin1: R.skin[1], skin2: R.skin[2],
  blue0: R.cloth[0], blue1: R.cloth[1], rust0: R.cloth[2], rust1: R.cloth[3],
} as const;

export const TRANSPARENT = 255;

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const RGB = PALETTE.map(hexToRgb);

const lum = (i: number) => {
  const [r, g, b] = RGB[i];
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

/** For each colour: [ramp name, position]. */
const where: Record<number, [RampName, number]> = {};
for (const name of Object.keys(R) as RampName[]) R[name].forEach((c, i) => (where[c] = [name, i]));

/** Next lighter / darker colour inside the same ramp (clamped). */
export function lighter(c: number, steps = 1): number {
  if (c === TRANSPARENT) return c;
  const [n, i] = where[c];
  return R[n][Math.min(R[n].length - 1, i + steps)];
}
export function darker(c: number, steps = 1): number {
  if (c === TRANSPARENT) return c;
  const [n, i] = where[c];
  return R[n][Math.max(0, i - steps)];
}

function nearestLum(c: number, ramp: readonly number[]): number {
  let best = ramp[0];
  let bd = 1e9;
  for (const k of ramp) {
    const d = Math.abs(lum(k) - lum(c) * 0.95);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
const warmMap: number[] = [];
const coolMap: number[] = [];
for (let c = 0; c < PALETTE.length; c++) {
  const isVoidish = where[c][0] === 'void';
  warmMap[c] = isVoidish ? c : where[c][0] === 'skin' ? c : nearestLum(c, [...R.amber.slice(0, 4), ...R.brass]);
  coolMap[c] = isVoidish ? c : nearestLum(c, [...R.teal.slice(0, 4), ...R.steel]);
}
/** Re-tint a colour towards amber / teal light, keeping roughly the same brightness. */
export const warm = (c: number) => (c === TRANSPARENT ? c : warmMap[c]);
export const cool = (c: number) => (c === TRANSPARENT ? c : coolMap[c]);
