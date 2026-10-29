import { Assets } from '../render/assets';
import { Renderer, type Actor, type View } from '../render/renderer';
import { AudioEngine } from '../audio/audio';
import { applyStep } from './apply';
import {
  GIVE_TARGETS, OPENING, SPEAKERS, dialogueChoices, dialogueSteps, hintSteps, itemName, objectiveText, resolve, say,
} from './content';
import { HOTSPOTS, HS_BY_ID, hotspotsIn, rectOf, walkOf, WALKABLE, BOT_POS, CUTIE_HOME, DONOVAN_POS, FOLLOWER_A, FOLLOWER_B, ROOM_NAMES } from './rooms';
import { findPath } from './nav';
import { clearSave, has, load, newState, save } from './state';
import { ITEM_NAME, VERB_LABEL, type GameState, type HotspotDef, type ItemId, type Ref, type SceneId, type SpeakerKey, type Step, type Verb } from './types';
import type { UI } from '../ui/ui';

class Abort extends Error {}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const STORM_LEN = 12;

interface Cmd { verb: Verb; a: Ref; b?: Ref; hs: HotspotDef | null; label: string }

export class Engine {
  state: GameState = newState();
  scene: SceneId = 'workshop';
  assets = new Assets();
  renderer!: Renderer;
  audio = new AudioEngine();
  ui!: UI;
  t = 0;
  stormT: number | null = null;
  reduced = false;
  reveal = false;
  pending: { verb: Verb | null; a?: Ref } = { verb: null };
  cmd: Cmd | null = null;
  busy = false;
  inGame = false;
  private gen = 0;
  private advanceResolve: (() => void) | null = null;
  private skipResolve: (() => void) | null = null;
  private path: [number, number][] = [];
  private speed = 95;
  private lastStep = -1;
  private hover: HotspotDef | null = null;
  private sentenceOverride: string | null = null;
  private cutieShown = false;
  private botFaceOverride: 1 | -1 | null = null;
  private selectedBoard: string | null = null;
  private dragFrom: HotspotDef | null = null;
  private legWalk: { x: number; y: number }[] = [];

  actors: Record<string, Actor> = {
    powell: this.mk('powell', 'powell', 150, 146, 1),
    donovan: this.mk('donovan', 'donovan', 124, 134, -1),
    cutie: this.mk('cutie', 'cutie', CUTIE_HOME[0], CUTIE_HOME[1], -1),
    followerA: this.mk('followerA', 'follower', FOLLOWER_A[0], FOLLOWER_A[1], 1),
    followerB: this.mk('followerB', 'follower', FOLLOWER_B[0], FOLLOWER_B[1], 1),
  };
  private mk(id: string, sprite: Actor['sprite'], x: number, y: number, face: 1 | -1): Actor {
    return { id, sprite, x, y, face, walking: false, walkT: 0, talking: false, reach: 0, visible: false };
  }

  async init(canvas: HTMLCanvasElement, ui: UI) {
    this.ui = ui;
    await this.assets.load();
    this.renderer = new Renderer(canvas, this.assets);
    this.reduced = (() => { try { const p = localStorage.getItem('reason.reduced'); if (p !== null) return p === '1'; } catch { /* ignore */ } return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; })();
    try { this.audio.muted = localStorage.getItem('reason.muted') === '1'; } catch { /* ignore */ }
    this.bindCanvas(canvas);
    this.syncActors();
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      this.update(dt); this.renderer.draw(this.view());
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    this.installDebug();
  }

  // ------------------------------------------------------------------ view and loop
  private view(): View {
    return { scene: this.scene, state: this.state, t: this.t, actors: this.actors, botFace: this.botFace(), stormT: this.stormT, reduced: this.reduced, selected: this.selectedBoard };
  }
  private botFace(): 1 | -1 {
    if (this.botFaceOverride) return this.botFaceOverride;
    if (has(this.state, 'demoWitnessed')) return 1;
    return this.actors.powell.x >= BOT_POS[0] ? 1 : -1;
  }

  private update(dt: number) {
    this.t += dt;
    const p = this.actors.powell;
    if (this.inGame && this.path.length && this.scene !== 'board') {
      const [tx, ty] = this.path[0];
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (d <= step) { p.x = tx; p.y = ty; this.path.shift(); } else { p.x += (dx / d) * step; p.y += (dy / d) * step; }
      if (Math.abs(dx) > 0.5) p.face = dx > 0 ? 1 : -1;
      p.walking = true; p.walkT += dt;
      const f = Math.floor(p.walkT * 9) % 6;
      if ((f === 0 || f === 3) && f !== this.lastStep) this.audio.play('step');
      this.lastStep = f;
      if (!this.path.length) { p.walking = false; this.lastStep = -1; this.arrived(); }
    }
    if (p.reach > 0) p.reach = Math.max(0, p.reach - dt);
    // walking actors driven by scripts or by Donovan's final-sequence reposition
    for (const a of Object.values(this.actors)) {
      if (a.id === 'powell') continue;
      const w = this.legWalkOf(a.id);
      if (!w) { if (a.id !== 'donovan') a.walking = false; continue; }
      const dx = w.x - a.x, dy = w.y - a.y, d = Math.hypot(dx, dy), st = 80 * dt;
      if (d <= st) { a.x = w.x; a.y = w.y; a.walking = false; } else { a.x += dx / d * st; a.y += dy / d * st; a.face = dx > 0 ? 1 : -1; a.walking = true; a.walkT += dt; }
    }
    this.driveDonovan(dt);
    // ambient follower ritual
    const fa = this.actors.followerA, fb = this.actors.followerB;
    fa.bow = (this.t % 9) > 4 && (this.t % 9) < 5.8 ? 1 : 0;
    fb.bow = ((this.t + 3) % 11) > 7 && ((this.t + 3) % 11) < 8.8 ? 1 : 0;
    // faces
    if (this.scene === 'quarters') this.actors.donovan.face = p.x >= this.actors.donovan.x ? 1 : -1;
    if (this.scene === 'converter' && !has(this.state, 'cutieAtWorkshop')) this.actors.cutie.face = p.x >= this.actors.cutie.x ? 1 : -1;
    if (this.stormT !== null) {
      this.stormT += dt;
      if (this.stormT >= STORM_LEN) this.finishStorm();
    }
  }
  private legWalkOf(id: string): { x: number; y: number } | null {
    return this.scriptTargets[id] ?? null;
  }
  private scriptTargets: Record<string, { x: number; y: number } | undefined> = {};

  private driveDonovan(dt: number) {
    const d = this.actors.donovan;
    if (this.scene !== 'quarters') return;
    const [tx, ty] = DONOVAN_POS(this.state);
    if (Math.hypot(tx - d.x, ty - d.y) > 1) {
      const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy), st = 70 * dt;
      if (dist <= st) { d.x = tx; d.y = ty; d.walking = false; } else { d.x += dx / dist * st; d.y += dy / dist * st; d.walking = true; d.walkT += dt; d.face = dx > 0 ? 1 : -1; }
    } else d.walking = false;
  }

  syncActors() {
    const a = this.actors, s = this.state;
    const here = this.scene === 'board' ? s.room : this.scene;
    a.powell.visible = true;
    a.donovan.visible = here === 'quarters';
    if (here === 'quarters') { const [x, y] = DONOVAN_POS(s); if (!this.donovanPlaced) { a.donovan.x = x; a.donovan.y = y; this.donovanPlaced = true; } }
    a.cutie.visible = here === 'converter' ? !has(s, 'cutieAtWorkshop') : here === 'workshop' ? has(s, 'cutieAtWorkshop') && this.cutieShown : false;
    if (here === 'converter' && !has(s, 'cutieAtWorkshop')) { a.cutie.x = CUTIE_HOME[0]; a.cutie.y = CUTIE_HOME[1]; }
    a.followerA.visible = a.followerB.visible = here === 'converter';
    this.audio.setRoom(here);
  }
  private donovanPlaced = false;

  // ------------------------------------------------------------------ input
  private bindCanvas(canvas: HTMLCanvasElement) {
    let down: { x: number; y: number; t: number } | null = null;
    canvas.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      const w = this.toWorld(e.clientX, e.clientY);
      this.dragFrom = this.scene === 'board' ? this.hotspotAt(w[0], w[1]) : null;
    });
    canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const from = this.dragFrom; this.dragFrom = null;
      down = null;
      const w = this.toWorld(e.clientX, e.clientY);
      if (moved > 14 && from?.usable) {
        const to = this.hotspotAt(w[0], w[1]);
        if (to && to !== from) { this.dragUse(from, to); return; }
      }
      if (moved > 14) return;
      this.tapScene(w[0], w[1], e.detail > 1 || false);
    });
    canvas.addEventListener('pointercancel', () => { down = null; this.dragFrom = null; });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const w = this.toWorld(e.clientX, e.clientY);
      const h = this.inGame && !this.busy ? this.hotspotAt(w[0], w[1]) : null;
      if (h !== this.hover) { this.hover = h; this.updateSentence(); }
    });
    canvas.addEventListener('pointerleave', () => { if (this.hover) { this.hover = null; this.updateSentence(); } });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.cancel();
      if ((e.key === 'Enter' || e.key === ' ') && this.advanceResolve && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); this.advance(); }
    });
  }

  toWorld(cx: number, cy: number): [number, number] {
    const r = this.ui.canvas.getBoundingClientRect();
    return [((cx - r.left) / r.width) * 320, ((cy - r.top) / r.height) * 180];
  }
  toScreen(x: number, y: number): [number, number] {
    const r = this.ui.canvas.getBoundingClientRect();
    return [r.left + (x / 320) * r.width, r.top + (y / 180) * r.height];
  }

  hotspotAt(wx: number, wy: number): HotspotDef | null {
    const list = hotspotsIn(this.scene, this.state);
    const scale = this.ui.canvas.getBoundingClientRect().width / 320;
    const inner: HotspotDef[] = [];
    const outer: { h: HotspotDef; d: number }[] = [];
    for (const h of list) {
      const [x, y, w, hh] = rectOf(h, this.state);
      if (wx >= x && wx < x + w && wy >= y && wy < y + hh) { inner.push(h); continue; }
      const ex = Math.min(6, Math.max(0, (44 / scale - w) / 2)), ey = Math.min(6, Math.max(0, (44 / scale - hh) / 2));
      if (h.scene !== 'board' && wx >= x - ex && wx < x + w + ex && wy >= y - ey && wy < y + hh + ey) outer.push({ h, d: Math.hypot(wx - (x + w / 2), wy - (y + hh / 2)) });
    }
    if (inner.length) return inner.sort((a, b) => { const ra = rectOf(a, this.state), rb = rectOf(b, this.state); return ra[2] * ra[3] - rb[2] * rb[3]; })[0];
    if (outer.length) return outer.sort((a, b) => a.d - b.d)[0].h;
    return null;
  }

  private tapScene(wx: number, wy: number, dbl: boolean) {
    if (!this.inGame) return;
    if (this.advanceResolve) { this.advance(); return; }
    if (this.busy) return;
    const h = this.hotspotAt(wx, wy);
    if (h) { this.ui.flashChip(h); this.target({ kind: 'hs', id: h.id }); return; }
    if (this.scene === 'board') { this.cancel(); return; }
    // floor
    this.pending = { verb: null };
    this.ui.setVerb(null); this.ui.renderInventory(this.state.inv, null);
    this.cmd = null; this.sentenceOverride = null;
    this.speed = dbl ? 190 : 95;
    const to = findPath(WALKABLE[this.state.room], [this.actors.powell.x, this.actors.powell.y], [wx, wy]);
    this.path = to; this.updateSentence();
  }

  private dragUse(from: HotspotDef, to: HotspotDef) {
    if (this.busy) return;
    this.pending = { verb: 'use', a: { kind: 'hs', id: from.id } };
    this.target({ kind: 'hs', id: to.id });
  }

  advance() { const r = this.advanceResolve; if (r) { this.advanceResolve = null; r(); } }
  cancel() {
    if (this.busy) return;
    this.pending = { verb: null }; this.cmd = null; this.path = []; this.actors.powell.walking = false;
    this.selectedBoard = null; this.sentenceOverride = null;
    this.ui.setVerb(null); this.ui.renderInventory(this.state.inv, null); this.updateSentence();
  }

  selectVerb(v: Verb) {
    if (!this.inGame || this.busy) return;
    this.audio.play('ui');
    if (this.pending.verb === v) { this.cancel(); return; }
    this.pending = { verb: v }; this.cmd = null; this.selectedBoard = null;
    this.ui.setVerb(v); this.ui.renderInventory(this.state.inv, null); this.updateSentence();
  }

  clickItem(id: ItemId) {
    if (!this.inGame || this.busy || this.advanceResolve) { if (this.advanceResolve) this.advance(); return; }
    this.audio.play('ui');
    this.target({ kind: 'item', id });
  }

  /** Central interaction rules: touch, mouse and drag all end up here. */
  target(ref: Ref) {
    const v = this.pending.verb;
    const a = this.pending.a;
    if (!v) {
      if (ref.kind === 'item') return this.run({ verb: 'look', a: ref, hs: null });
      const h = HS_BY_ID[ref.id];
      return this.run({ verb: h.exit ? 'use' : 'look', a: ref, hs: h });
    }
    if (v === 'use' || v === 'give') {
      if (!a) {
        if (ref.kind === 'item' || (HS_BY_ID[ref.id]?.usable)) { this.pending.a = ref; this.ui.renderInventory(this.state.inv, ref.kind === 'item' ? ref.id : null); this.selectedBoard = ref.kind === 'hs' ? ref.id : null; this.updateSentence(); return; }
        if (v === 'give') {
          this.ui.toast(GIVE_TARGETS.has(ref.id) ? 'Give what? Tap an inventory item first.' : 'Give what? Tap an inventory item first, then the person.');
          return;
        }
        return this.run({ verb: v, a: ref, hs: HS_BY_ID[ref.id] });
      }
      if (a.kind === ref.kind && a.id === ref.id) { this.pending.a = undefined; this.selectedBoard = null; this.ui.renderInventory(this.state.inv, null); this.updateSentence(); return; }
      const hs = ref.kind === 'hs' ? HS_BY_ID[ref.id] : a.kind === 'hs' ? HS_BY_ID[a.id] : null;
      return this.run({ verb: v, a, b: ref, hs });
    }
    const hs = ref.kind === 'hs' ? HS_BY_ID[ref.id] : null;
    this.run({ verb: v, a: ref, hs });
  }

  private nameOf(r?: Ref) { return !r ? '' : r.kind === 'item' ? ITEM_NAME[r.id as ItemId] : HS_BY_ID[r.id].name; }

  private run(c: Omit<Cmd, 'label'> & { label?: string }, quiet = false) {
    void quiet;
    const cmd: Cmd = { ...c, label: '' } as Cmd;
    const prep = cmd.verb === 'give' ? 'to' : 'with';
    cmd.label = `${VERB_LABEL[cmd.verb]} ${this.nameOf(cmd.a)}${cmd.b ? ` ${prep} ${this.nameOf(cmd.b)}` : ''}`;
    this.sentenceOverride = cmd.label; this.updateSentence();
    this.cmd = cmd;
    // hotspot to walk to: the world object involved
    const hs = cmd.hs && cmd.hs.scene !== 'board' ? cmd.hs : null;
    if (!hs || this.scene === 'board') { this.arrived(); return; }
    const [wx, wy] = walkOf(hs, this.state);
    const p = this.actors.powell;
    this.speed = 95;
    this.path = Math.hypot(wx - p.x, wy - p.y) < 3 ? [] : findPath(WALKABLE[this.state.room], [p.x, p.y], [wx, wy]);
    if (!this.path.length) this.arrived();
  }

  private arrived() {
    const cmd = this.cmd;
    if (!cmd) return;
    this.cmd = null;
    const p = this.actors.powell;
    if (cmd.hs && cmd.hs.scene !== 'board') {
      const [x, , w] = rectOf(cmd.hs, this.state);
      p.face = cmd.hs.face ?? (x + w / 2 >= p.x ? 1 : -1);
      this.state.px = p.x; this.state.py = p.y;
    }
    const steps = resolve(this.state, cmd.verb, cmd.a, cmd.b);
    if (cmd.verb === 'pickup' || cmd.verb === 'use' || cmd.verb === 'open' || cmd.verb === 'give') p.reach = 0.45;
    this.pending = { verb: null }; this.selectedBoard = null;
    this.ui.setVerb(null); this.ui.renderInventory(this.state.inv, null);
    void this.runScript(steps);
  }

  // ------------------------------------------------------------------ scripts
  async runScript(steps: Step[]) {
    const gen = this.gen;
    this.busy = true;
    this.ui.setBusy(true);
    try {
      await this.runSteps(steps, gen);
    } catch (e) {
      if (!(e instanceof Abort)) throw e;
      return;
    }
    if (gen !== this.gen) return;
    this.busy = false;
    this.ui.setBusy(false);
    this.sentenceOverride = null;
    this.persist();
    this.refreshHud();
  }

  private check(gen: number) { if (gen !== this.gen) throw new Abort(); }

  private async runSteps(steps: Step[], gen: number) {
    for (const st of steps) { this.check(gen); await this.exec(st, gen); }
  }

  private async exec(st: Step, gen: number) {
    switch (st.t) {
      case 'say': await this.say(st.who, st.text, gen); break;
      case 'flag': case 'count': case 'give': case 'take':
        applyStep(this.state, st);
        if (st.t === 'flag' && (st.name === 'cutieAtWorkshop')) this.syncActors();
        if (st.t === 'give' || st.t === 'take') this.ui.renderInventory(this.state.inv, null);
        if (st.t === 'flag' && st.name === 'finalSequence') this.syncActors();
        if (st.t === 'give') this.audio.play('pickup');
        this.persist();
        break;
      case 'sfx': this.audio.play(st.name); break;
      case 'wait': await this.delay(st.ms, gen); break;
      case 'objective': this.refreshHud(); break;
      case 'room': await this.changeRoom(st, gen); break;
      case 'dialogue': await this.runDialogue(st.id, gen); break;
      case 'closeup':
        this.scene = st.open ? 'board' : this.state.room;
        this.pending = { verb: null }; this.selectedBoard = null;
        this.ui.setVerb(null); this.ui.renderInventory(this.state.inv, null);
        this.refreshHud();
        break;
      case 'actor': await this.actorOp(st, gen); break;
      case 'storm': await this.runStorm(gen); break;
      case 'ending': await this.runEnding(gen); break;
    }
  }

  private async delay(ms: number, gen: number) { await sleep(ms); this.check(gen); }

  private speakerActor(who: SpeakerKey): Actor | null {
    const sp = SPEAKERS[who];
    if (!sp.sprite) return null;
    if (who.endsWith('_ic') && who !== 'powell_ic') return null;
    const here = this.scene === 'board' ? this.state.room : this.scene;
    if (sp.sprite === 'powell') return this.actors.powell;
    if (sp.sprite === 'donovan') return here === 'quarters' ? this.actors.donovan : null;
    if (sp.sprite === 'cutie') return this.actors.cutie.visible ? this.actors.cutie : null;
    if (sp.sprite === 'follower') return this.actors.followerA.visible ? this.actors.followerA : null;
    return null;
  }

  private async say(who: SpeakerKey, text: string, gen = this.gen) {
    const sp = SPEAKERS[who];
    this.ui.showCaption(sp.name, text, who);
    const actor = this.speakerActor(who);
    if (actor) actor.talking = true;
    this.audio.play('blip');
    await new Promise<void>((res) => { this.advanceResolve = res; this.ui.setWaiting(true); });
    this.ui.setWaiting(false);
    if (actor) actor.talking = false;
    this.check(gen);
  }
  private say1(who: SpeakerKey, text: string) { void this.runScript([say(who, text)]); }

  private async changeRoom(st: Extract<Step, { t: 'room' }>, gen: number) {
    this.audio.play('door');
    await this.ui.fade(true);
    this.check(gen);
    applyStep(this.state, st);
    this.scene = st.to;
    const p = this.actors.powell;
    p.x = st.x; p.y = st.y; p.face = st.face; p.walking = false;
    this.path = []; this.hover = null;
    this.pending = { verb: null }; this.ui.setVerb(null); this.ui.renderInventory(this.state.inv, null);
    this.donovanPlaced = false;
    this.syncActors();
    this.ui.toast(ROOM_NAMES[st.to]);
    this.refreshHud();
    await sleep(60);
    await this.ui.fade(false);
  }

  private async actorOp(st: Extract<Step, { t: 'actor' }>, gen: number) {
    if (st.who === 'bot') { if (st.op === 'face') this.botFaceOverride = st.dir ?? 1; return; }
    const a = this.actors[st.who];
    if (!a) return;
    if (st.op === 'appear') { this.cutieShown = true; a.x = st.x!; a.y = st.y!; a.face = st.dir ?? -1; a.visible = this.scene === 'workshop'; this.syncActors(); a.x = st.x!; a.y = st.y!; this.audio.play('door'); }
    else if (st.op === 'face') a.face = st.dir ?? 1;
    else if (st.op === 'walk' || st.op === 'leave') {
      const tx = st.op === 'leave' ? 312 : st.x!, ty = st.op === 'leave' ? 138 : st.y!;
      this.scriptTargets[st.who] = { x: tx, y: ty };
      while (Math.hypot(tx - a.x, ty - a.y) > 1) { await sleep(30); this.check(gen); }
      delete this.scriptTargets[st.who];
      a.walking = false;
      if (st.op === 'leave') { this.cutieShown = false; a.visible = false; this.botFaceOverride = null; }
    }
  }

  private async runStorm(gen: number) {
    this.state.flags.stormRunning = true;
    this.persist();
    this.ui.setBanner('Recording the electron storm. The receiver only listens.');
    this.ui.showSkip(true);
    this.audio.stormStart(STORM_LEN, this.reduced);
    window.setTimeout(() => { if (this.stormT !== null) this.audio.printStart(7); }, 3000);
    this.stormT = 0;
    await new Promise<void>((res) => { this.skipResolve = res; });
    this.check(gen);
  }
  skipStorm() { if (this.stormT !== null) this.finishStorm(); }
  private finishStorm() {
    this.stormT = null;
    this.audio.stormStop(); this.audio.printStop();
    delete this.state.flags.stormRunning;
    this.ui.showSkip(false); this.ui.setBanner(null);
    this.audio.play('relay');
    const r = this.skipResolve; this.skipResolve = null; r?.();
  }

  private async runEnding(gen: number) {
    this.state.flags.ended = true;
    save(this.state, true);
    this.audio.motif();
    await this.ui.fade(true, 900);
    this.check(gen);
    this.busy = false; this.ui.setBusy(false);
    this.gen++;
    await this.ui.showCredits();
    this.toTitle();
  }

  private async runDialogue(id: 'cutie' | 'donovan', gen: number) {
    this.ui.setDialogue(true);
    const here = this.state.room;
    const target = id === 'cutie' ? this.actors.cutie : this.actors.donovan;
    void target; void here;
    let first = true;
    for (;;) {
      this.check(gen);
      const choices = dialogueChoices(id, this.state);
      if (first) this.ui.showCaption(SPEAKERS[id === 'cutie' ? 'cutie' : 'donovan'].name, 'Choose what to say.', id === 'cutie' ? 'cutie' : 'donovan');
      first = false;
      const pick = await this.ui.chooseFrom(choices.map((c) => ({ id: c.id, text: c.text })));
      this.check(gen);
      const c = choices.find((x) => x.id === pick)!;
      this.ui.hideChoices();
      if (c.end) { await this.say('powell', c.text, gen); break; }
      await this.runSteps(dialogueSteps(id, pick, this.state), gen);
    }
    this.ui.setDialogue(false);
  }

  askHint() {
    if (!this.inGame || this.busy) return;
    this.audio.play('ui');
    void this.runScript(hintSteps(this.state));
  }

  // ------------------------------------------------------------------ HUD
  refreshHud() {
    this.ui.setBack(this.scene === 'board');
    this.ui.renderInventory(this.state.inv, this.pending.a?.kind === 'item' ? this.pending.a.id : null);
    this.ui.setIdle(objectiveText(this.state));
    this.ui.setChips(this.chipList());
    this.updateSentence();
  }
  chipList() {
    const out: { h: HotspotDef; rect: [number, number, number, number] }[] = [];
    if (!this.inGame) return out;
    if (this.reveal || this.scene === 'board') for (const h of hotspotsIn(this.scene, this.state)) out.push({ h, rect: rectOf(h, this.state) });
    return out;
  }
  toggleReveal() {
    this.reveal = !this.reveal;
    this.ui.setReveal(this.reveal);
    this.ui.setChips(this.chipList());
  }
  backFromCloseup() { if (this.scene === 'board' && !this.busy) { this.scene = this.state.room; this.cancel(); this.refreshHud(); } }

  updateSentence() {
    if (!this.inGame) { this.ui.setSentence(''); return; }
    if (this.sentenceOverride) { this.ui.setSentence(this.sentenceOverride); return; }
    const v = this.pending.verb, a = this.pending.a;
    const hn = this.hover ? this.hover.name : '';
    if (!v) { this.ui.setSentence(hn ? (this.hover!.exit ? `Walk to ${hn}` : `Look at ${hn}`) : 'Walk to', !hn); return; }
    const prep = v === 'give' ? 'to' : 'with';
    let s = VERB_LABEL[v];
    if (a) s += ` ${this.nameOf(a)} ${prep}`;
    if (hn && (!a || a.id !== this.hover!.id)) s += ` ${hn}`;
    this.ui.setSentence(s);
  }

  private persist() {
    if (!this.inGame) return;
    const p = this.actors.powell;
    this.state.px = Math.round(p.x); this.state.py = Math.round(p.y); this.state.face = p.face;
    save(this.state, !!this.state.flags.ended);
  }

  // ------------------------------------------------------------------ lifecycle
  hasSave() { return load(); }
  async startGame(fresh: boolean) {
    this.audio.init();
    this.audio.setMuted(this.audio.muted);
    this.gen++;
    this.busy = true; this.ui.setBusy(true); this.ui.setDialogue(false); this.stormStop();
    const saved = fresh ? null : load();
    await this.ui.fade(true, 200);
    if (fresh || !saved || saved.finished) { clearSave(); this.state = newState(); } else this.state = saved.s;
    const resumed = !!saved && !fresh && !saved.finished;
    this.scene = this.state.room;
    const p = this.actors.powell;
    p.x = this.state.px; p.y = this.state.py; p.face = this.state.face; p.walking = false;
    this.path = []; this.cmd = null; this.pending = { verb: null }; this.reveal = false; this.ui.setReveal(false);
    this.cutieShown = false; this.botFaceOverride = null; this.donovanPlaced = false; this.stormT = null;
    this.inGame = true;
    this.ui.showTitle(false);
    this.syncActors();
    this.refreshHud();
    await this.ui.fade(false, 200);
    if (!resumed) { void this.runScript(OPENING); } else { this.busy = false; this.ui.setBusy(false); this.ui.toast('Welcome back'); this.ui.setIdle(objectiveText(this.state)); }
  }
  private stormStop() { this.stormT = null; this.audio.stormStop(); this.audio.printStop(); this.ui.showSkip(false); this.ui.setBanner(null); }

  toTitle() {
    this.gen++;
    this.inGame = false; this.busy = false; this.ui.setBusy(false); this.ui.setDialogue(false);
    this.advanceResolve = null; this.skipResolve = null;
    this.stormStop();
    this.ui.fade(false, 10);
    this.ui.showTitle(true);
    this.ui.showCredits(false);
    this.ui.showMenu(false);
  }
  restartGame() { void this.startGame(true); }

  toggleSound() {
    this.audio.init();
    this.audio.setMuted(!this.audio.muted);
    try { localStorage.setItem('reason.muted', this.audio.muted ? '1' : '0'); } catch { /* ignore */ }
    this.ui.setSound(this.audio.muted);
  }
  toggleMotion() {
    this.reduced = !this.reduced;
    try { localStorage.setItem('reason.reduced', this.reduced ? '1' : '0'); } catch { /* ignore */ }
    this.ui.setMotion(this.reduced);
  }

  // ------------------------------------------------------------------ debug hook (read-only)
  private installDebug() {
    const self = this;
    (window as any).__reason = {
      hotspots() {
        if (!self.inGame) return [];
        const out: any[] = [];
        for (const h of hotspotsIn(self.scene, self.state)) {
          const [x, y, w, hh] = rectOf(h, self.state);
          const [sx, sy] = self.toScreen(x, y), [ex, ey] = self.toScreen(x + w, y + hh);
          let click: [number, number] | null = null;
          const tries: [number, number][] = [];
          for (const fy of [0.5, 0.3, 0.7, 0.15, 0.85]) for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85]) tries.push([x + w * fx, y + hh * fy]);
          for (const [tx, ty] of tries) if (self.hotspotAt(tx, ty)?.id === h.id) { const [cx, cy] = self.toScreen(tx, ty); click = [cx, cy]; break; }
          out.push({ id: h.id, name: h.name, scene: h.scene, rect: { x: sx, y: sy, w: ex - sx, h: ey - sy }, click });
        }
        return out;
      },
      state: () => JSON.parse(JSON.stringify(self.state)),
      scene: () => self.scene,
      busy: () => self.busy || !!self.cmd || self.path.length > 0 || self.actors.powell.walking,
      waiting: () => !!self.advanceResolve,
      inGame: () => self.inGame,
      stormRunning: () => self.stormT !== null,
    };
  }
}
void HOTSPOTS; void itemName;
