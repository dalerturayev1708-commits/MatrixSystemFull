/**
 * Flood fill (BFS-based, 4-connected) — the "paint bucket" tool.
 * Recolours every cell connected to `start` that shares its original colour.
 * Returns the new colour grid and the order cells were filled in.
 */
import { DIRS, inBounds, key } from './pathfinding.js';

export function floodFill(colors, start, newColor) {
  if (!inBounds(colors, start)) return { ok: false, error: 'err.algoBounds', result: colors, order: [], steps: [] };
  const target = colors[start[0]][start[1]];
  const result = colors.map((r) => r.slice());
  if (target === newColor) return { ok: true, result, order: [], steps: [], note: 'sameColor' };
  const queue = [start];
  const seen = new Set([key(start)]);
  const order = [];
  const steps = [];
  while (queue.length) {
    const cur = queue.shift();
    result[cur[0]][cur[1]] = newColor;
    order.push(cur);
    const added = [];
    for (const [dr, dc] of DIRS) {
      const n = [cur[0] + dr, cur[1] + dc];
      if (!inBounds(colors, n) || seen.has(key(n)) || colors[n[0]][n[1]] !== target) continue;
      seen.add(key(n));
      queue.push(n);
      added.push(n);
    }
    steps.push({ current: cur, added, queue: queue.slice() });
  }
  return { ok: true, result, order, steps };
}
