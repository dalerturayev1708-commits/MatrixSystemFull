import { useMemo, useState } from 'react';
import { Play, History, ListChecks } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import MatrixEditor from '../components/matrix/MatrixEditor.jsx';
import MatrixPicker from '../components/matrix/MatrixPicker.jsx';
import MatrixGrid from '../components/matrix/MatrixGrid.jsx';
import ResultMatrix from '../components/matrix/ResultMatrix.jsx';
import { ResultMessages, Callout } from '../components/common/Messages.jsx';
import {
  ElementwiseVisualizer, MultiplyVisualizer, TransposeVisualizer, EliminationVisualizer, PowerVisualizer, LUVisualizer,
} from '../components/visualization/OperationVisualizers.jsx';
import { useApp } from '../context/AppContext.jsx';
import * as M from '../math/index.js';
import { formatNumber, parseNumber } from '../utils/formatting.js';

export const OPS = {
  add: { group: 'basic', arity: 2, sym: 'A + B', run: (a, b) => M.addMatrices(a, b) },
  sub: { group: 'basic', arity: 2, sym: 'A − B', run: (a, b) => M.subtractMatrices(a, b) },
  scalarMul: { group: 'basic', arity: 1, scalar: true, sym: 'kA', run: (a, b, o) => M.scalarMultiply(a, o.k) },
  mul: { group: 'basic', arity: 2, sym: 'AB', run: (a, b) => M.multiplyMatrices(a, b) },
  hadamard: { group: 'basic', arity: 2, sym: 'A ⊙ B', run: (a, b) => M.hadamardProduct(a, b) },
  transpose: { group: 'basic', arity: 1, sym: 'Aᵀ', run: (a) => M.transposeMatrix(a) },
  equal: { group: 'basic', arity: 2, sym: 'A = B', run: (a, b) => M.matricesEqual(a, b) },
  negate: { group: 'basic', arity: 1, sym: '−A', run: (a) => M.negateMatrix(a) },
  trace: { group: 'advanced', arity: 1, sym: 'tr(A)', run: (a) => M.traceMatrix(a) },
  rank: { group: 'advanced', arity: 1, pivoting: true, sym: 'rank(A)', run: (a) => M.matrixRank(a) },
  ref: { group: 'advanced', arity: 1, pivoting: true, sym: 'REF(A)', run: (a, b, o) => M.rowEchelon(a, { pivoting: o.pivoting }) },
  rref: { group: 'advanced', arity: 1, pivoting: true, sym: 'RREF(A)', run: (a, b, o) => M.rref(a, { pivoting: o.pivoting }) },
  lu: { group: 'advanced', arity: 1, sym: 'PA = LU', run: (a) => M.luDecomposition(a) },
  powerOp: { group: 'advanced', arity: 1, power: true, sym: 'Aᵏ', run: (a, b, o) => M.matrixPower(a, o.k, M.inverseMatrix) },
  eigen: { group: 'advanced', arity: 1, sym: 'Av = λv', run: (a) => M.eigen(a) },
  diag: { group: 'advanced', arity: 1, sym: 'A = PDP⁻¹', run: (a) => M.diagonalize(a) },
};

function Vector({ v, d }) {
  return <MatrixGrid matrix={v.map((x) => [x])} compact valueFor={(i, j, x) => +x.toFixed(d)} />;
}

function EigenResult({ res }) {
  const { t, state } = useApp();
  const d = state.prefs.decimals;
  if (!res.real) {
    return (
      <div className="stack">
        <h4>{t('ops.complex')}</h4>
        <div className="row">{res.complex.map((c, i) => <span key={i} className="chip violet mono">λ{i + 1} = {formatNumber(c.re, d)} {c.im < 0 ? '−' : '+'} {formatNumber(Math.abs(c.im), d)}i</span>)}</div>
      </div>
    );
  }
  return (
    <div className="stack">
      {res.result.map((g, k) => (
        <div key={k} className="panel flat tight stack" style={{ gap: 8 }}>
          <div className="row"><span className="chip cyan mono">{t('ops.eigValue', { v: g.value })}</span><span className="xs muted">{t('ops.eigMult', { a: g.algebraic, g: g.geometric })}</span></div>
          <div className="row" style={{ gap: 14 }}>
            {g.vectors.map((v, i) => <div key={i} className="stack" style={{ gap: 4 }}><span className="xs faint">{t('ops.eigVec')} v{i + 1}</span><Vector v={v} d={d} /></div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Operations() {
  const app = useApp();
  const { t, tm, state, setMatrix, logOp } = app;
  const names = Object.keys(state.matrices);
  const [op, setOp] = useState('mul');
  const [left, setLeft] = useState(names.includes('A') ? 'A' : names[0]);
  const [right, setRight] = useState(names.includes('B') ? 'B' : names[1] || names[0]);
  const [kText, setKText] = useState('2');
  const [pivoting, setPivoting] = useState('partial');
  const [run, setRun] = useState(null);

  const def = OPS[op];
  const A = state.matrices[left] || state.matrices[names[0]];
  const B = state.matrices[right] || state.matrices[names[0]];
  const k = parseNumber(kText);

  // Live validation before the user presses Compute.
  const preview = useMemo(() => {
    if ((def.scalar || def.power) && !Number.isFinite(k)) return { ok: false, error: { key: def.power ? 'err.powerInt' : 'err.badScalar' } };
    return def.run(A, B, { k, pivoting });
  }, [def, A, B, k, pivoting]);

  const compute = () => {
    const res = def.run(A, B, { k, pivoting });
    setRun({ op, res, A, B, k, key: Date.now(), left, right });
    logOp({ type: op, label: def.sym.replace('A', left).replace('B', right).replace('k', formatNumber(k)), ok: res.ok });
  };

  const res = run?.res;
  const d = state.prefs.decimals;

  const renderResult = () => {
    if (!res || !res.ok) return null;
    switch (run.op) {
      case 'equal':
        return <Callout type={res.result ? 'success' : 'warn'}>{res.result ? t('ops.isEqual') : t('ops.notEqual')}</Callout>;
      case 'trace':
      case 'rank':
        return <div className="kpi"><span className="k">{def.sym}</span><span className="v">{formatNumber(res.result, d)}</span></div>;
      case 'lu':
        return (
          <div className="matrix-stage">
            <MatrixGrid matrix={res.result.P} name="P" compact />
            <MatrixGrid matrix={res.result.L} name="L" compact />
            <MatrixGrid matrix={res.result.U} name="U" compact />
          </div>
        );
      case 'eigen':
        return <EigenResult res={res} />;
      case 'diag':
        return (
          <div className="stack">
            <div className="matrix-stage">
              <MatrixGrid matrix={res.result.P} name="P" compact />
              <MatrixGrid matrix={res.result.D} name="D" compact />
              <MatrixGrid matrix={res.result.Pinv} name="P⁻¹" compact />
            </div>
            <div className="label">{t('ops.verify')}</div>
            <MatrixGrid matrix={M.cleanMatrix(res.check, 1e-9)} compact />
          </div>
        );
      default:
        return <ResultMatrix matrix={res.result} name="C" />;
    }
  };

  const renderViz = () => {
    if (!res || !res.ok || !res.steps?.length) return null;
    const rk = run.key;
    switch (run.op) {
      case 'add': case 'sub': case 'hadamard':
        return <ElementwiseVisualizer A={run.A} B={run.B} result={res.result} steps={res.steps} op={run.op} resetKey={rk} />;
      case 'scalarMul': case 'negate':
        return <ElementwiseVisualizer A={run.A} result={res.result} steps={res.steps} op={run.op} scalar={run.op === 'negate' ? -1 : run.k} resetKey={rk} />;
      case 'mul':
        return <MultiplyVisualizer A={run.A} B={run.B} result={res.result} steps={res.steps} resetKey={rk} />;
      case 'transpose':
        return <TransposeVisualizer A={run.A} result={res.result} steps={res.steps} resetKey={rk} />;
      case 'rank': case 'ref': case 'rref':
        return <EliminationVisualizer steps={res.steps} resetKey={rk} />;
      case 'powerOp':
        return <PowerVisualizer steps={res.steps} resetKey={rk} />;
      case 'lu':
        return <LUVisualizer steps={res.steps} resetKey={rk} />;
      case 'equal':
        return <MatrixGrid matrix={run.A} name={run.left} highlight={(i, j) => (res.steps.some((s) => s.i === i && s.j === j) ? 'hl-pivot' : '')} />;
      default:
        return null;
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="02 · OPERATIONS" title={t('ops.title')} subtitle={t('ops.subtitle')} />

      <section className="panel">
        <label className="field show-sm">
          <span>{t('ops.operation')}</span>
          <select className="select" value={op} onChange={(e) => setOp(e.target.value)}>
            {['basic', 'advanced'].map((g) => (
              <optgroup key={g} label={t(`ops.group.${g}`)}>
                {Object.keys(OPS).filter((k) => OPS[k].group === g).map((k) => <option key={k} value={k}>{t(`ops.${k}`)}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="stack hide-sm">
          {['basic', 'advanced'].map((g) => (
            <div key={g} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
              <span className="label" style={{ minWidth: 80, paddingTop: 8 }}>{t(`ops.group.${g}`)}</span>
              <div className="seg" role="group" aria-label={t(`ops.group.${g}`)} style={{ flex: 1 }}>
                {Object.entries(OPS).filter(([, o]) => o.group === g).map(([key]) => (
                  <button key={key} aria-pressed={op === key} onClick={() => setOp(key)}>{t(`ops.${key}`)}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="panel stack-lg">
          <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
            <MatrixPicker id="op-left" label={def.arity === 2 ? t('ops.left') : t('common.matrix')} value={left} onChange={setLeft} />
            {def.arity === 2 && <MatrixPicker id="op-right" label={t('ops.right')} value={right} onChange={setRight} />}
            {(def.scalar || def.power) && (
              <label className="field">
                <span>{def.power ? t('ops.power') : t('ops.scalar')}</span>
                <input className={`input num ${Number.isFinite(k) ? '' : 'invalid'}`} value={kText} onChange={(e) => setKText(e.target.value)} />
              </label>
            )}
            {def.pivoting && (
              <label className="field">
                <span>{t('ops.pivoting')}</span>
                <select className="select" value={pivoting} onChange={(e) => setPivoting(e.target.value)}>
                  <option value="partial">{t('ops.piv.partial')}</option>
                  <option value="first">{t('ops.piv.first')}</option>
                </select>
              </label>
            )}
          </div>
          <MatrixEditor name={left} matrix={A} onChange={(m) => setMatrix(left, m)} compactToolbar />
          {def.arity === 2 && <MatrixEditor name={right} matrix={B} onChange={(m) => setMatrix(right, m)} compactToolbar />}
        </section>

        <section className="panel stack-lg">
          <div className="stack" style={{ gap: 8 }}>
            <div className="row-between">
              <h2 className="mono" style={{ fontFamily: 'var(--font-mono)' }}>{def.sym}</h2>
              <button className="btn btn-primary" onClick={compute}><Play size={15} /> {t('common.compute')}</button>
            </div>
            <div className="callout info"><ListChecks size={18} /><div><strong>{t('common.requirements')}: </strong>{t(`req.${op}`)}</div></div>
            {op === 'eigen' && <Callout type="warn">{t('ops.eigSupported')}</Callout>}
            {!preview.ok && <Callout type="error">{tm(preview.error)}</Callout>}
          </div>
          {res && run.op === op && (
            <div className="stack-lg pop" key={run.key}>
              <ResultMessages res={res} />
              {renderResult()}
            </div>
          )}
          {!res && <div className="empty">{t('common.compute')} → {def.sym}</div>}
        </section>
      </div>

      {res && res.ok && run.op === op && res.steps?.length > 0 && (
        <section className="panel">
          <div className="panel-head"><h2>{t('common.steps')}</h2></div>
          {renderViz()}
        </section>
      )}

      <section className="panel">
        <div className="panel-head"><h3><History size={17} /> {t('ops.history')}</h3></div>
        {!state.recentOps.length ? <div className="empty">{t('dash.noRecent')}</div> : (
          <div className="row" style={{ gap: 6 }}>
            {state.recentOps.slice(0, 16).map((o, i) => (
              <button key={i} className={`chip mono ${o.ok ? 'cyan' : 'rose'}`} onClick={() => OPS[o.type] && setOp(o.type)} style={{ cursor: 'pointer' }}>{o.label}</button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
