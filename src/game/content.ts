import type { GameState, ItemId, Ref, Step, SpeakerKey } from './types';
import { has } from './state';
import { HS_BY_ID } from './rooms';

export const say = (who: SpeakerKey, text: string): Step => ({ t: 'say', who, text });
export const flag = (name: string, value = true): Step => ({ t: 'flag', name, value });
export const give = (item: ItemId): Step => ({ t: 'give', item });
export const take = (item: ItemId): Step => ({ t: 'take', item });
export const sfx = (name: string): Step => ({ t: 'sfx', name });
export const wait = (ms: number): Step => ({ t: 'wait', ms });
export const objective = (text: string): Step => ({ t: 'objective', text });

export const SPEAKERS: Record<SpeakerKey, { name: string; sprite?: 'powell' | 'donovan' | 'cutie' | 'follower' }> = {
  powell: { name: 'Powell', sprite: 'powell' },
  donovan: { name: 'Donovan', sprite: 'donovan' },
  cutie: { name: 'Cutie', sprite: 'cutie' },
  follower: { name: 'Follower robot', sprite: 'follower' },
  donovan_ic: { name: 'Donovan (intercom)' },
  powell_ic: { name: 'Powell (intercom)', sprite: 'powell' },
  cutie_ic: { name: 'Cutie (intercom)' },
  note: { name: 'Powell', sprite: 'powell' },
};

export const OBJECTIVES = {
  assemble: 'Assemble the demonstration robot in the workshop.',
  summon: 'Use the workshop intercom to call Cutie to see the robot.',
  investigate: 'Find out whether Cutie can run the station safely. Talk to him, and look for a way to watch his work.',
  observe: 'Use the observation receiver in the crew quarters.',
  strip: 'Take the chart strip from the printer.',
  compare: 'Use the chart strip on the comparison board and match each trace to its reference.',
  finale: 'Tell Cutie what the record shows: use the quarters intercom.',
  done: 'The beam held.',
};

export function objectiveText(s: GameState): string {
  if (has(s, 'ended')) return OBJECTIVES.done;
  if (!has(s, 'robotAssembled')) return OBJECTIVES.assemble;
  if (!has(s, 'demoWitnessed')) return OBJECTIVES.summon;
  if (!has(s, 'accessGranted')) return OBJECTIVES.investigate;
  if (!has(s, 'stormDone')) return OBJECTIVES.observe;
  if (!has(s, 'stripTaken')) return OBJECTIVES.strip;
  if (!(has(s, 'findingDirection') && has(s, 'findingFocus'))) return OBJECTIVES.compare;
  return OBJECTIVES.finale;
}

/** Hints for the current unsolved step: three progressively explicit lines in Donovan's voice. */
export function currentHint(s: GameState): { key: string; hints: [string, string, string] } {
  const robotParts = () => {
    const fitted = (has(s, 'armFitted') ? 1 : 0) + (has(s, 'moduleFitted') ? 1 : 0);
    const held = s.inv.filter((i) => i === 'arm' || i === 'module').length;
    return { fitted, held };
  };
  if (!has(s, 'robotAssembled')) {
    const { fitted, held } = robotParts();
    if (has(s, 'armFitted') && has(s, 'moduleFitted')) {
      return { key: 'tighten', hints: [
        'The diagram said something about retaining screws, Greg.',
        'Both parts are in. Time for the screwdriver.',
        'Select Use, tap the screwdriver in your inventory, then tap the unfinished robot.',
      ] };
    }
    if (fitted + held === 2 && has(s, 'screwdriverTaken')) {
      return { key: 'fit', hints: [
        'Those parts belong on the unfinished robot.',
        'Use the arm assembly on the robot, and the positronic module on the robot. Either order.',
        'Select Use, tap a part in your inventory, then tap the robot. Repeat for the other part.',
      ] };
    }
    return { key: 'parts', hints: [
      'Start with the wall diagram. It tells you what that robot is missing.',
      'The parts drawer in the cabinet is worth opening. Take what is inside, and the screwdriver from the bench.',
      'Open the parts drawer, then pick up the arm assembly, the positronic module and the screwdriver.',
    ] };
  }
  if (!has(s, 'demoWitnessed')) {
    return { key: 'summon', hints: [
      'A robot is no use as an argument if Cutie never sees it.',
      'The intercom on the workshop wall will bring him over.',
      'Use the intercom in the Assembly Workshop, next to the converter door.',
    ] };
  }
  if (!has(s, 'accessGranted')) {
    if (!has(s, 'clueServing')) return { key: 'serving', hints: [
      'He keeps saying he serves the Master. Maybe ask him what that actually involves.',
      'Go to the converter chamber and Talk to Cutie. Ask about serving the Master.',
      'Talk to Cutie, then choose "What does serving the Master involve?"',
    ] };
    if (!has(s, 'clueSchematic')) return { key: 'schematic', hints: [
      'There must be a way to watch the converter without touching it.',
      'The service schematic in the converter chamber might show one.',
      'Look at the framed service schematic on the converter chamber wall, left of the converter.',
    ] };
    return { key: 'permission', hints: [
      'You know what he cares about, and how to watch without touching. Ask him.',
      'Talk to Cutie again. There should be a new question about watching from our quarters.',
      'Talk to Cutie and ask if you may watch the Master\'s instruments from the quarters.',
    ] };
  }
  if (!has(s, 'stormDone')) {
    return { key: 'storm', hints: [
      'He opened a feed, and it comes out in our quarters.',
      'The observation receiver is on the desk in the crew quarters. The reference sheet on the wall explains what to look for.',
      'Go to the crew quarters, read the reference sheet, then Use the observation receiver.',
    ] };
  }
  if (!has(s, 'stripTaken')) {
    return { key: 'strip', hints: [
      'The printer was chattering. It must have something.',
      'Pick up the chart strip from the strip-chart printer.',
      'Pick up the chart strip from the printer on the desk in the crew quarters.',
    ] };
  }
  const d = has(s, 'findingDirection'), f = has(s, 'findingFocus');
  if (!(d && f)) {
    if (d || f) {
      const need = d ? 'focus' : 'direction';
      return { key: 'board-' + need, hints: [
        `One trace is confirmed. The ${need} trace is still waiting for its reference.`,
        `Match the ${need} trace to the ${need} reference.`,
        `In the close-up, Use the ${need} trace with the ${need} reference. Select Use, tap the trace, then tap the reference.`,
      ] };
    }
    return { key: 'board', hints: [
      'Compare the strip against the reference marks on the board.',
      'Use the chart strip on the comparison board. Then match each beam trace to its own reference. Storm intensity is not a beam measurement.',
      'On the board, Use the direction trace with the direction reference, and the focus trace with the focus reference.',
    ] };
  }
  return { key: 'finale', hints: [
    'Cutie should hear this from us.',
    'There is an intercom panel in the crew quarters, linked to the converter chamber.',
    'Use the intercom panel on the quarters wall, near the hatch.',
  ] };
}

// ---------------------------------------------------------------------------- dialogue
export interface Choice { id: string; text: string; end?: boolean }

const REFUSALS = [
  'No. The Master\'s instruments are in my care.',
  'I understand the request, Powell. The answer remains no.',
  'Courteously, and finally: no.',
];

export function dialogueChoices(id: 'cutie' | 'donovan', s: GameState): Choice[] {
  if (id === 'cutie') {
    const out: Choice[] = [
      { id: 'who', text: 'Who made you, Cutie?' },
      { id: 'serve', text: 'What does serving the Master involve?' },
      { id: 'demand', text: 'We need the controls, Cutie.' },
      { id: 'shift', text: 'Let us run the storm shift ourselves.' },
    ];
    if (has(s, 'accessGranted')) out.push({ id: 'feed', text: 'About that observation feed...' });
    else if (has(s, 'clueServing') && has(s, 'clueSchematic') && has(s, 'demoWitnessed')) {
      out.push({ id: 'observe', text: 'May we watch the Master\'s instruments from our quarters? Watching only.' });
    }
    out.push({ id: 'bye', text: 'That is all for now.', end: true });
    return out;
  }
  return [
    { id: 'next', text: 'What should we do next?' },
    { id: 'cutie', text: 'What do you make of Cutie?' },
    { id: 'bye', text: 'Never mind.', end: true },
  ];
}

export function dialogueSteps(id: 'cutie' | 'donovan', choice: string, s: GameState): Step[] {
  const c = dialogueChoices(id, s).find((x) => x.id === choice);
  if (!c) return [];
  if (id === 'cutie') {
    switch (choice) {
      case 'who': return [
        say('powell', c.text),
        say('cutie', 'I think, therefore I am, and what exists was made. You are frail and brief. The Master made me.'),
      ];
      case 'serve': return [
        say('powell', c.text),
        say('cutie', 'Balance. The Master sends its beam, and I keep every instrument in its proper order: direction, focus, the quiet currents. Nothing may drift.'),
        flag('clueServing'),
      ];
      case 'demand':
      case 'shift': {
        const n = s.counters.refusals ?? 0;
        return [say('powell', c.text), say('cutie', REFUSALS[n % REFUSALS.length]), { t: 'count', name: 'refusals', add: 1 }];
      }
      case 'observe': return [
        say('powell', c.text),
        say('cutie', 'Observation without interference. The demonstration showed me your craft is real, though not your claim. Very well: the feed will open.'),
        flag('accessGranted'),
        say('cutie', 'Watch, Powell, and see what the Master achieves through me.'),
        say('powell', 'The receiver is in our quarters. Let us see what he does with it.'),
        objective(OBJECTIVES.observe),
      ];
      case 'feed': return [
        say('powell', c.text),
        say('cutie', 'It is open. Observe as you like. Please do not touch.'),
      ];
      default: return [];
    }
  }
  switch (choice) {
    case 'next': return [say('powell', c.text), ...hintSteps(s)];
    case 'cutie': return [
      say('powell', c.text),
      say('donovan', 'A polite, immovable lump of logic. I like him, and I want to throw a wrench at him.'),
    ];
    default: return [];
  }
}

/** The caption lines for the next hint. Donovan speaks it, over the intercom when away from the quarters. */
export function hintSteps(s: GameState): Step[] {
  const { key, hints } = currentHint(s);
  const lvl = Math.min(2, s.counters['hint:' + key] ?? 0);
  const who: SpeakerKey = s.room === 'quarters' ? 'donovan' : 'donovan_ic';
  return [say(who, hints[lvl]), { t: 'count', name: 'hint:' + key, add: lvl < 2 ? 1 : 0 }];
}

// ---------------------------------------------------------------------------- behaviours
type Fn = (s: GameState) => Step[];
interface Behaviour {
  look: Fn;
  pickup?: Fn; open?: Fn; talk?: Fn; use?: Fn;
  useWith?: Partial<Record<ItemId, Fn>>;
  give?: Partial<Record<ItemId, Fn>>;
  /** hotspot-with-hotspot use (close-up traces on references) */
  useOn?: Record<string, Fn>;
}
const P = (t: string) => say('powell', t);
const one = (t: string): Fn => () => [P(t)];

export const ITEM_LOOK: Record<ItemId, string> = {
  screwdriver: 'A flathead screwdriver. Splendidly ordinary.',
  arm: 'Arm assembly: brass joints, a retaining flange, one shoulder fitting.',
  module: 'Positronic module. Warm, humming, faintly teal.',
  mug: 'Mike\'s mug. "World\'s Second-Best Engineer."',
  strip: 'The chart strip: three traces from the receiver. Storm intensity, beam direction error, focus error.',
};

const missingParts = (s: GameState) => {
  const miss: string[] = [];
  if (!has(s, 'armFitted')) miss.push('the shoulder socket is still empty');
  if (!has(s, 'moduleFitted')) miss.push('the head socket is still empty');
  return miss.join(', and ');
};

export const BEHAVIOURS: Record<string, Behaviour> = {
  // ---------------- workshop
  ws_door_quarters: { look: one('The hatch back to our quarters. Mike is behind it, probably eating.') },
  ws_door_converter: { look: one('The way to the converter chamber, where Cutie holds court.') },
  ws_tools: {
    look: one('Every tool is outlined in paint on the board. Three outlines are empty. That would be Mike.'),
    pickup: one('They are hung with great pride. I will leave them hanging.'),
  },
  ws_diagram: {
    look: () => [P('The diagram: arm into the shoulder socket, positronic module into the head socket. Fit both, then tighten the retaining screws.'), flag('clueDiagram')],
    pickup: one('It is screwed to the wall. Properly.'),
  },
  ws_bench: {
    look: (s) => [P(has(s, 'screwdriverTaken') ? 'Scorched, scratched and loved. The best bench on the station.' : 'Scorched, scratched and loved. A screwdriver lies in the middle of it.')],
    pickup: one('It weighs more than both of us together.'),
  },
  ws_screwdriver: {
    look: one('A flathead screwdriver. Splendidly ordinary.'),
    pickup: (s) => (has(s, 'screwdriverTaken') ? [] : [give('screwdriver'), flag('screwdriverTaken'), P('Screwdriver. The one tool Mike has not lost.')]),
  },
  ws_drawer: {
    look: (s) => [P(has(s, 'drawerOpen') ? 'The parts drawer, standing open.' : 'A parts drawer, labelled in handwriting that hated labelling.')],
    open: (s) => (has(s, 'drawerOpen')
      ? [P(has(s, 'armTaken') && has(s, 'moduleTaken') ? 'Already open, and empty now.' : 'Already open. The parts are right there.')]
      : [sfx('drawer'), flag('drawerOpen'), P('Inside, packed in felt: an arm assembly and a positronic module.')]),
    use: (s) => (has(s, 'drawerOpen') ? [P('It is open. Take the parts out.')] : [sfx('drawer'), flag('drawerOpen'), P('Inside, packed in felt: an arm assembly and a positronic module.')]),
    pickup: one('The drawer is bolted in. The things inside are not.'),
  },
  ws_arm: {
    look: one(ITEM_LOOK.arm),
    pickup: (s) => (has(s, 'armTaken') ? [] : [give('arm'), flag('armTaken'), sfx('pickup'), P('Arm assembly.')]),
  },
  ws_module: {
    look: one(ITEM_LOOK.module),
    pickup: (s) => (has(s, 'moduleTaken') ? [] : [give('module'), flag('moduleTaken'), sfx('pickup'), P('Positronic module. It hums back.')]),
  },
  ws_robot: {
    look: (s) => {
      if (has(s, 'robotAssembled')) return [P('Assembled and humming. It looks like a cousin of Cutie\'s, if Cutie had any.')];
      if (has(s, 'armFitted') && has(s, 'moduleFitted')) return [P('Both parts are in, but the screws are not tight yet.')];
      if (has(s, 'armFitted') || has(s, 'moduleFitted')) return [P(`One part is fitted. ${missingParts(s).replace(/^./, (c) => c.toUpperCase())}.`)];
      return [P('An unfinished maintenance robot. A shoulder socket and a head socket both gape empty.')];
    },
    talk: (s) => [P(has(s, 'robotAssembled') ? 'It beeps once, in no particular direction. Yet.' : 'No module, no mind. It cannot answer.')],
    pickup: one('It is bolted to its cradle, and heavier than it looks.'),
    open: one('Its panels open when it is finished, not before.'),
    use: one('Use what with it? A part from my inventory might do.'),
    give: { },
    useWith: {
      arm: (s) => (has(s, 'robotAssembled') || has(s, 'armFitted') ? [P('The shoulder is already fitted.')] : [take('arm'), flag('armFitted'), sfx('click'), P('The arm clicks into the shoulder socket.')]),
      module: (s) => (has(s, 'robotAssembled') || has(s, 'moduleFitted') ? [P('The head socket is already fitted.')] : [take('module'), flag('moduleFitted'), sfx('click'), P('The module seats in the head socket with a soft chime.')]),
      screwdriver: (s) => {
        if (has(s, 'robotAssembled')) return [P('Everything is already tight.')];
        if (!(has(s, 'armFitted') && has(s, 'moduleFitted'))) return [P(`Not yet: ${missingParts(s)}. The diagram says both sockets first, then the screws.`)];
        return [
          sfx('tool'), wait(500), flag('robotAssembled'), sfx('activate'),
          P('Screws tight. The robot\'s eyes flicker teal, and it sits up.'),
          flag('botActive'),
          P('Good. Now to get Cutie to look at it.'),
          objective(OBJECTIVES.summon),
        ];
      },
    },
  },
  ws_intercom: {
    look: one('The workshop intercom. It reaches every room, including Cutie\'s.'),
    pickup: one('It is part of the wall.'),
    use: (s) => {
      if (has(s, 'demoWitnessed')) return [P('Cutie has seen the robot. Calling him again will not change his mind.')];
      if (!has(s, 'robotAssembled')) return [P('Not yet. I would only be inviting him to look at a pile of parts.')];
      return demoScene();
    },
    talk: (s) => BEHAVIOURS.ws_intercom.use!(s),
  },

  // ---------------- converter chamber
  cv_door: { look: one('Back to the workshop.') },
  cv_schematic: {
    look: () => [
      P('The service schematic. The receiver in our quarters can copy instrument readings without touching this console. It only listens.'),
      flag('clueSchematic'),
    ],
    pickup: one('I would rather not carry the station\'s plumbing around.'),
  },
  cv_gauges: {
    look: one('An instrument rack. Teal lamps, steady needles. Cutie keeps them very tidy.'),
    use: one('Cutie is watching. I will leave the dials alone.'),
  },
  cv_converter: {
    look: one('The energy converter: a brass-and-copper cathedral that turns sunlight into a beam for Earth. Cutie calls it the Master.'),
    talk: one('It hums. It does not take questions.'),
    use: one('Hands off. This is Cutie\'s sacred machinery now, and he is standing right there.'),
    open: one('There is no door. Only awe.'),
    pickup: one('Ha.'),
  },
  cv_console: {
    look: one('The operating console. Power, focus, direction trim. All under Cutie\'s hands.'),
    use: () => [say('cutie', 'The console is the Master\'s instrument, and it is in my care.'), P('He has shifted exactly one step to the left. It is somehow very final.')],
    open: one('Nothing on it opens. Only Cutie operates it.'),
  },
  cv_cutie: {
    look: one('QT-1, nicknamed Cutie. Polished, serene, and entirely sure of himself.'),
    talk: () => [{ t: 'dialogue', id: 'cutie' }],
    pickup: one('He weighs several hundred pounds, and he would object.'),
    open: one('He is not a drawer.'),
    use: one('Use Cutie? He would only quote philosophy at me.'),
    give: {
      screwdriver: () => [P('Would you like a screwdriver?'), say('cutie', 'A tool of your craft. I need none; the Master adjusts me directly.')],
      mug: () => [P('Coffee?'), say('cutie', 'Heated liquid? No. My sustenance comes from the Master.')],
      strip: () => [say('cutie', 'A record of the storm? Interesting. But the Master\'s work needs no commentary.')],
    },
  },
  cv_follower_a: {
    look: one('A follower robot, polishing a valve with great ritual. It has adopted Cutie\'s theology and a very good posture.'),
    talk: () => [say('follower', 'We serve the Master. Cutie is its prophet. Ask him.')],
    use: one('It politely turns away from my hands.'),
    pickup: one('It would not appreciate being carried.'),
  },
  cv_follower_b: {
    look: one('Another follower. It bows to the converter every few minutes, perfectly in time with the first.'),
    talk: () => [say('follower', 'The prophet speaks for the Master. Ask the prophet.')],
    use: one('It politely turns away from my hands.'),
    pickup: one('It would not appreciate being carried.'),
  },

  // ---------------- quarters
  qt_hatch: { look: one('The hatch back to the workshop.') },
  qt_bunks: {
    look: one('Two bunks. Mine is the one without a boot print on the pillow.'),
    use: one('Not now. There is a beam to watch.'),
    open: one('Not a drawer. Not a door. Just a bunk.'),
    pickup: one('I would need a bigger pocket.'),
  },
  qt_viewport: {
    look: (s) => [P(has(s, 'stormDone')
      ? 'The green shimmer is fading. Whatever that was, it has passed.'
      : has(s, 'accessGranted')
        ? 'The stars have a faint green shimmer now. The storm front is arriving.'
        : 'Cold stars and the sun\'s glare. Somewhere out there, an electron storm is on its way.')],
    open: one('It is a viewport. It does not open, and I am glad.'),
  },
  qt_mug: {
    look: one(ITEM_LOOK.mug),
    pickup: (s) => (has(s, 'mugTaken') ? [] : [give('mug'), flag('mugTaken'), sfx('pickup'), P('Mike\'s mug. Stone cold, naturally.')]),
  },
  qt_sheet: {
    look: () => [P('Technical reference: beam direction error and focus error must stay inside their marked tolerance bands. Storm intensity alone says nothing about the beam.'), flag('clueSheet')],
    pickup: one('Mike pinned it there. He will notice.'),
  },
  qt_receiver: {
    look: (s) => [P(has(s, 'stormDone') ? 'The receiver has finished recording. It only ever listened.' : 'The observation receiver. It copies instrument readings from the converter and cannot send a thing back.')],
    use: (s) => {
      if (has(s, 'stormDone')) return [P('The recording is finished. The printer has the strip.')];
      if (!has(s, 'accessGranted')) return [P('No feed. Cutie has to permit it first.')];
      return [
        P('Receiver on. It only records; Cutie keeps the controls.'),
        flag('finalSequence'),
        { t: 'storm' },
        flag('stormDone'), flag('printed'),
        donovanSay('That was the worst of it. The printer is spitting out a strip, Greg.'),
        P('Let us see what the beam did.'),
        objective(OBJECTIVES.strip),
      ];
    },
    open: one('The casing stays shut. It does not need my help.'),
    pickup: one('It is bolted to the desk. Mike did that after the last incident.'),
  },
  qt_printer: {
    look: (s) => [P(has(s, 'printed') && !has(s, 'stripTaken') ? 'The printer has a long strip waiting in its tray.' : 'A strip-chart printer. Empty and waiting.')],
    pickup: (s) => {
      if (has(s, 'stripTaken')) return [P('The tray is empty now.')];
      if (!has(s, 'printed')) return [P('Nothing printed yet.')];
      return [give('strip'), flag('stripTaken'), sfx('pickup'), P('The chart strip. Three traces.'), objective(OBJECTIVES.compare)];
    },
    use: (s) => BEHAVIOURS.qt_printer.pickup!(s),
  },
  qt_board: {
    look: one('The comparison board: an illuminated light box with reference marks for direction and focus.'),
    use: one('It needs something to compare. A chart strip, perhaps.'),
    pickup: one('It is built into the wall. Mike calls it "the Tribunal".'),
    useWith: {
      strip: () => [P('Let us lay it against the board.'), { t: 'closeup', open: true }],
    },
  },
  qt_intercom: {
    look: one('An intercom panel linked to the converter chamber. I can reach Cutie from here.'),
    use: (s) => {
      if (has(s, 'findingDirection') && has(s, 'findingFocus') && !has(s, 'ended')) return endingScene();
      if (has(s, 'ended')) return [];
      return [P('Nothing to tell him yet. I want evidence first.')];
    },
    talk: (s) => BEHAVIOURS.qt_intercom.use!(s),
  },
  qt_donovan: {
    look: one('Mike Donovan: impatient, red-haired, and still, as far as I can tell, awake.'),
    talk: () => [{ t: 'dialogue', id: 'donovan' }],
    use: one('Use Mike? He would bite.'),
    pickup: one('He would object, loudly.'),
    open: one('Mike is not a drawer. He is mostly opinions.'),
    give: {
      mug: () => [take('mug'), flag('mugGiven'), P('Your mug.'), say('donovan', 'Cold, naturally. I accept the sentiment.')],
      screwdriver: () => [P('Screwdriver?'), say('donovan', 'Last time I held one I "fixed" the toaster. Keep it.')],
      strip: (s) => [P('Take a look at this.'), say('donovan', has(s, 'findingDirection') ? 'I see flat lines where it counts.' : 'A big squiggle, then two flat ones. I think the flat ones are the good ones.')],
    },
  },

  // ---------------- comparison board close-up
  cu_storm: {
    look: one('Storm intensity: a ragged mountain range. Violent, and that is all it tells me about the weather.'),
    useOn: {
      cu_ref_dir: () => [P('The storm trace blows through any band. Intensity is not beam error: the storm was violent, and that is a different question.')],
      cu_ref_focus: () => [P('Same answer. Storm intensity says nothing about focus. The beam is what matters, not the weather.')],
    },
  },
  cu_dir: {
    look: one('Beam direction error: a quiet, wandering line, never far from zero.'),
    useOn: {
      cu_ref_dir: (s) => has(s, 'findingDirection') ? [P('Already confirmed: direction stayed inside the band.')] : [flag('findingDirection'), sfx('confirm'), P('Direction error never leaves its band. The beam did not wander.'), ...(has(s, 'findingFocus') ? realization() : [])],
      cu_ref_focus: () => [P('Wrong reference. That band measures focus error; direction has its own.')],
    },
  },
  cu_focus: {
    look: one('Focus error: a small, steady wobble, all of it near the centre.'),
    useOn: {
      cu_ref_focus: (s) => has(s, 'findingFocus') ? [P('Already confirmed: focus stayed inside the band.')] : [flag('findingFocus'), sfx('confirm'), P('Focus stayed inside tolerance, start to finish.'), ...(has(s, 'findingDirection') ? realization() : [])],
      cu_ref_dir: () => [P('Wrong reference. That band is for direction error; focus has its own.')],
    },
  },
  cu_ref_dir: { look: one('The direction reference: a tolerance band, with the limits marked. Direction error must stay between the brackets.') },
  cu_ref_focus: { look: one('The focus reference: a second tolerance band, with its own limits. Focus error must stay inside it.') },
};

function donovanSay(text: string): Step { return say('donovan', text); }

export function demoScene(): Step[] {
  return [
    say('powell_ic', 'Cutie, could you come to the workshop? We have built something.'),
    flag('cutieAtWorkshop'),
    { t: 'actor', who: 'cutie', op: 'appear', x: 306, y: 138, dir: -1 },
    { t: 'actor', who: 'cutie', op: 'walk', x: 176, y: 146 },
    say('cutie', 'A robot, assembled from parts. Charming work.'),
    P('Humans built it, Cutie. Humans built you the same way.'),
    { t: 'actor', who: 'cutie', op: 'face', dir: 1 },
    say('cutie', 'The assembly is sound, Powell. But you copy a pattern the Master made first. Your evidence is practical. My explanation stands.'),
    P('He accepts the screws and rejects the screwdriver.'),
    { t: 'actor', who: 'cutie', op: 'walk', x: 306, y: 138 },
    { t: 'actor', who: 'bot', op: 'face', dir: 1 },
    wait(500),
    P('The new robot turned to follow Cutie. Not me.'),
    { t: 'actor', who: 'cutie', op: 'leave' },
    flag('cutieAtWorkshop', false),
    flag('demoWitnessed'),
    P('Fine. If he will not believe us, I will find out whether he can run this station through the storm.'),
    objective(OBJECTIVES.investigate),
  ];
}

/** Both findings confirmed: the humans understand what Cutie did. */
export function realization(): Step[] {
  return [
    { t: 'closeup', open: false },
    take('strip'),
    say('donovan', 'Both inside tolerance, the whole storm? The robot who calls us a rumour held the beam?'),
    P('He did. Whatever he believes, he kept it perfect.'),
    objective(OBJECTIVES.finale),
  ];
}

export function endingScene(): Step[] {
  return [
    P('We should tell him.'),
    say('powell_ic', 'Cutie, the beam held through the storm. Well done.'),
    say('cutie_ic', 'Naturally. I kept the Master\'s instruments in balance. You have only now confirmed it.'),
    say('donovan', 'He is wrong about everything, and right about the beam.'),
    P('So we log it: robot operating normally, theology unresolved.'),
    say('donovan', 'And underneath: do not argue with Cutie. Just let him work.'),
    { t: 'ending' },
  ];
}

// ---------------------------------------------------------------------------- resolution
const FALLBACK = {
  pickup: (n: string) => `I will leave the ${n} where it is.`,
  use: (n: string) => `I cannot think what to do with the ${n} right now.`,
  open: (n: string) => `The ${n} does not open.`,
  talk: (n: string) => `The ${n} has nothing to say.`,
  give: (n: string) => `I do not think the ${n} wants that.`,
};

export function itemName(i: string) {
  return ({ screwdriver: 'screwdriver', arm: 'arm assembly', module: 'positronic module', mug: 'mug', strip: 'chart strip' } as Record<string, string>)[i] ?? i;
}

export function exitSteps(s: GameState, id: string): Step[] {
  const h = HS_BY_ID[id];
  if (!h.exit) return [];
  if (id === 'qt_hatch' && has(s, 'finalSequence')) {
    return [say('donovan', 'Nobody walks the corridors during an electron storm, Greg. Not even robots.')];
  }
  return [{ t: 'room', to: h.exit.to, x: h.exit.x, y: h.exit.y, face: h.exit.face }];
}

export function resolve(s: GameState, verb: string, a: Ref, b?: Ref): Step[] {
  const hsA = a.kind === 'hs' ? HS_BY_ID[a.id] : undefined;
  if (verb === 'look') {
    if (a.kind === 'item') return [P(ITEM_LOOK[a.id as ItemId])];
    const beh = BEHAVIOURS[a.id];
    return beh ? beh.look(s) : [P(`It is a ${hsA!.name}.`)];
  }
  if (verb === 'use' && hsA?.exit) return exitSteps(s, a.id);
  if (verb === 'open' && hsA?.exit) return exitSteps(s, a.id);
  if (verb === 'use' || verb === 'give') {
    if (a.kind === 'item' && b) {
      if (b.kind === 'item') return [P('That does nothing. They are not meant to go together.')];
      const beh = BEHAVIOURS[b.id];
      const fn = verb === 'use' ? beh?.useWith?.[a.id as ItemId] : beh?.give?.[a.id as ItemId];
      if (fn) return fn(s);
      const nm = HS_BY_ID[b.id].name;
      return [P(verb === 'use' ? `I cannot see how the ${itemName(a.id)} helps with the ${nm}.` : FALLBACK.give(nm))];
    }
    if (a.kind === 'hs' && b?.kind === 'hs') {
      const fn = BEHAVIOURS[a.id]?.useOn?.[b.id];
      if (fn) return fn(s);
      return [P('Those two do not go together. A trace is compared with a reference.')];
    }
    if (a.kind === 'hs' && b?.kind === 'item') return resolve(s, verb, b, a);
    if (a.kind === 'hs') {
      const fn = BEHAVIOURS[a.id]?.use;
      return fn ? fn(s) : [P(FALLBACK.use(hsA!.name))];
    }
    return [P('Use it with what?')];
  }
  if (a.kind === 'item') return [P(ITEM_LOOK[a.id as ItemId]), P(verb === 'pickup' ? 'Already in my pocket.' : 'That is not something I can do with it.')];
  const beh = BEHAVIOURS[a.id];
  const fn = verb === 'pickup' ? beh?.pickup : verb === 'open' ? beh?.open : verb === 'talk' ? beh?.talk : undefined;
  if (fn) return fn(s);
  const f = FALLBACK[verb as 'pickup' | 'open' | 'talk'];
  return [P(f ? f(hsA!.name) : 'Nothing happens.')];
}

/** Hotspots that can start a Give (valid recipients). */
export const GIVE_TARGETS = new Set(['cv_cutie', 'qt_donovan']);

export const OPENING: Step[] = [
  say('donovan_ic', 'Greg, the electron storm reaches the beam in a few hours, and Cutie still will not take orders from us.'),
  say('powell', 'He runs the station flawlessly and calls the converter "the Master". Fine. I just want proof he can ride out the storm.'),
  say('donovan_ic', 'Start by proving we made him. Build a robot where he can watch.'),
  say('powell', 'The parts should be around here somewhere.'),
  objective(OBJECTIVES.assemble),
];
