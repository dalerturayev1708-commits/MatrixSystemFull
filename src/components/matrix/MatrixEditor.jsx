import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Minus, Undo2, Copy, Dices, Eraser } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatNumber, parseNumber, parseMatrixText, matrixToText, copyText } from '../../utils/formatting.js';
import { MAX_DIM, createMatrix } from '../../math/index.js';

/** One editable cell. Keeps a text draft so users can type "-", "0." or "3/" mid-edit. */
const EditableCell = memo(function EditableCell({ value, i, j, decimals, onCommit, register, onNav, onPaste, cls, onHover }) {
  const [draft, setDraft] = useState(formatNumber(value, decimals).replace('−', '-'));
  const [focused, setFocused] = useState(false);
  const invalid = draft.trim() !== '' && !Number.isFinite(parseNumber(draft));

  useEffect(() => {
    if (!focused) setDraft(formatNumber(value, decimals).replace('−', '-'));
  }, [value, focused, decimals]);

  const commit = () => {
    const v = parseNumber(draft);
    if (draft.trim() === '') { onCommit(i, j, 0); setDraft('0'); return; }
    if (Number.isFinite(v)) onCommit(i, j, v);
  };

  return (
    <div className={`mcell ${cls} ${invalid ? 'invalid' : ''}`} onMouseEnter={() => onHover(i, j)} onMouseLeave={() => onHover(null)} role="cell">
      <input
        ref={(el) => register(i, j, el)}
        value={draft}
        inputMode="decimal"
        aria-label={`a${i + 1},${j + 1}`}
        aria-invalid={invalid}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => { setFocused(true); onHover(i, j); e.target.select(); }}
        onBlur={() => { setFocused(false); commit(); onHover(null); }}
        onKeyDown={(e) => {
          const el = e.target;
          const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
          const atEnd = el.selectionStart === el.value.length;
          const all = el.selectionStart === 0 && el.selectionEnd === el.value.length;
          if (e.key === 'Enter') { e.preventDefault(); commit(); onNav(i, j, e.shiftKey ? 'up' : 'down'); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); onNav(i, j, 'up'); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); onNav(i, j, 'down'); }
          else if (e.key === 'ArrowLeft' && (atStart || all)) { e.preventDefault(); onNav(i, j, 'left'); }
          else if (e.key === 'ArrowRight' && (atEnd || all)) { e.preventDefault(); onNav(i, j, 'right'); }
          else if (e.key === 'Escape') { setDraft(formatNumber(value, decimals).replace('−', '-')); el.blur(); }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (/[\t\n,;]|\s\S/.test(text.trim())) {
            e.preventDefault();
            onPaste(i, j, text);
          }
        }}
      />
    </div>
  );
});

/**
 * Full matrix editor: resize, edit, keyboard navigation, paste from
 * spreadsheets, quick generators, copy, undo and hover highlighting.
 */
export default function MatrixEditor({ name, matrix, onChange, highlightMode = 'cross', compactToolbar = false, maxDim = MAX_DIM }) {
  const { t, toast, state } = useApp();
  const refs = useRef({});
  const history = useRef([]);
  const [hover, setHover] = useState(null);
  const [, force] = useState(0);
  const rows = matrix.length;
  const cols = matrix[0].length;
  const decimals = state.prefs.decimals;

  const change = useCallback((next) => {
    history.current = [...history.current.slice(-49), matrix];
    force((x) => x + 1);
    onChange(next);
  }, [matrix, onChange]);

  const register = useCallback((i, j, el) => { refs.current[`${i},${j}`] = el; }, []);
  const focusCell = (i, j) => { const el = refs.current[`${i},${j}`]; if (el) { el.focus(); } };

  const onCommit = useCallback((i, j, v) => {
    if (matrix[i]?.[j] === v) return;
    const next = matrix.map((r) => r.slice());
    next[i][j] = v;
    change(next);
  }, [matrix, change]);

  const onNav = useCallback((i, j, dir) => {
    let [r, c] = [i, j];
    if (dir === 'up') r = Math.max(0, i - 1);
    if (dir === 'down') r = Math.min(rows - 1, i + 1);
    if (dir === 'left') { if (j > 0) c = j - 1; else if (i > 0) { r = i - 1; c = cols - 1; } }
    if (dir === 'right') { if (j < cols - 1) c = j + 1; else if (i < rows - 1) { r = i + 1; c = 0; } }
    requestAnimationFrame(() => focusCell(r, c));
  }, [rows, cols]);

  const onPaste = useCallback((i, j, text) => {
    const data = parseMatrixText(text);
    if (!data) { toast(t('lab.pasteBad'), 'error'); return; }
    const nr = Math.min(maxDim, Math.max(rows, i + data.length));
    const nc = Math.min(maxDim, Math.max(cols, j + data[0].length));
    const next = createMatrix(nr, nc, (r, c) => {
      const dr = r - i;
      const dc = c - j;
      if (dr >= 0 && dc >= 0 && dr < data.length && dc < data[0].length) return data[dr][dc];
      return matrix[r]?.[c] ?? 0;
    });
    change(next);
    toast(t('lab.pasted', { rows: data.length, cols: data[0].length }), 'success');
  }, [rows, cols, matrix, change, toast, t, maxDim]);

  const resize = (r, c) => {
    const nr = Math.max(1, Math.min(maxDim, r));
    const nc = Math.max(1, Math.min(maxDim, c));
    if (nr === rows && nc === cols) return;
    change(createMatrix(nr, nc, (i, j) => matrix[i]?.[j] ?? 0));
  };

  const undo = () => {
    const prev = history.current.pop();
    if (prev) { force((x) => x + 1); onChange(prev); }
  };

  const hlClass = (i, j) => {
    if (!hover || highlightMode === 'none') return '';
    const [hi, hj] = hover;
    if (highlightMode === 'cell') return hi === i && hj === j ? 'hl-cell' : '';
    if (highlightMode === 'row') return hi === i ? 'hl-row' : '';
    if (highlightMode === 'col') return hj === j ? 'hl-col' : '';
    if (hi === i && hj === j) return 'hl-cell';
    return hi === i ? 'hl-row' : hj === j ? 'hl-col' : '';
  };
  const onHover = useCallback((i, j) => setHover(i === null ? null : [i, j]), []);

  const copy = async () => {
    const okCopy = await copyText(matrixToText(matrix, decimals));
    toast(okCopy ? t('common.copied') : t('common.copyFail'), okCopy ? 'success' : 'error');
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 6 }}>
        <div className="row" style={{ gap: 4 }} role="group" aria-label={t('common.rows')}>
          <span className="label">{t('common.rows')}</span>
          <button className="btn btn-icon btn-sm" onClick={() => resize(rows - 1, cols)} disabled={rows <= 1} aria-label={t('lab.removeRow')} title={t('lab.removeRow')}><Minus size={14} /></button>
          <input className="input num" style={{ width: 52, minHeight: 30 }} type="number" min="1" max={maxDim} value={rows} onChange={(e) => resize(+e.target.value || 1, cols)} aria-label={t('common.rows')} />
          <button className="btn btn-icon btn-sm" onClick={() => resize(rows + 1, cols)} disabled={rows >= maxDim} aria-label={t('lab.addRow')} title={t('lab.addRow')}><Plus size={14} /></button>
        </div>
        <div className="row" style={{ gap: 4 }} role="group" aria-label={t('common.cols')}>
          <span className="label">{t('common.cols')}</span>
          <button className="btn btn-icon btn-sm" onClick={() => resize(rows, cols - 1)} disabled={cols <= 1} aria-label={t('lab.removeCol')} title={t('lab.removeCol')}><Minus size={14} /></button>
          <input className="input num" style={{ width: 52, minHeight: 30 }} type="number" min="1" max={maxDim} value={cols} onChange={(e) => resize(rows, +e.target.value || 1)} aria-label={t('common.cols')} />
          <button className="btn btn-icon btn-sm" onClick={() => resize(rows, cols + 1)} disabled={cols >= maxDim} aria-label={t('lab.addCol')} title={t('lab.addCol')}><Plus size={14} /></button>
        </div>
        <div className="row" style={{ gap: 4, marginLeft: 'auto' }}>
          {!compactToolbar && (
            <>
              <button className="btn btn-sm" onClick={() => change(createMatrix(rows, cols, () => Math.round(Math.random() * 18 - 9)))} title={t('lab.gen.random')}><Dices size={14} /> {t('common.random')}</button>
              <button className="btn btn-sm btn-icon" onClick={() => change(createMatrix(rows, cols, 0))} aria-label={t('common.clear')} title={t('common.clear')}><Eraser size={14} /></button>
            </>
          )}
          <button className="btn btn-sm btn-icon" onClick={copy} aria-label={t('lab.copyText')} title={t('lab.copyText')}><Copy size={14} /></button>
          <button className="btn btn-sm btn-icon" onClick={undo} disabled={!history.current.length} aria-label={t('common.undo')} title={t('common.undo')}><Undo2 size={14} /></button>
        </div>
      </div>

      <div className="scroll-x">
        <div className="matrix-wrap" role="table" aria-label={`${name} ${rows}×${cols}`}>
          {name && <div className="matrix-name">{name} =</div>}
          <div className="bracket l" aria-hidden="true" />
          <div className="matrix-grid" style={{ gridTemplateColumns: `22px repeat(${cols}, auto)` }}>
            <span />
            {Array.from({ length: cols }, (_, j) => <span key={'c' + j} className="col-idx">{j + 1}</span>)}
            {matrix.map((row, i) => (
              <div role="row" key={i} style={{ display: 'contents' }}>
                <span className="row-idx">{i + 1}</span>
                {row.map((v, j) => (
                  <EditableCell
                    key={j}
                    value={v}
                    i={i}
                    j={j}
                    decimals={decimals}
                    onCommit={onCommit}
                    register={register}
                    onNav={onNav}
                    onPaste={onPaste}
                    cls={hlClass(i, j)}
                    onHover={onHover}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="bracket r" aria-hidden="true" />
        </div>
      </div>
      <div className="row-between">
        <span className="coord-tip" aria-live="polite">{hover ? t('lab.hover', { i: hover[0] + 1, j: hover[1] + 1 }) : ''}</span>
        <span className="matrix-dims">{t('lab.dims', { rows, cols })}</span>
      </div>
    </div>
  );
}
