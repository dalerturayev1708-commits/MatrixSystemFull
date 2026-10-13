/**
 * Breadth-first search on a grid. Explores cells in order of distance from the
 * start, so the first time it reaches the target it has found a shortest path
 * (fewest moves) in an unweighted grid.
 *
 * Returns:
 *  visitedOrder – every cell in the order it was dequeued (explored)
 *  path         – the actual shortest path, start → target (separate from visited)
 *  steps        – one entry per dequeue with the queue contents afterwards
 */
import { key, neighbors, reconstructPath, validateEndpoints } from './pathfinding.js';

export function bfs(grid, start, target) {
  const err = validateEndpoints(grid, start, target);
  if (err) return { ok: false, error: err, visitedOrder: [], path: [], steps: [], found: false };
  const queue = [start];
  const seen = new Set([key(start)]);
  const parent = new Map();
  const dist = new Map([[key(start), 0]]);
  const visitedOrder = [];
  const steps = [];
  let found = false;

  while (queue.length) {
    const cur = queue.shift();
    visitedOrder.push(cur);
    const d = dist.get(key(cur));
    if (key(cur) === key(target)) {
      steps.push({ current: cur, added: [], queue: queue.slice(), distance: d, reason: 'found' });
      found = true;
      break;
    }
    const added = [];
    for (const { cell, dir } of neighbors(grid, cur)) {
      const k = key(cell);
      if (seen.has(k)) continue;
      seen.add(k);
      parent.set(k, key(cur));
      dist.set(k, d + 1);
      queue.push(cell);
      added.push({ cell, dir });
    }
    steps.push({ current: cur, added, queue: queue.slice(), distance: d, reason: 'expand' });
  }

  const path = found ? reconstructPath(parent, start, target) : [];
  return { ok: true, found, visitedOrder, path, steps, pathLength: found ? path.length - 1 : null };
}
