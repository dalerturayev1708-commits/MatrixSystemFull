/**
 * Dijkstra's algorithm on a weighted grid.
 *  walls[r][c]   – 1 for a wall, 0 for open
 *  weights[r][c] – cost to ENTER that cell (must be ≥ 0)
 *
 * Correctness assumption: all weights are non-negative. Under that assumption,
 * when a cell is removed from the priority queue its distance is final, because
 * any other route to it would have to pass through a cell with a distance that
 * is already at least as large.
 */
import { key, neighbors, reconstructPath, validateEndpoints } from './pathfinding.js';

class MinHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(item) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].d <= a[i].d) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].d < a[m].d) m = l;
        if (r < a.length && a[r].d < a[m].d) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  snapshot(limit = 10) {
    return this.a.slice().sort((x, y) => x.d - y.d).slice(0, limit).map(({ cell, d }) => ({ cell, d }));
  }
}

export function dijkstra(walls, weights, start, target) {
  const err = validateEndpoints(walls, start, target);
  if (err) return { ok: false, error: err, visitedOrder: [], path: [], steps: [], found: false };
  if (weights.some((row) => row.some((w) => !(w >= 0)))) return { ok: false, error: 'err.negativeWeight', visitedOrder: [], path: [], steps: [], found: false };

  const dist = new Map([[key(start), 0]]);
  const parent = new Map();
  const done = new Set();
  const pq = new MinHeap();
  pq.push({ cell: start, d: 0 });
  const visitedOrder = [];
  const steps = [];
  let found = false;

  while (pq.size) {
    const { cell: cur, d } = pq.pop();
    const k = key(cur);
    if (done.has(k)) continue;
    done.add(k);
    visitedOrder.push(cur);
    if (k === key(target)) {
      steps.push({ current: cur, distance: d, updates: [], pq: pq.snapshot(), reason: 'found' });
      found = true;
      break;
    }
    const updates = [];
    for (const { cell } of neighbors(walls, cur)) {
      const nk = key(cell);
      if (done.has(nk)) continue;
      const nd = d + weights[cell[0]][cell[1]];
      const old = dist.has(nk) ? dist.get(nk) : Infinity;
      if (nd < old) {
        dist.set(nk, nd);
        parent.set(nk, k);
        pq.push({ cell, d: nd });
        updates.push({ cell, old, next: nd });
      }
    }
    steps.push({ current: cur, distance: d, updates, pq: pq.snapshot(), reason: 'expand' });
  }

  const path = found ? reconstructPath(parent, start, target) : [];
  return { ok: true, found, visitedOrder, path, steps, totalCost: found ? dist.get(key(target)) : null, distances: dist };
}
