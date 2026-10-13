import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatNumber } from '../../utils/formatting.js';
import MatrixCell from './MatrixCell.jsx';

/**
 * Read-only matrix display with brackets.
 *  highlight(i, j) → extra class names ('hl-a', 'hl-b', 'hl-out', 'hl-pivot', 'hl-dim', 'pending')
 *  augmentAt       → column index where a vertical bar separates an augmented matrix
 */
export default function MatrixGrid({
  matrix, name, highlight, compact, showIndices = false, onCellClick, augmentAt, hoverInfo = false, label, valueFor,
}) {
  const { state, t } = useApp();
  const [hover, setHover] = useState(null);
  if (!matrix || !matrix.length) return null;
  const rows = matrix.length;
  const cols = matrix[0].length;
  const dec = state.prefs.decimals;
  const colTemplate = `${showIndices ? '22px ' : ''}repeat(${cols}, auto)`;

  return (
    <div className="stack" style={{ gap: 4, minWidth: 0 }}>
      <div className="scroll-x">
        <div className="matrix-wrap" role="table" aria-label={label || (name ? `${name} ${rows}×${cols}` : `${rows}×${cols}`)}>
          {name && <div className="matrix-name">{name} =</div>}
          <div className="bracket l" aria-hidden="true" />
          <div className="matrix-grid" style={{ gridTemplateColumns: colTemplate }}>
            {showIndices && (
              <>
                <span />
                {Array.from({ length: cols }, (_, j) => <span key={'c' + j} className="col-idx">{j + 1}</span>)}
              </>
            )}
            {matrix.map((row, i) => (
              <div role="row" key={i} style={{ display: 'contents' }}>
                {showIndices && <span className="row-idx">{i + 1}</span>}
                {row.map((v, j) => {
                  const cls = highlight ? highlight(i, j) || '' : '';
                  const shown = valueFor ? valueFor(i, j, v) : v;
                  return (
                    <MatrixCell
                      key={j}
                      value={shown}
                      text={typeof shown === 'number' ? formatNumber(shown, dec) : shown}
                      className={`${cls} ${augmentAt === j ? 'aug-sep' : ''} ${compact ? 'compact' : ''} ${shown === 0 ? 'zero' : ''}`}
                      onClick={onCellClick ? () => onCellClick(i, j) : undefined}
                      onHover={hoverInfo ? (h) => setHover(h ? [i, j] : null) : undefined}
                      ariaLabel={`a${i + 1},${j + 1} = ${typeof shown === 'number' ? formatNumber(shown, dec) : shown}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="bracket r" aria-hidden="true" />
        </div>
      </div>
      {hoverInfo && <div className="coord-tip" aria-live="polite">{hover ? t('lab.hover', { i: hover[0] + 1, j: hover[1] + 1 }) : `${rows} × ${cols}`}</div>}
    </div>
  );
}
