import { useState } from 'react';
import { Copy, Save } from 'lucide-react';
import MatrixGrid from './MatrixGrid.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { copyText, matrixToText } from '../../utils/formatting.js';

/** A computed matrix with copy and "save as named matrix" actions. */
export default function ResultMatrix({ matrix, name = 'R', highlight, title, saveable = true, augmentAt, valueFor }) {
  const { t, toast, state, addMatrix } = useApp();
  const [saveName, setSaveName] = useState('');
  if (!matrix) return null;
  const copy = async () => {
    const okCopy = await copyText(matrixToText(matrix, state.prefs.decimals));
    toast(okCopy ? t('common.copied') : t('common.copyFail'), okCopy ? 'success' : 'error');
  };
  const save = () => {
    const n = addMatrix(matrix.map((r) => r.slice()), saveName.trim() || undefined);
    toast(t('ops.savedAs', { name: n }), 'success');
    setSaveName('');
  };
  return (
    <div className="stack" style={{ gap: 10 }}>
      {title && <div className="label">{title}</div>}
      <MatrixGrid matrix={matrix} name={name} highlight={highlight} augmentAt={augmentAt} valueFor={valueFor} hoverInfo />
      <div className="row" style={{ gap: 6 }}>
        <button className="btn btn-sm" onClick={copy}><Copy size={14} /> {t('common.copy')}</button>
        {saveable && (
          <>
            <input className="input" style={{ width: 90, minHeight: 30 }} placeholder="D" value={saveName} onChange={(e) => setSaveName(e.target.value.slice(0, 12))} aria-label={t('ops.saveAs')} />
            <button className="btn btn-sm" onClick={save}><Save size={14} /> {t('ops.saveAs')}</button>
          </>
        )}
      </div>
    </div>
  );
}
