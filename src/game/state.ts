import type { GameState, ItemId } from './types';

export function newState(): GameState {
  return { room: 'workshop', px: 150, py: 146, face: 1, flags: {}, inv: [], counters: {} };
}
export const has = (s: GameState, f: string) => !!s.flags[f];
export const holds = (s: GameState, i: ItemId) => s.inv.includes(i);

/** Flags that only describe an in-flight scene and are never restored. */
export const TRANSIENT_FLAGS = ['cutieAtWorkshop', 'stormRunning'];

export const SAVE_KEY = 'reason.save.v1';

export interface SaveBlob { v: 1; s: GameState; finished: boolean }

/** Turn a stored snapshot into a consistent state, repairing interrupted scenes. */
export function normalize(raw: unknown): GameState | null {
  try {
    const o = raw as any;
    if (!o || typeof o !== 'object' || !o.flags || !Array.isArray(o.inv)) return null;
    if (!['workshop', 'converter', 'quarters'].includes(o.room)) return null;
    const s: GameState = {
      room: o.room, px: Number(o.px) || 150, py: Number(o.py) || 146, face: o.face === -1 ? -1 : 1,
      flags: { ...o.flags }, inv: o.inv.filter((i: any) => ['screwdriver', 'arm', 'module', 'mug', 'strip'].includes(i)), counters: { ...(o.counters ?? {}) },
    };
    const wasStorm = s.flags.stormRunning && !s.flags.stormDone;
    for (const f of TRANSIENT_FLAGS) delete s.flags[f];
    if (wasStorm || (s.flags.finalSequence && !s.flags.stormDone)) {
      // Interrupted storm: back to "access granted", in the quarters, final sequence still active.
      s.flags.accessGranted = true;
      s.flags.finalSequence = true;
      s.room = 'quarters';
      s.px = 150; s.py = 146; s.face = 1;
    }
    if (s.flags.stormDone) {
      s.flags.printed = true;
      const both = s.flags.findingDirection && s.flags.findingFocus;
      s.inv = s.inv.filter((i) => i !== 'strip');
      if (s.flags.stripTaken && !both) s.inv.push('strip');
    }
    return s;
  } catch {
    return null;
  }
}

export function save(s: GameState, finished = false) {
  try {
    const blob: SaveBlob = { v: 1, s, finished };
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
  } catch { /* storage unavailable */ }
}
export function load(): { s: GameState; finished: boolean } | null {
  try {
    const txt = localStorage.getItem(SAVE_KEY);
    if (!txt) return null;
    const o = JSON.parse(txt);
    if (o?.v !== 1) return null;
    const s = normalize(o.s);
    return s ? { s, finished: !!o.finished } : null;
  } catch { return null; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
