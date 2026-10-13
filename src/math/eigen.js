/**
 * Eigenvalues and eigenvectors — SUPPORTED CASES ONLY.
 *
 *  1. 1×1 matrices.
 *  2. Triangular matrices (upper or lower): eigenvalues are the diagonal entries.
 *  3. Real symmetric matrices of any size up to 20×20: cyclic Jacobi rotation
 *     method. Always real eigenvalues and an orthonormal eigenvector basis.
 *  4. General 2×2 real matrices: characteristic polynomial λ² − tr(A)λ + det(A).
 *     If the discriminant is negative the eigenvalues are complex; we report them
 *     but do not compute complex eigenvectors.
 *
 * General non-symmetric matrices larger than 2×2 are reported as unsupported
 * rather than approximated with a method that could silently fail.
 */
import { ok, fail, msg, checkSquare, clean } from './validation.js';
import { identityMatrix, isSymmetric, isUpperTriangular, isLowerTriangular, multiplyMatrices, diagonalMatrix } from './matrixCore.js';
import { nullSpace } from './elimination.js';
import { inverseMatrix } from './inverse.js';

function normalizeVec(v) {
  const max = v.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0);
  if (Math.abs(max) < 1e-14) return v.map(() => 0);
  const first = v.find((x) => Math.abs(x) > 1e-9) ?? 1;
  const s = Math.sign(first) / Math.abs(max);
  return v.map((x) => clean(x * s, 1e-9));
}

function shift(A, lambda) {
  return A.map((row, i) => row.map((v, j) => (i === j ? v - lambda : v)));
}

function distinct(values, tol = 1e-8) {
  const out = [];
  for (const v of values) {
    const hit = out.find((o) => Math.abs(o.value - v) < tol * Math.max(1, Math.abs(v)));
    if (hit) hit.multiplicity++;
    else out.push({ value: v, multiplicity: 1 });
  }
  return out;
}

function vectorsFor(A, lambdas) {
  const scale = Math.max(1, ...A.flat().map(Math.abs));
  return distinct(lambdas).map(({ value, multiplicity }) => {
    const basis = nullSpace(shift(A, value), 1e-7 * scale).map(normalizeVec);
    return { value: clean(value, 1e-9), algebraic: multiplicity, geometric: basis.length, vectors: basis };
  });
}

function jacobi(S, maxSweeps = 100) {
  const n = S.length;
  const A = S.map((r) => r.slice());
  const V = identityMatrix(n);
  let sweeps = 0;
  for (; sweeps < maxSweeps; sweeps++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-15) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p];
          const akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k];
          const aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p];
          const vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  return { values: A.map((r, i) => r[i]), V, sweeps };
}

export function eigen(A) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const n = A.length;

  if (n === 1) {
    return ok([{ value: A[0][0], algebraic: 1, geometric: 1, vectors: [[1]] }], { method: 'direct', real: true, explanation: msg('exp.eig1') });
  }

  if (isUpperTriangular(A) || isLowerTriangular(A)) {
    const lambdas = A.map((r, i) => r[i]);
    return ok(vectorsFor(A, lambdas), { method: 'triangular', real: true, explanation: msg('exp.eigTriangular') });
  }

  if (isSymmetric(A)) {
    const { values, V, sweeps } = jacobi(A);
    const order = values.map((v, i) => i).sort((a, b) => values[b] - values[a]);
    const groups = distinct(order.map((i) => values[i]));
    let idx = 0;
    const result = groups.map((g) => {
      const vecs = [];
      for (let m = 0; m < g.multiplicity; m++) {
        const col = order[idx++];
        vecs.push(normalizeVec(V.map((row) => row[col])));
      }
      return { value: clean(g.value, 1e-9), algebraic: g.multiplicity, geometric: g.multiplicity, vectors: vecs };
    });
    return ok(result, { method: 'jacobi', real: true, sweeps, explanation: msg('exp.eigJacobi', { sweeps }) });
  }

  if (n === 2) {
    const [[a, b], [c, d]] = A;
    const tr = a + d;
    const det = a * d - b * c;
    const disc = tr * tr - 4 * det;
    const poly = { tr: clean(tr), det: clean(det), disc: clean(disc) };
    if (disc < -1e-12) {
      const re = clean(tr / 2);
      const im = clean(Math.sqrt(-disc) / 2, 1e-12);
      return ok([], {
        method: 'characteristic',
        real: false,
        complex: [{ re, im }, { re, im: -im }],
        poly,
        explanation: msg('exp.eigComplex', { re, im: +im.toFixed(6) }),
        warnings: [msg('warn.eigComplex')],
      });
    }
    const root = Math.sqrt(Math.max(0, disc));
    const l1 = (tr + root) / 2;
    const l2 = (tr - root) / 2;
    return ok(vectorsFor(A, [l1, l2]), { method: 'characteristic', real: true, poly, explanation: msg('exp.eig2', poly) });
  }

  return fail('err.eigenUnsupported', { n });
}

export function diagonalize(A) {
  const e = eigen(A);
  if (!e.ok) return e;
  if (!e.real) return fail('err.diagComplex');
  const n = A.length;
  const vecs = [];
  const vals = [];
  for (const g of e.result) {
    for (const v of g.vectors) {
      vecs.push(v);
      vals.push(g.value);
    }
  }
  if (vecs.length < n) {
    const defective = e.result.find((g) => g.geometric < g.algebraic);
    return fail('err.notDiagonalizable', { l: defective?.value ?? '?', a: defective?.algebraic ?? 0, g: defective?.geometric ?? 0 });
  }
  const P = Array.from({ length: n }, (_, i) => vecs.map((v) => v[i]));
  const D = diagonalMatrix(vals);
  const Pinv = inverseMatrix(P);
  if (!Pinv.ok) return fail('err.notDiagonalizable', { l: '?', a: 0, g: 0 });
  const check = multiplyMatrices(multiplyMatrices(P, D).result, Pinv.result).result;
  return ok({ P, D, Pinv: Pinv.result }, { check, eigen: e.result, explanation: msg('exp.diagonalize') });
}
