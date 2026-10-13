import { useEffect, useMemo, useState } from 'react';
import { Equal, Minus, Plus } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import MatrixGrid from '../components/matrix/MatrixGrid.jsx';
import { ResultMessages, Callout } from '../components/common/Messages.jsx';
import { EliminationVisualizer } from '../components/visualization/OperationVisualizers.jsx';
import { useApp } from '../context/AppContext.jsx';
import { solveLinearSystem, leastSquares } from '../math/index.js';
import { formatNumber, parseNumber, sub } from '../utils/formatting.js';

const EXAMPLES = {
  unique: { A: [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], b: [8, -11, -3] },
  none: { A: [[1, 1], [2, 2]], b: [3, 7] },
  inf: { A: [[1, 2, -1], [2, 4, -2], [1, 0, 1]], b: [3, 6, 1] },
  line: { A: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]], b: [1.1, 2.9, 5.2, 6.8, 9.1] },
};

function NumInput({ value, onChange, label }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const bad = !Number.isFinite(parseNumber(draft));
  return (
    <input
      className={`input num ${bad ? 'invalid' : ''}`}
      style={{ width: 62 }}
      value={draft}
      aria-label={label}
      inputMode="decimal"
      onChange={(e) => { setDraft(e.target.value); const v = parseNumber(e.target.value); if (Number.isFinite(v)) onChange(v); }}
      onBlur={() => setDraft(String(value))}
    />
  );
}

export default function LinearSystems() {
  const { t, state, logOp } = useApp();
  const [A, setA] = useState(EXAMPLES.unique.A);
  const [b, setB] = useState(EXAMPLES.unique.b);
  const [mode, setMode] = useState('exact');
  const d = state.prefs.decimals;
  const m = A.length;
  const n = A[0].length;

  const resize = (rows, cols) => {
    const r = Math.max(1, Math.min(8, rows));
    const c = Math.max(1, Math.min(8, cols));
    setA(Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => A[i]?.[j] ?? 0)));
    setB(Array.from({ length: r }, (_, i) => b[i] ?? 0));
  };

  const res = useMemo(() => (mode === 'exact' ? solveLinearSystem(A, b) : leastSquares(A, b)), [A, b, mode]);

  useEffect(() => {
    const id = setTimeout(() => logOp({ type: mode === 'exact' ? 'solve' : 'leastSquares', label: `${m}×${n} ${mode === 'exact' ? 'Ax=b' : 'LS'}`, ok: res.ok }), 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [A, b, mode]);

  const term = (coef, j, first) => {
    if (coef === 0) return null;
    const sign = coef < 0 ? (first ? '−' : ' − ') : first ? '' : ' + ';
    const abs = Math.abs(coef);
    return <span key={j}>{sign}{abs === 1 ? '' : formatNumber(abs, d)}x{sub(j + 1)}</span>;
  };

  const typeChip = mode === 'exact' && res.ok ? { unique: ['lime', t('sys.unique')], none: ['rose', t('sys.none')], infinite: ['amber', t('sys.infinite')] }[res.type] : null;
  const augmented = A.map((row, i) => [...row, b[i]]);

  return (
    <div className="page">
      <PageHeader eyebrow="04 · SYSTEMS" title={t('sys.title')} subtitle={t('sys.subtitle')} />

      <section className="panel">
        <div className="row-between">
          <div className="row" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 4 }}>
              <span className="label">{t('sys.equations')}</span>
              <button className="btn btn-icon btn-sm" onClick={() => resize(m - 1, n)} disabled={m <= 1} aria-label="−"><Minus size={14} /></button>
              <span className="mono" style={{ minWidth: 18, textAlign: 'center' }}>{m}</span>
              <button className="btn btn-icon btn-sm" onClick={() => resize(m + 1, n)} disabled={m >= 8} aria-label="+"><Plus size={14} /></button>
            </div>
            <div className="row" style={{ gap: 4 }}>
              <span className="label">{t('sys.unknowns')}</span>
              <button className="btn btn-icon btn-sm" onClick={() => resize(m, n - 1)} disabled={n <= 1} aria-label="−"><Minus size={14} /></button>
              <span className="mono" style={{ minWidth: 18, textAlign: 'center' }}>{n}</span>
              <button className="btn btn-icon btn-sm" onClick={() => resize(m, n + 1)} disabled={n >= 8} aria-label="+"><Plus size={14} /></button>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="label">{t('sys.example')}</span>
            {Object.keys(EXAMPLES).map((k) => (
              <button key={k} className="btn btn-sm" onClick={() => { setA(EXAMPLES[k].A); setB(EXAMPLES[k].b); setMode(k === 'line' ? 'ls' : 'exact'); }}>{t(`sys.ex.${k}`)}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="split">
        <section className="panel stack-lg">
          <div className="scroll-x">
            <div className="stack" style={{ gap: 6 }} role="group" aria-label={t('sys.equations')}>
              {A.map((row, i) => (
                <div className="row" key={i} style={{ gap: 6, flexWrap: 'nowrap' }}>
                  {row.map((v, j) => (
                    <span className="row" key={j} style={{ gap: 4, flexWrap: 'nowrap' }}>
                      {j > 0 && <span className="faint">+</span>}
                      <NumInput value={v} label={`a${i + 1}${j + 1}`} onChange={(x) => setA(A.map((r, ri) => (ri === i ? r.map((c, cj) => (cj === j ? x : c)) : r)))} />
                      <span className="mono small">x{sub(j + 1)}</span>
                    </span>
                  ))}
                  <span className="op-symbol" style={{ fontSize: '1.1rem' }}>=</span>
                  <NumInput value={b[i]} label={`b${i + 1}`} onChange={(x) => setB(b.map((c, ci) => (ci === i ? x : c)))} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>{t('sys.preview')}</div>
            <div className="formula">
              {A.map((row, i) => {
                let first = true;
                const terms = row.map((c, j) => { const el = term(c, j, first); if (el) first = false; return el; });
                return <div key={i}>{first ? '0' : terms} = {formatNumber(b[i], d)}</div>;
              })}
            </div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>[A | b]</div>
            <MatrixGrid matrix={augmented} augmentAt={n} compact />
          </div>
        </section>

        <section className="panel stack-lg">
          <div className="seg" role="tablist">
            <button role="tab" aria-selected={mode === 'exact'} onClick={() => setMode('exact')}><Equal size={14} /> {t('sys.solve')}</button>
            <button role="tab" aria-selected={mode === 'ls'} onClick={() => setMode('ls')}>{t('sys.ls')}</button>
          </div>
          {mode === 'ls' && <Callout type="info">{t('sys.lsExplain')}</Callout>}
          {typeChip && <span className={`chip ${typeChip[0]}`} style={{ alignSelf: 'flex-start' }}>{typeChip[1]}</span>}
          <ResultMessages res={res} />
          {res.ok && res.result && (
            <div className="stack">
              {res.type === 'infinite' && <div className="label">{t('sys.particular')}</div>}
              <div className="row" style={{ gap: 8 }}>
                {res.result.map((x, j) => (
                  <span key={j} className={`chip mono ${res.freeVars?.includes(j) ? 'amber' : 'cyan'}`} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                    x{sub(j + 1)} = {formatNumber(x, d)}{res.freeVars?.includes(j) ? ` (${t('sys.free')})` : ''}
                  </span>
                ))}
              </div>
              {res.type === 'infinite' && (
                <>
                  <div className="label">{t('sys.general')}</div>
                  <div className="formula">
                    x = p{res.nullBasis.map((v, k) => ` + t${sub(k + 1)}·(${v.map((x) => formatNumber(x, d)).join(', ')})`).join('')}
                  </div>
                </>
              )}
              {mode === 'ls' && (
                <div className="kpi"><span className="k">{t('sys.residual')}</span><span className="v">{formatNumber(res.residualNorm, d)}</span></div>
              )}
            </div>
          )}
        </section>
      </div>

      {mode === 'exact' && res.ok && res.steps?.length > 0 && (
        <section className="panel">
          <div className="panel-head"><h2>{t('common.steps')} · Gauss–Jordan [A | b]</h2></div>
          <EliminationVisualizer steps={res.steps} augmentAt={n} resetKey={JSON.stringify([A, b])} />
        </section>
      )}
    </div>
  );
}
