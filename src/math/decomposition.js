/**
 * LU decomposition with partial pivoting: P·A = L·U
 *  - P: permutation matrix (row swaps)
 *  - L: unit lower triangular (the elimination multipliers)
 *  - U: upper triangular (the row echelon form)
 * Works for every square matrix; if A is singular, U has a zero on its diagonal.
 */
import { ok, msg, checkSquare, cleanMatrix, tolFor } from './validation.js';
import { identityMatrix } from './matrixCore.js';

export function luDecomposition(A) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const n = A.length;
  const U = A.map((r) => r.slice());
  const L = identityMatrix(n).map((r) => r.map(() => 0));
  const perm = [...Array(n).keys()];
  const tol = tolFor(A);
  const steps = [];
  const warnings = [];
  let singular = false;

  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(U[i][k]) > Math.abs(U[p][k])) p = i;
    if (p !== k) {
      [U[p], U[k]] = [U[k], U[p]];
      [L[p], L[k]] = [L[k], L[p]];
      [perm[p], perm[k]] = [perm[k], perm[p]];
      steps.push({ type: 'swap', rows: [k, p], L: cleanMatrix(L.map((r, i) => r.map((v, j) => (i === j ? 1 : v)))), U: cleanMatrix(U), text: msg('step.swap', { a: k + 1, b: p + 1 }) });
    }
    if (Math.abs(U[k][k]) <= tol) {
      singular = true;
      steps.push({ type: 'zeroPivot', col: k, L: cleanMatrix(L), U: cleanMatrix(U), text: msg('step.luZeroPivot', { c: k + 1 }) });
      continue;
    }
    for (let i = k + 1; i < n; i++) {
      const f = U[i][k] / U[k][k];
      L[i][k] = f;
      U[i] = U[i].map((v, j) => (j < k ? v : v - f * U[k][j]));
      U[i][k] = 0;
      steps.push({
        type: 'eliminate',
        rows: [i, k],
        factor: f,
        L: cleanMatrix(L.map((r, a) => r.map((v, b) => (a === b ? 1 : v)))),
        U: cleanMatrix(U),
        text: msg('step.luMultiplier', { i: i + 1, k: k + 1, f: +f.toFixed(6) }),
      });
    }
  }
  for (let i = 0; i < n; i++) L[i][i] = 1;
  const P = perm.map((pi) => identityMatrix(n)[pi]);
  if (singular) warnings.push(msg('warn.luSingular'));
  return ok(
    { L: cleanMatrix(L, 1e-9), U: cleanMatrix(U, 1e-9), P },
    { steps, warnings, explanation: msg('exp.lu') },
  );
}
