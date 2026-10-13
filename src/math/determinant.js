/**
 * Determinants, minors, cofactors and the adjugate.
 *
 * Methods:
 *  - cofactor (Laplace) expansion along the first row — exact and easy to
 *    follow, but O(n!) so it is limited to n ≤ 6.
 *  - elimination: reduce to an upper triangular matrix with partial pivoting;
 *    det = (−1)^(row swaps) × product of the diagonal. O(n³).
 */
import { ok, fail, msg, checkSquare, clean } from './validation.js';
import { rowEchelon } from './elimination.js';
import { transposeMatrix } from './matrixCore.js';

export function submatrix(A, row, col) {
  return A.filter((_, i) => i !== row).map((r) => r.filter((_, j) => j !== col));
}

function detElimValue(A) {
  if (A.length === 0) return 1;
  const r = rowEchelon(A);
  const U = r.raw;
  let d = r.swaps % 2 === 0 ? 1 : -1;
  for (let i = 0; i < U.length; i++) d *= U[i][i];
  return clean(d);
}

function detCofactorValue(A) {
  const n = A.length;
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  let s = 0;
  for (let j = 0; j < n; j++) {
    if (A[0][j] === 0) continue;
    s += (j % 2 === 0 ? 1 : -1) * A[0][j] * detCofactorValue(submatrix(A, 0, j));
  }
  return s;
}

export function determinant(A, { method = 'auto' } = {}) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const n = A.length;
  const warnings = [];
  let m = method;
  if (m === 'auto') m = n <= 3 ? 'cofactor' : 'elimination';
  if (m === 'cofactor' && n > 6) {
    warnings.push(msg('warn.cofactorLarge', { n }));
    m = 'elimination';
  }

  if (n === 1) {
    return ok(A[0][0], { method: 'direct', steps: [{ type: 'direct', text: msg('step.det1', { v: A[0][0] }) }], explanation: msg('exp.det1'), warnings });
  }

  if (m === 'cofactor') {
    if (n === 2) {
      const [[a, b], [c, d]] = A;
      const v = clean(a * d - b * c);
      return ok(v, {
        method: 'cofactor',
        steps: [{ type: 'det2', text: msg('step.det2', { a, b, c, d, ad: clean(a * d), bc: clean(b * c), v }) }],
        explanation: msg('exp.det2'),
        warnings,
      });
    }
    const steps = [];
    let total = 0;
    for (let j = 0; j < n; j++) {
      const sign = j % 2 === 0 ? 1 : -1;
      const minor = submatrix(A, 0, j);
      const minorDet = clean(detCofactorValue(minor));
      const term = clean(sign * A[0][j] * minorDet);
      total += term;
      steps.push({
        type: 'cofactor',
        col: j,
        sign,
        entry: A[0][j],
        minor,
        minorDet,
        term,
        text: msg('step.cofactorTerm', { j: j + 1, sign: sign > 0 ? '+' : '−', a: A[0][j], m: minorDet, t: term }),
      });
    }
    total = clean(total);
    steps.push({ type: 'sum', text: msg('step.cofactorSum', { terms: steps.map((s) => s.term).join(' + '), v: total }) });
    return ok(total, { method: 'cofactor', steps, explanation: msg('exp.detCofactor'), warnings });
  }

  const r = rowEchelon(A);
  const U = r.raw;
  const diag = U.map((row, i) => clean(row[i]));
  const sign = r.swaps % 2 === 0 ? 1 : -1;
  const v = clean(sign * diag.reduce((p, x) => p * x, 1));
  const steps = r.steps.slice();
  steps.push({
    type: 'product',
    matrix: r.result,
    diag,
    text: msg('step.detProduct', { swaps: r.swaps, sign: sign > 0 ? '+1' : '−1', diag: diag.join(' × '), v }),
  });
  return ok(v, { method: 'elimination', steps, explanation: msg('exp.detElim'), warnings });
}

export function getMinor(A, i, j) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const n = A.length;
  if (n < 2) return fail('err.minorSize');
  if (i < 0 || j < 0 || i >= n || j >= n) return fail('err.indexRange', { n });
  const sub = submatrix(A, i, j);
  const value = detElimValue(sub);
  const cof = clean(((i + j) % 2 === 0 ? 1 : -1) * value);
  return ok(value, { submatrix: sub, cofactor: cof, explanation: msg('exp.minor', { i: i + 1, j: j + 1, v: value, c: cof }) });
}

export function getMinors(A) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const n = A.length;
  if (n < 2) return fail('err.minorSize');
  const result = A.map((row, i) => row.map((_, j) => detElimValue(submatrix(A, i, j))));
  return ok(result, { explanation: msg('exp.minors') });
}

export function cofactorMatrix(A) {
  const m = getMinors(A);
  if (!m.ok) return m;
  const result = m.result.map((row, i) => row.map((v, j) => clean(((i + j) % 2 === 0 ? 1 : -1) * v)));
  return ok(result, { minors: m.result, explanation: msg('exp.cofactor') });
}

export function adjugateMatrix(A) {
  const c = cofactorMatrix(A);
  if (!c.ok) return c;
  const result = transposeMatrix(c.result).result;
  return ok(result, { cofactors: c.result, minors: c.minors, explanation: msg('exp.adjugate') });
}

/** Plain numeric determinant (elimination) for internal use. */
export const detValue = (A) => detElimValue(A);
