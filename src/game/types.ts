export type RoomId = 'workshop' | 'converter' | 'quarters';
export type SceneId = RoomId | 'board';
export type Verb = 'look' | 'pickup' | 'use' | 'talk' | 'open' | 'give';
export const VERBS: Verb[] = ['look', 'pickup', 'use', 'talk', 'open', 'give'];
export const VERB_LABEL: Record<Verb, string> = { look: 'Look at', pickup: 'Pick up', use: 'Use', talk: 'Talk to', open: 'Open', give: 'Give' };
export type ItemId = 'screwdriver' | 'arm' | 'module' | 'mug' | 'strip';
export const ITEM_NAME: Record<ItemId, string> = {
  screwdriver: 'screwdriver', arm: 'arm assembly', module: 'positronic module', mug: 'mug', strip: 'chart strip',
};
export type SpeakerKey = 'powell' | 'donovan' | 'cutie' | 'follower' | 'donovan_ic' | 'powell_ic' | 'cutie_ic' | 'note';

export type ActorId = 'cutie' | 'bot' | 'donovan';

export type Step =
  | { t: 'say'; who: SpeakerKey; text: string }
  | { t: 'flag'; name: string; value?: boolean }
  | { t: 'count'; name: string; add: number }
  | { t: 'give'; item: ItemId }
  | { t: 'take'; item: ItemId }
  | { t: 'room'; to: RoomId; x: number; y: number; face: 1 | -1 }
  | { t: 'dialogue'; id: 'cutie' | 'donovan' }
  | { t: 'closeup'; open: boolean }
  | { t: 'actor'; who: ActorId; op: 'appear' | 'walk' | 'face' | 'leave'; x?: number; y?: number; dir?: 1 | -1 }
  | { t: 'wait'; ms: number }
  | { t: 'sfx'; name: string }
  | { t: 'storm' }
  | { t: 'objective'; text: string }
  | { t: 'ending' };

export interface GameState {
  room: RoomId;
  px: number;
  py: number;
  face: 1 | -1;
  flags: Record<string, boolean>;
  inv: ItemId[];
  counters: Record<string, number>;
}

export interface Ref { kind: 'hs' | 'item'; id: string }

export interface HotspotDef {
  id: string;
  name: string;
  scene: SceneId;
  /** world rect [x, y, w, h] in 320x180 logical pixels */
  rect: [number, number, number, number];
  /** interaction position (feet) */
  walk: [number, number];
  face?: 1 | -1;
  exit?: { to: RoomId; x: number; y: number; face: 1 | -1 };
  /** hotspot that can be picked as the first object of "Use" (close-up traces) */
  usable?: boolean;
  visible?: (s: GameState) => boolean;
  /** dynamic rect (e.g. a character who moves) */
  dynRect?: (s: GameState) => [number, number, number, number];
  dynWalk?: (s: GameState) => [number, number];
}
