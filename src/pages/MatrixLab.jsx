import { useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Star, Upload, Download, Wand2, Info, Copy } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import MatrixEditor from '../components/matrix/MatrixEditor.jsx';
import MatrixGrid from '../components/matrix/MatrixGrid.jsx';
import Modal from '../components/common/Modal.jsx';
import { Sym } from '../components/common/Tooltip.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  createMatrix, randomMatrix, identityMatrix, isSymmetric, isUpperTriangular, isLowerTriangular, isValidMatrix,
  determinant, matrixRank, traceMatrix,
} from '../math/index.js';
import { matrixToCSV, parseMatrixText, downloadText, copyText } from '../utils/formatting.js';

function Properties({ M }) {
  const { t, state } = useApp();
  const props = useMemo(() => {
    const square = M.length === M[0].length;
    const zero = M.every((r) => r.every((v) => v === 0));
    const out = { square, zero };
    if (square) {
      out.symmetric = isSymmetric(M);
      out.upper = isUpperTriangular(M);
      out.lower = isLowerTriangular(M);
      out.diagonal = out.upper && out.lower;
      out.identity = out.diagonal && M.every((r, i) => r[i] === 1);
      out.det = determinant(M, { method: 'elimination' }).result;
      out.trace = traceMatrix(M).result;
    }
    out.rank = matrixRank(M).result;
    return out;
  }, [M]);
  const flags = ['square', 'symmetric', 'diagonal', 'identity', 'upper', 'lower', 'zero'].filter((k) => props[k]);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 6 }}>
        {flags.length ? flags.map((k) => <span key={k} className="chip cyan">{t(`lab.prop.${k}`)}</span>) : <span className="chip">{M.length} × {M[0].length}</span>}
      </div>
      <table className="table">
        <tbody>
          <tr><th>{t('common.size')}</th><td className="mono">{M.length} × {M[0].length}</td></tr>
          <tr><th><Sym tip={t('req.rank')}>rank</Sym></th><td className="mono">{props.rank}</td></tr>
          {props.square && <tr><th><Sym tip={t('det.geom')}>det</Sym></th><td className="mono">{+props.det.toFixed(state.prefs.decimals)}</td></tr>}
          {props.square && <tr><th><Sym tip={t('req.trace')}>tr</Sym></th><td className="mono">{+props.trace.toFixed(state.prefs.decimals)}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function MatrixLab() {
  const app = useApp();
  const { t, state, setMatrix, setActiveMatrix, addMatrix, renameMatrix, deleteMatrix, addFavorite, removeFavorite, toast } = app;
  const names = Object.keys(state.matrices);
  const active = state.matrices[state.activeMatrix] ? state.activeMatrix : names[0];
  const M = state.matrices[active];

  const [hl, setHl] = useState('cross');
  const [gen, setGen] = useState({ kind: 'random', numbers: 'int', min: -9, max: 9 });
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [renameErr, setRenameErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [fmt, setFmt] = useState('json');
  const fileRef = useRef(null);

  const generate = () => {
    const r = M.length;
    const c = M[0].length;
    const lo = Math.min(gen.min, gen.max);
    const hi = Math.max(gen.min, gen.max);
    const opts = { min: lo, max: hi, decimals: gen.numbers === 'dec' ? 2 : 0 };
    const rnd = () => randomMatrix(1, 1, opts)[0][0];
    let next;
    switch (gen.kind) {
      case 'identity': next = createMatrix(r, c, (i, j) => (i === j ? 1 : 0)); break;
      case 'zero': next = createMatrix(r, c, 0); break;
      case 'diagonal': next = createMatrix(r, c, (i, j) => (i === j ? rnd() : 0)); break;
      case 'upper': next = createMatrix(r, c, (i, j) => (j >= i ? rnd() : 0)); break;
      case 'lower': next = createMatrix(r, c, (i, j) => (j <= i ? rnd() : 0)); break;
      default: next = randomMatrix(r, c, opts);
    }
    setMatrix(active, next);
  };

  const startRename = (n) => { setRenaming(n); setRenameVal(n); setRenameErr(''); };
  const doRename = () => {
    const err = renameMatrix(renaming, renameVal.trim());
    if (err) { setRenameErr(t(err)); return; }
    setRenaming(null);
  };

  const exportText = fmt === 'json' ? JSON.stringify({ name: active, rows: M.length, cols: M[0].length, matrix: M }, null, 2) : matrixToCSV(M);

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      let imported = [];
      if (file.name.toLowerCase().endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const data = JSON.parse(text);
        if (Array.isArray(data) && isValidMatrix(data)) imported = [[file.name.replace(/\.\w+$/, ''), data]];
        else if (data.matrix && isValidMatrix(data.matrix)) imported = [[data.name, data.matrix]];
        else if (data.matrices) imported = Object.entries(data.matrices).filter(([, m]) => isValidMatrix(m));
      } else {
        const m = parseMatrixText(text);
        if (m) imported = [[file.name.replace(/\.\w+$/, ''), m]];
      }
      imported = imported.filter(([, m]) => m.length <= 20 && m[0].length <= 20);
      if (!imported.length) throw new Error('bad');
      imported.forEach(([n, m]) => {
        const safe = String(n || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 12);
        const name = addMatrix(m, /^[A-Za-z_]/.test(safe) ? safe : undefined);
        toast(t('lab.imported', { name }), 'success');
      });
    } catch {
      toast(t('lab.importBad'), 'error');
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="01 · LAB"
        title={t('lab.title')}
        subtitle={t('lab.subtitle')}
        actions={(
          <>
            <input ref={fileRef} type="file" accept=".json,.csv,.txt,application/json,text/csv" hidden onChange={onImport} />
            <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> {t('lab.import')}</button>
            <button className="btn" onClick={() => setExportOpen(true)}><Download size={15} /> {t('lab.export')}</button>
          </>
        )}
      />

      <div className="panel tight">
        <div className="row-between">
          <div className="matrix-tabs" role="tablist" aria-label={t('lab.matrices')}>
            {names.map((n) => (
              <button key={n} role="tab" aria-selected={n === active} className="matrix-tab" onClick={() => setActiveMatrix(n)}>
                {n} <span>{state.matrices[n].length}×{state.matrices[n][0].length}</span>
              </button>
            ))}
            <button className="btn btn-sm" onClick={() => addMatrix(identityMatrix(3))}><Plus size={14} /> {t('lab.addMatrix')}</button>
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn-sm" onClick={() => startRename(active)}><Pencil size={14} /> {t('lab.rename')}</button>
            <button className="btn btn-sm" onClick={() => { addFavorite(active, M); toast(t('lab.saved', { name: active }), 'success'); }}><Star size={14} /> {t('lab.saveFav')}</button>
            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDel(active)} disabled={names.length <= 1}><Trash2 size={14} /> {t('lab.delete')}</button>
          </div>
        </div>
      </div>

      <div className="split">
        <section className="panel" aria-label={active}>
          <div className="panel-head">
            <h2>{active} <span className="matrix-dims">{M.length} × {M[0].length}</span></h2>
            <div className="seg" role="group" aria-label={t('lab.highlight')}>
              {['none', 'cell', 'row', 'col', 'cross'].map((m) => (
                <button key={m} aria-pressed={hl === m} onClick={() => setHl(m)}>{t(`lab.hl.${m}`)}</button>
              ))}
            </div>
          </div>
          <MatrixEditor name={active} matrix={M} onChange={(next) => setMatrix(active, next)} highlightMode={hl} />
          <p className="xs faint" style={{ marginTop: 12 }}>{t('lab.pasteHint')} {t('lab.limit')}</p>
        </section>

        <div className="stack-lg">
          <section className="panel">
            <div className="panel-head"><h3><Wand2 size={17} /> {t('lab.generate')}</h3></div>
            <div className="stack">
              <div className="seg" role="group" aria-label={t('lab.generate')}>
                {['random', 'identity', 'zero', 'diagonal', 'upper', 'lower'].map((k) => (
                  <button key={k} aria-pressed={gen.kind === k} onClick={() => setGen({ ...gen, kind: k })}>{t(`lab.gen.${k}`)}</button>
                ))}
              </div>
              {!['identity', 'zero'].includes(gen.kind) && (
                <div className="row" style={{ gap: 12 }}>
                  <div className="seg" role="group" aria-label={t('lab.numbers')}>
                    <button aria-pressed={gen.numbers === 'int'} onClick={() => setGen({ ...gen, numbers: 'int' })}>{t('lab.integers')}</button>
                    <button aria-pressed={gen.numbers === 'dec'} onClick={() => setGen({ ...gen, numbers: 'dec' })}>{t('lab.decimals')}</button>
                  </div>
                  <label className="row small muted" style={{ gap: 6 }}>
                    {t('lab.range')}
                    <input className="input num" style={{ width: 64 }} type="number" value={gen.min} onChange={(e) => setGen({ ...gen, min: +e.target.value })} aria-label="min" />
                    –
                    <input className="input num" style={{ width: 64 }} type="number" value={gen.max} onChange={(e) => setGen({ ...gen, max: +e.target.value })} aria-label="max" />
                  </label>
                </div>
              )}
              <button className="btn btn-primary" onClick={generate}><Wand2 size={15} /> {t('lab.generate')} {M.length}×{M[0].length}</button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3>{t('lab.properties')}</h3></div>
            <Properties M={M} />
            <div className="callout info" style={{ marginTop: 14 }}><Info size={18} /><div>{t('lab.dimsExplain')}</div></div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3><Star size={17} /> {t('lab.favorites')}</h3></div>
            {!state.favorites.length ? <div className="empty">{t('lab.noFav')}</div> : (
              <div className="stack" style={{ gap: 10 }}>
                {state.favorites.slice(0, 8).map((fav) => (
                  <div key={fav.id} className="panel flat tight row-between">
                    <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                      <strong>{fav.name} <span className="matrix-dims">{fav.matrix.length}×{fav.matrix[0].length}</span></strong>
                      <div style={{ maxWidth: 260, overflow: 'hidden' }}><MatrixGrid matrix={fav.matrix.slice(0, 3).map((r) => r.slice(0, 4))} compact /></div>
                    </div>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn-sm" onClick={() => setMatrix(active, fav.matrix.map((r) => r.slice()))}>{t('lab.load')} → {active}</button>
                      <button className="btn btn-sm btn-icon btn-ghost" onClick={() => removeFavorite(fav.id)} aria-label={t('lab.delete')}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title={t('lab.rename')}
        footer={<><button className="btn" onClick={() => setRenaming(null)}>{t('common.cancel')}</button><button className="btn btn-primary" onClick={doRename}>{t('common.save')}</button></>}
      >
        <label className="field">
          <span>{renaming} →</span>
          <input data-autofocus className={`input ${renameErr ? 'invalid' : ''}`} value={renameVal} onChange={(e) => { setRenameVal(e.target.value); setRenameErr(''); }} onKeyDown={(e) => e.key === 'Enter' && doRename()} maxLength={12} />
        </label>
        {renameErr && <p className="small" style={{ color: 'var(--rose)', marginTop: 8 }} role="alert">{renameErr}</p>}
      </Modal>

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title={t('lab.delete')}
        footer={<><button className="btn" onClick={() => setConfirmDel(null)} data-autofocus>{t('common.cancel')}</button><button className="btn btn-danger" onClick={() => { deleteMatrix(confirmDel); setConfirmDel(null); }}>{t('lab.delete')}</button></>}
      >
        <p>{t('lab.deleteConfirm', { name: confirmDel })}</p>
      </Modal>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`${t('lab.export')} · ${active}`}
        footer={(
          <>
            <button className="btn" onClick={async () => { const ok = await copyText(exportText); toast(ok ? t('common.copied') : t('common.copyFail'), ok ? 'success' : 'error'); }}><Copy size={15} /> {t('common.copy')}</button>
            <button className="btn btn-primary" onClick={() => downloadText(`${active}.${fmt}`, exportText, fmt === 'json' ? 'application/json' : 'text/csv')}><Download size={15} /> {t('lab.download')}</button>
          </>
        )}
      >
        <div className="stack">
          <div className="seg" role="group">
            <button aria-pressed={fmt === 'json'} onClick={() => setFmt('json')}>{t('lab.exportJSON')}</button>
            <button aria-pressed={fmt === 'csv'} onClick={() => setFmt('csv')}>{t('lab.exportCSV')}</button>
          </div>
          <p className="small muted">{t('lab.exportReady')}</p>
          <textarea className="textarea" readOnly value={exportText} onFocus={(e) => e.target.select()} aria-label={t('lab.export')} />
        </div>
      </Modal>
    </div>
  );
}
