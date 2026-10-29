/** Grid pathfinding over axis-aligned walkable rectangles. */
export type R4 = [number, number, number, number];
export interface Walkable { areas: R4[]; blocked: R4[] }
const CELL = 4;
const inRect = (x: number, y: number, r: R4) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];

export function isWalkable(w: Walkable, x: number, y: number) {
  return w.areas.some((a) => inRect(x, y, a)) && !w.blocked.some((b) => inRect(x, y, b));
}
export function clampToWalkable(w: Walkable, x: number, y: number): [number, number] {
  if (isWalkable(w, x, y)) return [x, y];
  let best: [number, number] = [x, y], bd = Infinity;
  for (let gy = 0; gy < 180; gy += 2) for (let gx = 0; gx < 320; gx += 2) {
    if (!isWalkable(w, gx, gy)) continue;
    const d = (gx - x) ** 2 + (gy - y) ** 2;
    if (d < bd) { bd = d; best = [gx, gy]; }
  }
  return best;
}
function lineClear(w: Walkable, a: [number, number], b: [number, number]) {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2);
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    if (!isWalkable(w, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;
  }
  return true;
}
/** Returns waypoints (excluding the start). Empty if already there. */
export function findPath(w: Walkable, from: [number, number], to: [number, number]): [number, number][] {
  const goal = clampToWalkable(w, to[0], to[1]);
  const start = clampToWalkable(w, from[0], from[1]);
  if (lineClear(w, start, goal)) return [goal];
  const gw = Math.ceil(320 / CELL), gh = Math.ceil(180 / CELL);
  const key = (cx: number, cy: number) => cy * gw + cx;
  const ok = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < gw && cy < gh && isWalkable(w, cx * CELL + CELL / 2, cy * CELL + CELL / 2);
  const sc: [number, number] = [Math.floor(start[0] / CELL), Math.floor(start[1] / CELL)];
  const gc: [number, number] = [Math.floor(goal[0] / CELL), Math.floor(goal[1] / CELL)];
  const open = new Map<number, { c: [number, number]; g: number; f: number; p: number }>();
  const closed = new Set<number>();
  const h = (c: [number, number]) => Math.hypot(c[0] - gc[0], c[1] - gc[1]);
  open.set(key(...sc), { c: sc, g: 0, f: h(sc), p: -1 });
  const nodes = new Map<number, { c: [number, number]; p: number }>();
  let found = -1;
  while (open.size) {
    let bk = -1, bf = Infinity;
    for (const [k, n] of open) if (n.f < bf) { bf = n.f; bk = k; }
    const cur = open.get(bk)!;
    open.delete(bk); closed.add(bk);
    nodes.set(bk, { c: cur.c, p: cur.p });
    if (cur.c[0] === gc[0] && cur.c[1] === gc[1]) { found = bk; break; }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nc: [number, number] = [cur.c[0] + dx, cur.c[1] + dy];
      const nk = key(...nc);
      if (closed.has(nk) || !ok(...nc)) continue;
      if (dx && dy && (!ok(cur.c[0] + dx, cur.c[1]) || !ok(cur.c[0], cur.c[1] + dy))) continue;
      const g = cur.g + Math.hypot(dx, dy);
      const ex = open.get(nk);
      if (!ex || g < ex.g) open.set(nk, { c: nc, g, f: g + h(nc), p: bk });
    }
  }
  if (found < 0) return [goal];
  const cells: [number, number][] = [];
  for (let k = found; k >= 0;) { const n = nodes.get(k)!; cells.push([n.c[0] * CELL + CELL / 2, n.c[1] * CELL + CELL / 2]); k = n.p; }
  cells.reverse();
  cells[0] = start; cells[cells.length - 1] = goal;
  // string-pull
  const out: [number, number][] = [];
  let anchor = cells[0], i = 1;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !lineClear(w, anchor, cells[j])) j--;
    out.push(cells[j]); anchor = cells[j]; i = j + 1;
  }
  return out;
}
