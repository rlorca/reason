// Dev helper: node scripts/dev-shot.mjs <out.png> [w] [h] [steps...]   (steps: new, click:<hotspotId>, wait:<ms>, verb:<v>, item:<id>)
import { chromium } from '@playwright/test';
const [out, w = '1440', h = '900', ...steps] = process.argv.slice(2);
const mobile = Number(w) < 900;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error') console.log('console.error', m.text()); });
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(process.env.URL ?? 'http://localhost:5173/');
await p.waitForSelector('#app[data-ready=true]');
for (const s of steps) {
  const [k, v] = s.split(':');
  if (k === 'new') await p.click('#btn-new');
  else if (k === 'wait') await p.waitForTimeout(+v);
  else if (k === 'verb') await p.click(`[data-verb=${v}]`);
  else if (k === 'item') await p.click(`[data-item=${v}]`);
  else if (k === 'adv') { for (let i = 0; i < +v; i++) { await p.click('#caption'); await p.waitForTimeout(60); } }
  else if (k === 'click') {
    const hs = await p.evaluate(() => window.__reason.hotspots());
    const t = hs.find((x) => x.id === v);
    if (!t) { console.log('no hotspot', v, hs.map((x) => x.id).join(',')); continue; }
    if (mobile) await p.touchscreen.tap(t.click[0], t.click[1]); else await p.mouse.click(t.click[0], t.click[1]);
    await p.waitForFunction(() => !window.__reason.busy() || window.__reason.waiting(), null, { timeout: 15000 });
  }
}
await p.screenshot({ path: out });
await b.close();
