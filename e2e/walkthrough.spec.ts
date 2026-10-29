import { expect, test } from '@playwright/test';
import { Game } from './helpers';

test('walkthrough: Start to credits through the real interface', async ({ page }, info) => {
  const g = new Game(page, info);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await g.open();
  await g.shot('01-title');
  await g.press(page.locator('#btn-new'));
  await expect(page.locator('#title')).toBeHidden();
  await g.waitIdle();
  await g.shot('02-opening-done');

  // --- puzzle 1: demonstration of creation
  await g.tap('ws_diagram'); // default action looks
  expect(g.last()).toMatch(/socket/);
  // incorrect: screwdriver on the robot before anything is ready (and before even having it)
  await g.act('pickup', 'ws_screwdriver');
  await g.useItem('screwdriver', 'ws_robot');
  expect(g.last()).toMatch(/socket is still empty/);
  await g.useItem('screwdriver', 'ws_bench');
  expect(g.last()).toMatch(/cannot see how/);
  expect((await g.state()).inv).toEqual(['screwdriver']);
  await g.act('open', 'ws_drawer');
  await g.shot('03-drawer-open');
  await g.act('pickup', 'ws_arm');
  await g.act('pickup', 'ws_module');
  expect((await g.state()).inv).toEqual(['screwdriver', 'arm', 'module']);
  await g.useItem('module', 'ws_robot');
  await g.useItem('arm', 'ws_robot');
  await g.useItem('screwdriver', 'ws_robot');
  expect((await g.flags()).robotAssembled).toBe(true);
  await g.shot('04-robot-assembled');
  await g.act('use', 'ws_intercom'); // Cutie arrives, inspects, leaves
  expect((await g.flags()).demoWitnessed).toBe(true);
  await g.shot('05-after-demo');

  // --- puzzle 2: permission to observe
  await g.tap('ws_door_converter');
  await g.expectScene('converter');
  await g.waitIdle();
  await g.tap('cv_schematic');
  await g.shot('06-converter');
  await g.act('talk', 'cv_cutie');
  await g.shot('07-dialogue');
  expect(await page.locator('#choices [data-choice=observe]').count()).toBe(0);
  await g.choose('demand');
  await g.choose('demand');
  await g.choose('serve');
  expect(await page.locator('#choices [data-choice=observe]').count()).toBe(1);
  await g.choose('observe');
  await g.choose('bye');
  expect((await g.flags()).accessGranted).toBe(true);
  await g.tap('cv_door');
  await g.expectScene('workshop');
  await g.waitIdle();
  await g.tap('ws_door_quarters');
  await g.expectScene('quarters');
  await g.waitIdle();

  // --- puzzle 3: what the instruments say
  await g.tap('qt_sheet');
  await g.shot('08-quarters');
  await g.act('use', 'qt_receiver');
  expect((await g.flags()).stormDone).toBe(true);
  await g.shot('09-after-storm');
  // exit is blocked once the final sequence has begun
  await g.tap('qt_hatch');
  expect(g.last()).toMatch(/electron storm/);
  expect(await g.scene()).toBe('quarters');
  await g.act('pickup', 'qt_printer');
  expect((await g.state()).inv).toContain('strip');
  await g.useItem('strip', 'qt_board');
  await g.expectScene('board');
  await g.shot('10-board');
  // wrong comparisons first, then the storm trace
  await g.verb('use'); await g.tap('cu_dir'); await g.tap('cu_ref_focus');
  expect(g.last()).toMatch(/Wrong reference/);
  await g.verb('use'); await g.tap('cu_storm'); await g.tap('cu_ref_dir');
  expect(g.last()).toMatch(/not beam error/);
  expect((await g.flags()).findingDirection).toBeFalsy();
  // direction by tapping, focus by dragging (optional convenience)
  await g.verb('use'); await g.tap('cu_dir'); await g.tap('cu_ref_dir');
  expect((await g.flags()).findingDirection).toBe(true);
  await g.shot('11-one-finding');
  if (!g.touch) {
    const hs = await g.hotspots();
    const a = hs.find((h) => h.id === 'cu_focus')!.click!, b = hs.find((h) => h.id === 'cu_ref_focus')!.click!;
    await page.mouse.move(a[0], a[1]); await page.mouse.down(); await page.mouse.move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { steps: 6 }); await page.mouse.move(b[0], b[1], { steps: 6 }); await page.mouse.up();
    await g.waitIdle();
  } else {
    await g.verb('use'); await g.tap('cu_focus'); await g.tap('cu_ref_focus');
  }
  expect((await g.flags()).findingFocus).toBe(true);
  await g.expectScene('quarters');
  expect((await g.state()).inv).not.toContain('strip');
  await g.shot('12-both-findings');

  // --- ending
  await g.act('use', 'qt_intercom');
  await expect(page.locator('#credits')).toBeVisible({ timeout: 15000 });
  await g.shot('13-credits');
  await g.press(page.locator('#btn-credits-done'));
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('#btn-restart-title')).toBeVisible();
  await expect(page.locator('#btn-continue')).toBeHidden();
  await g.shot('14-title-after');

  const words = g.transcript.map((t) => t.text).join(' ').split(/\s+/).filter(Boolean).length;
  console.log(`[${info.project.name}] captions advanced: ${g.transcript.length}, words: ${words}`);
  expect(errors).toEqual([]);
});
