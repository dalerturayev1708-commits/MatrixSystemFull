/**
 * Linear systems Ax = b.
 *  - solveLinearSystem: Gauss–Jordan on [A | b]; classifies the system as
 *    having a unique solution, infinitely many, or none (inconsistent).
 *  - leastSquares: solves the normal equations AᵀA x = Aᵀb. Only supported
 *    when A has full column rank (otherwise the minimiser is not unique).
 */
import { ok, fail, msg, checkMatrix, clean, tolFor } from './validation.js';
import { rref, nullSpace, matrixRank } from './elimination.js';
import { transposeMatrix, multiplyMatrices, matVec } from './matrixCore.js';

function toVector(b) {
  if (!Array.isArray(b)) return null;
  if (b.every((v) => typeof v === 'number')) return b.slice();
  if (b.every((r) => Array.isArray(r) && r.length === 1)) return b.map((r) => r[0]);
  return null;
}

export function solveLinearSystem(A, bIn) {
  const bad = checkMatrix(A);
  if (bad) return bad;
  const b = toVector(bIn);
  if (!b || !b.every(Number.isFinite)) return fail('err.badVector');
  if (b.length !== A.length) return fail('err.systemDims', { rows: A.length, len: b.length });
  const n = A[0].length;
  const aug = A.map((row, i) => [...row, b[i]]);
  const r = rref(aug, { augmentedCols: 1, tol: tolFor(aug) });
  const R = r.result;
  const tol = 1e-9;

  const inconsistentRow = R.findIndex((row) => row.slice(0, n).every((v) => Math.abs(v) < tol) && Math.abs(row[n]) > tol);
  if (inconsistentRow !== -1) {
    return ok(null, {
      type: 'none',
      steps: r.steps,
      inconsistentRow,
      explanation: msg('exp.sysNone', { r: inconsistentRow + 1, v: R[inconsistentRow][n] }),
    });
  }

  const pivotCols = r.pivots.map(([, c]) => c);
  const x = new Array(n).fill(0);
  r.pivots.forEach(([row, c]) => { x[c] = clean(R[row][n]); });
  const rank = pivotCols.length;

  if (rank === n) {
    return ok(x, { type: 'unique', steps: r.steps, rank, explanation: msg('exp.sysUnique', { rank, n }) });
  }
  const freeVars = [];
  for (let c = 0; c < n; c++) if (!pivotCols.includes(c)) freeVars.push(c);
  const basis = nullSpace(A);
  return ok(x, {
    type: 'infinite',
    steps: r.steps,
    rank,
    freeVars,
    nullBasis: basis,
    explanation: msg('exp.sysInfinite', { rank, n, free: freeVars.map((f) => 'x' + (f + 1)).join(', ') }),
  });
}

export function leastSquares(A, bIn) {
  const bad = checkMatrix(A);
  if (bad) return bad;
  const b = toVector(bIn);
  if (!b || !b.every(Number.isFinite)) return fail('err.badVector');
  if (b.length !== A.length) return fail('err.systemDims', { rows: A.length, len: b.length });
  const n = A[0].length;
  const rank = matrixRank(A).result;
  if (rank < n) return fail('err.lsRankDeficient', { rank, n });
  const At = transposeMatrix(A).result;
  const AtA = multiplyMatrices(At, A).result;
  const Atb = matVec(At, b).map((v) => clean(v));
  const sol = solveLinearSystem(AtA, Atb);
  if (!sol.ok || sol.type !== 'unique') return fail('err.lsRankDeficient', { rank, n });
  const x = sol.result;
  const fitted = matVec(A, x);
  const residual = b.map((v, i) => clean(v - fitted[i], 1e-9));
  const norm = Math.sqrt(residual.reduce((s, v) => s + v * v, 0));
  return ok(x, {
    AtA,
    Atb,
    residual,
    residualNorm: clean(norm, 1e-9),
    steps: sol.steps,
    explanation: msg('exp.leastSquares', { norm: +norm.toFixed(6) }),
  });
}
