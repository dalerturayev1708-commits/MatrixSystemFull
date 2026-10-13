import { describe, it, expect } from 'vitest';
import { bfs } from '../algorithms/bfs.js';
import { dfs } from '../algorithms/dfs.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { floodFill } from '../algorithms/floodFill.js';
import { SORTERS } from '../algorithms/sorting.js';
import { binarySearch, linearSearch } from '../algorithms/search.js';
import { createGrid, key } from '../algorithms/pathfinding.js';

const maze = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
];

const validPath = (grid, path, start, target) => {
  expect(path[0]).toEqual(start);
  expect(path.at(-1)).toEqual(target);
  for (let i = 1; i < path.length; i++) {
    const d = Math.abs(path[i][0] - path[i - 1][0]) + Math.abs(path[i][1] - path[i - 1][1]);
    expect(d).toBe(1);
    expect(grid[path[i][0]][path[i][1]]).toBe(0);
  }
};

describe('BFS', () => {
  it('finds the shortest path and keeps it separate from visited cells', () => {
    const r = bfs(maze, [0, 0], [4, 4]);
    expect(r.found).toBe(true);
    expect(r.pathLength).toBe(16);
    validPath(maze, r.path, [0, 0], [4, 4]);
    expect(r.visitedOrder.length).toBeGreaterThanOrEqual(r.path.length);
    expect(r.steps.length).toBe(r.visitedOrder.length);
  });
  it('shortest on an open grid equals Manhattan distance', () => {
    const r = bfs(createGrid(6, 6), [0, 0], [5, 3]);
    expect(r.pathLength).toBe(8);
  });
  it('reports unreachable targets', () => {
    const g = [[0, 1, 0], [1, 1, 0], [0, 0, 0]];
    const r = bfs(g, [0, 0], [2, 2]);
    expect(r.found).toBe(false);
    expect(r.path).toEqual([]);
  });
  it('rejects a start on a wall', () => {
    expect(bfs([[1, 0]], [0, 0], [0, 1]).ok).toBe(false);
  });
  it('start equals target', () => {
    const r = bfs(createGrid(3, 3), [1, 1], [1, 1]);
    expect(r.pathLength).toBe(0);
  });
});

describe('DFS', () => {
  it('finds a valid path (not necessarily shortest)', () => {
    const g = createGrid(5, 5);
    const r = dfs(g, [0, 0], [4, 4]);
    expect(r.found).toBe(true);
    validPath(g, r.path, [0, 0], [4, 4]);
    expect(r.pathLength).toBeGreaterThanOrEqual(8);
    expect(new Set(r.visitedOrder.map(key)).size).toBe(r.visitedOrder.length);
  });
});

describe('Dijkstra', () => {
  it('prefers a cheaper detour over a short expensive route', () => {
    const walls = createGrid(3, 3);
    const weights = [[1, 9, 1], [1, 9, 1], [1, 1, 1]];
    const r = dijkstra(walls, weights, [0, 0], [0, 2]);
    expect(r.totalCost).toBe(6);
    validPath(walls, r.path, [0, 0], [0, 2]);
    expect(r.path.some(([rr, cc]) => weights[rr][cc] === 9)).toBe(false);
  });
  it('matches BFS on uniform weights', () => {
    const w = maze.map((row) => row.map(() => 1));
    expect(dijkstra(maze, w, [0, 0], [4, 4]).totalCost).toBe(16);
  });
  it('rejects negative weights', () => {
    expect(dijkstra(createGrid(2, 2), [[1, -1], [1, 1]], [0, 0], [1, 1]).ok).toBe(false);
  });
});

describe('flood fill', () => {
  it('fills only the connected region', () => {
    const c = [[1, 1, 2], [1, 2, 2], [2, 1, 1]];
    const r = floodFill(c, [0, 0], 5);
    expect(r.result).toEqual([[5, 5, 2], [5, 2, 2], [2, 1, 1]]);
    expect(r.order).toHaveLength(3);
    expect(c[0][0]).toBe(1);
  });
});

describe('sorting and searching', () => {
  const data = [5, 3, 8, 1, 9, 2, 7, 2];
  Object.entries(SORTERS).forEach(([name, fn]) => {
    it(`${name} sort is correct and does not mutate input`, () => {
      const copy = data.slice();
      const r = fn(data);
      expect(r.result).toEqual([...data].sort((a, b) => a - b));
      expect(data).toEqual(copy);
      expect(r.steps.at(-1).array).toEqual(r.result);
    });
  });
  it('binary search', () => {
    const arr = [1, 3, 5, 7, 9, 11];
    expect(binarySearch(arr, 9).index).toBe(4);
    expect(binarySearch(arr, 4).index).toBe(-1);
    expect(binarySearch([3, 1], 1).error).toBe('err.notSorted');
    expect(binarySearch(arr, 9).comparisons).toBeLessThanOrEqual(3);
  });
  it('linear search', () => {
    expect(linearSearch([4, 2, 7], 7)).toMatchObject({ index: 2, comparisons: 3 });
    expect(linearSearch([4, 2, 7], 1).index).toBe(-1);
  });
});
