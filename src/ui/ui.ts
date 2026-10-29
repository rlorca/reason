import type { Engine } from '../game/engine';
import { VERBS, type HotspotDef, type ItemId, type Verb } from '../game/types';
import { ITEM_NAME } from '../game/types';
import type { SpeakerKey } from '../game/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class UI {
  canvas = $<HTMLCanvasElement>('world');
  private el = {
    app: $('app'), caption: $('caption'), speaker: $('speaker'), line: $('line'), sentence: $('sentence'),
    verbs: $('verbs'), inventory: $('inventory'), choices: $('choices'), panel: $('panel'), labels: $('labels'),
    toast: $('toast'), fade: $('fade'), banner: $('banner'), skip: $<HTMLButtonElement>('btn-skip'), back: $<HTMLButtonElement>('btn-back'),
    cancel: $<HTMLButtonElement>('btn-cancel'), title: $('title'), menu: $('menu'), credits: $('credits'),
  };
  private engine!: Engine;
  private toastTimer = 0;
  private flashTimer = 0;
  private flashed: HotspotDef | null = null;
  private chipsShown: { h: HotspotDef; rect: [number, number, number, number] }[] = [];
  private creditsDone: (() => void) | null = null;
  private confirmRestart = false;
  private chooseResolve: ((id: string) => void) | null = null;

  bind(engine: Engine) {
    this.engine = engine;
    this.el.verbs.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.addEventListener('click', () => engine.selectVerb(b.dataset.verb as Verb)));
    $('btn-reveal').addEventListener('click', () => engine.toggleReveal());
    $('btn-hint').addEventListener('click', () => engine.askHint());
    $('btn-sound').addEventListener('click', () => engine.toggleSound());
    $('btn-menu').addEventListener('click', () => this.showMenu(true));
    this.el.cancel.addEventListener('click', () => engine.cancel());
    this.el.back.addEventListener('click', () => engine.backFromCloseup());
    this.el.skip.addEventListener('click', () => engine.skipStorm());
    this.el.caption.addEventListener('click', () => engine.advance());
    $('btn-continue').addEventListener('click', () => void engine.startGame(false));
    $('btn-new').addEventListener('click', () => void engine.startGame(true));
    $('btn-restart-title').addEventListener('click', () => void engine.startGame(true));
    $('m-close').addEventListener('click', () => this.showMenu(false));
    $('m-sound').addEventListener('click', () => engine.toggleSound());
    $('m-motion').addEventListener('click', () => engine.toggleMotion());
    $('m-title').addEventListener('click', () => { this.showMenu(false); engine.toTitle(); });
    $('m-restart').addEventListener('click', () => {
      const b = $('m-restart');
      if (!this.confirmRestart) { this.confirmRestart = true; b.textContent = 'Tap again to restart from the beginning'; window.setTimeout(() => { this.confirmRestart = false; b.textContent = 'Restart game'; }, 3500); return; }
      this.confirmRestart = false; b.textContent = 'Restart game'; this.showMenu(false); engine.restartGame();
    });
    $('btn-credits-done').addEventListener('click', () => this.creditsDone?.());
    this.el.menu.addEventListener('click', (e) => { if (e.target === this.el.menu) this.showMenu(false); });
    this.setSound(engine.audio.muted);
    this.setMotion(engine.reduced);
  }

  setVerb(v: Verb | null) {
    this.el.verbs.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.verb === v)));
    this.el.cancel.hidden = !(v || this.engine?.pending.a);
  }
  renderInventory(items: ItemId[], selected: string | null) {
    const inv = this.el.inventory;
    inv.innerHTML = '';
    for (const id of items) {
      const b = document.createElement('button');
      b.className = 'item'; b.dataset.item = id; b.setAttribute('role', 'listitem'); b.setAttribute('aria-pressed', String(selected === id));
      b.appendChild(this.engine.assets.icon(id));
      const s = document.createElement('span'); s.textContent = ITEM_NAME[id]; b.appendChild(s);
      b.addEventListener('click', () => this.engine.clickItem(id));
      inv.appendChild(b);
    }
    this.el.cancel.hidden = !(this.engine.pending.verb || this.engine.pending.a);
  }
  setSentence(text: string, dim = false) {
    this.el.sentence.textContent = text;
    this.el.sentence.classList.toggle('dim', dim);
    this.el.sentence.style.color = dim ? 'var(--steel2)' : '';
    this.el.cancel.hidden = !(this.engine.pending.verb || this.engine.pending.a);
  }
  showCaption(name: string, text: string, who: SpeakerKey) {
    this.el.caption.dataset.who = who; this.el.caption.dataset.idle = 'false';
    this.el.speaker.textContent = name; this.el.line.textContent = text;
  }
  setIdle(text: string) {
    if (this.engine.busy) return;
    this.el.caption.dataset.who = ''; this.el.caption.dataset.idle = 'true';
    this.el.speaker.textContent = ''; this.el.line.textContent = text;
  }
  setWaiting(w: boolean) { this.el.caption.dataset.waiting = String(w); }
  setBusy(b: boolean) { this.el.app.dataset.busy = String(b); }
  setDialogue(on: boolean) {
    this.el.app.dataset.dialogue = String(on);
    this.el.panel.hidden = on; this.el.choices.hidden = true;
  }
  chooseFrom(list: { id: string; text: string }[]): Promise<string> {
    const box = this.el.choices;
    box.innerHTML = '';
    for (const c of list) {
      const b = document.createElement('button');
      b.dataset.choice = c.id; b.textContent = c.text; b.setAttribute('role', 'listitem');
      b.addEventListener('click', () => { const r = this.chooseResolve; this.chooseResolve = null; r?.(c.id); });
      box.appendChild(b);
    }
    box.hidden = false; box.scrollTop = 0;
    return new Promise((res) => { this.chooseResolve = res; });
  }
  hideChoices() { this.el.choices.hidden = true; this.el.choices.innerHTML = ''; this.chooseResolve = null; }
  toast(text: string, ms = 2200) {
    this.el.toast.textContent = text; this.el.toast.classList.add('show');
    clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => this.el.toast.classList.remove('show'), ms);
  }
  fade(on: boolean, ms = 220): Promise<void> {
    this.el.fade.style.transitionDuration = ms + 'ms';
    this.el.fade.classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, this.engine?.reduced ? Math.min(ms, 40) : ms));
  }
  setBanner(text: string | null) { this.el.banner.hidden = !text; if (text) this.el.banner.textContent = text; }
  showSkip(on: boolean) { this.el.skip.hidden = !on; }
  setBack(on: boolean) { this.el.back.hidden = !on; this.el.app.dataset.scene = on ? 'board' : 'room'; }
  setReveal(on: boolean) { $('btn-reveal').setAttribute('aria-pressed', String(on)); }
  setSound(muted: boolean) {
    $('btn-sound').setAttribute('aria-pressed', String(muted));
    $('btn-sound').setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    $('m-sound').textContent = `Sound: ${muted ? 'off' : 'on'}`;
  }
  setMotion(reduced: boolean) {
    $('m-motion').textContent = `Reduced motion: ${reduced ? 'on' : 'off'}`;
    document.body.classList.toggle('reduced-motion', reduced);
  }

  // --- labels (hotspot reveal, close-up labels, tap feedback)
  setChips(list: { h: HotspotDef; rect: [number, number, number, number] }[]) { this.chipsShown = list; this.drawChips(); }
  flashChip(h: HotspotDef) {
    if (this.engine.reveal || h.scene === 'board') return;
    this.flashed = h; this.drawChips();
    clearTimeout(this.flashTimer); this.flashTimer = window.setTimeout(() => { this.flashed = null; this.drawChips(); }, 1400);
  }
  private drawChips() {
    const box = this.el.labels; box.innerHTML = '';
    const flags = this.engine.state.flags;
    const list = [...this.chipsShown];
    if (this.flashed && !list.some((c) => c.h.id === this.flashed!.id)) list.push({ h: this.flashed, rect: this.flashed.dynRect ? this.flashed.dynRect(this.engine.state) : this.flashed.rect });
    list.sort((a, b) => a.rect[0] - b.rect[0]);
    list.forEach(({ h, rect }, idx) => {
      const [x, y, w, hh] = rect;
      if (h.scene !== 'board' && this.engine.reveal) {
        const o = document.createElement('div');
        o.className = 'hs-outline';
        o.style.cssText = `left:${(x / 320) * 100}%;top:${(y / 180) * 100}%;width:${(w / 320) * 100}%;height:${(hh / 180) * 100}%`;
        box.appendChild(o);
      }
      const c = document.createElement('div');
      c.className = 'chip' + (h.scene === 'board' ? ' board' : '');
      let text = h.exit ? h.name.replace(/^(door|hatch) to /, '\u2192 ') : h.name;
      if (h.scene === 'board') {
        const mark = { cu_storm: '▲ ', cu_dir: '■ ', cu_focus: '● ', cu_ref_dir: '■ ', cu_ref_focus: '● ' }[h.id] ?? '';
        text = mark + h.name.replace(/^./, (m) => m.toUpperCase());
        if ((h.id === 'cu_dir' && flags.findingDirection) || (h.id === 'cu_focus' && flags.findingFocus)) { c.classList.add('confirmed'); text += ' ✓ inside band'; }
        if (this.engine.pending.a?.id === h.id) c.classList.add('selected');
      }
      c.textContent = text;
      if (h.scene === 'board') {
        c.style.transform = 'none';
        c.style.left = `${((x + 4) / 320) * 100}%`;
        c.style.top = `${((y + 3) / 180) * 100}%`;
      } else {
        const cx = x + w / 2, top = Math.max(8, y);
        c.style.left = `${Math.max(14, Math.min(86, (cx / 320) * 100))}%`;
        c.style.top = `${Math.max(7, (top / 180) * 100) + (this.engine.reveal ? (idx % 3) * 8 : 0)}%`;
      }
      box.appendChild(c);
    });
  }

  // --- overlays
  async showTitle(on: boolean) {
    this.el.title.hidden = !on;
    if (!on) return;
    const info = this.engine.hasSave();
    const cont = $('btn-continue'), nw = $('btn-new'), rs = $('btn-restart-title');
    cont.hidden = !(info && !info.finished);
    rs.hidden = !(info && info.finished);
    nw.hidden = !!(info && info.finished);
    nw.textContent = info && !info.finished ? 'New Game' : 'Start';
    nw.classList.toggle('primary', !(info && !info.finished));
    rs.classList.add('primary');
    this.el.cancel.hidden = true;
    (cont.hidden ? (nw.hidden ? rs : nw) : cont).focus?.();
  }
  showMenu(on: boolean) { this.el.menu.hidden = !on; if (on) $('m-close').focus(); }
  showCredits(on: boolean = true): Promise<void> {
    if (!on) { this.el.credits.hidden = true; return Promise.resolve(); }
    this.el.credits.hidden = false;
    return new Promise((res) => {
      const done = () => { window.clearTimeout(t); this.creditsDone = null; this.el.credits.hidden = true; res(); };
      this.creditsDone = done;
      const t = window.setTimeout(done, 30000);
    });
  }
}
