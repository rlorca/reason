import type { GameState, Step } from './types';

/** Apply the state-changing effect of one step. Presentation is handled by the engine. */
export function applyStep(s: GameState, st: Step): void {
  switch (st.t) {
    case 'flag': s.flags[st.name] = st.value !== false; break;
    case 'count': s.counters[st.name] = (s.counters[st.name] ?? 0) + st.add; break;
    case 'give': if (!s.inv.includes(st.item)) s.inv.push(st.item); break;
    case 'take': s.inv = s.inv.filter((i) => i !== st.item); break;
    case 'room': s.room = st.to; s.px = st.x; s.py = st.y; s.face = st.face; break;
    default: break;
  }
}

/** Run a script against state with no presentation (used by tests and the engine's fast paths). */
export function applyScript(s: GameState, steps: Step[]): void {
  for (const st of steps) applyStep(s, st);
}
