/**
 * Depth-first search on a grid with an explicit stack (no recursion limit).
 * DFS follows one direction as deep as possible before backtracking. It finds
 * *a* path if one exists, but NOT necessarily the shortest one.
 *
 * Neighbours are pushed in reverse order so they are explored up → right →
 * down → left, matching BFS for a fair comparison.
 */
import { key, neighbors, reconstructPath, validateEndpoints } from './pathfinding.js';

export function dfs(grid, start, target) {
  const err = validateEndpoints(grid, start, target);
  if (err) return { ok: false, error: err, visitedOrder: [], path: [], steps: [], found: false };
  const stack = [start];
  const visited = new Set();
  const parent = new Map();
  const visitedOrder = [];
  const steps = [];
  let found = false;

  while (stack.length) {
    const cur = stack.pop();
    const k = key(cur);
    if (visited.has(k)) continue;
    visited.add(k);
    visitedOrder.push(cur);
    if (k === key(target)) {
      steps.push({ current: cur, added: [], stack: stack.slice(), reason: 'found' });
      found = true;
      break;
    }
    const nbrs = neighbors(grid, cur).filter(({ cell }) => !visited.has(key(cell)));
    const added = [];
    for (let i = nbrs.length - 1; i >= 0; i--) {
      const { cell, dir } = nbrs[i];
      parent.set(key(cell), k);
      stack.push(cell);
      added.push({ cell, dir });
    }
    steps.push({ current: cur, added: added.reverse(), stack: stack.slice(), reason: nbrs.length ? 'expand' : 'deadEnd' });
  }

  const path = found ? reconstructPath(parent, start, target) : [];
  return { ok: true, found, visitedOrder, path, steps, pathLength: found ? path.length - 1 : null };
}
