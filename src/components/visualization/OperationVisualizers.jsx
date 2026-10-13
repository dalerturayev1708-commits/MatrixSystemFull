/**
 * Visualizers for every operation. Each consumes the engine's own step records
 * so highlighted rows, columns, pivots and partial results are exactly what the
 * algorithm used. Nothing here recomputes the math.
 */
import { useApp } from '../../context/AppContext.jsx';
import { formatNumber } from '../../utils/formatting.js';
import MatrixGrid from '../matrix/MatrixGrid.jsx';
import StepVisualizer from './StepVisualizer.jsx';

const f = (v, d) => formatNumber(v, d);
const paren = (v, d) => (v < 0 ? `(${f(v, d)})` : f(v, d));

/** Partially filled result: cells computed so far show values, the rest are pending. */
function partial(result, filled) {
  return (i, j) => (filled(i, j) ? '' : 'pending');
}

export function ElementwiseVisualizer({ A, B, result, steps, op, scalar, resetKey }) {
  const { state } = useApp();
  const d = state.prefs.decimals;
  const symbol = { add: '+', sub: '−', hadamard: '⊙', scalarMul: '·', negate: '·' }[op];
  const cols = result[0].length;
  return (
    <StepVisualizer
      steps={steps}
      resetKey={resetKey}
      render={(s, idx) => {
        const done = (i, j) => i * cols + j <= idx;
        const hl = (i, j) => (i === s.i && j === s.j ? 'hl-a' : '');
        return (
          <div className="stack" style={{ gap: 12 }}>
            <div className="matrix-stage">
              {B ? (
                <>
                  <MatrixGrid matrix={A} name="A" highlight={hl} compact />
                  <span className="op-symbol">{symbol}</span>
                  <MatrixGrid matrix={B} name="B" highlight={(i, j) => (i === s.i && j === s.j ? 'hl-b' : '')} compact />
                </>
              ) : (
                <>
                  <span className="op-symbol mono">{f(scalar, d)}</span>
                  <span className="op-symbol">·</span>
                  <MatrixGrid matrix={A} name="A" highlight={hl} compact />
                </>
              )}
              <span className="op-symbol">=</span>
              <MatrixGrid matrix={result} highlight={(i, j) => (i === s.i && j === s.j ? 'hl-out' : partial(result, done)(i, j))} compact />
            </div>
            <div className="calc-line">
              c<sub>{s.i + 1}{s.j + 1}</sub> ={' '}
              {B ? (
                <>
                  <span className="a">{paren(s.a, d)}</span> {symbol === '⊙' ? '×' : symbol} <span className="b">{paren(s.b, d)}</span>
                </>
              ) : (
                <>
                  <span className="b">{paren(s.k, d)}</span> × <span className="a">{paren(s.a, d)}</span>
                </>
              )}{' '}= <span className="r">{f(s.value, d)}</span>
            </div>
          </div>
        );
      }}
    />
  );
}

export function MultiplyVisualizer({ A, B, result, steps, resetKey }) {
  const { state, t } = useApp();
  const d = state.prefs.decimals;
  const cols = result[0].length;
  return (
    <StepVisualizer
      steps={steps}
      resetKey={resetKey}
      describe={(s) => t('ops.cellCalc', { i: s.i + 1, j: s.j + 1, calc: s.terms.map((x) => `${paren(x.a, d)}·${paren(x.b, d)}`).join(' + '), v: s.value })}
      render={(s, idx) => {
        const done = (i, j) => i * cols + j <= idx;
        return (
          <div className="stack" style={{ gap: 12 }}>
            <div className="matrix-stage">
              <MatrixGrid matrix={A} name="A" compact highlight={(i) => (i === s.i ? 'hl-a' : 'hl-dim')} />
              <span className="op-symbol">×</span>
              <MatrixGrid matrix={B} name="B" compact highlight={(i, j) => (j === s.j ? 'hl-b' : 'hl-dim')} />
              <span className="op-symbol">=</span>
              <MatrixGrid matrix={result} compact highlight={(i, j) => (i === s.i && j === s.j ? 'hl-out' : done(i, j) ? '' : 'pending')} />
            </div>
            <div className="calc-line">
              c<sub>{s.i + 1}{s.j + 1}</sub> ={' '}
              {s.terms.map((x, k) => (
                <span key={k}>
                  {k > 0 && ' + '}
                  <span className="a">{paren(x.a, d)}</span>·<span className="b">{paren(x.b, d)}</span>
                </span>
              ))}
              {' '}= {s.terms.map((x) => paren(x.product, d)).join(' + ')} = <span className="r">{f(s.value, d)}</span>
            </div>
            <p className="small muted">
              {state.lang === 'uz'
                ? `A ning ${s.i + 1}-satri (moviy) B ning ${s.j + 1}-ustuniga (binafsha) mos elementlar bo'yicha ko'paytirilib, yig'iladi.`
                : `Row ${s.i + 1} of A (cyan) meets column ${s.j + 1} of B (violet): multiply matching entries, then add.`}
            </p>
          </div>
        );
      }}
    />
  );
}

export function TransposeVisualizer({ A, result, steps, resetKey }) {
  return (
    <StepVisualizer
      steps={steps}
      resetKey={resetKey}
      render={(s) => (
        <div className="matrix-stage">
          <MatrixGrid matrix={A} name="A" compact highlight={(i) => (i === s.row ? 'hl-a' : i < s.row ? '' : 'hl-dim')} />
          <span className="op-symbol">→</span>
          <MatrixGrid matrix={result} name="Aᵀ" compact highlight={(i, j) => (j === s.row ? 'hl-out' : j < s.row ? '' : 'pending')} />
        </div>
      )}
    />
  );
}

/** Row operations (REF, RREF, inverse, rank, determinant by elimination, systems). */
export function EliminationVisualizer({ steps, resetKey, augmentAt }) {
  return (
    <StepVisualizer
      steps={steps}
      resetKey={resetKey}
      render={(s) => {
        if (!s.matrix) return null;
        const [pr, pc] = s.pivot || [-1, -1];
        const target = s.type === 'eliminate' ? s.rows[0] : -1;
        const swapRows = s.type === 'swap' ? s.rows : [];
        const scaled = s.type === 'scale' ? s.rows[0] : -1;
        const hl = (i, j) => {
          if (i === pr && j === pc) return 'hl-pivot';
          if (i === target) return 'hl-a';
          if (swapRows.includes(i) || i === scaled) return 'hl-b';
          if (s.type === 'eliminate' && i === s.rows[1]) return 'hl-b';
          if (s.type === 'noPivot' && j === s.col) return 'hl-dim';
          return '';
        };
        return (
          <div className="stack" style={{ gap: 10 }}>
            <MatrixGrid matrix={s.matrix} highlight={hl} augmentAt={augmentAt} showIndices />
            <div className="legend">
              <span><i style={{ background: 'var(--amber)' }} />pivot</span>
              <span><i style={{ background: 'var(--cyan)' }} />R target</span>
              <span><i style={{ background: 'var(--violet)' }} />R source / swap</span>
            </div>
          </div>
        );
      }}
    />
  );
}

export function CofactorDetVisualizer({ A, steps, resetKey }) {
  const { state } = useApp();
  const d = state.prefs.decimals;
  return (
    <StepVisualizer
      steps={steps}
      resetKey={resetKey}
      render={(s) => {
        if (s.type === 'cofactor') {
          return (
            <div className="matrix-stage">
              <MatrixGrid matrix={A} name="A" compact highlight={(i, j) => (i === 0 && j === s.col ? 'hl-pivot' : i === 0 || j === s.col ? 'hl-dim' : 'hl-a')} />
              <span className="op-symbol">→</span>
              <MatrixGrid matrix={s.minor} name={`M₁${s.col + 1}`} compact />
              <div className="calc-line">
                det M = <span className="a">{f(s.minorDet, d)}</span><br />
                {s.sign > 0 ? '+' : '−'} <span className="b">{paren(s.entry, d)}</span> × {paren(s.minorDet, d)} = <span className="r">{f(s.term, d)}</span>
              </div>
            </div>
          );
        }
        return <MatrixGrid matrix={A} name="A" compact />;
      }}
    />
  );
}

export function PowerVisualizer({ steps, resetKey }) {
  return (
    <StepVisualizer
      steps={steps}
      resetKey={resetKey}
      render={(s) => <MatrixGrid matrix={s.matrix} name={`A^${s.power}`} />}
    />
  );
}

export function LUVisualizer({ steps, resetKey }) {
  return (
    <StepVisualizer
      steps={steps}
      resetKey={resetKey}
      render={(s) => (
        <div className="matrix-stage">
          <MatrixGrid matrix={s.L} name="L" compact highlight={(i, j) => (s.type === 'eliminate' && i === s.rows[0] && j === s.rows[1] ? 'hl-out' : '')} />
          <MatrixGrid matrix={s.U} name="U" compact highlight={(i) => (s.rows?.[0] === i ? 'hl-a' : s.rows?.[1] === i ? 'hl-b' : '')} />
        </div>
      )}
    />
  );
}
