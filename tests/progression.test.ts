import { describe, expect, it } from 'vitest';
import { newState, normalize, has } from '../src/game/state';
import { applyScript } from '../src/game/apply';
import { dialogueChoices, dialogueSteps, resolve, currentHint, hintSteps, objectiveText } from '../src/game/content';
import type { GameState, ItemId, Ref, Step, Verb } from '../src/game/types';

const hs = (id: string): Ref => ({ kind: 'hs', id });
const it_ = (id: ItemId): Ref => ({ kind: 'item', id });

function act(s: GameState, verb: Verb, a: Ref, b?: Ref): Step[] {
  const steps = resolve(s, verb, a, b);
  applyScript(s, steps);
  return steps;
}
const said = (steps: Step[]) => steps.filter((x) => x.t === 'say').map((x: any) => x.text).join(' | ');

function assembled(): GameState {
  const s = newState();
  act(s, 'pickup', hs('ws_screwdriver'));
  act(s, 'open', hs('ws_drawer'));
  act(s, 'pickup', hs('ws_arm'));
  act(s, 'pickup', hs('ws_module'));
  act(s, 'use', it_('arm'), hs('ws_robot'));
  act(s, 'use', it_('module'), hs('ws_robot'));
  act(s, 'use', it_('screwdriver'), hs('ws_robot'));
  return s;
}
function withAccess(): GameState {
  const s = assembled();
  act(s, 'use', hs('ws_intercom'));
  const talk = (c: string) => applyScript(s, dialogueSteps('cutie', c, s));
  talk('serve');
  act(s, 'look', hs('cv_schematic'));
  talk('observe');
  return s;
}
function afterStorm(): GameState {
  const s = withAccess();
  act(s, 'use', hs('qt_receiver'));
  act(s, 'pickup', hs('qt_printer'));
  return s;
}

describe('puzzle 1: demonstration of creation', () => {
  it('early screwdriver use explains what is missing and consumes nothing', () => {
    const s = newState();
    act(s, 'pickup', hs('ws_screwdriver'));
    const out = act(s, 'use', it_('screwdriver'), hs('ws_robot'));
    expect(said(out)).toMatch(/socket/);
    expect(s.inv).toEqual(['screwdriver']);
    expect(has(s, 'robotAssembled')).toBe(false);
  });
  it('accepts the parts in either order and then the screwdriver', () => {
    for (const order of [['arm', 'module'], ['module', 'arm']] as ItemId[][]) {
      const s = newState();
      act(s, 'pickup', hs('ws_screwdriver'));
      act(s, 'open', hs('ws_drawer'));
      act(s, 'pickup', hs('ws_arm'));
      act(s, 'pickup', hs('ws_module'));
      for (const i of order) act(s, 'use', it_(i), hs('ws_robot'));
      expect(s.inv).toEqual(['screwdriver']);
      act(s, 'use', it_('screwdriver'), hs('ws_robot'));
      expect(has(s, 'robotAssembled')).toBe(true);
    }
  });
  it('repeated pickups and drawer opens are idempotent; robot cannot be assembled twice', () => {
    const s = assembled();
    const before = JSON.stringify(s);
    act(s, 'pickup', hs('ws_screwdriver'));
    act(s, 'open', hs('ws_drawer'));
    act(s, 'pickup', hs('ws_arm'));
    expect(s.inv).toEqual(['screwdriver']);
    act(s, 'use', it_('screwdriver'), hs('ws_robot'));
    expect(JSON.stringify(s)).toBe(before);
  });
  it('intercom does nothing useful until the robot is assembled', () => {
    const s = newState();
    const out = act(s, 'use', hs('ws_intercom'));
    expect(has(s, 'demoWitnessed')).toBe(false);
    expect(said(out)).toMatch(/pile of parts/);
    const s2 = assembled();
    act(s2, 'use', hs('ws_intercom'));
    expect(has(s2, 'demoWitnessed')).toBe(true);
    expect(objectiveText(s2)).toMatch(/safely/);
  });
});

describe('puzzle 2: permission to observe', () => {
  it('serving topic is available from the start; permission is gated on both clues and the demo', () => {
    const s = newState();
    expect(dialogueChoices('cutie', s).some((c) => c.id === 'serve')).toBe(true);
    applyScript(s, dialogueSteps('cutie', 'serve', s));
    expect(dialogueChoices('cutie', s).some((c) => c.id === 'observe')).toBe(false);
    act(s, 'look', hs('cv_schematic'));
    expect(dialogueChoices('cutie', s).some((c) => c.id === 'observe')).toBe(false);
    const s2 = assembled();
    act(s2, 'use', hs('ws_intercom'));
    act(s2, 'look', hs('cv_schematic'));
    expect(dialogueChoices('cutie', s2).some((c) => c.id === 'observe')).toBe(false);
    applyScript(s2, dialogueSteps('cutie', 'serve', s2));
    expect(dialogueChoices('cutie', s2).some((c) => c.id === 'observe')).toBe(true);
  });
  it('demands are refused repeatably without closing anything', () => {
    const s = withAccess();
    const s0 = newState();
    for (let i = 0; i < 5; i++) {
      const out = dialogueSteps('cutie', i % 2 ? 'shift' : 'demand', s0);
      applyScript(s0, out);
      expect(said(out)).toMatch(/\|/);
    }
    expect(has(s0, 'accessGranted')).toBe(false);
    expect(has(s, 'accessGranted')).toBe(true);
  });
  it('granting access is idempotent', () => {
    const s = withAccess();
    const snap = JSON.stringify(s.flags);
    expect(dialogueChoices('cutie', s).some((c) => c.id === 'observe')).toBe(false);
    applyScript(s, dialogueSteps('cutie', 'feed', s));
    expect(JSON.stringify(s.flags)).toBe(snap);
  });
});

describe('puzzle 3: what the instruments actually say', () => {
  it('receiver refuses before access', () => {
    const s = assembled();
    const out = act(s, 'use', hs('qt_receiver'));
    expect(out.some((x) => x.t === 'storm')).toBe(false);
    expect(has(s, 'finalSequence')).toBe(false);
  });
  it('receiver starts the final sequence which blocks the quarters exit', () => {
    const s = withAccess();
    s.room = 'quarters';
    const open = resolve(s, 'use', hs('qt_hatch'));
    expect(open.some((x) => x.t === 'room')).toBe(true);
    const out = act(s, 'use', hs('qt_receiver'));
    expect(out.some((x) => x.t === 'storm')).toBe(true);
    const blocked = resolve(s, 'use', hs('qt_hatch'));
    expect(blocked.some((x) => x.t === 'room')).toBe(false);
    expect(said(blocked)).toMatch(/electron storm/);
  });
  it('strip is in the printer, can be taken once, and compared on the board', () => {
    const s = afterStorm();
    expect(s.inv).toContain('strip');
    act(s, 'pickup', hs('qt_printer'));
    expect(s.inv.filter((i) => i === 'strip')).toHaveLength(1);
    const out = act(s, 'use', it_('strip'), hs('qt_board'));
    expect(out.some((x) => x.t === 'closeup')).toBe(true);
  });
  it('wrong and storm comparisons give feedback and confirm nothing', () => {
    const s = afterStorm();
    const cases: [string, string][] = [['cu_dir', 'cu_ref_focus'], ['cu_focus', 'cu_ref_dir'], ['cu_storm', 'cu_ref_dir'], ['cu_storm', 'cu_ref_focus'], ['cu_dir', 'cu_storm']];
    for (const [a, b] of cases) {
      const out = act(s, 'use', hs(a), hs(b));
      expect(said(out).length).toBeGreaterThan(10);
    }
    expect(has(s, 'findingDirection')).toBe(false);
    expect(has(s, 'findingFocus')).toBe(false);
    expect(s.inv).toContain('strip');
    expect(said(resolve(s, 'use', hs('cu_storm'), hs('cu_ref_dir')))).toMatch(/not beam error/);
  });
  it('both findings consume the strip and lead to the ending', () => {
    const s = afterStorm();
    act(s, 'use', hs('cu_dir'), hs('cu_ref_dir'));
    expect(s.inv).toContain('strip');
    expect(objectiveText(s)).toMatch(/comparison board/);
    act(s, 'use', hs('cu_dir'), hs('cu_ref_dir')); // repeat is harmless
    const out = act(s, 'use', hs('cu_focus'), hs('cu_ref_focus'));
    expect(s.inv).not.toContain('strip');
    expect(out.some((x) => x.t === 'closeup')).toBe(true);
    expect(objectiveText(s)).toMatch(/intercom/);
    const end = resolve(s, 'use', hs('qt_intercom'));
    expect(end.some((x) => x.t === 'ending')).toBe(true);
  });
  it('quarters intercom does nothing early', () => {
    const s = assembled();
    expect(resolve(s, 'use', hs('qt_intercom')).some((x) => x.t === 'ending')).toBe(false);
  });
});

describe('save restoration', () => {
  it('an interrupted storm restores to access granted in the quarters with the exit blocked', () => {
    const s = withAccess();
    s.flags.finalSequence = true;
    s.flags.stormRunning = true;
    s.room = 'quarters';
    const r = normalize(JSON.parse(JSON.stringify(s)))!;
    expect(r.room).toBe('quarters');
    expect(has(r, 'accessGranted')).toBe(true);
    expect(has(r, 'finalSequence')).toBe(true);
    expect(has(r, 'stormRunning')).toBe(false);
    expect(has(r, 'stormDone')).toBe(false);
    expect(said(resolve(r, 'use', hs('qt_hatch')))).toMatch(/electron storm/);
  });
  it('a finished storm keeps the strip and confirmed findings', () => {
    const s = afterStorm();
    act(s, 'use', hs('cu_dir'), hs('cu_ref_dir'));
    const r = normalize(JSON.parse(JSON.stringify(s)))!;
    expect(r.inv).toContain('strip');
    expect(has(r, 'findingDirection')).toBe(true);
    expect(has(r, 'findingFocus')).toBe(false);
  });
  it('strip stays in the printer if never picked up', () => {
    const s = withAccess();
    act(s, 'use', hs('qt_receiver'));
    const r = normalize(JSON.parse(JSON.stringify(s)))!;
    expect(has(r, 'printed')).toBe(true);
    expect(r.inv).not.toContain('strip');
    act(r, 'pickup', hs('qt_printer'));
    expect(r.inv).toContain('strip');
  });
  it('drops transient scene flags and rejects garbage', () => {
    const s = assembled();
    s.flags.cutieAtWorkshop = true;
    expect(has(normalize(JSON.parse(JSON.stringify(s)))!, 'cutieAtWorkshop')).toBe(false);
    expect(normalize({ nope: 1 })).toBeNull();
    expect(normalize(null)).toBeNull();
    expect(normalize({ room: 'bogus', flags: {}, inv: [] })).toBeNull();
  });
});

describe('hints', () => {
  it('stay accurate after partial progress and escalate', () => {
    const s = newState();
    expect(currentHint(s).key).toBe('parts');
    act(s, 'pickup', hs('ws_screwdriver'));
    act(s, 'open', hs('ws_drawer'));
    act(s, 'pickup', hs('ws_arm'));
    act(s, 'pickup', hs('ws_module'));
    expect(currentHint(s).key).toBe('fit');
    act(s, 'use', it_('arm'), hs('ws_robot'));
    act(s, 'use', it_('module'), hs('ws_robot'));
    expect(currentHint(s).key).toBe('tighten');
    const a = said(hintSteps(s)); applyScript(s, hintSteps(s));
    const b = said(hintSteps(s));
    expect(a).not.toBe(b);
    const t = withAccess();
    expect(currentHint(t).key).toBe('storm');
    const u = afterStorm();
    act(u, 'use', hs('cu_focus'), hs('cu_ref_focus'));
    expect(currentHint(u).key).toBe('board-direction');
  });
});

describe('give interactions', () => {
  it('has at least three optional gives that respond', () => {
    const s = newState();
    for (const [item, target] of [['mug', 'qt_donovan'], ['screwdriver', 'cv_cutie'], ['strip', 'qt_donovan']] as [ItemId, string][]) {
      expect(said(resolve(s, 'give', it_(item), hs(target))).length).toBeGreaterThan(5);
    }
  });
  it('giving the mug is consumed once', () => {
    const s = newState();
    act(s, 'pickup', hs('qt_mug'));
    act(s, 'pickup', hs('qt_mug'));
    expect(s.inv).toEqual(['mug']);
    act(s, 'give', it_('mug'), hs('qt_donovan'));
    expect(s.inv).toEqual([]);
  });
});
