/**
 * Shared grid helpers for graph algorithms.
 * A grid is a matrix: 0 = open cell, 1 = wall. Cells are [row, col].
 * Neighbour order is fixed — up, right, down, left — so every run is
 * deterministic and the explanation can say exactly why a cell came next.
 */
export const DIRS = [
  [-1, 0, 'up'],
  [0, 1, 'right'],
  [1, 0, 'down'],
  [0, -1, 'left'],
];

export const key = ([r, c]) => `${r},${c}`;
export const parseKey = (k) => k.split(',').map(Number);

export function inBounds(grid, [r, c]) {
  return r >= 0 && c >= 0 && r < grid.length && c < grid[0].length;
}

export function isOpen(grid, cell) {
  return inBounds(grid, cell) && grid[cell[0]][cell[1]] !== 1;
}

export function neighbors(grid, [r, c]) {
  const out = [];
  for (const [dr, dc, dir] of DIRS) {
    const n = [r + dr, c + dc];
    if (isOpen(grid, n)) out.push({ cell: n, dir });
  }
  return out;
}

export function reconstructPath(parent, start, target) {
  const tk = key(target);
  if (!parent.has(tk) && key(start) !== tk) return [];
  const path = [];
  let cur = tk;
  while (cur !== undefined) {
    path.push(parseKey(cur));
    if (cur === key(start)) break;
    cur = parent.get(cur);
  }
  return path.reverse();
}

export function createGrid(rows, cols, fill = 0) {
  return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

/** Seeded PRNG (mulberry32) so challenge mazes are reproducible. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomWalls(rows, cols, density = 0.28, rng = Math.random, keepFree = []) {
  const g = createGrid(rows, cols);
  const keep = new Set(keepFree.map(key));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!keep.has(key([r, c])) && rng() < density) g[r][c] = 1;
  return g;
}

export function validateEndpoints(grid, start, target) {
  if (!grid?.length) return 'err.algoGrid';
  if (!inBounds(grid, start) || !inBounds(grid, target)) return 'err.algoBounds';
  if (grid[start[0]][start[1]] === 1 || grid[target[0]][target[1]] === 1) return 'err.algoWall';
  return null;
}
