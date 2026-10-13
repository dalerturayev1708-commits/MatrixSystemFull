/**
 * Core matrix constructors and element-wise / product operations.
 * Matrices are plain arrays of rows: M[i][j] is row i, column j (0-based
 * internally; the UI shows 1-based a_ij to match mathematical convention).
 * No function mutates its inputs.
 */
import { ok, fail, msg, checkMatrix, checkSameDims, checkSquare, dims, clean, cleanMatrix, approxEqual } from './validation.js';

export const MAX_DIM = 20;

/** Clamp a dimension to the editor's supported range (UI concern, not math). */
export const clampDim = (n) => Math.max(1, Math.min(MAX_DIM, Math.floor(n) || 1));

/** Creates rows × cols. Never clamps — the 20×20 limit is enforced by the editor UI. */
export function createMatrix(rows, cols, fill = 0) {
  const r = Math.max(1, Math.floor(rows));
  const c = Math.max(1, Math.floor(cols));
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => (typeof fill === 'function' ? fill(i, j) : fill)),
  );
}

export const zerosMatrix = (rows, cols = rows) => createMatrix(rows, cols, 0);

export const identityMatrix = (n) => createMatrix(n, n, (i, j) => (i === j ? 1 : 0));

export function randomMatrix(rows, cols = rows, { min = -9, max = 9, decimals = 0, rng = Math.random } = {}) {
  const f = 10 ** decimals;
  return createMatrix(rows, cols, () => {
    const v = min + rng() * (max - min);
    return decimals > 0 ? Math.round(v * f) / f : Math.round(v);
  });
}

export function diagonalMatrix(values) {
  const n = values.length;
  return createMatrix(n, n, (i, j) => (i === j ? values[i] : 0));
}

export function triangularMatrix(n, kind = 'upper', opts = {}) {
  const R = randomMatrix(n, n, opts);
  return R.map((row, i) => row.map((v, j) => ((kind === 'upper' ? j >= i : j <= i) ? v : 0)));
}

export const cloneMatrix = (M) => M.map((row) => row.slice());

export function addMatrices(A, B) {
  const bad = checkSameDims(A, B);
  if (bad) return bad;
  const steps = [];
  const result = A.map((row, i) =>
    row.map((a, j) => {
      const v = clean(a + B[i][j]);
      steps.push({ i, j, a, b: B[i][j], value: v, text: msg('step.addCell', { i: i + 1, j: j + 1, a, b: B[i][j], v }) });
      return v;
    }),
  );
  return ok(result, { steps, explanation: msg('exp.add', dims(A)) });
}

export function subtractMatrices(A, B) {
  const bad = checkSameDims(A, B);
  if (bad) return bad;
  const steps = [];
  const result = A.map((row, i) =>
    row.map((a, j) => {
      const v = clean(a - B[i][j]);
      steps.push({ i, j, a, b: B[i][j], value: v, text: msg('step.subCell', { i: i + 1, j: j + 1, a, b: B[i][j], v }) });
      return v;
    }),
  );
  return ok(result, { steps, explanation: msg('exp.sub', dims(A)) });
}

export function scalarMultiply(A, k) {
  const bad = checkMatrix(A);
  if (bad) return bad;
  if (typeof k !== 'number' || !Number.isFinite(k)) return fail('err.badScalar');
  const steps = [];
  const result = A.map((row, i) =>
    row.map((a, j) => {
      const v = clean(k * a);
      steps.push({ i, j, a, k, value: v, text: msg('step.scaleCell', { i: i + 1, j: j + 1, k, a, v }) });
      return v;
    }),
  );
  return ok(result, { steps, explanation: msg('exp.scalar', { k }) });
}

export function negateMatrix(A) {
  const r = scalarMultiply(A, -1);
  if (r.ok) r.explanation = msg('exp.negate');
  return r;
}

/** Standard matrix product: (AB)_ij = Σ_k A_ik · B_kj. Requires cols(A) = rows(B). */
export function multiplyMatrices(A, B) {
  const bad = checkMatrix(A, 'A') || checkMatrix(B, 'B');
  if (bad) return bad;
  const da = dims(A);
  const db = dims(B);
  if (da.cols !== db.rows) {
    return fail('err.mulMismatch', { ar: da.rows, ac: da.cols, br: db.rows, bc: db.cols });
  }
  const steps = [];
  const result = [];
  for (let i = 0; i < da.rows; i++) {
    const row = [];
    for (let j = 0; j < db.cols; j++) {
      const terms = [];
      let sum = 0;
      for (let k = 0; k < da.cols; k++) {
        terms.push({ a: A[i][k], b: B[k][j], product: clean(A[i][k] * B[k][j]) });
        sum += A[i][k] * B[k][j];
      }
      sum = clean(sum);
      row.push(sum);
      steps.push({ i, j, terms, value: sum, text: msg('step.mulCell', { i: i + 1, j: j + 1, v: sum }) });
    }
    result.push(row);
  }
  return ok(result, { steps, explanation: msg('exp.mul', { ar: da.rows, ac: da.cols, bc: db.cols }) });
}

/** Hadamard (element-wise) product — NOT the standard matrix product. */
export function hadamardProduct(A, B) {
  const bad = checkSameDims(A, B);
  if (bad) return bad;
  const steps = [];
  const result = A.map((row, i) =>
    row.map((a, j) => {
      const v = clean(a * B[i][j]);
      steps.push({ i, j, a, b: B[i][j], value: v, text: msg('step.hadCell', { i: i + 1, j: j + 1, a, b: B[i][j], v }) });
      return v;
    }),
  );
  return ok(result, { steps, explanation: msg('exp.hadamard'), warnings: [msg('warn.hadamard')] });
}

export function transposeMatrix(A) {
  const bad = checkMatrix(A);
  if (bad) return bad;
  const { rows, cols } = dims(A);
  const result = createMatrix(cols, rows, (i, j) => A[j][i]);
  const steps = A.map((row, i) => ({ row: i, values: row.slice(), text: msg('step.transposeRow', { i: i + 1 }) }));
  return ok(result, { steps, explanation: msg('exp.transpose', { rows, cols }) });
}

export function matricesEqual(A, B, tol = 1e-9) {
  const bad = checkMatrix(A, 'A') || checkMatrix(B, 'B');
  if (bad) return bad;
  const da = dims(A);
  const db = dims(B);
  if (da.rows !== db.rows || da.cols !== db.cols) {
    return ok(false, { explanation: msg('exp.eqDims', { ar: da.rows, ac: da.cols, br: db.rows, bc: db.cols }) });
  }
  const diffs = [];
  A.forEach((row, i) => row.forEach((a, j) => { if (!approxEqual(a, B[i][j], tol)) diffs.push({ i, j }); }));
  return ok(diffs.length === 0, { steps: diffs, explanation: msg(diffs.length ? 'exp.eqDiff' : 'exp.eqSame', { n: diffs.length }) });
}

export function traceMatrix(A) {
  const bad = checkSquare(A);
  if (bad) return bad;
  const diag = A.map((row, i) => row[i]);
  const value = clean(diag.reduce((s, v) => s + v, 0));
  return ok(value, { steps: diag.map((v, i) => ({ i, value: v })), explanation: msg('exp.trace', { terms: diag.join(' + '), v: value }) });
}

/** A^k for square A and integer k ≥ 0 (binary exponentiation). Negative k uses the inverse. */
export function matrixPower(A, k, inverseFn) {
  const bad = checkSquare(A);
  if (bad) return bad;
  if (!Number.isInteger(k)) return fail('err.powerInt');
  if (Math.abs(k) > 64) return fail('err.powerRange');
  let base = A;
  if (k < 0) {
    if (!inverseFn) return fail('err.powerNeg');
    const inv = inverseFn(A);
    if (!inv.ok) return fail('err.powerSingular');
    base = inv.result;
  }
  let e = Math.abs(k);
  let result = identityMatrix(A.length);
  const steps = [];
  let cur = base;
  while (e > 0) {
    if (e & 1) result = multiplyMatrices(result, cur).result;
    e >>= 1;
    if (e > 0) cur = multiplyMatrices(cur, cur).result;
  }
  // Linear steps for small powers so learners can follow every multiplication.
  if (Math.abs(k) <= 8) {
    let acc = identityMatrix(A.length);
    steps.push({ power: 0, matrix: acc, text: msg('step.power0') });
    for (let s = 1; s <= Math.abs(k); s++) {
      acc = multiplyMatrices(acc, base).result;
      steps.push({ power: s, matrix: acc, text: msg('step.powerN', { s }) });
    }
  }
  return ok(cleanMatrix(result), { steps, explanation: msg('exp.power', { k }) });
}

export function isSymmetric(A, tol = 1e-9) {
  if (!A.length || A.length !== A[0].length) return false;
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) if (!approxEqual(A[i][j], A[j][i], tol)) return false;
  return true;
}

export function isUpperTriangular(A, tol = 1e-12) {
  for (let i = 0; i < A.length; i++) for (let j = 0; j < Math.min(i, A[0].length); j++) if (Math.abs(A[i][j]) > tol) return false;
  return true;
}

export function isLowerTriangular(A, tol = 1e-12) {
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A[0].length; j++) if (Math.abs(A[i][j]) > tol) return false;
  return true;
}

/** Matrix-vector product with a plain array vector. */
export function matVec(A, v) {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
}
