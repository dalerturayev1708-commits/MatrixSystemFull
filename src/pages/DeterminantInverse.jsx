import { useEffect, useMemo, useState } from 'react';
import { Sigma, RotateCcw, Grid2x2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import MatrixEditor from '../components/matrix/MatrixEditor.jsx';
import MatrixPicker from '../components/matrix/MatrixPicker.jsx';
import MatrixGrid from '../components/matrix/MatrixGrid.jsx';
import ResultMatrix from '../components/matrix/ResultMatrix.jsx';
import { ResultMessages, Callout } from '../components/common/Messages.jsx';
import { CofactorDetVisualizer, EliminationVisualizer } from '../components/visualization/OperationVisualizers.jsx';
import { useApp } from '../context/AppContext.jsx';
import { determinant, inverseMatrix, adjugateMatrix, cofactorMatrix, getMinor } from '../math/index.js';
import { formatNumber } from '../utils/formatting.js';

export default function DeterminantInverse() {
  const { t, tm, state, setMatrix, logOp } = useApp();
  const names = Object.keys(state.matrices);
  const firstSquare = names.find((n) => state.matrices[n].length === state.matrices[n][0].length) || names[0];
  const [name, setName] = useState(firstSquare);
  const [method, setMethod] = useState('auto');
  const [tab, setTab] = useState('det');
  const [cell, setCell] = useState([0, 0]);
  const A = state.matrices[name] || state.matrices[names[0]];
  const d = state.prefs.decimals;
  const n = A.length;

  const det = useMemo(() => determinant(A, { method }), [A, method]);
  const inv = useMemo(() => inverseMatrix(A), [A]);
  const adj = useMemo(() => adjugateMatrix(A), [A]);
  const cof = useMemo(() => cofactorMatrix(A), [A]);
  const [ci, cj] = cell[0] < n && cell[1] < n ? cell : [0, 0];
  const minor = useMemo(() => getMinor(A, ci, cj), [A, ci, cj]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (det.ok) logOp({ type: 'det', label: `det(${name})`, ok: true });
      if (inv.ok) logOp({ type: 'inverse', label: `${name}⁻¹`, ok: true });
    }, 1200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [A]);

  const singular = det.ok && Math.abs(det.result) < 1e-12;

  return (
    <div className="page">
      <PageHeader eyebrow="03 · DET & INVERSE" title={t('det.title')} subtitle={t('det.subtitle')} />

      <div className="split">
        <section className="panel stack-lg">
          <div className="row" style={{ alignItems: 'flex-end', gap: 12 }}>
            <MatrixPicker id="det-m" label={t('common.matrix')} value={name} onChange={setName} />
            {det.ok && (
              <div className="row" style={{ gap: 8 }}>
                <span className="chip mono violet">det = {formatNumber(det.result, d)}</span>
                <span className={`chip ${singular ? 'rose' : 'lime'}`}>{singular ? t('det.singular') : t('det.nonsingular')}</span>
              </div>
            )}
          </div>
          <MatrixEditor name={name} matrix={A} onChange={(m) => setMatrix(name, m)} compactToolbar />
          <Callout type="info">{t('det.geom')}</Callout>
        </section>

        <section className="panel stack-lg">
          <div className="seg" role="tablist" aria-label={t('det.title')}>
            {[['det', t('det.det')], ['inverse', t('det.inverse')], ['adjugate', t('det.adjugate')], ['minor', t('det.minors')]].map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
            ))}
          </div>

          {tab === 'det' && (
            <div className="stack-lg">
              <div className="row" style={{ gap: 10 }}>
                <span className="label">{t('det.method')}</span>
                <div className="seg" role="group">
                  {[['auto', t('det.auto')], ['cofactor', t('det.cofactorM')], ['elimination', t('det.elimM')]].map(([k, l]) => (
                    <button key={k} aria-pressed={method === k} onClick={() => setMethod(k)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="callout info"><Sigma size={18} /><div><strong>{t('common.requirements')}: </strong>{t('req.det')}</div></div>
              <ResultMessages res={det} />
              {det.ok && <div className="kpi"><span className="k">det({name})</span><span className="v">{formatNumber(det.result, d)}</span></div>}
            </div>
          )}

          {tab === 'inverse' && (
            <div className="stack-lg">
              <div className="callout info"><RotateCcw size={18} /><div><strong>{t('common.requirements')}: </strong>{t('req.inverse')}</div></div>
              <ResultMessages res={inv} />
              {inv.ok && (
                <>
                  <ResultMatrix matrix={inv.result} name={`${name}⁻¹`} />
                  <div className="label">{t('det.verify')}</div>
                  <MatrixGrid matrix={inv.verification} compact />
                </>
              )}
            </div>
          )}

          {tab === 'adjugate' && (
            <div className="stack-lg">
              <div className="callout info"><Grid2x2 size={18} /><div><strong>{t('common.requirements')}: </strong>{t('req.adjugate')}</div></div>
              {!adj.ok ? <ResultMessages res={adj} /> : (
                <>
                  <div className="label">{t('det.cofactors')}</div>
                  <p className="small muted">{tm(cof.explanation)}</p>
                  <MatrixGrid matrix={cof.result} name="C" compact />
                  <div className="label">{t('det.adjugate')}</div>
                  <p className="small muted">{tm(adj.explanation)}</p>
                  <ResultMatrix matrix={adj.result} name={`adj(${name})`} />
                </>
              )}
            </div>
          )}

          {tab === 'minor' && (
            <div className="stack-lg">
              <div className="callout info"><Grid2x2 size={18} /><div><strong>{t('common.requirements')}: </strong>{t('req.minor')}</div></div>
              {!minor.ok ? <ResultMessages res={minor} /> : (
                <>
                  <p className="small muted">{t('det.chooseCell')}</p>
                  <MatrixGrid
                    matrix={A}
                    name={name}
                    showIndices
                    onCellClick={(i, j) => setCell([i, j])}
                    highlight={(i, j) => (i === ci && j === cj ? 'hl-pivot' : i === ci || j === cj ? 'hl-dim' : 'hl-a')}
                  />
                  <div className="matrix-stage">
                    <MatrixGrid matrix={minor.submatrix} name={`M${ci + 1}${cj + 1}`} compact />
                    <div className="stack" style={{ gap: 6 }}>
                      <span className="chip mono cyan">{t('det.minorAt', { i: ci + 1, j: cj + 1 })} = {formatNumber(minor.result, d)}</span>
                      <span className="chip mono violet">{t('det.cofactorAt', { i: ci + 1, j: cj + 1 })} = {formatNumber(minor.cofactor, d)}</span>
                    </div>
                  </div>
                  <p className="small">{tm(minor.explanation)}</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {tab === 'det' && det.ok && det.steps.length > 0 && (
        <section className="panel">
          <div className="panel-head"><h2>{t('common.steps')} · {det.method === 'cofactor' ? t('det.cofactorM') : det.method === 'elimination' ? t('det.elimM') : 'det'}</h2></div>
          {det.method === 'cofactor' && n > 2 ? <CofactorDetVisualizer A={A} steps={det.steps} resetKey={`${name}${method}${JSON.stringify(A)}`} />
            : det.method === 'elimination' ? <EliminationVisualizer steps={det.steps} resetKey={`${name}${method}${JSON.stringify(A)}`} />
              : <div className="step-text">{det.steps.map((s) => tm(s.text)).join('  ·  ')}</div>}
        </section>
      )}

      {tab === 'inverse' && (inv.steps?.length > 0) && (
        <section className="panel">
          <div className="panel-head"><h2>{t('common.steps')} · Gauss–Jordan [A | I]</h2></div>
          <EliminationVisualizer steps={inv.steps} augmentAt={n} resetKey={`inv${name}${JSON.stringify(A)}`} />
        </section>
      )}
    </div>
  );
}
