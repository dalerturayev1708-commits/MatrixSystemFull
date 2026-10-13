/**
 * Gaussian elimination (row echelon form) and Gauss–Jordan elimination
 * (reduced row echelon form), with a recorded step for every row operation.
 *
 * Pivoting:
 *  - 'partial' (default): choose the row with the largest |value| in the pivot
 *    column. Numerically stable; this is what real software does.
 *  - 'first': choose the first row with a non-zero entry. Matches many textbooks.
 */
import { ok, msg, checkMatrix, tolFor, cleanMatrix, clean } from './validation.js';

function snapshot(M) {
  return cleanMatrix(M);
}

function choosePivot(M, r, c, tol, pivoting) {
  let p = -1;
  let best = tol;
  for (let i = r; i < M.length; i++) {
    const v = Math.abs(M[i][c]);
    if (pivoting === 'first') {
      if (v > tol) return i;
    } else if (v > best) {
      best = v;
      p = i;
    }
  }
  return p;
}

function eliminate(A, { reduced, pivoting = 'partial', augmentedCols = 0, tol: tolOverride } = {}) {
  const M = A.map((row) => row.slice());
  const rows = M.length;
  const cols = M[0].length;
  const coefCols = cols - augmentedCols;
  const tol = tolOverride ?? tolFor(A);
  const steps = [{ type: 'start', matrix: snapshot(M), text: msg('step.elimStart') }];
  const pivots = [];
  let swaps = 0;
  let r = 0;

  for (let c = 0; c < coefCols && r < rows; c++) {
    const p = choosePivot(M, r, c, tol, pivoting);
    if (p === -1) {
      steps.push({ type: 'noPivot', col: c, matrix: snapshot(M), text: msg('step.noPivot', { c: c + 1 }) });
      continue;
    }
    if (p !== r) {
      [M[p], M[r]] = [M[r], M[p]];
      swaps++;
      steps.push({ type: 'swap', rows: [r, p], pivot: [r, c], matrix: snapshot(M), text: msg('step.swap', { a: r + 1, b: p + 1 }) });
    }
    steps.push({ type: 'pivot', pivot: [r, c], matrix: snapshot(M), text: msg('step.pivot', { r: r + 1, c: c + 1, v: clean(M[r][c]) }) });

    if (reduced) {
      const pv = M[r][c];
      if (Math.abs(pv - 1) > 1e-12) {
        M[r] = M[r].map((v) => v / pv);
        M[r][c] = 1;
        steps.push({ type: 'scale', rows: [r], pivot: [r, c], matrix: snapshot(M), text: msg('step.scaleRow', { r: r + 1, v: clean(pv) }) });
      }
    }

    for (let i = reduced ? 0 : r + 1; i < rows; i++) {
      if (i === r) continue;
      const factor = M[i][c] / M[r][c];
      if (Math.abs(factor) <= 1e-14) continue;
      M[i] = M[i].map((v, j) => v - factor * M[r][j]);
      M[i][c] = 0;
      steps.push({
        type: 'eliminate',
        rows: [i, r],
        target: i,
        pivot: [r, c],
        factor: clean(factor),
        matrix: snapshot(M),
        text: msg('step.eliminate', { i: i + 1, r: r + 1, f: clean(factor) }),
      });
    }
    pivots.push([r, c]);
    r++;
  }

  const result = cleanMatrix(M, 1e-9);
  steps.push({ type: 'done', matrix: result, text: msg(reduced ? 'step.rrefDone' : 'step.refDone', { rank: pivots.length }) });
  return { result, steps, pivots, swaps, raw: M };
}

export function rowEchelon(A, options = {}) {
  const bad = checkMatrix(A);
  if (bad) return bad;
  const out = eliminate(A, { ...options, reduced: false });
  return ok(out.result, { steps: out.steps, pivots: out.pivots, swaps: out.swaps, raw: out.raw, explanation: msg('exp.ref') });
}

export function rref(A, options = {}) {
  const bad = checkMatrix(A);
  if (bad) return bad;
  const out = eliminate(A, { ...options, reduced: true });
  return ok(out.result, { steps: out.steps, pivots: out.pivots, explanation: msg('exp.rref') });
}

export const gaussianElimination = rowEchelon;
export const gaussJordan = rref;

export function matrixRank(A) {
  const bad = checkMatrix(A);
  if (bad) return bad;
  const r = rref(A);
  const rank = r.pivots.length;
  const n = Math.min(A.length, A[0].length);
  return ok(rank, {
    steps: r.steps,
    pivots: r.pivots,
    explanation: msg(rank === n ? 'exp.rankFull' : 'exp.rankDeficient', { rank, n }),
  });
}

/** Basis for the null space of A (vectors x with Ax = 0), derived from RREF. */
export function nullSpace(A, tol = 1e-8) {
  const R = eliminate(A, { reduced: true, tol }).raw;
  const cols = A[0].length;
  const pivotCols = [];
  const pivotRowOf = {};
  for (let i = 0; i < R.length; i++) {
    const c = R[i].findIndex((v) => Math.abs(v) > tol);
    if (c !== -1 && !(c in pivotRowOf)) {
      pivotCols.push(c);
      pivotRowOf[c] = i;
    }
  }
  const free = [];
  for (let c = 0; c < cols; c++) if (!(c in pivotRowOf)) free.push(c);
  return free.map((f) => {
    const v = new Array(cols).fill(0);
    v[f] = 1;
    for (const p of pivotCols) v[p] = clean(-R[pivotRowOf[p]][f], 1e-9);
    return v;
  });
}
