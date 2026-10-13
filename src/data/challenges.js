/**
 * Question bank. Every question is GENERATED from random inputs and ANSWERED by
 * the math engine / algorithms — there are no hand-written answer keys.
 *
 * Question shape:
 *  { gen, kind: 'number'|'dims'|'choice'|'matrix', prompt:{key,params}, matrices:[{name,M}],
 *    grid?: string[], answer, options?: [{key}|string], hint:{key,params}, work?: string }
 */
import * as M from '../math/index.js';
import { bfs } from '../algorithms/bfs.js';
import { seededRandom } from '../algorithms/pathfinding.js';
import { formatNumber, parseNumber } from '../utils/formatting.js';

const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const mat = (rng, r, c, lo = -5, hi = 9) => M.createMatrix(r, c, () => int(rng, lo, hi));
const pickIdx = (rng, n) => Math.floor(rng() * n);
const fmt = (v) => formatNumber(v, 4).replace('−', '-');
const par = (v) => (v < 0 ? `(${fmt(v)})` : fmt(v));

/** Unimodular-ish 2×2 with small determinant so inverse entries are tidy. */
function niceInvertible(rng) {
  for (;;) {
    const A = mat(rng, 2, 2, -4, 6);
    const d = M.detValue(A);
    if ([1, -1, 2, -2, 4, -4].includes(d)) return A;
  }
}

export const GENERATORS = {
  dims(rng) {
    const r = int(rng, 1, 5);
    const c = int(rng, 1, 5);
    return { kind: 'dims', prompt: { key: 'q.dims' }, matrices: [{ name: 'A', M: mat(rng, r, c) }], answer: [r, c], hint: { key: 'h.dims' } };
  },
  rowsCount(rng) {
    const r = int(rng, 1, 5);
    return { kind: 'number', prompt: { key: 'q.rowsCount' }, matrices: [{ name: 'A', M: mat(rng, r, int(rng, 2, 5)) }], answer: r, hint: { key: 'h.dims' } };
  },
  colsCount(rng) {
    const c = int(rng, 1, 5);
    return { kind: 'number', prompt: { key: 'q.colsCount' }, matrices: [{ name: 'A', M: mat(rng, int(rng, 2, 5), c) }], answer: c, hint: { key: 'h.dims' } };
  },
  entry(rng) {
    const A = mat(rng, int(rng, 2, 4), int(rng, 2, 4));
    const i = pickIdx(rng, A.length);
    const j = pickIdx(rng, A[0].length);
    return { kind: 'number', prompt: { key: 'q.entry', params: { i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }], answer: A[i][j], hint: { key: 'h.entry', params: { i: i + 1, j: j + 1 } }, focus: [i, j] };
  },
  addCell(rng) {
    const r = int(rng, 2, 3); const c = int(rng, 2, 3);
    const A = mat(rng, r, c); const B = mat(rng, r, c);
    const i = pickIdx(rng, r); const j = pickIdx(rng, c);
    const res = M.addMatrices(A, B).result;
    return { kind: 'number', prompt: { key: 'q.addCell', params: { i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }, { name: 'B', M: B }], answer: res[i][j], hint: { key: 'h.add', params: { i: i + 1, j: j + 1 } }, work: `${par(A[i][j])} + ${par(B[i][j])} = ${fmt(res[i][j])}` };
  },
  subCell(rng) {
    const r = int(rng, 2, 3); const c = int(rng, 2, 3);
    const A = mat(rng, r, c); const B = mat(rng, r, c);
    const i = pickIdx(rng, r); const j = pickIdx(rng, c);
    const res = M.subtractMatrices(A, B).result;
    return { kind: 'number', prompt: { key: 'q.subCell', params: { i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }, { name: 'B', M: B }], answer: res[i][j], hint: { key: 'h.sub' }, work: `${par(A[i][j])} − ${par(B[i][j])} = ${fmt(res[i][j])}` };
  },
  scalarCell(rng) {
    const A = mat(rng, 2, 3);
    const k = [-3, -2, 2, 3, 4, 5][pickIdx(rng, 6)];
    const i = pickIdx(rng, 2); const j = pickIdx(rng, 3);
    const res = M.scalarMultiply(A, k).result;
    return { kind: 'number', prompt: { key: 'q.scalarCell', params: { k, i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }], answer: res[i][j], hint: { key: 'h.scalar' }, work: `${par(k)} × ${par(A[i][j])} = ${fmt(res[i][j])}` };
  },
  transposeCell(rng) {
    const A = mat(rng, int(rng, 2, 3), int(rng, 3, 4));
    const T = M.transposeMatrix(A).result;
    const i = pickIdx(rng, T.length); const j = pickIdx(rng, T[0].length);
    return { kind: 'number', prompt: { key: 'q.transposeCell', params: { i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }], answer: T[i][j], hint: { key: 'h.transpose' }, work: `(Aᵀ)${i + 1}${j + 1} = A${j + 1}${i + 1} = ${fmt(T[i][j])}` };
  },
  transposeDims(rng) {
    const r = int(rng, 1, 6); const c = int(rng, 1, 6);
    const T = M.transposeMatrix(M.createMatrix(r, c)).result;
    return { kind: 'dims', prompt: { key: 'q.transposeDims', params: { r, c } }, matrices: [], answer: [T.length, T[0].length], hint: { key: 'h.transpose' } };
  },
  addFull(rng) {
    const A = mat(rng, 2, 2); const B = mat(rng, 2, 2);
    return { kind: 'matrix', prompt: { key: 'q.addFull' }, matrices: [{ name: 'A', M: A }, { name: 'B', M: B }], answer: M.addMatrices(A, B).result, hint: { key: 'h.add', params: { i: 'i', j: 'j' } } };
  },
  canMultiply(rng) {
    const ar = int(rng, 1, 4); const ac = int(rng, 1, 4);
    const br = rng() < 0.5 ? ac : int(rng, 1, 4); const bc = int(rng, 1, 4);
    const ok = M.multiplyMatrices(M.createMatrix(ar, ac), M.createMatrix(br, bc)).ok;
    return { kind: 'choice', prompt: { key: 'q.canMultiply', params: { ar, ac, br, bc } }, matrices: [], options: ['common.yes', 'common.no'], answer: ok ? 0 : 1, hint: { key: 'h.mulDims' } };
  },
  productDims(rng) {
    const ar = int(rng, 1, 5); const n = int(rng, 1, 5); const bc = int(rng, 1, 5);
    const P = M.multiplyMatrices(M.createMatrix(ar, n), M.createMatrix(n, bc)).result;
    return { kind: 'dims', prompt: { key: 'q.productDims', params: { ar, ac: n, br: n, bc } }, matrices: [], answer: [P.length, P[0].length], hint: { key: 'h.mulDims' } };
  },
  mulCell(rng) {
    const ar = int(rng, 2, 3); const n = int(rng, 2, 3); const bc = int(rng, 2, 3);
    const A = mat(rng, ar, n, -4, 6); const B = mat(rng, n, bc, -4, 6);
    const r = M.multiplyMatrices(A, B);
    const i = pickIdx(rng, ar); const j = pickIdx(rng, bc);
    const s = r.steps.find((x) => x.i === i && x.j === j);
    return {
      kind: 'number', prompt: { key: 'q.mulCell', params: { i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }, { name: 'B', M: B }],
      answer: r.result[i][j], hint: { key: 'h.mulCell', params: { i: i + 1, j: j + 1 } },
      work: `${s.terms.map((x) => `${par(x.a)}·${par(x.b)}`).join(' + ')} = ${fmt(r.result[i][j])}`,
    };
  },
  mulFull(rng) {
    const A = mat(rng, 2, 2, -3, 5); const B = mat(rng, 2, 2, -3, 5);
    return { kind: 'matrix', prompt: { key: 'q.mulFull' }, matrices: [{ name: 'A', M: A }, { name: 'B', M: B }], answer: M.multiplyMatrices(A, B).result, hint: { key: 'h.mulCell', params: { i: 'i', j: 'j' } } };
  },
  det2(rng) {
    const A = mat(rng, 2, 2, -6, 9);
    const r = M.determinant(A);
    return { kind: 'number', prompt: { key: 'q.det2' }, matrices: [{ name: 'A', M: A }], answer: r.result, hint: { key: 'h.det2' }, work: `${par(A[0][0])}·${par(A[1][1])} − ${par(A[0][1])}·${par(A[1][0])} = ${fmt(r.result)}` };
  },
  det3(rng) {
    const A = mat(rng, 3, 3, -3, 4);
    const r = M.determinant(A, { method: 'cofactor' });
    const terms = r.steps.filter((s) => s.type === 'cofactor').map((s) => `${s.sign > 0 ? '+' : '−'}${par(s.entry)}·${par(s.minorDet)}`).join(' ');
    return { kind: 'number', prompt: { key: 'q.det3' }, matrices: [{ name: 'A', M: A }], answer: r.result, hint: { key: 'h.det3' }, work: `${terms} = ${fmt(r.result)}` };
  },
  singular(rng) {
    let A;
    if (rng() < 0.5) {
      const a = int(rng, -4, 5); const b = int(rng, -4, 5); const k = int(rng, -3, 3) || 2;
      A = [[a, b], [k * a, k * b]];
    } else A = mat(rng, 2, 2, -5, 7);
    const inv = M.inverseMatrix(A);
    return { kind: 'choice', prompt: { key: 'q.singular' }, matrices: [{ name: 'A', M: A }], options: ['common.yes', 'common.no'], answer: inv.ok ? 0 : 1, hint: { key: 'h.singular' }, work: `det(A) = ${fmt(M.detValue(A))}` };
  },
  inverseCell(rng) {
    const A = niceInvertible(rng);
    const inv = M.inverseMatrix(A).result;
    const i = pickIdx(rng, 2); const j = pickIdx(rng, 2);
    return { kind: 'number', prompt: { key: 'q.inverseCell', params: { i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }], answer: inv[i][j], hint: { key: 'h.inverse2' }, work: `det = ${fmt(M.detValue(A))}; A⁻¹ = [[${inv.map((r) => r.map(fmt).join(', ')).join('], [')}]]` };
  },
  detScale(rng) {
    const n = int(rng, 2, 3); const k = [2, 3, -2, -1][pickIdx(rng, 4)];
    const A = mat(rng, n, n, -3, 4);
    const d = M.detValue(A);
    const scaled = M.detValue(M.scalarMultiply(A, k).result);
    return { kind: 'number', prompt: { key: 'q.detScale', params: { d, k, n } }, matrices: [], answer: scaled, hint: { key: 'h.detScale' }, work: `(${k})^${n} × ${par(d)} = ${fmt(scaled)}` };
  },
  detProduct(rng) {
    const A = mat(rng, 2, 2, -4, 5); const B = mat(rng, 2, 2, -4, 5);
    const a = M.detValue(A); const b = M.detValue(B);
    const ab = M.detValue(M.multiplyMatrices(A, B).result);
    return { kind: 'number', prompt: { key: 'q.detProduct', params: { a, b } }, matrices: [], answer: ab, hint: { key: 'h.detProduct' }, work: `${par(a)} × ${par(b)} = ${fmt(ab)}` };
  },
  detTranspose(rng) {
    const A = mat(rng, 3, 3, -3, 4);
    const a = M.detValue(A);
    return { kind: 'number', prompt: { key: 'q.detTranspose', params: { a } }, matrices: [], answer: M.detValue(M.transposeMatrix(A).result), hint: { key: 'h.detTranspose' } };
  },
  detInverse(rng) {
    const A = niceInvertible(rng);
    const a = M.detValue(A);
    return { kind: 'number', prompt: { key: 'q.detInverse', params: { a } }, matrices: [], answer: M.detValue(M.inverseMatrix(A).result), hint: { key: 'h.detInverse' }, work: `1 / ${par(a)} = ${fmt(1 / a)}` };
  },
  trace(rng) {
    const A = mat(rng, 3, 3);
    const r = M.traceMatrix(A);
    return { kind: 'number', prompt: { key: 'q.trace' }, matrices: [{ name: 'A', M: A }], answer: r.result, hint: { key: 'h.trace' }, work: `${A.map((row, i) => par(row[i])).join(' + ')} = ${fmt(r.result)}` };
  },
  solveX(rng) {
    for (;;) {
      const A = mat(rng, 2, 2, -4, 6);
      if (Math.abs(M.detValue(A)) < 1) continue;
      const x = [int(rng, -5, 6), int(rng, -5, 6)];
      const b = M.matVec(A, x);
      const sol = M.solveLinearSystem(A, b);
      if (sol.type !== 'unique') continue;
      const v = pickIdx(rng, 2);
      return {
        kind: 'number', prompt: { key: 'q.solveX', params: { v: v + 1 } },
        matrices: [{ name: '[A|b]', M: A.map((r, i) => [...r, b[i]]), augmentAt: 2 }],
        system: { A, b }, answer: sol.result[v], hint: { key: 'h.solve' }, work: `x₁ = ${fmt(sol.result[0])}, x₂ = ${fmt(sol.result[1])}`,
      };
    }
  },
  rank(rng) {
    const target = int(rng, 1, 3);
    const basis = Array.from({ length: target }, () => [int(rng, -3, 4), int(rng, -3, 4), int(rng, -3, 4)]);
    const rows = Array.from({ length: 3 }, (_, i) => (i < target ? basis[i] : basis.reduce((acc, row) => acc.map((v, j) => v + int(rng, -2, 2) * row[j]), [0, 0, 0])));
    const A = rows.sort(() => rng() - 0.5);
    return { kind: 'number', prompt: { key: 'q.rank' }, matrices: [{ name: 'A', M: A }], answer: M.matrixRank(A).result, hint: { key: 'h.rank' } };
  },
  area(rng) {
    const A = mat(rng, 2, 2, -3, 4);
    const v = Math.abs(M.detValue(A));
    return { kind: 'number', prompt: { key: 'q.area' }, matrices: [{ name: 'A', M: A }], answer: v, hint: { key: 'h.area' }, work: `|det A| = |${fmt(M.detValue(A))}| = ${fmt(v)}` };
  },
  powerCell(rng) {
    const A = mat(rng, 2, 2, -3, 4);
    const P = M.matrixPower(A, 2).result;
    const i = pickIdx(rng, 2); const j = pickIdx(rng, 2);
    return { kind: 'number', prompt: { key: 'q.powerCell', params: { i: i + 1, j: j + 1 } }, matrices: [{ name: 'A', M: A }], answer: P[i][j], hint: { key: 'h.power' }, work: `A² = [[${P.map((r) => r.map(fmt).join(', ')).join('], [')}]]` };
  },
  bfsLen(rng) {
    const n = 5;
    for (;;) {
      const g = M.createMatrix(n, n, () => (rng() < 0.3 ? 1 : 0));
      g[0][0] = 0; g[n - 1][n - 1] = 0;
      const r = bfs(g, [0, 0], [n - 1, n - 1]);
      if (!r.found && rng() < 0.7) continue;
      const grid = g.map((row, i) => row.map((v, j) => (i === 0 && j === 0 ? 'S' : i === n - 1 && j === n - 1 ? 'T' : v ? '#' : '·')).join(' '));
      return { kind: 'number', prompt: { key: 'q.bfsLen' }, matrices: [], grid, answer: r.found ? r.pathLength : -1, hint: { key: 'h.bfs' } };
    }
  },
};

export const LEVELS = [
  { n: 1, key: 'ch.lvl1', desc: 'ch.lvl1d', gens: ['dims', 'entry', 'rowsCount', 'colsCount', 'entry'] },
  { n: 2, key: 'ch.lvl2', desc: 'ch.lvl2d', gens: ['addCell', 'subCell', 'scalarCell', 'transposeCell', 'addFull'] },
  { n: 3, key: 'ch.lvl3', desc: 'ch.lvl3d', gens: ['canMultiply', 'productDims', 'mulCell', 'mulCell', 'mulFull'] },
  { n: 4, key: 'ch.lvl4', desc: 'ch.lvl4d', gens: ['det2', 'singular', 'det3', 'inverseCell', 'detScale'] },
  { n: 5, key: 'ch.lvl5', desc: 'ch.lvl5d', gens: ['solveX', 'rank', 'area', 'trace', 'solveX'] },
  { n: 6, key: 'ch.lvl6', desc: 'ch.lvl6d', gens: ['bfsLen', 'powerCell', 'detProduct', 'detInverse', 'mulFull', 'rank', 'bfsLen'] },
];

export const DAILY_POOL = ['mulCell', 'det2', 'det3', 'solveX', 'rank', 'inverseCell', 'bfsLen', 'powerCell', 'area', 'detProduct'];

export function generateQuestion(gen, rng = Math.random) {
  return { gen, ...GENERATORS[gen](rng) };
}

export function generateLevel(levelN, seed = Date.now()) {
  const rng = seededRandom(seed);
  const level = LEVELS.find((l) => l.n === levelN);
  return level.gens.map((g) => generateQuestion(g, rng));
}

/** Same daily question for everyone on the same calendar day. */
export function dailyQuestion(dayKey) {
  const seed = [...dayKey].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rng = seededRandom(seed);
  const gen = DAILY_POOL[Math.floor(rng() * DAILY_POOL.length)];
  return generateQuestion(gen, rng);
}

export function xpForLevel(n) {
  return 10 * n;
}

const near = (a, b) => Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(b));

/** Parses "3x2", "3 × 2", "3*2", "3 2", "3,2". */
export function parseDims(s) {
  const m = String(s).trim().match(/^(\d+)\s*[x×X*,\s]\s*(\d+)$/);
  return m ? [+m[1], +m[2]] : null;
}

/** Validates an answer against the engine-computed key. */
export function checkAnswer(q, input) {
  switch (q.kind) {
    case 'number': {
      const v = parseNumber(input);
      return Number.isFinite(v) && near(v, q.answer);
    }
    case 'dims': {
      const d = parseDims(input);
      return !!d && d[0] === q.answer[0] && d[1] === q.answer[1];
    }
    case 'choice':
      return Number(input) === q.answer;
    case 'matrix': {
      if (!Array.isArray(input)) return false;
      return q.answer.every((row, i) => row.every((v, j) => { const x = parseNumber(input[i]?.[j]); return Number.isFinite(x) && near(x, v); }));
    }
    default:
      return false;
  }
}

export function answerText(q, t) {
  if (q.kind === 'dims') return `${q.answer[0]} × ${q.answer[1]}`;
  if (q.kind === 'choice') return t(q.options[q.answer]);
  if (q.kind === 'matrix') return `[[${q.answer.map((r) => r.map(fmt).join(', ')).join('], [')}]]`;
  return fmt(q.answer);
}
