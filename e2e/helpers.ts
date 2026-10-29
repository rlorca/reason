import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

export class Game {
  transcript: { who: string; text: string }[] = [];
  constructor(public page: Page, public info: TestInfo) {}
  get touch() { return !!this.info.project.use.hasTouch; }

  async press(loc: Locator) { if (this.touch) await loc.tap(); else await loc.click(); }
  async tapAt(x: number, y: number) { if (this.touch) await this.page.touchscreen.tap(x, y); else await this.page.mouse.click(x, y); }

  async open() {
    await this.page.goto('/');
    await this.page.waitForSelector('#app[data-ready=true]');
    await this.page.locator('#splash').click();
    await expect(this.page.locator('#splash')).toBeHidden();
  }
  async shot(name: string) {
    await this.page.screenshot({ path: `e2e/shots/${this.info.project.name}-${name}.png` });
  }
  hotspots() { return this.page.evaluate(() => (window as any).__reason.hotspots() as { id: string; name: string; scene: string; rect: { x: number; y: number; w: number; h: number }; click: [number, number] | null }[]); }
  state() { return this.page.evaluate(() => (window as any).__reason.state()); }
  scene() { return this.page.evaluate(() => (window as any).__reason.scene() as string); }

  /** Advance dialogue lines and wait for scripts and walking to finish. Stops when idle or when dialogue choices are showing. */
  async pump(timeout = 45_000) {
    const start = Date.now();
    for (;;) {
      const s = await this.page.evaluate(() => {
        const r = (window as any).__reason;
        const ch = document.getElementById('choices')!;
        return { busy: r.busy(), waiting: r.waiting(), choices: !ch.hidden && ch.children.length > 0,
          who: document.getElementById('speaker')!.textContent ?? '', text: document.getElementById('line')!.textContent ?? '' };
      });
      if (s.choices) return 'choices';
      if (s.waiting) {
        this.transcript.push({ who: s.who, text: s.text });
        await this.press(this.page.locator('#caption'));
        await this.page.waitForTimeout(40);
        continue;
      }
      if (!s.busy) return 'idle';
      if (Date.now() - start > timeout) throw new Error('pump timeout');
      await this.page.waitForTimeout(80);
    }
  }

  async verb(v: string) { await this.press(this.page.locator(`#verbs [data-verb=${v}]`)); }
  async item(id: string) { await this.press(this.page.locator(`#inventory [data-item=${id}]`)); }
  async tap(id: string) {
    const hs = await this.hotspots();
    const h = hs.find((x) => x.id === id);
    if (!h || !h.click) throw new Error(`hotspot ${id} not clickable; have ${hs.map((x) => x.id).join(',')}`);
    await this.tapAt(h.click[0], h.click[1]);
    return this.pump();
  }
  async act(verb: string, id: string) { await this.verb(verb); return this.tap(id); }
  async useItem(item: string, id: string) { await this.verb('use'); await this.item(item); return this.tap(id); }
  async choose(id: string) {
    await this.press(this.page.locator(`#choices [data-choice=${id}]`));
    return this.pump();
  }
  last() { return this.transcript[this.transcript.length - 1]?.text ?? ''; }
  async caption() { return (await this.page.locator('#line').textContent()) ?? ''; }
  async expectScene(s: string) { await expect.poll(() => this.scene(), { timeout: 8000 }).toBe(s); }
  async waitIdle() { return this.pump(); }
  async flags() { return (await this.state()).flags as Record<string, boolean>; }
}
