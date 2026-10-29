import type { HotspotDef, RoomId, SceneId, GameState } from './types';
import type { Walkable } from './nav';
import { has } from './state';

export const ROOM_NAMES: Record<RoomId, string> = { workshop: 'Assembly Workshop', converter: 'Converter Chamber', quarters: 'Crew Quarters' };

export const WALKABLE: Record<RoomId, Walkable> = {
  workshop: { areas: [[12, 128, 296, 44]], blocked: [[0, 146, 32, 40], [290, 140, 30, 40]] },
  converter: { areas: [[12, 128, 34, 44], [12, 148, 296, 24]], blocked: [[0, 148, 28, 40], [294, 120, 26, 60]] },
  quarters: { areas: [[10, 128, 280, 44]], blocked: [[0, 146, 42, 40], [244, 148, 32, 40]] },
};

/** Default entry points per room (used on New Game). */
export const START = { workshop: [150, 146] as [number, number] };

const hs = (id: string, name: string, scene: SceneId, rect: [number, number, number, number], walk: [number, number], extra: Partial<HotspotDef> = {}): HotspotDef =>
  ({ id, name, scene, rect, walk, ...extra });

export const DONOVAN_POS = (s: GameState): [number, number] => (has(s, 'finalSequence') ? [264, 142] : [124, 134]);
export const CUTIE_HOME: [number, number] = [218, 130];
export const FOLLOWER_A: [number, number] = [80, 128];
export const FOLLOWER_B: [number, number] = [140, 126];
export const BOT_POS: [number, number] = [224, 123];

export const HOTSPOTS: HotspotDef[] = [
  // ---- Assembly Workshop
  hs('ws_door_quarters', 'door to Crew Quarters', 'workshop', [4, 40, 36, 82], [26, 134], { face: -1, exit: { to: 'quarters', x: 276, y: 140, face: -1 } }),
  hs('ws_door_converter', 'door to Converter Chamber', 'workshop', [280, 40, 36, 82], [296, 134], { face: 1, exit: { to: 'converter', x: 30, y: 152, face: 1 } }),
  hs('ws_tools', 'hanging tools', 'workshop', [46, 36, 48, 46], [70, 132], { face: -1 }),
  hs('ws_diagram', 'wall diagram', 'workshop', [102, 30, 60, 56], [132, 132], { face: -1 }),
  hs('ws_bench', 'workbench', 'workshop', [48, 96, 108, 28], [106, 134]),
  hs('ws_screwdriver', 'screwdriver', 'workshop', [84, 93, 26, 11], [98, 134], { visible: (s) => !has(s, 'screwdriverTaken') }),
  hs('ws_drawer', 'parts drawer', 'workshop', [166, 88, 44, 28], [188, 134]),
  hs('ws_arm', 'arm assembly', 'workshop', [172, 102, 16, 12], [188, 134], { visible: (s) => has(s, 'drawerOpen') && !has(s, 'armTaken') }),
  hs('ws_module', 'positronic module', 'workshop', [190, 102, 16, 12], [188, 134], { visible: (s) => has(s, 'drawerOpen') && !has(s, 'moduleTaken') }),
  hs('ws_robot', 'maintenance robot', 'workshop', [207, 78, 34, 46], [224, 136]),
  hs('ws_chainsaw', 'chainsaw', 'workshop', [34, 78, 24, 46], [46, 134]),
  hs('ws_intercom', 'intercom', 'workshop', [247, 60, 24, 34], [258, 134], { face: 1 }),

  // ---- Converter Chamber
  hs('cv_door', 'door to Assembly Workshop', 'converter', [6, 62, 34, 68], [30, 152], { face: -1, exit: { to: 'workshop', x: 296, y: 138, face: -1 } }),
  hs('cv_schematic', 'service schematic', 'converter', [54, 38, 48, 42], [84, 150]),
  hs('cv_gauges', 'instrument rack', 'converter', [64, 90, 50, 36], [92, 150]),
  hs('cv_converter', 'energy converter', 'converter', [104, 4, 112, 124], [160, 152]),
  hs('cv_console', 'operating console', 'converter', [230, 74, 76, 56], [268, 152]),
  hs('cv_cutie', 'Cutie', 'converter', [207, 76, 22, 56], [206, 152], { visible: (s) => !has(s, 'cutieAtWorkshop') }),
  hs('cv_follower_a', 'follower robot', 'converter', [70, 91, 20, 38], [86, 150]),
  hs('cv_follower_b', 'second follower robot', 'converter', [130, 89, 20, 38], [140, 150]),

  // ---- Crew Quarters
  hs('qt_hatch', 'hatch to Assembly Workshop', 'quarters', [288, 34, 30, 90], [278, 140], { face: 1, exit: { to: 'workshop', x: 30, y: 138, face: 1 } }),
  hs('qt_bunks', 'bunks', 'quarters', [2, 42, 86, 82], [56, 136]),
  hs('qt_viewport', 'viewport', 'quarters', [96, 22, 58, 58], [128, 134]),
  hs('qt_plant', 'Chuck the plant', 'quarters', [83, 86, 20, 38], [94, 136]),
  hs('qt_mug', 'mug', 'quarters', [98, 74, 14, 11], [104, 134], { visible: (s) => !has(s, 'mugTaken') && !has(s, 'mugGiven') }),
  hs('qt_sheet', 'technical reference sheet', 'quarters', [158, 24, 26, 34], [170, 134]),
  hs('qt_receiver', 'observation receiver', 'quarters', [150, 72, 36, 30], [166, 134]),
  hs('qt_printer', 'strip-chart printer', 'quarters', [188, 76, 36, 26], [206, 134]),
  hs('qt_board', 'comparison board', 'quarters', [222, 36, 40, 60], [240, 134]),
  hs('qt_intercom', 'intercom panel', 'quarters', [264, 54, 22, 42], [270, 136]),
  hs('qt_donovan', 'Donovan', 'quarters', [112, 84, 24, 52], [100, 138], {
    dynRect: (s) => { const [x, y] = DONOVAN_POS(s); return [x - 12, y - 50, 24, 52]; },
    dynWalk: (s) => { const [x, y] = DONOVAN_POS(s); return has(s, 'finalSequence') ? [x - 22, y + 4] : [x - 22, y + 4]; },
  }),

  // ---- Comparison board close-up
  hs('cu_storm', 'storm intensity trace', 'board', [12, 22, 186, 38], [0, 0], { usable: true }),
  hs('cu_dir', 'beam direction trace', 'board', [12, 66, 186, 38], [0, 0], { usable: true }),
  hs('cu_focus', 'focus error trace', 'board', [12, 110, 186, 38], [0, 0], { usable: true }),
  hs('cu_ref_dir', 'direction reference', 'board', [208, 26, 100, 62], [0, 0]),
  hs('cu_ref_focus', 'focus reference', 'board', [208, 96, 100, 62], [0, 0]),
];

export const HS_BY_ID: Record<string, HotspotDef> = Object.fromEntries(HOTSPOTS.map((h) => [h.id, h]));

export function hotspotsIn(scene: SceneId, s: GameState): HotspotDef[] {
  return HOTSPOTS.filter((h) => h.scene === scene && (!h.visible || h.visible(s)));
}
export function rectOf(h: HotspotDef, s: GameState): [number, number, number, number] {
  return h.dynRect ? h.dynRect(s) : h.rect;
}
export function walkOf(h: HotspotDef, s: GameState): [number, number] {
  return h.dynWalk ? h.dynWalk(s) : h.walk;
}
