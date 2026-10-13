/**
 * Validation helpers and shared result builders for the math engine.
 * Every engine function returns a structured object:
 *   { ok, result, steps, explanation, warnings, error }
 * Text is never hard-coded here: `explanation`, step descriptions and errors
 * are { key, params } objects that the UI translates (see utils/stepText.js).
 */

export const EPS = 1e-10;

export function msg(key, params = {}) {
  return { key, params };
}

export function ok(result, { steps = [], explanation = null, warnings = [], ...extra } = {}) {
  return { ok: true, result, steps, explanation, warnings, error: null, ...extra };
}

export function fail(key, params = {}, extra = {}) {
  return { ok: false, result: null, steps: [], explanation: null, warnings: [], error: msg(key, params), ...extra };
}

/** True when M is a non-empty rectangular array of finite numbers. */
export function isValidMatrix(M) {
  if (!Array.isArray(M) || M.length === 0) return false;
  if (!Array.isArray(M[0]) || M[0].length === 0) return false;
  const cols = M[0].length;
  return M.every((row) => Array.isArray(row) && row.length === cols && row.every((v) => typeof v === 'number' && Number.isFinite(v)));
}

export function dims(M) {
  return { rows: M.length, cols: M[0]?.length ?? 0 };
}

export function isSquare(M) {
  return M.length === M[0].length;
}

/** Returns a failure object if invalid, otherwise null. */
export function checkMatrix(M, name = 'A') {
  if (!isValidMatrix(M)) return fail('err.invalidMatrix', { name });
  return null;
}

export function checkSquare(M, name = 'A') {
  const bad = checkMatrix(M, name);
  if (bad) return bad;
  if (!isSquare(M)) {
    const { rows, cols } = dims(M);
    return fail('err.notSquare', { name, rows, cols });
  }
  return null;
}

export function checkSameDims(A, B) {
  const a = checkMatrix(A, 'A') || checkMatrix(B, 'B');
  if (a) return a;
  const da = dims(A);
  const db = dims(B);
  if (da.rows !== db.rows || da.cols !== db.cols) {
    return fail('err.dimMismatch', { ar: da.rows, ac: da.cols, br: db.rows, bc: db.cols });
  }
  return null;
}

/** Relative tolerance based on the largest magnitude in M. */
export function tolFor(M) {
  let max = 0;
  for (const row of M) for (const v of row) max = Math.max(max, Math.abs(v));
  return Math.max(EPS, EPS * max * Math.max(M.length, M[0]?.length || 1) * 10);
}

/** Snaps tiny floating point noise: -0 → 0, 1.9999999999 → 2. */
export function clean(x, eps = 1e-9) {
  if (Math.abs(x) < eps) return 0;
  const r = Math.round(x);
  if (Math.abs(x - r) < eps * Math.max(1, Math.abs(x))) return r;
  return x;
}

export function cleanMatrix(M, eps) {
  return M.map((row) => row.map((v) => clean(v, eps)));
}

export function approxEqual(a, b, tol = 1e-9) {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}
