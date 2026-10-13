/**
 * Matrix inverse by Gauss–Jordan elimination on the augmented matrix [A | I].
 * If the left block cannot be reduced to I (fewer than n pivots) the matrix is
 * singular and no inverse exists — we never return a fake result.
 */
import { ok, fail, msg, checkSquare, cleanMatrix, tolFor } from './validation.js';
import { identityMatrix, multiplyMatrices } from './matrixCore.js';
import { rref } from './elimination.js';
import { detValue } from './determinant.js';

export function inverseMatrix(A) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const n = A.length;
  const I = identityMatrix(n);
  const aug = A.map((row, i) => [...row, ...I[i]]);
  const r = rref(aug, { augmentedCols: n, tol: tolFor(A) });
  if (r.pivots.length < n) {
    return fail('err.singular', { rank: r.pivots.length, n }, { steps: r.steps, det: 0 });
  }
  const result = cleanMatrix(r.result.map((row) => row.slice(n)), 1e-9);
  const warnings = [];
  const check = multiplyMatrices(A, result).result;
  let residual = 0;
  check.forEach((row, i) => row.forEach((v, j) => { residual = Math.max(residual, Math.abs(v - (i === j ? 1 : 0))); }));
  if (residual > 1e-6) warnings.push(msg('warn.illConditioned', { r: residual.toExponential(2) }));
  return ok(result, {
    steps: r.steps,
    augmentedCols: n,
    det: detValue(A),
    verification: cleanMatrix(check, 1e-9),
    explanation: msg('exp.inverse'),
    warnings,
  });
}

/** Inverse via adjugate / determinant — shown for small matrices in lessons. */
export function inverseByAdjugate(A, adjugateFn) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const d = detValue(A);
  if (Math.abs(d) < 1e-12) return fail('err.singular', { rank: '<' + A.length, n: A.length });
  const adj = adjugateFn(A).result;
  return ok(cleanMatrix(adj.map((row) => row.map((v) => v / d))), { det: d, adjugate: adj, explanation: msg('exp.inverseAdj') });
}
