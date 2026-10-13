import { describe, it, expect } from 'vitest';
import {
  addMatrices, subtractMatrices, scalarMultiply, multiplyMatrices, hadamardProduct, transposeMatrix,
  matricesEqual, traceMatrix, matrixPower, identityMatrix, createMatrix, randomMatrix, negateMatrix,
  determinant, getMinor, getMinors, cofactorMatrix, adjugateMatrix, inverseMatrix, rref, rowEchelon,
  matrixRank, luDecomposition, solveLinearSystem, leastSquares, eigen, diagonalize, clean, nullSpace,
} from '../math/index.js';

const close = (A, B, tol = 1e-8) => {
  expect(A.length).toBe(B.length);
  A.forEach((row, i) => row.forEach((v, j) => expect(Math.abs(v - B[i][j])).toBeLessThan(tol)));
};

describe('constructors', () => {
  it('creates identity; engine never clamps large shapes (UI does)', () => {
    expect(identityMatrix(3)).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(createMatrix(30, 0).length).toBe(30);
    expect(createMatrix(30, 0)[0].length).toBe(1);
    const tall = createMatrix(40, 2, (i, j) => i * 2 + j);
    const T = transposeMatrix(tall).result;
    expect(T.length).toBe(2);
    expect(T[0].length).toBe(40);
    expect(T[1][39]).toBe(79);
    expect(multiplyMatrices(T, tall).ok).toBe(true);
  });
  it('random matrix respects bounds and decimals', () => {
    const M = randomMatrix(5, 4, { min: -2, max: 2, decimals: 1 });
    expect(M.length).toBe(5);
    M.flat().forEach((v) => { expect(v).toBeGreaterThanOrEqual(-2); expect(v).toBeLessThanOrEqual(2); expect(Math.round(v * 10) / 10).toBe(v); });
  });
});

describe('basic operations', () => {
  const A = [[1, 2], [3, 4]];
  const B = [[5, 6], [7, 8]];
  it('adds, subtracts, scales, negates', () => {
    expect(addMatrices(A, B).result).toEqual([[6, 8], [10, 12]]);
    expect(subtractMatrices(A, B).result).toEqual([[-4, -4], [-4, -4]]);
    expect(scalarMultiply(A, 3).result).toEqual([[3, 6], [9, 12]]);
    expect(negateMatrix(A).result).toEqual([[-1, -2], [-3, -4]]);
  });
  it('does not mutate inputs', () => {
    const a = [[1, 2], [3, 4]];
    addMatrices(a, B); transposeMatrix(a); inverseMatrix(a); rref(a); determinant(a, { method: 'elimination' });
    expect(a).toEqual([[1, 2], [3, 4]]);
  });
  it('rejects addition with mismatched dimensions', () => {
    const r = addMatrices(A, [[1, 2, 3]]);
    expect(r.ok).toBe(false);
    expect(r.error.key).toBe('err.dimMismatch');
  });
  it('multiplies with step records matching the result', () => {
    const r = multiplyMatrices([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]]);
    expect(r.result).toEqual([[58, 64], [139, 154]]);
    expect(r.steps).toHaveLength(4);
    r.steps.forEach((s) => expect(s.terms.reduce((acc, t) => acc + t.product, 0)).toBe(r.result[s.i][s.j]));
  });
  it('rejects incompatible multiplication', () => {
    const r = multiplyMatrices([[1, 2]], [[1, 2]]);
    expect(r.ok).toBe(false);
    expect(r.error.key).toBe('err.mulMismatch');
  });
  it('matrix product is not commutative', () => {
    expect(multiplyMatrices(A, B).result).not.toEqual(multiplyMatrices(B, A).result);
  });
  it('hadamard, transpose, trace, equality', () => {
    expect(hadamardProduct(A, B).result).toEqual([[5, 12], [21, 32]]);
    expect(transposeMatrix([[1, 2, 3], [4, 5, 6]]).result).toEqual([[1, 4], [2, 5], [3, 6]]);
    expect(traceMatrix(A).result).toBe(5);
    expect(traceMatrix([[1, 2]]).ok).toBe(false);
    expect(matricesEqual(A, [[1, 2], [3, 4 + 1e-13]]).result).toBe(true);
    expect(matricesEqual(A, B).result).toBe(false);
    expect(matricesEqual(A, [[1, 2]]).result).toBe(false);
  });
  it('handles floating point noise', () => {
    expect(addMatrices([[0.1]], [[0.2]]).result[0][0]).toBeCloseTo(0.3, 12);
    expect(clean(1.9999999999999)).toBe(2);
    expect(Object.is(clean(-0), 0)).toBe(true);
  });
  it('raises matrices to powers', () => {
    expect(matrixPower([[1, 1], [1, 0]], 10).result).toEqual([[89, 55], [55, 34]]);
    expect(matrixPower(A, 0).result).toEqual(identityMatrix(2));
    expect(matrixPower(A, 1.5).ok).toBe(false);
    close(matrixPower([[2, 0], [0, 4]], -1, inverseMatrix).result, [[0.5, 0], [0, 0.25]]);
    expect(matrixPower([[1, 2], [2, 4]], -1, inverseMatrix).ok).toBe(false);
  });
});

describe('determinant family', () => {
  const M3 = [[2, -3, 1], [2, 0, -1], [1, 4, 5]];
  it('computes 1x1, 2x2, 3x3 by cofactor and elimination consistently', () => {
    expect(determinant([[7]]).result).toBe(7);
    expect(determinant([[1, 2], [3, 4]]).result).toBe(-2);
    expect(determinant(M3).result).toBe(49);
    expect(determinant(M3, { method: 'elimination' }).result).toBe(49);
  });
  it('cofactor steps sum to the determinant', () => {
    const r = determinant(M3, { method: 'cofactor' });
    const terms = r.steps.filter((s) => s.type === 'cofactor').reduce((a, s) => a + s.term, 0);
    expect(terms).toBe(49);
  });
  it('handles row swaps and singular matrices', () => {
    expect(determinant([[0, 1], [1, 0]], { method: 'elimination' }).result).toBe(-1);
    expect(determinant([[1, 2, 3], [4, 5, 6], [7, 8, 9]]).result).toBe(0);
    expect(determinant([[1, 2, 3, 4], [2, 4, 6, 8], [1, 0, 1, 0], [3, 1, 2, 5]]).result).toBe(0);
  });
  it('4x4 and large cofactor fallback', () => {
    const M = [[1, 0, 2, -1], [3, 0, 0, 5], [2, 1, 4, -3], [1, 0, 5, 0]];
    expect(determinant(M).result).toBe(30);
    expect(determinant(M, { method: 'cofactor' }).result).toBe(30);
    const big = identityMatrix(8);
    const r = determinant(big, { method: 'cofactor' });
    expect(r.result).toBe(1);
    expect(r.warnings[0].key).toBe('warn.cofactorLarge');
  });
  it('rejects non-square matrices', () => {
    expect(determinant([[1, 2, 3]]).error.key).toBe('err.notSquare');
  });
  it('minors, cofactors, adjugate', () => {
    const A = [[1, 2], [3, 4]];
    expect(getMinors(A).result).toEqual([[4, 3], [2, 1]]);
    expect(cofactorMatrix(A).result).toEqual([[4, -3], [-2, 1]]);
    expect(adjugateMatrix(A).result).toEqual([[4, -2], [-3, 1]]);
    const m = getMinor(M3, 0, 0);
    expect(m.result).toBe(4);
    expect(m.cofactor).toBe(4);
    expect(getMinor(M3, 0, 1).cofactor).toBe(-11);
  });
});

describe('inverse', () => {
  it('inverts and verifies A·A⁻¹ = I', () => {
    const A = [[4, 7], [2, 6]];
    const r = inverseMatrix(A);
    close(r.result, [[0.6, -0.7], [-0.2, 0.4]]);
    close(r.verification, identityMatrix(2));
  });
  it('inverts a random well-conditioned 6x6', () => {
    const A = createMatrix(6, 6, (i, j) => (i === j ? 10 : (i * 7 + j * 3) % 5 - 2));
    const r = inverseMatrix(A);
    expect(r.ok).toBe(true);
    close(multiplyMatrices(A, r.result).result, identityMatrix(6), 1e-9);
  });
  it('refuses singular matrices', () => {
    const r = inverseMatrix([[1, 2], [2, 4]]);
    expect(r.ok).toBe(false);
    expect(r.error.key).toBe('err.singular');
    expect(inverseMatrix([[0]]).ok).toBe(false);
  });
  it('detects near-singular noise as singular', () => {
    expect(inverseMatrix([[0.1 + 0.2, 0.6], [1, 2]]).ok).toBe(false);
  });
});

describe('elimination', () => {
  it('computes RREF and rank', () => {
    const A = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    expect(rref(A).result).toEqual([[1, 0, -1], [0, 1, 2], [0, 0, 0]]);
    expect(matrixRank(A).result).toBe(2);
    expect(matrixRank(identityMatrix(4)).result).toBe(4);
    expect(matrixRank([[0, 0], [0, 0]]).result).toBe(0);
    expect(matrixRank([[1, 2, 3, 4]]).result).toBe(1);
  });
  it('REF is upper triangular and every step snapshot is recorded', () => {
    const r = rowEchelon([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]);
    const U = r.result;
    for (let i = 0; i < 3; i++) for (let j = 0; j < i; j++) expect(Math.abs(U[i][j])).toBeLessThan(1e-12);
    expect(r.steps[0].type).toBe('start');
    expect(r.steps.at(-1).type).toBe('done');
    r.steps.forEach((s) => expect(s.matrix).toBeDefined());
  });
  it('null space vectors satisfy Ax = 0', () => {
    const A = [[1, 2, 3], [2, 4, 6]];
    const basis = nullSpace(A);
    expect(basis).toHaveLength(2);
    basis.forEach((v) => A.forEach((row) => expect(Math.abs(row.reduce((s, a, j) => s + a * v[j], 0))).toBeLessThan(1e-12)));
  });
});

describe('LU decomposition', () => {
  it('satisfies PA = LU', () => {
    const A = [[0, 2, 1], [1, 1, 1], [4, 3, 2]];
    const { L, U, P } = luDecomposition(A).result;
    close(multiplyMatrices(P, A).result, multiplyMatrices(L, U).result);
    for (let i = 0; i < 3; i++) expect(L[i][i]).toBe(1);
  });
  it('warns for singular input', () => {
    const r = luDecomposition([[1, 2], [2, 4]]);
    expect(r.ok).toBe(true);
    expect(r.warnings[0].key).toBe('warn.luSingular');
  });
});

describe('linear systems', () => {
  it('solves a unique system', () => {
    const r = solveLinearSystem([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]);
    expect(r.type).toBe('unique');
    close([r.result], [[2, 3, -1]]);
  });
  it('detects an inconsistent system', () => {
    const r = solveLinearSystem([[1, 1], [1, 1]], [1, 2]);
    expect(r.type).toBe('none');
    expect(r.result).toBeNull();
  });
  it('describes infinitely many solutions', () => {
    const r = solveLinearSystem([[1, 1], [2, 2]], [3, 6]);
    expect(r.type).toBe('infinite');
    expect(r.freeVars).toEqual([1]);
    expect(r.nullBasis[0]).toEqual([-1, 1]);
  });
  it('validates vector length', () => {
    expect(solveLinearSystem([[1, 2], [3, 4]], [1]).error.key).toBe('err.systemDims');
  });
  it('least squares fits a line', () => {
    const A = [[1, 0], [1, 1], [1, 2], [1, 3]];
    const b = [1, 3, 5, 7];
    const r = leastSquares(A, b);
    close([r.result], [[1, 2]]);
    expect(r.residualNorm).toBeLessThan(1e-9);
    const r2 = leastSquares([[1, 0], [1, 1], [1, 2]], [1, 2, 2]);
    close([r2.result], [[7 / 6, 0.5]]);
  });
  it('least squares refuses rank-deficient A', () => {
    expect(leastSquares([[1, 2], [2, 4], [3, 6]], [1, 2, 3]).error.key).toBe('err.lsRankDeficient');
  });
});

describe('eigen', () => {
  const check = (A, groups) => groups.forEach((g) => g.vectors.forEach((v) => {
    const Av = A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
    Av.forEach((x, i) => expect(Math.abs(x - g.value * v[i])).toBeLessThan(1e-7));
  }));
  it('general 2x2 with real eigenvalues', () => {
    const A = [[4, 1], [2, 3]];
    const r = eigen(A);
    expect(r.result.map((g) => g.value)).toEqual([5, 2]);
    check(A, r.result);
  });
  it('2x2 complex eigenvalues reported honestly', () => {
    const r = eigen([[0, -1], [1, 0]]);
    expect(r.ok).toBe(true);
    expect(r.real).toBe(false);
    expect(r.complex[0]).toEqual({ re: 0, im: 1 });
  });
  it('symmetric 3x3 via Jacobi', () => {
    const A = [[2, -1, 0], [-1, 2, -1], [0, -1, 2]];
    const r = eigen(A);
    expect(r.method).toBe('jacobi');
    const vals = r.result.map((g) => g.value);
    [2 + Math.SQRT2, 2, 2 - Math.SQRT2].forEach((v, i) => expect(vals[i]).toBeCloseTo(v, 9));
    check(A, r.result);
  });
  it('triangular and repeated eigenvalues', () => {
    const r = eigen([[2, 1], [0, 2]]);
    expect(r.result[0]).toMatchObject({ value: 2, algebraic: 2, geometric: 1 });
  });
  it('unsupported general 3x3 is refused', () => {
    expect(eigen([[1, 2, 3], [0, 1, 4], [5, 6, 0]]).error.key).toBe('err.eigenUnsupported');
  });
  it('diagonalizes when possible and rejects defective matrices', () => {
    const A = [[4, 1], [2, 3]];
    const r = diagonalize(A);
    close(r.check, A, 1e-7);
    expect(diagonalize([[2, 1], [0, 2]]).error.key).toBe('err.notDiagonalizable');
    expect(diagonalize([[0, -1], [1, 0]]).error.key).toBe('err.diagComplex');
  });
});
