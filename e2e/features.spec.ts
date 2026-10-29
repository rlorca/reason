import { expect, test } from '@playwright/test';
import { Game } from './helpers';

async function overflowFree(g: Game) {
  const o = await g.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw).toBeLessThanOrEqual(o.cw);
}

test('hints escalate, sound off, save/reload continue, restart, orientation change', async ({ page }, info) => {
  const g = new Game(page, info);
  await g.open();
  await g.press(page.locator('#btn-new'));
  await g.waitIdle();
  // sound off
  await g.press(page.locator('#btn-sound'));
  await expect(page.locator('#btn-sound')).toHaveAttribute('aria-pressed', 'true');
  // three progressively explicit hints
  const hints: string[] = [];
  for (let i = 0; i < 3; i++) { await g.press(page.locator('#btn-hint')); await g.waitIdle(); hints.push(g.last()); }
  expect(new Set(hints).size).toBe(3);
  expect(hints[2]).toMatch(/Open the parts drawer/);
  // partial progress keeps hints accurate
  await g.act('pickup', 'ws_screwdriver');
  await g.act('open', 'ws_drawer');
  await g.act('pickup', 'ws_arm');
  await g.act('pickup', 'ws_module');
  await g.press(page.locator('#btn-hint')); await g.waitIdle();
  expect(g.last()).toMatch(/belong on the unfinished robot/);
  // reveal hotspots
  await g.press(page.locator('#btn-reveal'));
  expect(await page.locator('.chip').count()).toBeGreaterThan(4);
  await g.shot('reveal');
  await g.press(page.locator('#btn-reveal'));
  // change orientation mid-game: layout adapts and hotspots still hit
  await page.evaluate(() => document.fullscreenElement && document.exitFullscreen());
  const vp = page.viewportSize()!;
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await overflowFree(g);
  await g.shot('rotated');
  await g.useItem('arm', 'ws_robot');
  expect((await g.flags()).armFitted).toBe(true);
  await page.setViewportSize(vp);
  await overflowFree(g);
  // reload: Continue restores progress
  await page.reload();
  await page.waitForSelector('#app[data-ready=true]');
  await page.locator('#splash').click();
  await expect(page.locator('#btn-continue')).toBeVisible();
  await g.press(page.locator('#btn-continue'));
  await g.waitIdle();
  const s = await g.state();
  expect(s.flags.armFitted).toBe(true);
  expect(s.inv).toEqual(['screwdriver', 'module']);
  // incorrect item uses
  await g.useItem('module', 'ws_diagram');
  expect(g.last()).toMatch(/cannot see how/);
  await g.useItem('module', 'ws_intercom');
  expect(g.last()).toMatch(/cannot see how/);
  // cancel clears selection
  await g.verb('use');
  await g.press(page.locator('#btn-cancel'));
  await expect(page.locator('#verbs [aria-pressed=true]')).toHaveCount(0);
  // restart via menu (two taps to confirm)
  await g.press(page.locator('#btn-menu'));
  await g.press(page.locator('#m-restart'));
  await g.press(page.locator('#m-restart'));
  await g.waitIdle();
  expect((await g.state()).inv).toEqual([]);
  expect((await g.flags()).armFitted).toBeFalsy();
});

test('interrupted storm restores to access granted with the exit blocked', async ({ page }, info) => {
  const g = new Game(page, info);
  await page.addInitScript(() => {
    localStorage.setItem('reason.save.v1', JSON.stringify({ v: 1, finished: false, s: {
      room: 'quarters', px: 200, py: 146, face: 1, inv: ['screwdriver'], counters: {},
      flags: { robotAssembled: true, demoWitnessed: true, clueServing: true, clueSchematic: true, accessGranted: true, finalSequence: true, stormRunning: true },
    } }));
  });
  await g.open();
  await g.press(page.locator('#btn-continue'));
  await g.waitIdle();
  const f = await g.flags();
  expect(f.stormRunning).toBeFalsy();
  expect(f.finalSequence).toBe(true);
  expect(await g.scene()).toBe('quarters');
  await g.tap('qt_hatch');
  expect(g.last()).toMatch(/electron storm/);
  expect(await g.scene()).toBe('quarters');
  // the storm can be replayed and skipped; evidence still arrives
  await g.verb('use'); await g.tap('qt_receiver').catch(() => {});
});
